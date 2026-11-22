import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Header } from './components/Header';
import { DynamicChickenEntries } from './components/DynamicChickenEntries';
import { PaymentSummary } from './components/PaymentSummary';
import { ThermalReceipt } from './components/ThermalReceipt';
import { ReceiptPreviewModal } from './components/ReceiptPreviewModal';
import { UpiQrModal } from './components/UpiQrModal';
import { BillHistoryView } from './components/BillHistoryView';
import { SettingsView } from './components/SettingsView';
import { 
  ChickenItem, 
  Bill, 
  ShopSettings, 
  PaymentMethod, 
  PrinterPaperWidth 
} from './types/billing';
import { 
  getSettings, 
  saveSettings, 
  getBills, 
  saveBill, 
  deleteBill 
} from './utils/storage';
import { 
  round2, 
  formatDate, 
  formatTime, 
  generateBillId, 
  formatBillNumber 
} from './utils/formatters';
import { sounds } from './utils/audio';

export const App: React.FC = () => {
  // App-level state
  const [settings, setSettings] = useState<ShopSettings>(() => getSettings());
  const [bills, setBills] = useState<Bill[]>(() => getBills());
  const [activeTab, setActiveTab] = useState<'billing' | 'history' | 'settings'>('billing');

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [selectedBillForPreview, setSelectedBillForPreview] = useState<Bill | null>(null);

  // Active Billing form state
  const [items, setItems] = useState<ChickenItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountReceived, setAmountReceived] = useState(0);
  const [notes, setNotes] = useState('');

  // Bill being printed in the hidden #thermal-print-container
  const [activePrintBill, setActivePrintBill] = useState<Bill | null>(null);

  // Update sound synthesizer state whenever setting changes
  useEffect(() => {
    sounds.setEnabled(Boolean(settings.enableSoundEffects));
  }, [settings.enableSoundEffects]);

  // Current live Bill Number
  const currentBillNumber = useMemo(() => {
    return formatBillNumber(settings.billPrefix || 'BAC-', settings.nextBillSequence || 1001);
  }, [settings.billPrefix, settings.nextBillSequence]);

  // Derived Calculations
  const subtotal = useMemo(() => {
    return round2(items.reduce((sum, item) => sum + (item.total || 0), 0));
  }, [items]);

  const discountAmount = useMemo(() => {
    if (!discount || discount <= 0) return 0;
    if (discountType === 'percent') {
      return round2((subtotal * discount) / 100);
    }
    return round2(discount);
  }, [subtotal, discount, discountType]);

  const grandTotal = useMemo(() => {
    return Math.max(0, round2(subtotal - discountAmount));
  }, [subtotal, discountAmount]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'Cash' || amountReceived <= 0) return 0;
    return round2(amountReceived - grandTotal);
  }, [paymentMethod, amountReceived, grandTotal]);

  // Add Dynamic Chicken Weighment Entry
  const handleAddItem = (weight = 1.0, name?: string, price?: number) => {
    const itemPrice = price !== undefined ? price : (settings.defaultPricePerKg || 250);
    const itemName = name || (settings.itemPresets?.[0]?.name || 'Chicken (Standard)');
    const itemWeight = Math.max(0.001, round2(weight));
    const total = round2(itemWeight * itemPrice);

    const newItem: ChickenItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: itemName,
      weight: itemWeight,
      pricePerKg: itemPrice,
      total,
    };

    setItems((prev) => [...prev, newItem]);
    sounds.playBeep();
  };

  // Update existing dynamic item
  const handleUpdateItem = (id: string, updates: Partial<ChickenItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          return updated;
        }
        return item;
      })
    );
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    sounds.playDelete();
  };

  // Clear all dynamic items
  const handleClearAllItems = () => {
    if (items.length > 0) {
      setItems([]);
      sounds.playDelete();
    }
  };

  // Build current Bill object
  const constructCurrentBill = useCallback((): Bill => {
    const now = new Date();
    return {
      id: generateBillId(),
      billNumber: currentBillNumber,
      timestamp: now.toISOString(),
      dateFormatted: formatDate(now),
      timeFormatted: formatTime(now),
      customerName: customerName.trim() || undefined,
      customerMobile: customerMobile.trim() || undefined,
      items: [...items],
      subtotal,
      discount,
      discountType,
      discountAmount,
      grandTotal,
      paymentMethod,
      amountReceived: paymentMethod === 'Cash' ? amountReceived : grandTotal,
      changeDue: paymentMethod === 'Cash' ? changeDue : 0,
      notes: notes.trim() || undefined,
    };
  }, [
    currentBillNumber,
    customerName,
    customerMobile,
    items,
    subtotal,
    discount,
    discountType,
    discountAmount,
    grandTotal,
    paymentMethod,
    amountReceived,
    changeDue,
    notes,
  ]);

  // Clear active bill form
  const handleClearBill = () => {
    if (items.length > 0) {
      if (!window.confirm('Are you sure you want to clear current bill entries?')) {
        return;
      }
    }
    setItems([]);
    setCustomerName('');
    setCustomerMobile('');
    setDiscount(0);
    setPaymentMethod('Cash');
    setAmountReceived(0);
    setNotes('');
    sounds.playDelete();
  };

  // Save current bill & start new
  const handleSaveBill = (triggerPrint = false) => {
    if (items.length === 0) {
      alert('Please add at least one chicken weighment entry before saving.');
      return;
    }

    const newBill = constructCurrentBill();
    const { updatedSettings, allBills } = saveBill(newBill, settings);
    setSettings(updatedSettings);
    setBills(allBills);
    sounds.playSuccessChime();

    if (triggerPrint) {
      setActivePrintBill(newBill);
      setTimeout(() => {
        window.print();
      }, 100);
    }

    // Reset fields for the next customer
    setItems([]);
    setCustomerName('');
    setCustomerMobile('');
    setDiscount(0);
    setPaymentMethod('Cash');
    setAmountReceived(0);
    setNotes('');
  };

  // Print Thermal Receipt
  const handlePrintReceipt = () => {
    if (items.length === 0) {
      alert('Please add chicken weight entries to print receipt.');
      return;
    }
    handleSaveBill(true);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: ShopSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Delete Bill
  const handleDeleteBill = (billId: string) => {
    const updated = deleteBill(billId);
    setBills(updated);
    sounds.playDelete();
  };

  // Reprint previous bill from history
  const handleReprintPreviousBill = (bill: Bill) => {
    setActivePrintBill(bill);
    sounds.playSuccessChime();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // View details modal
  const handleViewBillDetails = (bill: Bill) => {
    setSelectedBillForPreview(bill);
    setIsPreviewOpen(true);
  };

  // Keyboard shortcut listener (F2: Print, Esc: Close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 -> Print
      if (e.key === 'F2') {
        e.preventDefault();
        if (items.length > 0) {
          handlePrintReceipt();
        }
      }
      // Escape -> close preview or modal
      if (e.key === 'Escape') {
        setIsPreviewOpen(false);
        setIsUpiModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, handlePrintReceipt]);

  // Current bill object for live preview
  const livePreviewBill = useMemo(() => {
    if (selectedBillForPreview) return selectedBillForPreview;
    return constructCurrentBill();
  }, [selectedBillForPreview, constructCurrentBill]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans selection:bg-brand-600 selection:text-white">
      
      {/* Top Application Header */}
      <Header
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentBillNumber={currentBillNumber}
        billsCount={bills.length}
        onToggleSound={() => {
          const nextVal = !settings.enableSoundEffects;
          const updated = { ...settings, enableSoundEffects: nextVal };
          saveSettings(updated);
          setSettings(updated);
        }}
        onPreviewReceipt={() => {
          setSelectedBillForPreview(null);
          setIsPreviewOpen(true);
        }}
        onTogglePaperWidth={(width: PrinterPaperWidth) => {
          const updated = { ...settings, printerWidth: width };
          saveSettings(updated);
          setSettings(updated);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* VIEW 1: BILLING DASHBOARD */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 7 Columns: Dynamic Chicken Weight Entries */}
            <div className="lg:col-span-7 h-[calc(100vh-170px)] min-h-[580px]">
              <DynamicChickenEntries
                items={items}
                defaultPricePerKg={settings.defaultPricePerKg || 250}
                itemPresets={settings.itemPresets || []}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
                onClearAllItems={handleClearAllItems}
              />
            </div>

            {/* Right 5 Columns: Billing Summary, Payments & Actions */}
            <div className="lg:col-span-5 h-[calc(100vh-170px)] min-h-[580px]">
              <PaymentSummary
                subtotal={subtotal}
                discount={discount}
                discountType={discountType}
                discountAmount={discountAmount}
                grandTotal={grandTotal}
                paymentMethod={paymentMethod}
                amountReceived={amountReceived}
                changeDue={changeDue}
                customerName={customerName}
                customerMobile={customerMobile}
                notes={notes}
                printerWidth={settings.printerWidth || '58mm'}
                hasItems={items.length > 0}
                onUpdateDiscount={(val, type) => {
                  setDiscount(val);
                  setDiscountType(type);
                }}
                onUpdatePaymentMethod={setPaymentMethod}
                onUpdateAmountReceived={setAmountReceived}
                onUpdateCustomerName={setCustomerName}
                onUpdateCustomerMobile={setCustomerMobile}
                onUpdateNotes={setNotes}
                onPrintReceipt={handlePrintReceipt}
                onSaveAndNewBill={() => handleSaveBill(false)}
                onClearBill={handleClearBill}
                onPreviewReceipt={() => {
                  setSelectedBillForPreview(null);
                  setIsPreviewOpen(true);
                }}
                onOpenUpiModal={() => setIsUpiModalOpen(true)}
              />
            </div>

          </div>
        )}

        {/* VIEW 2: BILL HISTORY & REPORTS */}
        {activeTab === 'history' && (
          <BillHistoryView
            bills={bills}
            settings={settings}
            onReprintBill={handleReprintPreviousBill}
            onViewBillDetails={handleViewBillDetails}
            onDeleteBill={handleDeleteBill}
          />
        )}

        {/* VIEW 3: SETTINGS VIEW */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        )}

      </main>

      {/* MODAL 1: Receipt Preview Modal */}
      <ReceiptPreviewModal
        bill={livePreviewBill}
        settings={settings}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedBillForPreview(null);
        }}
        onPrint={() => {
          if (selectedBillForPreview) {
            handleReprintPreviousBill(selectedBillForPreview);
          } else {
            handlePrintReceipt();
          }
        }}
      />

      {/* MODAL 2: Dynamic UPI Counter QR Modal */}
      <UpiQrModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        onPaymentConfirmed={() => {
          setPaymentMethod('UPI');
          sounds.playSuccessChime();
        }}
        grandTotal={grandTotal}
        billNumber={currentBillNumber}
        upiId={settings.upiId || 'billachicken@upi'}
        payeeName={settings.upiPayeeName || settings.shopName || 'BILL A CHICKEN'}
      />

      {/* DEDICATED THERMAL PRINT CONTAINER (Rendered into body sibling via portal)
          This DOM element is hidden on screen (@media screen { display: none; })
          and is the ONLY visible element when window.print() is executed (@media print { ... })
      */}
      {activePrintBill && document.getElementById('thermal-print-container') && createPortal(
        <ThermalReceipt
          bill={activePrintBill}
          settings={settings}
          isPrintContainer={true}
        />,
        document.getElementById('thermal-print-container')!
      )}

    </div>
  );
};
