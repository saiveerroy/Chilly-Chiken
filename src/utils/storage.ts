import { Bill, ShopSettings, ItemPreset } from '../types/billing';

const SETTINGS_STORAGE_KEY = 'bac_shop_settings_v1';
const BILLS_STORAGE_KEY = 'bac_bills_history_v1';

export const DEFAULT_ITEM_PRESETS: ItemPreset[] = [
  { id: 'cut-1', name: 'Chicken (Standard)', pricePerKg: 250, badge: 'Popular' },
  { id: 'cut-2', name: 'Chicken (Skinless)', pricePerKg: 270, badge: 'Clean' },
  { id: 'cut-3', name: 'Chicken (With Skin)', pricePerKg: 240, badge: 'Crispy' },
  { id: 'cut-4', name: 'Boneless Chicken', pricePerKg: 380, badge: 'Prime' },
  { id: 'cut-5', name: 'Live Chicken', pricePerKg: 180, badge: 'Farm' },
  { id: 'cut-6', name: 'Wings & Legs', pricePerKg: 260, badge: 'Cut' },
  { id: 'cut-7', name: 'Liver / Gizzard', pricePerKg: 200, badge: 'Special' },
];

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'BILL A CHICKEN',
  tagline: 'Fresh, Tender & Hygienic Chicken Daily',
  addressLine1: 'Shop #4, Daily Fresh Meat Market',
  addressLine2: 'Station Road, Opp. Bus Stand',
  phone: '+91 98765 43210',
  altPhone: '+91 98123 45678',
  gstin: '',
  fssai: '21523000000000',
  upiId: 'billachicken@upi',
  upiPayeeName: 'BILL A CHICKEN STORE',
  defaultPricePerKg: 250,
  printerWidth: '58mm',
  receiptFooterMessage: 'THANK YOU! VISIT AGAIN\nHygiene & Freshness Guaranteed',
  receiptNotice: 'Goods once sold are not returnable. Weighment checked at counter.',
  billPrefix: 'BAC-',
  nextBillSequence: 1001,
  enableSoundEffects: true,
  autoPrintAfterSave: true,
  itemPresets: DEFAULT_ITEM_PRESETS,
};

/**
 * Load settings from localStorage
 */
export function getSettings(): ShopSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error('Failed to parse settings from localStorage', e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: ShopSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

/**
 * Get all bills from localStorage
 */
export function getBills(): Bill[] {
  try {
    const raw = localStorage.getItem(BILLS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Bill[];
  } catch (e) {
    console.error('Failed to parse bills history', e);
    return [];
  }
}

/**
 * Save a new bill into localStorage and increment the sequence number
 */
export function saveBill(bill: Bill, currentSettings: ShopSettings): { updatedSettings: ShopSettings; allBills: Bill[] } {
  try {
    const bills = getBills();
    // Add new bill at the beginning
    const updatedBills = [bill, ...bills];
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(updatedBills));

    // Update settings with incremented bill number
    const updatedSettings: ShopSettings = {
      ...currentSettings,
      nextBillSequence: (currentSettings.nextBillSequence || 1000) + 1,
    };
    saveSettings(updatedSettings);

    return { updatedSettings, allBills: updatedBills };
  } catch (e) {
    console.error('Failed to save bill', e);
    return { updatedSettings: currentSettings, allBills: getBills() };
  }
}

/**
 * Delete a bill by ID
 */
export function deleteBill(billId: string): Bill[] {
  const bills = getBills();
  const updated = bills.filter(b => b.id !== billId);
  try {
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update bills after deletion', e);
  }
  return updated;
}

/**
 * Clear all bills history
 */
export function clearAllBills(): void {
  localStorage.removeItem(BILLS_STORAGE_KEY);
}

/**
 * Export bills to CSV file for shop accounting / Excel
 */
export function exportBillsToCSV(bills: Bill[]): void {
  if (!bills || bills.length === 0) {
    alert('No bills to export');
    return;
  }

  const headers = [
    'Bill Number',
    'Date',
    'Time',
    'Customer Name',
    'Customer Mobile',
    'Total Items',
    'Total Weight (KG)',
    'Subtotal (INR)',
    'Discount (INR)',
    'Grand Total (INR)',
    'Payment Method',
    'Amount Received (INR)',
    'Change Returned (INR)',
    'Item Details'
  ];

  const rows = bills.map(b => {
    const totalWeight = b.items.reduce((sum, item) => sum + (item.weight || 0), 0);
    const itemDetailsStr = b.items
      .map(i => `${i.name} (${i.weight}kg @ Rs.${i.pricePerKg} = Rs.${i.total})`)
      .join('; ');

    return [
      `"${b.billNumber}"`,
      `"${b.dateFormatted}"`,
      `"${b.timeFormatted}"`,
      `"${(b.customerName || 'Walk-in Customer').replace(/"/g, '""')}"`,
      `"${(b.customerMobile || '-').replace(/"/g, '""')}"`,
      b.items.length,
      totalWeight.toFixed(3),
      b.subtotal.toFixed(2),
      b.discountAmount.toFixed(2),
      b.grandTotal.toFixed(2),
      `"${b.paymentMethod}"`,
      b.amountReceived.toFixed(2),
      b.changeDue.toFixed(2),
      `"${itemDetailsStr.replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `bill_a_chicken_sales_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
