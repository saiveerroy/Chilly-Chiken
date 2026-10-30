export interface ChickenItem {
  id: string;
  name: string;
  weight: number; // in KG (e.g. 1.250, 0.5)
  pricePerKg: number; // in INR
  total: number; // weight * pricePerKg
}

export type PaymentMethod = 'Cash' | 'UPI';

export type UserRole = 'owner' | 'employee';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  shopId: string | null;
  shopNumber?: string;
  shopName?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
}

export interface ShopStats {
  billCount: number;
  totalSales: number;
  totalWeightKg: number;
  todaySales: number;
  todayBillCount: number;
  assignedStaffCount: number;
}

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
  printerWidth: PrinterPaperWidth;
  receiptFooterMessage: string;
  receiptNotice: string;
  billPrefix: string;
  nextBillSequence: number;
  status: 'active' | 'inactive';
  stats?: ShopStats;
  createdAt?: string;
  updatedAt?: string;
}

export interface Bill {
  id: string;
  shopId: string;
  shopNumber: string;
  shopName: string;
  billNumber: string;
  employeeId: string;
  employeeName: string;
  timestamp: string; // ISO string
  dateFormatted: string; // DD/MM/YYYY
  timeFormatted: string; // HH:MM AM/PM
  customerName?: string;
  customerMobile?: string;
  items: ChickenItem[];
  subtotal: number;
  discount: number;
  discountType: 'amount' | 'percent';
  discountAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  changeDue: number;
  notes?: string;
  printCount: number; // starts at 1, employee cannot reprint, owner can
  status: 'completed' | 'adjusted';
  adjustmentReason?: string;
  adjustedBy?: string;
  adjustedAt?: string;
  originalBillData?: string; // permanent immutable snapshot
  createdAt?: string;
}

export type PrinterPaperWidth = '58mm' | '80mm';

export interface ItemPreset {
  id: string;
  name: string;
  pricePerKg: number;
  badge?: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  altPhone?: string;
  gstin?: string;
  fssai?: string;
  upiId?: string;
  upiPayeeName?: string;
  defaultPricePerKg: number;
  printerWidth: PrinterPaperWidth;
  receiptFooterMessage: string;
  receiptNotice?: string;
  billPrefix: string;
  nextBillSequence: number;
  enableSoundEffects: boolean;
  autoPrintAfterSave: boolean;
  itemPresets: ItemPreset[];
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
  role: UserRole;
  shopId?: string | null;
  shopNumber?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface ConsolidatedAnalytics {
  summary: {
    totalRevenue: number;
    totalKgSold: number;
    totalBillsCount: number;
    cashCollections: number;
    upiCollections: number;
    totalActiveShops: number;
    totalShops: number;
    bestShop: {
      shopId: string;
      shopNumber: string;
      shopName: string;
      revenue: number;
      totalKg: number;
      billCount: number;
    } | null;
  };
  shopPerformance: Array<{
    shopId: string;
    shopNumber: string;
    shopName: string;
    status: 'active' | 'inactive';
    billCount: number;
    revenue: number;
    totalKg: number;
    cashRevenue: number;
    upiRevenue: number;
  }>;
}
