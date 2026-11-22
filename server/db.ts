import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface Shop {
  id: string;
  shopNumber: string; // 'Shop 01' ... 'Shop 20'
  name: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  altPhone?: string;
  fssai?: string;
  gstin?: string;
  upiId: string;
  upiPayeeName: string;
  defaultPricePerKg: number;
  printerWidth: '58mm' | '80mm';
  receiptFooterMessage: string;
  receiptNotice: string;
  billPrefix: string;
  nextBillSequence: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'owner' | 'employee';
  shopId: string | null; // null for owner, required for employee
  fullName: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ChickenItem {
  id: string;
  name: string;
  weight: number;
  pricePerKg: number;
  total: number;
}

export interface Bill {
  id: string;
  shopId: string;
  shopNumber: string;
  shopName: string;
  billNumber: string;
  employeeId: string;
  employeeName: string;
  timestamp: string;
  dateFormatted: string;
  timeFormatted: string;
  customerName?: string;
  customerMobile?: string;
  items: ChickenItem[];
  subtotal: number;
  discount: number;
  discountType: 'amount' | 'percent';
  discountAmount: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'UPI';
  amountReceived: number;
  changeDue: number;
  notes?: string;
  printCount: number; // starts at 1 upon initial print, only owner can reprint
  status: 'completed' | 'adjusted';
  adjustmentReason?: string;
  adjustedBy?: string;
  adjustedAt?: string;
  originalBillData?: string; // JSON snapshot preserved permanently
  createdAt: string;
}

export interface AuditLog {
  id: string;
  eventType: 
    | 'LOGIN' 
    | 'LOGOUT' 
    | 'BILL_CREATED' 
    | 'BILL_PRINTED' 
    | 'BILL_ADJUSTED' 
    | 'REPRINT_ATTEMPT' 
    | 'SHOP_UPDATED' 
    | 'EMPLOYEE_CREATED' 
    | 'PASSWORD_RESET' 
    | 'UNAUTHORIZED_ACCESS_ATTEMPT';
  userId: string;
  username: string;
  role: 'owner' | 'employee';
  shopId?: string | null;
  shopNumber?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

interface DatabaseSchema {
  shops: Shop[];
  users: User[];
  bills: Bill[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'pos_database.json');

// Initial 20 Shops definitions with realistic names and addresses
export const INITIAL_SHOPS: Omit<Shop, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'shop-01',
    shopNumber: 'Shop 01',
    name: 'Shop 01 – Hyderabad Main Branch',
    tagline: 'Fresh & Tender Chicken Daily',
    addressLine1: 'Shop #12, Charminar Market Road',
    addressLine2: 'Old City, Hyderabad',
    phone: '+91 98480 11001',
    altPhone: '+91 98480 22001',
    fssai: '23621001000001',
    gstin: '36AAAAA1001A1Z1',
    upiId: 'billachicken.shop01@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 01',
    defaultPricePerKg: 250,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN\nHygiene & Freshness Guaranteed',
    receiptNotice: 'Weighment checked at counter. Goods once sold are not returnable.',
    billPrefix: 'BAC-S01-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-02',
    shopNumber: 'Shop 02',
    name: 'Shop 02 – Secunderabad Station Branch',
    tagline: 'Farm Fresh Chicken',
    addressLine1: 'Station Road, Opp. Platform 1',
    addressLine2: 'Secunderabad',
    phone: '+91 98480 11002',
    fssai: '23621001000002',
    upiId: 'billachicken.shop02@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 02',
    defaultPricePerKg: 250,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN\nFresh Chicken Daily',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S02-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-03',
    shopNumber: 'Shop 03',
    name: 'Shop 03 – Madhapur Hitec City',
    tagline: 'Premium Hygienic Cuts',
    addressLine1: 'Plot 45, Near Ayyappa Society',
    addressLine2: 'Madhapur, Hyderabad',
    phone: '+91 98480 11003',
    fssai: '23621001000003',
    upiId: 'billachicken.shop03@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 03',
    defaultPricePerKg: 260,
    printerWidth: '80mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN\nHygienic Halal Chicken',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S03-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-04',
    shopNumber: 'Shop 04',
    name: 'Shop 04 – Kukatpally KPHB Branch',
    tagline: 'Daily Fresh Farm Chicken',
    addressLine1: 'Road No 1, KPHB Colony',
    addressLine2: 'Kukatpally, Hyderabad',
    phone: '+91 98480 11004',
    fssai: '23621001000004',
    upiId: 'billachicken.shop04@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 04',
    defaultPricePerKg: 250,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S04-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-05',
    shopNumber: 'Shop 05',
    name: 'Shop 05 – Ameerpet Metro Branch',
    tagline: 'Fresh & Tender Cuts',
    addressLine1: 'Near Metro Pillar A82',
    addressLine2: 'Ameerpet, Hyderabad',
    phone: '+91 98480 11005',
    fssai: '23621001000005',
    upiId: 'billachicken.shop05@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 05',
    defaultPricePerKg: 250,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S05-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-06',
    shopNumber: 'Shop 06',
    name: 'Shop 06 – Gachibowli Financial Dist',
    tagline: 'Fresh Meat Express',
    addressLine1: 'Indira Nagar Main Road',
    addressLine2: 'Gachibowli, Hyderabad',
    phone: '+91 98480 11006',
    fssai: '23621001000006',
    upiId: 'billachicken.shop06@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 06',
    defaultPricePerKg: 260,
    printerWidth: '80mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S06-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-07',
    shopNumber: 'Shop 07',
    name: 'Shop 07 – Banjara Hills Road #12',
    tagline: 'Premium Farm Chicken',
    addressLine1: 'Road No 12, MLA Colony',
    addressLine2: 'Banjara Hills, Hyderabad',
    phone: '+91 98480 11007',
    fssai: '23621001000007',
    upiId: 'billachicken.shop07@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 07',
    defaultPricePerKg: 270,
    printerWidth: '80mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S07-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-08',
    shopNumber: 'Shop 08',
    name: 'Shop 08 – Jubilee Hills Checkpost',
    tagline: 'Prime Organic Chicken',
    addressLine1: 'Checkpost Road, Near Metro',
    addressLine2: 'Jubilee Hills, Hyderabad',
    phone: '+91 98480 11008',
    fssai: '23621001000008',
    upiId: 'billachicken.shop08@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 08',
    defaultPricePerKg: 270,
    printerWidth: '80mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S08-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-09',
    shopNumber: 'Shop 09',
    name: 'Shop 09 – Dilsukhnagar Main Market',
    tagline: 'Wholesale & Retail Meat',
    addressLine1: 'Main Market Road',
    addressLine2: 'Dilsukhnagar, Hyderabad',
    phone: '+91 98480 11009',
    fssai: '23621001000009',
    upiId: 'billachicken.shop09@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 09',
    defaultPricePerKg: 240,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S09-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-10',
    shopNumber: 'Shop 10',
    name: 'Shop 10 – LB Nagar Ring Road',
    tagline: 'Daily Fresh Tender Meat',
    addressLine1: 'Inner Ring Road',
    addressLine2: 'LB Nagar, Hyderabad',
    phone: '+91 98480 11010',
    fssai: '23621001000010',
    upiId: 'billachicken.shop10@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 10',
    defaultPricePerKg: 240,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S10-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-11',
    shopNumber: 'Shop 11',
    name: 'Shop 11 – Kondapur Botanical Garden',
    tagline: 'Hygienic Tender Chicken',
    addressLine1: 'Botanical Garden Road',
    addressLine2: 'Kondapur, Hyderabad',
    phone: '+91 98480 11011',
    fssai: '23621001000011',
    upiId: 'billachicken.shop11@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 11',
    defaultPricePerKg: 260,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S11-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-12',
    shopNumber: 'Shop 12',
    name: 'Shop 12 – Miyapur X Road',
    tagline: 'Fresh Chicken Center',
    addressLine1: 'National Highway 65',
    addressLine2: 'Miyapur, Hyderabad',
    phone: '+91 98480 11012',
    fssai: '23621001000012',
    upiId: 'billachicken.shop12@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 12',
    defaultPricePerKg: 250,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S12-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-13',
    shopNumber: 'Shop 13',
    name: 'Shop 13 – Begumpet Lifestyle Circle',
    tagline: 'Fresh Meat Specialist',
    addressLine1: 'Prakash Nagar Main Road',
    addressLine2: 'Begumpet, Hyderabad',
    phone: '+91 98480 11013',
    fssai: '23621001000013',
    upiId: 'billachicken.shop13@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 13',
    defaultPricePerKg: 250,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S13-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-14',
    shopNumber: 'Shop 14',
    name: 'Shop 14 – Mehdipatnam Rythu Bazar',
    tagline: 'Daily Fresh Farm Supply',
    addressLine1: 'Rythu Bazar Market Lane',
    addressLine2: 'Mehdipatnam, Hyderabad',
    phone: '+91 98480 11014',
    fssai: '23621001000014',
    upiId: 'billachicken.shop14@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 14',
    defaultPricePerKg: 240,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S14-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-15',
    shopNumber: 'Shop 15',
    name: 'Shop 15 – Uppal Metro Junction',
    tagline: 'Clean & Tender Poultry',
    addressLine1: 'Warangal Highway Road',
    addressLine2: 'Uppal, Hyderabad',
    phone: '+91 98480 11015',
    fssai: '23621001000015',
    upiId: 'billachicken.shop15@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 15',
    defaultPricePerKg: 240,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S15-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-16',
    shopNumber: 'Shop 16',
    name: 'Shop 16 – Tolichowki Paramount Colony',
    tagline: 'Specialist Chicken Cuts',
    addressLine1: 'Paramount Hills Main Road',
    addressLine2: 'Tolichowki, Hyderabad',
    phone: '+91 98480 11016',
    fssai: '23621001000016',
    upiId: 'billachicken.shop16@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 16',
    defaultPricePerKg: 250,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S16-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-17',
    shopNumber: 'Shop 17',
    name: 'Shop 17 – Manikonda Marichettu',
    tagline: 'Fresh Farm Birds Daily',
    addressLine1: 'OU Colony Main Road',
    addressLine2: 'Manikonda, Hyderabad',
    phone: '+91 98480 11017',
    fssai: '23621001000017',
    upiId: 'billachicken.shop17@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 17',
    defaultPricePerKg: 255,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S17-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-18',
    shopNumber: 'Shop 18',
    name: 'Shop 18 – Attapur Pillar 140',
    tagline: 'Hygiene & Quality Meat',
    addressLine1: 'PVNR Expressway Pillar 140',
    addressLine2: 'Attapur, Hyderabad',
    phone: '+91 98480 11018',
    fssai: '23621001000018',
    upiId: 'billachicken.shop18@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 18',
    defaultPricePerKg: 245,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S18-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-19',
    shopNumber: 'Shop 19',
    name: 'Shop 19 – Kompally Highway Branch',
    tagline: 'Highway Fresh Poultry',
    addressLine1: 'Nagpur Highway NH44',
    addressLine2: 'Kompally, Secunderabad',
    phone: '+91 98480 11019',
    fssai: '23621001000019',
    upiId: 'billachicken.shop19@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 19',
    defaultPricePerKg: 245,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S19-',
    nextBillSequence: 1001,
    status: 'active'
  },
  {
    id: 'shop-20',
    shopNumber: 'Shop 20',
    name: 'Shop 20 – Nizampet Village Road',
    tagline: 'Fresh Chicken Everyday',
    addressLine1: 'Nizampet Village Main Road',
    addressLine2: 'Nizampet, Hyderabad',
    phone: '+91 98480 11020',
    fssai: '23621001000020',
    upiId: 'billachicken.shop20@upi',
    upiPayeeName: 'BILL A CHICKEN - SHOP 20',
    defaultPricePerKg: 250,
    printerWidth: '58mm',
    receiptFooterMessage: 'THANK YOU! VISIT AGAIN',
    receiptNotice: 'Weighment checked at counter.',
    billPrefix: 'BAC-S20-',
    nextBillSequence: 1001,
    status: 'active'
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadOrInit();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadOrInit(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error reading database file, re-initializing', e);
      }
    }

    const now = new Date().toISOString();

    // Generate 20 shops with timestamps
    const shops: Shop[] = INITIAL_SHOPS.map(s => ({
      ...s,
      createdAt: now,
      updatedAt: now,
    }));

    // Pre-hash passwords
    const ownerHash = bcrypt.hashSync('Owner@1234', 10);

    const users: User[] = [
      {
        id: 'user-owner',
        username: 'owner',
        passwordHash: ownerHash,
        role: 'owner',
        shopId: null,
        fullName: 'Business Owner Admin',
        phone: '+91 99999 00000',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }
    ];

    // Seed 20 employee accounts, one for each shop
    shops.forEach((shop, index) => {
      const shopNumStr = String(index + 1).padStart(2, '0');
      const empUsername = `emp_shop${shopNumStr}`;
      const empPass = `Emp@Shop${shopNumStr}`;
      const empHash = bcrypt.hashSync(empPass, 10);

      users.push({
        id: `user-emp-${shop.id}`,
        username: empUsername,
        passwordHash: empHash,
        role: 'employee',
        shopId: shop.id,
        fullName: `Cashier ${shop.shopNumber}`,
        phone: shop.phone,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
    });

    // Seed some initial realistic completed bills for historical demonstration across shops
    const bills: Bill[] = [];
    const yesterday = new Date(Date.now() - 86400000);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayDate = `${dd}/${mm}/${yyyy}`;

    // Seed initial bills for first 5 shops so analytics has live data immediately
    const sampleShops = shops.slice(0, 5);
    sampleShops.forEach((shop, sIdx) => {
      const billId = `seed_bill_${shop.id}_1`;
      const weight1 = 1.250;
      const weight2 = 0.850;
      const rate = shop.defaultPricePerKg;
      const total1 = Math.round(weight1 * rate * 100) / 100;
      const total2 = Math.round(weight2 * rate * 100) / 100;
      const sub = total1 + total2;

      bills.push({
        id: billId,
        shopId: shop.id,
        shopNumber: shop.shopNumber,
        shopName: shop.name,
        billNumber: `${shop.billPrefix}1000`,
        employeeId: `user-emp-${shop.id}`,
        employeeName: `Cashier ${shop.shopNumber}`,
        timestamp: yesterday.toISOString(),
        dateFormatted: yesterdayDate,
        timeFormatted: '11:30 AM',
        customerName: `Customer ${sIdx + 1}`,
        customerMobile: `984801110${sIdx}`,
        items: [
          { id: 'item_1', name: 'Chicken (Standard)', weight: weight1, pricePerKg: rate, total: total1 },
          { id: 'item_2', name: 'Chicken (Skinless)', weight: weight2, pricePerKg: rate, total: total2 }
        ],
        subtotal: sub,
        discount: 0,
        discountType: 'amount',
        discountAmount: 0,
        grandTotal: sub,
        paymentMethod: sIdx % 2 === 0 ? 'Cash' : 'UPI',
        amountReceived: sIdx % 2 === 0 ? sub + 50 : sub,
        changeDue: sIdx % 2 === 0 ? 50 : 0,
        notes: 'Seed initial historical bill',
        printCount: 1,
        status: 'completed',
        createdAt: yesterday.toISOString()
      });
    });

    const auditLogs: AuditLog[] = [
      {
        id: 'audit-init',
        eventType: 'SHOP_UPDATED',
        userId: 'system',
        username: 'system',
        role: 'owner',
        shopId: null,
        shopNumber: 'All',
        details: 'System initialized with 20 shops and administrative owner account.',
        timestamp: now,
      }
    ];

    const initialDb: DatabaseSchema = {
      shops,
      users,
      bills,
      auditLogs
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  public save() {
    try {
      const tempFile = DB_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (e) {
      console.error('Failed to write database file', e);
    }
  }

  // --- Audit Log Helpers ---
  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      ...entry,
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // Keep last 2000 logs
    if (this.data.auditLogs.length > 2000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 2000);
    }
    this.save();
    return log;
  }

  public getAuditLogs(limit = 200): AuditLog[] {
    return this.data.auditLogs.slice(0, limit);
  }

  // --- Shop Management ---
  public getShops(): Shop[] {
    return this.data.shops;
  }

  public getShopById(id: string): Shop | undefined {
    return this.data.shops.find(s => s.id === id);
  }

  public updateShop(id: string, updates: Partial<Shop>): Shop | null {
    const idx = this.data.shops.findIndex(s => s.id === id);
    if (idx === -1) return null;

    const existing = this.data.shops[idx];
    const updated: Shop = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      shopNumber: existing.shopNumber, // Keep consistent numbering
      updatedAt: new Date().toISOString(),
    };

    this.data.shops[idx] = updated;
    this.save();
    return updated;
  }

  public createShop(newShopData: Partial<Shop>): Shop {
    const count = this.data.shops.length + 1;
    const shopNumStr = String(count).padStart(2, '0');
    const now = new Date().toISOString();

    const shop: Shop = {
      id: `shop-${shopNumStr}`,
      shopNumber: `Shop ${shopNumStr}`,
      name: newShopData.name || `Shop ${shopNumStr} – New Branch`,
      tagline: newShopData.tagline || 'Fresh & Tender Chicken Daily',
      addressLine1: newShopData.addressLine1 || '',
      addressLine2: newShopData.addressLine2 || '',
      phone: newShopData.phone || '+91 98000 00000',
      altPhone: newShopData.altPhone,
      fssai: newShopData.fssai,
      gstin: newShopData.gstin,
      upiId: newShopData.upiId || `billachicken.shop${shopNumStr}@upi`,
      upiPayeeName: newShopData.upiPayeeName || `BILL A CHICKEN - SHOP ${shopNumStr}`,
      defaultPricePerKg: newShopData.defaultPricePerKg || 250,
      printerWidth: newShopData.printerWidth || '58mm',
      receiptFooterMessage: newShopData.receiptFooterMessage || 'THANK YOU! VISIT AGAIN',
      receiptNotice: newShopData.receiptNotice || 'Weighment checked at counter.',
      billPrefix: `BAC-S${shopNumStr}-`,
      nextBillSequence: 1001,
      status: newShopData.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    this.data.shops.push(shop);
    this.save();
    return shop;
  }

  // --- User / Employee Management ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public createEmployee(username: string, passwordPlain: string, shopId: string, fullName: string, phone?: string): User {
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(passwordPlain, 10);
    const user: User = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: username.toLowerCase().trim(),
      passwordHash,
      role: 'employee',
      shopId,
      fullName: fullName || username,
      phone,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    this.data.users.push(user);
    this.save();
    return user;
  }

  public resetPassword(userId: string, newPasswordPlain: string): boolean {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;
    user.passwordHash = bcrypt.hashSync(newPasswordPlain, 10);
    user.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  public updateUserStatus(userId: string, status: 'active' | 'inactive'): boolean {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;
    user.status = status;
    user.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  // --- Bill Management & Security ---
  public getBills(shopIdFilter?: string | null): Bill[] {
    if (shopIdFilter) {
      return this.data.bills.filter(b => b.shopId === shopIdFilter);
    }
    return this.data.bills;
  }

  public getBillById(id: string): Bill | undefined {
    return this.data.bills.find(b => b.id === id);
  }

  /**
   * Atomic Bill Creation:
   * Increments the shop sequence number, assigns unique bill number,
   * stores permanently, and records audit trail.
   */
  public createBill(billData: Omit<Bill, 'id' | 'billNumber' | 'createdAt' | 'printCount' | 'status'>): Bill {
    const shop = this.getShopById(billData.shopId);
    if (!shop) {
      throw new Error(`Shop with id ${billData.shopId} not found`);
    }

    const currentSeq = shop.nextBillSequence || 1001;
    const generatedBillNumber = `${shop.billPrefix}${currentSeq}`;
    
    // Atomically increment the sequence for this shop
    shop.nextBillSequence = currentSeq + 1;
    shop.updatedAt = new Date().toISOString();

    const now = new Date().toISOString();
    const newBill: Bill = {
      ...billData,
      id: 'bill_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      billNumber: generatedBillNumber,
      shopNumber: shop.shopNumber,
      shopName: shop.name,
      printCount: 1, // First printing upon completion
      status: 'completed',
      createdAt: now,
    };

    this.data.bills.unshift(newBill);
    this.save();

    return newBill;
  }

  /**
   * Record reprint count (Allowed for Owner ONLY)
   */
  public recordReprint(billId: string): Bill | null {
    const bill = this.data.bills.find(b => b.id === billId);
    if (!bill) return null;
    bill.printCount = (bill.printCount || 1) + 1;
    this.save();
    return bill;
  }

  /**
   * Owner-Only Adjustment Process:
   * Preserves the original bill data permanently in originalBillData.
   * Modifies only specified fields and records reason, user, and timestamp.
   * NEVER erases the original transaction!
   */
  public adjustBill(
    billId: string, 
    adjustedByUserId: string, 
    adjustedByUsername: string, 
    reason: string, 
    adjustments: Partial<Bill>
  ): Bill | null {
    const bill = this.data.bills.find(b => b.id === billId);
    if (!bill) return null;

    // Preserve snapshot of previous version before adjusting
    const originalSnapshot = JSON.stringify({
      items: bill.items,
      subtotal: bill.subtotal,
      discount: bill.discount,
      discountAmount: bill.discountAmount,
      grandTotal: bill.grandTotal,
      paymentMethod: bill.paymentMethod,
      timestamp: bill.timestamp,
    });

    bill.originalBillData = bill.originalBillData || originalSnapshot;
    bill.status = 'adjusted';
    bill.adjustmentReason = reason;
    bill.adjustedBy = `${adjustedByUsername} (${adjustedByUserId})`;
    bill.adjustedAt = new Date().toISOString();

    // Apply allowed adjustments (items, totals, notes)
    if (adjustments.items) bill.items = adjustments.items;
    if (adjustments.subtotal !== undefined) bill.subtotal = adjustments.subtotal;
    if (adjustments.discountAmount !== undefined) bill.discountAmount = adjustments.discountAmount;
    if (adjustments.grandTotal !== undefined) bill.grandTotal = adjustments.grandTotal;
    if (adjustments.paymentMethod) bill.paymentMethod = adjustments.paymentMethod;
    if (adjustments.notes !== undefined) bill.notes = adjustments.notes;

    this.save();
    return bill;
  }
}

export const db = new Database();
