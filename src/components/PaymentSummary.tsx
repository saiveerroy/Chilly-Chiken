import React from 'react';
import { 
  Printer, 
  RotateCcw, 
  CheckCircle2, 
  User, 
  Phone, 
  Banknote, 
  QrCode, 
  Eye,
  FileText
} from 'lucide-react';
import { PaymentMethod, PrinterPaperWidth } from '../types/billing';
import { formatCurrency } from '../utils/formatters';

interface PaymentSummaryProps {
  subtotal: number;
  discount: number;
  discountType: 'amount' | 'percent';
  discountAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  changeDue: number;
  customerName: string;
  customerMobile: string;
  notes: string;
  printerWidth: PrinterPaperWidth;
  hasItems: boolean;
  onUpdateDiscount: (val: number, type: 'amount' | 'percent') => void;
  onUpdatePaymentMethod: (method: PaymentMethod) => void;
  onUpdateAmountReceived: (val: number) => void;
  onUpdateCustomerName: (val: string) => void;
  onUpdateCustomerMobile: (val: string) => void;
  onUpdateNotes: (val: string) => void;
  onPrintReceipt: () => void;
  onSaveAndNewBill: () => void;
  onClearBill: () => void;
  onPreviewReceipt: () => void;
  onOpenUpiModal: () => void;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
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
  printerWidth,
  hasItems,
  onUpdateDiscount,
  onUpdatePaymentMethod,
  onUpdateAmountReceived,
  onUpdateCustomerName,
  onUpdateCustomerMobile,
  onUpdateNotes,
  onPrintReceipt,
  onSaveAndNewBill,
  onClearBill,
  onPreviewReceipt,
  onOpenUpiModal,
}) => {

  // Quick cash denomination chips
  const cashChips = [50, 100, 200, 500, 2000];

  const handleCashChipClick = (amount: number) => {
    onUpdateAmountReceived(amount);
  };

  const handleExactCash = () => {
    onUpdateAmountReceived(grandTotal);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-brand-100 shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* Customer Info Section */}
      <div className="bg-brand-50/50 p-4 border-b border-brand-100">
        <h3 className="text-xs font-black text-brand-dark uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Customer Details (Optional)</span>
          <span className="text-[10px] text-gray-500 font-normal">For thermal bill header</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="relative">
            <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => onUpdateCustomerName(e.target.value)}
              className="w-full bg-white text-xs pl-8 pr-2.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium"
            />
          </div>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              maxLength={10}
              placeholder="Mobile (10 digits)"
              value={customerMobile}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                onUpdateCustomerMobile(val);
              }}
              className="w-full bg-white text-xs pl-8 pr-2.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono font-medium"
            />
          </div>
        </div>
        <div className="mt-2 relative">
          <FileText className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Order / Cutting Note (e.g. Biryani cut, Small pieces)"
            value={notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            className="w-full bg-white text-xs pl-8 pr-2.5 py-1.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 text-gray-700"
          />
        </div>
      </div>

      {/* Main Billing Calculation Box */}
      <div className="p-5 flex-1 flex flex-col space-y-4 overflow-y-auto">
        
        {/* Subtotal row */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-600">Subtotal Amount</span>
          <span className="font-mono font-bold text-gray-900 text-base">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Discount Row */}
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-700 uppercase flex items-center space-x-1">
              <span>Optional Discount</span>
            </span>
            {/* Toggle Discount Mode: ₹ vs % */}
            <div className="flex bg-gray-200 rounded-md p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => onUpdateDiscount(discount, 'amount')}
                className={`px-2 py-0.5 rounded transition ${
                  discountType === 'amount' ? 'bg-white text-brand-900 shadow-2xs' : 'text-gray-600'
                }`}
              >
                ₹ Flat
              </button>
              <button
                type="button"
                onClick={() => onUpdateDiscount(discount, 'percent')}
                className={`px-2 py-0.5 rounded transition ${
                  discountType === 'percent' ? 'bg-white text-brand-900 shadow-2xs' : 'text-gray-600'
                }`}
              >
                % Off
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                {discountType === 'amount' ? '₹' : '%'}
              </span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={discount === 0 ? '' : discount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onUpdateDiscount(val, discountType);
                }}
                className="w-full bg-white text-right font-mono font-bold text-sm pl-7 pr-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {discountAmount > 0 && (
              <div className="text-right text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200 whitespace-nowrap">
                - {formatCurrency(discountAmount)}
              </div>
            )}
          </div>
        </div>

        {/* GRAND TOTAL BIG CARD */}
        <div className="bg-gradient-to-br from-brand-900 to-brand-dark text-white p-4 rounded-2xl shadow-lg border-2 border-brand-500 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10 pointer-events-none text-8xl font-black">
            ₹
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-brand-200 uppercase tracking-widest mb-1">
            <span>Payable Grand Total</span>
            <span className="text-[10px] bg-brand-800 text-brand-100 px-2 py-0.5 rounded-full border border-brand-600">
              Net Amount
            </span>
          </div>
          <div className="font-mono font-black text-3xl sm:text-4xl text-emerald-300 tracking-tight flex items-baseline justify-between">
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onUpdatePaymentMethod('Cash')}
              className={`p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center space-x-2 transition ${
                paymentMethod === 'Cash'
                  ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <Banknote className="w-4 h-4 text-brand-600" />
              <span>💵 Cash</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdatePaymentMethod('UPI')}
              className={`p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center space-x-2 transition ${
                paymentMethod === 'UPI'
                  ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <QrCode className="w-4 h-4 text-brand-600" />
              <span>📱 UPI / QR</span>
            </button>
          </div>
        </div>

        {/* Conditional Payment Method Specific Section */}
        {paymentMethod === 'Cash' ? (
          <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-brand-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-900 uppercase">
                Cash Received
              </label>
              <button
                type="button"
                onClick={handleExactCash}
                className="text-[11px] font-bold text-brand-700 hover:text-brand-900 underline"
              >
                Exact ({formatCurrency(grandTotal)})
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={amountReceived === 0 ? '' : amountReceived}
                onChange={(e) => onUpdateAmountReceived(parseFloat(e.target.value) || 0)}
                className="w-full bg-white text-right font-mono font-black text-xl pl-8 pr-3 py-2 rounded-xl border-2 border-brand-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 text-gray-900"
              />
            </div>

            {/* Quick cash denomination buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {cashChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleCashChipClick(chip)}
                  className="bg-white hover:bg-brand-100 text-gray-700 font-mono text-xs font-bold px-2 py-1 rounded-md border border-gray-200 shadow-2xs transition active:scale-95"
                >
                  ₹{chip}
                </button>
              ))}
            </div>

            {/* Return Change or Balance Display */}
            {amountReceived > 0 && (
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  changeDue >= 0
                    ? 'bg-emerald-100/90 border-emerald-300 text-emerald-950'
                    : 'bg-amber-100/90 border-amber-300 text-amber-950'
                }`}
              >
                <div className="text-xs font-bold uppercase">
                  {changeDue >= 0 ? 'Change to Return:' : 'Balance Remaining:'}
                </div>
                <div className="font-mono font-black text-lg">
                  {formatCurrency(Math.abs(changeDue))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* UPI Mode */
          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-brand-200 flex flex-col items-center text-center space-y-2.5">
            <div className="text-xs font-bold text-brand-900 uppercase">
              Instant UPI Counter QR Code
            </div>
            <p className="text-[11px] text-gray-600">
              Customer can scan dynamically generated QR code with GPay, PhonePe, or Paytm
            </p>
            <button
              type="button"
              onClick={onOpenUpiModal}
              className="w-full bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Show Live QR ({formatCurrency(grandTotal)})</span>
            </button>
          </div>
        )}

      </div>

      {/* Action Buttons Bottom Footer */}
      <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-2.5">
        
        {/* Primary Thermal Print Button */}
        <button
          type="button"
          disabled={!hasItems}
          onClick={onPrintReceipt}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-base uppercase tracking-wider flex items-center justify-center space-x-2.5 transition shadow-lg active:scale-98 ${
            hasItems
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-700/30'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title="Print Thermal Receipt (F2)"
        >
          <Printer className="w-5 h-5 stroke-[2.5]" />
          <span>Print Receipt ({printerWidth})</span>
        </button>

        {/* Secondary Row: Save & New Bill, Clear Bill */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!hasItems}
            onClick={onSaveAndNewBill}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border transition ${
              hasItems
                ? 'bg-white hover:bg-brand-50 text-brand-800 border-brand-300 shadow-2xs'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
            title="Save Bill & Clear for Next Customer"
          >
            <CheckCircle2 className="w-4 h-4 text-brand-600" />
            <span>Save & New Bill</span>
          </button>

          <button
            type="button"
            onClick={onClearBill}
            className="py-2.5 px-3 rounded-xl font-bold text-xs bg-white hover:bg-red-50 text-red-600 border border-red-200 shadow-2xs transition flex items-center justify-center space-x-1.5"
            title="Clear all fields & start fresh"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Bill</span>
          </button>
        </div>

        {/* Live Preview Button */}
        <button
          type="button"
          onClick={onPreviewReceipt}
          className="w-full text-center text-xs font-semibold text-gray-500 hover:text-brand-700 transition flex items-center justify-center space-x-1 pt-1"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview Thermal Ticket Layout</span>
        </button>

      </div>

    </div>
  );
};
