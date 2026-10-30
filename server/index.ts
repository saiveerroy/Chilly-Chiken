import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, User, Shop, Bill } from './db';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bac_super_secret_jwt_key_2026_offline_pos';

// Middleware
app.use(cors());
app.use(express.json());

// Extend Express Request type with User
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'owner' | 'employee';
    shopId: string | null;
    fullName: string;
  };
}

// Helper: Extract client IP
const getClientIp = (req: Request) => {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
};

// --- AUTHENTICATION MIDDLEWARES ---

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired session token' });
      return;
    }
    const payload = decodedUser as AuthenticatedRequest['user'];
    if (!payload) {
      res.status(403).json({ error: 'Invalid token payload' });
      return;
    }

    // Verify user exists and is active in database
    const userInDb = db.getUserById(payload.id);
    if (!userInDb || userInDb.status === 'inactive') {
      res.status(403).json({ error: 'User account is disabled or no longer exists' });
      return;
    }

    // If employee, verify shop is active
    if (userInDb.role === 'employee' && userInDb.shopId) {
      const shop = db.getShopById(userInDb.shopId);
      if (!shop || shop.status === 'inactive') {
        res.status(403).json({ error: 'Assigned shop has been deactivated by owner' });
        return;
      }
    }

    req.user = {
      id: userInDb.id,
      username: userInDb.username,
      role: userInDb.role,
      shopId: userInDb.shopId,
      fullName: userInDb.fullName,
    };
    next();
  });
};

export const requireOwner = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'owner') {
    db.logAudit({
      eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      userId: req.user?.id || 'unknown',
      username: req.user?.username || 'unknown',
      role: req.user?.role || 'employee',
      shopId: req.user?.shopId,
      details: `Unauthorized attempt to access owner-only endpoint: ${req.method} ${req.originalUrl}`,
      ipAddress: getClientIp(req),
    });

    res.status(403).json({ error: 'Access denied: Owner privileges required' });
    return;
  }
  next();
};

// --- AUTH ROUTES ---

// 1. Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const user = db.getUserByUsername(username);
  if (!user) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  if (user.status === 'inactive') {
    res.status(403).json({ error: 'Account has been deactivated. Contact owner.' });
    return;
  }

  const passwordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordValid) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  // Check shop active status for employee
  let assignedShop: Shop | null = null;
  if (user.role === 'employee' && user.shopId) {
    assignedShop = db.getShopById(user.shopId) || null;
    if (!assignedShop || assignedShop.status === 'inactive') {
      res.status(403).json({ error: 'Your assigned shop is currently inactive' });
      return;
    }
  }

  // Generate JWT token
  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    shopId: user.shopId,
    fullName: user.fullName,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '14d' });

  // Log successful login in Audit
  db.logAudit({
    eventType: 'LOGIN',
    userId: user.id,
    username: user.username,
    role: user.role,
    shopId: user.shopId,
    shopNumber: assignedShop ? assignedShop.shopNumber : 'All',
    details: `User logged in successfully as ${user.role.toUpperCase()}`,
    ipAddress: getClientIp(req),
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      shopId: user.shopId,
      fullName: user.fullName,
    },
    shop: assignedShop,
  });
});

// 2. Logout
app.post('/api/auth/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    db.logAudit({
      eventType: 'LOGOUT',
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      shopId: req.user.shopId,
      details: 'User logged out',
      ipAddress: getClientIp(req),
    });
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// 3. Me (Current session check)
app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  let shop: Shop | null = null;
  if (user.shopId) {
    shop = db.getShopById(user.shopId) || null;
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      shopId: user.shopId,
      fullName: user.fullName,
    },
    shop,
  });
});

// --- SHOPS ROUTES ---

// List shops
app.get('/api/shops', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const allShops = db.getShops();

  if (req.user!.role === 'employee') {
    // Strictly isolate: Employee can ONLY see their assigned shop
    const myShop = allShops.filter(s => s.id === req.user!.shopId);
    res.json(myShop);
    return;
  }

  // Owner sees all 20 shops with live sales calculations
  const allBills = db.getBills();
  const allUsers = db.getUsers();

  const shopsWithStats = allShops.map(shop => {
    const shopBills = allBills.filter(b => b.shopId === shop.id);
    const totalSales = shopBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const totalWeight = shopBills.reduce((sum, b) => {
      return sum + b.items.reduce((w, i) => w + (i.weight || 0), 0);
    }, 0);

    const todayDateStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
    const todayBills = shopBills.filter(b => b.dateFormatted === todayDateStr);
    const todaySales = todayBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);

    const assignedStaff = allUsers.filter(u => u.shopId === shop.id && u.role === 'employee');

    return {
      ...shop,
      stats: {
        billCount: shopBills.length,
        totalSales: Math.round(totalSales * 100) / 100,
        totalWeightKg: Math.round(totalWeight * 1000) / 1000,
        todaySales: Math.round(todaySales * 100) / 100,
        todayBillCount: todayBills.length,
        assignedStaffCount: assignedStaff.length,
      }
    };
  });

  res.json(shopsWithStats);
});

// Get single shop
app.get('/api/shops/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  // If employee, prevent looking at other shops
  if (req.user!.role === 'employee' && req.user!.shopId !== req.params.id) {
    db.logAudit({
      eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      userId: req.user!.id,
      username: req.user!.username,
      role: 'employee',
      shopId: req.user!.shopId,
      details: `Employee attempted to view another shop: ${req.params.id}`,
      ipAddress: getClientIp(req),
    });
    res.status(403).json({ error: 'Access denied: You can only access your assigned shop' });
    return;
  }

  const shop = db.getShopById(req.params.id);
  if (!shop) {
    res.status(404).json({ error: 'Shop not found' });
    return;
  }
  res.json(shop);
});

// Owner: Create shop
app.post('/api/shops', authenticateToken, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const newShop = db.createShop(req.body);

  db.logAudit({
    eventType: 'SHOP_UPDATED',
    userId: req.user!.id,
    username: req.user!.username,
    role: 'owner',
    shopId: newShop.id,
    shopNumber: newShop.shopNumber,
    details: `Owner created new shop: ${newShop.name} (${newShop.shopNumber})`,
    ipAddress: getClientIp(req),
  });

  res.status(201).json(newShop);
});

// Owner: Update shop details or status
app.put('/api/shops/:id', authenticateToken, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateShop(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Shop not found' });
    return;
  }

  db.logAudit({
    eventType: 'SHOP_UPDATED',
    userId: req.user!.id,
    username: req.user!.username,
    role: 'owner',
    shopId: updated.id,
    shopNumber: updated.shopNumber,
    details: `Owner updated shop details for ${updated.name}`,
    ipAddress: getClientIp(req),
  });

  res.json(updated);
});

// --- EMPLOYEE MANAGEMENT ROUTES (OWNER ONLY) ---

// List all employees
app.get('/api/employees', authenticateToken, requireOwner, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers().filter(u => u.role === 'employee');
  const shops = db.getShops();

  const employeeList = users.map(u => {
    const assignedShop = shops.find(s => s.id === u.shopId);
    return {
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      shopId: u.shopId,
      shopNumber: assignedShop?.shopNumber || 'Unassigned',
      shopName: assignedShop?.name || 'Unassigned',
      status: u.status,
      createdAt: u.createdAt,
    };
  });

  res.json(employeeList);
});

// Create employee account
app.post('/api/employees', authenticateToken, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { username, password, shopId, fullName, phone } = req.body;

  if (!username || !password || !shopId) {
    res.status(400).json({ error: 'Username, password, and assigned shopId are required' });
    return;
  }

  const existing = db.getUserByUsername(username);
  if (existing) {
    res.status(400).json({ error: 'An account with this username already exists' });
    return;
  }

  const shop = db.getShopById(shopId);
  if (!shop) {
    res.status(400).json({ error: 'Specified shop does not exist' });
    return;
  }

  const employee = db.createEmployee(username, password, shopId, fullName, phone);

  db.logAudit({
    eventType: 'EMPLOYEE_CREATED',
    userId: req.user!.id,
    username: req.user!.username,
    role: 'owner',
    shopId: shop.id,
    shopNumber: shop.shopNumber,
    details: `Owner created employee account "${employee.username}" for ${shop.shopNumber}`,
    ipAddress: getClientIp(req),
  });

  res.status(201).json({
    id: employee.id,
    username: employee.username,
    fullName: employee.fullName,
    shopId: employee.shopId,
    status: employee.status,
  });
});

// Reset employee password
app.post('/api/employees/:id/reset-password', authenticateToken, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) {
    res.status(404).json({ error: 'Employee not found' });
    return;
  }

  const success = db.resetPassword(req.params.id, newPassword);
  if (!success) {
    res.status(500).json({ error: 'Failed to reset password' });
    return;
  }

  db.logAudit({
    eventType: 'PASSWORD_RESET',
    userId: req.user!.id,
    username: req.user!.username,
    role: 'owner',
    shopId: targetUser.shopId,
    details: `Owner reset password for user: ${targetUser.username}`,
    ipAddress: getClientIp(req),
  });

  res.json({ success: true, message: `Password reset successfully for ${targetUser.username}` });
});

// Activate or Deactivate employee
app.put('/api/employees/:id/status', authenticateToken, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  if (status !== 'active' && status !== 'inactive') {
    res.status(400).json({ error: 'Status must be active or inactive' });
    return;
  }

  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) {
    res.status(404).json({ error: 'Employee not found' });
    return;
  }

  db.updateUserStatus(req.params.id, status);

  db.logAudit({
    eventType: 'EMPLOYEE_CREATED',
    userId: req.user!.id,
    username: req.user!.username,
    role: 'owner',
    shopId: targetUser.shopId,
    details: `Owner changed employee "${targetUser.username}" status to ${status}`,
    ipAddress: getClientIp(req),
  });

  res.json({ success: true, status });
});

// --- BILLING ROUTES & SECURITY ENFORCEMENT ---

// 1. Get Bills (Role-Based Isolation)
app.get('/api/bills', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { shopId, search } = req.query;

  let bills: Bill[] = [];

  if (req.user!.role === 'employee') {
    // STRICT SECURITY: Backend forces employee's assigned shop.
    // Cannot see other shops under any circumstances!
    bills = db.getBills(req.user!.shopId!);
  } else {
    // Owner can see all shops or filter by specific shop
    if (shopId && typeof shopId === 'string' && shopId !== 'all') {
      bills = db.getBills(shopId);
    } else {
      bills = db.getBills();
    }
  }

  // Optional search filter
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    bills = bills.filter(b => 
      b.billNumber.toLowerCase().includes(q) ||
      (b.customerName && b.customerName.toLowerCase().includes(q)) ||
      (b.customerMobile && b.customerMobile.includes(q))
    );
  }

  res.json(bills);
});

// 2. Create Bill (Permanent, Atomic Sequence Increment)
app.post('/api/bills', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { 
    items, 
    subtotal, 
    discount, 
    discountType, 
    discountAmount, 
    grandTotal, 
    paymentMethod, 
    amountReceived, 
    changeDue, 
    customerName, 
    customerMobile, 
    notes,
    timestamp,
    dateFormatted,
    timeFormatted
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Bill must have at least one chicken item' });
    return;
  }

  // Security Validation of Shop ID:
  // If employee: Backend STRICTLY forces shopId = req.user.shopId!
  // If owner: Uses specified shopId or default
  let effectiveShopId = req.user!.shopId;
  if (req.user!.role === 'owner') {
    effectiveShopId = req.body.shopId || 'shop-01';
  }

  if (!effectiveShopId) {
    res.status(400).json({ error: 'Shop ID required to issue a bill' });
    return;
  }

  const shop = db.getShopById(effectiveShopId);
  if (!shop || shop.status === 'inactive') {
    res.status(403).json({ error: 'Cannot create bill for an inactive shop' });
    return;
  }

  try {
    const newBill = db.createBill({
      shopId: shop.id,
      shopNumber: shop.shopNumber,
      shopName: shop.name,
      employeeId: req.user!.id,
      employeeName: req.user!.fullName || req.user!.username,
      timestamp: timestamp || new Date().toISOString(),
      dateFormatted: dateFormatted || new Date().toLocaleDateString('en-GB'),
      timeFormatted: timeFormatted || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      customerName,
      customerMobile,
      items,
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      discountType: discountType || 'amount',
      discountAmount: Number(discountAmount) || 0,
      grandTotal: Number(grandTotal) || 0,
      paymentMethod: paymentMethod || 'Cash',
      amountReceived: Number(amountReceived) || 0,
      changeDue: Number(changeDue) || 0,
      notes,
    });

    // Record Audit Log for Bill Creation & Initial Print
    db.logAudit({
      eventType: 'BILL_CREATED',
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      shopId: shop.id,
      shopNumber: shop.shopNumber,
      details: `Bill #${newBill.billNumber} created: ₹${newBill.grandTotal} (${newBill.paymentMethod}, Items: ${newBill.items.length})`,
      ipAddress: getClientIp(req),
    });

    res.status(201).json(newBill);
  } catch (err: unknown) {
    console.error('Bill creation error', err);
    res.status(500).json({ error: (err as Error).message || 'Failed to create bill' });
  }
});

// 3. Reprint Bill (Strict Security: Owner ONLY!)
app.post('/api/bills/:id/reprint', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const bill = db.getBillById(req.params.id);
  if (!bill) {
    res.status(404).json({ error: 'Bill not found' });
    return;
  }

  // EMPLOYEE RESTRICTION CHECK:
  if (req.user!.role !== 'owner') {
    // Log unauthorized reprint attempt
    db.logAudit({
      eventType: 'REPRINT_ATTEMPT',
      userId: req.user!.id,
      username: req.user!.username,
      role: 'employee',
      shopId: req.user!.shopId,
      shopNumber: bill.shopNumber,
      details: `SECURITY ALERT: Employee attempted unauthorized reprint of Bill #${bill.billNumber}`,
      ipAddress: getClientIp(req),
    });

    res.status(403).json({
      error: 'Security Restriction: Employees cannot reprint previously completed bills. Contact the shop owner.'
    });
    return;
  }

  // Owner allowed:
  const updatedBill = db.recordReprint(bill.id);

  db.logAudit({
    eventType: 'BILL_PRINTED',
    userId: req.user!.id,
    username: req.user!.username,
    role: 'owner',
    shopId: bill.shopId,
    shopNumber: bill.shopNumber,
    details: `Owner authorized reprint of Bill #${bill.billNumber} (Print count: ${updatedBill?.printCount})`,
    ipAddress: getClientIp(req),
  });

  res.json({ success: true, bill: updatedBill });
});

// 4. Delete Bill (STRICTLY FORBIDDEN FOR EVERYONE - IMMUTABLE RECORD)
app.delete('/api/bills/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  db.logAudit({
    eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    userId: req.user!.id,
    username: req.user!.username,
    role: req.user!.role,
    shopId: req.user!.shopId,
    details: `REJECTED: User attempted to delete Bill #${req.params.id}. Billing records are permanently immutable.`,
    ipAddress: getClientIp(req),
  });

  res.status(403).json({
    error: 'Permanent Bill Security: Completed bills cannot be deleted. All transactions are permanently archived for financial integrity.'
  });
});

// 5. Owner-Only Adjustment (Preserves Original Bill, Records Reason)
app.post('/api/bills/:id/adjust', authenticateToken, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { reason, adjustments } = req.body;

  if (!reason || reason.trim().length < 5) {
    res.status(400).json({ error: 'A valid explanation reason (minimum 5 characters) is required for bill adjustments' });
    return;
  }

  const existing = db.getBillById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Bill not found' });
    return;
  }

  const adjusted = db.adjustBill(
    req.params.id, 
    req.user!.id, 
    req.user!.username, 
    reason.trim(), 
    adjustments || {}
  );

  db.logAudit({
    eventType: 'BILL_ADJUSTED',
    userId: req.user!.id,
    username: req.user!.username,
    role: 'owner',
    shopId: existing.shopId,
    shopNumber: existing.shopNumber,
    details: `Owner adjusted Bill #${existing.billNumber}. Reason: "${reason.trim()}"`,
    ipAddress: getClientIp(req),
  });

  res.json(adjusted);
});

// --- OWNER CONSOLIDATED ANALYTICS & AUDIT LOGS ---

// Consolidated Analytics across all 20 shops
app.get('/api/analytics/consolidated', authenticateToken, requireOwner, (_req: AuthenticatedRequest, res: Response) => {
  const shops = db.getShops();
  const bills = db.getBills();

  const totalRevenue = bills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
  const totalBillsCount = bills.length;
  const totalKgSold = bills.reduce((sum, b) => {
    return sum + b.items.reduce((w, i) => w + (i.weight || 0), 0);
  }, 0);

  const cashCollections = bills
    .filter(b => b.paymentMethod === 'Cash')
    .reduce((sum, b) => sum + (b.grandTotal || 0), 0);

  const upiCollections = bills
    .filter(b => b.paymentMethod === 'UPI')
    .reduce((sum, b) => sum + (b.grandTotal || 0), 0);

  // Shop Performance Breakdown
  const shopPerformance = shops.map(shop => {
    const shopBills = bills.filter(b => b.shopId === shop.id);
    const shopRev = shopBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const shopKg = shopBills.reduce((sum, b) => {
      return sum + b.items.reduce((w, i) => w + (i.weight || 0), 0);
    }, 0);
    const shopCash = shopBills.filter(b => b.paymentMethod === 'Cash').reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const shopUpi = shopBills.filter(b => b.paymentMethod === 'UPI').reduce((sum, b) => sum + (b.grandTotal || 0), 0);

    return {
      shopId: shop.id,
      shopNumber: shop.shopNumber,
      shopName: shop.name,
      status: shop.status,
      billCount: shopBills.length,
      revenue: Math.round(shopRev * 100) / 100,
      totalKg: Math.round(shopKg * 1000) / 1000,
      cashRevenue: Math.round(shopCash * 100) / 100,
      upiRevenue: Math.round(shopUpi * 100) / 100,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Best Performing Shop
  const bestShop = shopPerformance.length > 0 ? shopPerformance[0] : null;

  res.json({
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalKgSold: Math.round(totalKgSold * 1000) / 1000,
      totalBillsCount,
      cashCollections: Math.round(cashCollections * 100) / 100,
      upiCollections: Math.round(upiCollections * 100) / 100,
      totalActiveShops: shops.filter(s => s.status === 'active').length,
      totalShops: shops.length,
      bestShop,
    },
    shopPerformance,
  });
});

// Audit Logs (Owner only)
app.get('/api/audit-logs', authenticateToken, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 200;
  const logs = db.getAuditLogs(limit);
  res.json(logs);
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'BILL A CHICKEN Backend', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🍗 BILL A CHICKEN Backend Server running on port ${PORT}`);
});
