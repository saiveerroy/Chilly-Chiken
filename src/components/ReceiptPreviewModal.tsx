import React, { useState } from 'react';
import { X, Printer, Check, Copy } from 'lucide-react';
import { Bill, ShopSettings, PrinterPaperWidth } from '../types/billing';
import { ThermalReceipt } from './ThermalReceipt';

interface ReceiptPreviewModalProps {
  bill: Bill;
  settings: ShopSettings;
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  bill,
  settings,
  isOpen,
  onClose,
  onPrint,
}) => {
  const [previewWidth, setPreviewWidth] = useState<PrinterPaperWidth>(settings.printerWidth || '58mm');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyText = () => {
    // Generate plain-text version for quick copying / sharing via WhatsApp
    const lines = [
      `🍗 ${settings.shopName || 'BILL A CHICKEN'} 🍗`,
      `CHICKEN SHOP BILL`,
      `Bill: ${bill.billNumber} | ${bill.dateFormatted} ${bill.timeFormatted}`,
      bill.customerName ? `Customer: ${bill.customerName}` : '',
      `--------------------------------`,
      ...bill.items.map(i => `${i.name}: ${i.weight}kg @ Rs.${i.pricePerKg} = Rs.${i.total}`),
      `--------------------------------`,
      `TOTAL: Rs.${bill.grandTotal} (${bill.paymentMethod})`,
      `THANK YOU! VISIT AGAIN`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Bar */}
        <div className="bg-brand-dark text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-brand-500">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span className="font-extrabold text-sm uppercase tracking-wide">
              Thermal Receipt Preview
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Paper Width Toggle Buttons */}
            <div className="flex bg-brand-900 rounded-lg p-0.5 border border-brand-700 text-xs">
              <button
                type="button"
                onClick={() => setPreviewWidth('58mm')}
                className={`px-2.5 py-1 rounded font-bold transition ${
                  previewWidth === '58mm'
                    ? 'bg-brand-500 text-white shadow-2xs'
                    : 'text-brand-300 hover:text-white'
                }`}
              >
                58mm (2")
              </button>
              <button
                type="button"
                onClick={() => setPreviewWidth('80mm')}
                className={`px-2.5 py-1 rounded font-bold transition ${
                  previewWidth === '80mm'
                    ? 'bg-brand-500 text-white shadow-2xs'
                    : 'text-brand-300 hover:text-white'
                }`}
              >
                80mm (3")
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-300 hover:text-white p-1 rounded-lg hover:bg-brand-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper receipt view area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-200 flex justify-center items-start">
          <div className="bg-white p-2 shadow-2xl border border-gray-400 rounded-xs relative">
            {/* Thermal ticket paper roll jagged edge effect top */}
            <div className="absolute -top-1 left-0 right-0 h-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-300 via-transparent to-transparent"></div>
            
            <ThermalReceipt
              bill={bill}
              settings={settings}
              forcedWidth={previewWidth}
            />

            {/* Thermal ticket paper roll jagged edge bottom */}
            <div className="mt-2 pt-1 border-t-2 border-dashed border-gray-300 text-center text-[9px] text-gray-400 font-mono">
              [ CUT HERE ]
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyText}
            className="text-xs font-bold text-gray-700 hover:text-brand-800 bg-white hover:bg-gray-100 px-3.5 py-2.5 rounded-xl border border-gray-300 flex items-center space-x-1.5 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied Text!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onPrint();
                onClose();
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 transition active:scale-95"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Thermal Receipt</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
