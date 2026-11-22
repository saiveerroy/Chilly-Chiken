import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, CheckCircle2, Copy, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentConfirmed: () => void;
  grandTotal: number;
  billNumber: string;
  upiId?: string;
  payeeName?: string;
}

export const UpiQrModal: React.FC<UpiQrModalProps> = ({
  isOpen,
  onClose,
  onPaymentConfirmed,
  grandTotal,
  billNumber,
  upiId = 'billachicken@upi',
  payeeName = 'BILL A CHICKEN',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Construct official NPCI UPI Deep Link
  const encodedPayee = encodeURIComponent(payeeName);
  const encodedNote = encodeURIComponent(`Bill ${billNumber}`);
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodedPayee}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodedNote}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="bg-brand-dark text-white p-4 flex items-center justify-between border-b-2 border-brand-500">
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wide">
              Scan & Pay via UPI
            </h3>
            <p className="text-[11px] text-brand-300">
              GPay • PhonePe • Paytm • BHIM
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded-lg hover:bg-brand-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="p-6 flex flex-col items-center bg-gray-50">
          
          {/* Amount Badge */}
          <div className="mb-4 text-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Amount to Pay
            </span>
            <span className="text-3xl font-black font-mono text-brand-dark">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Dynamic QR Code */}
          <div className="p-4 bg-white rounded-2xl border-2 border-brand-300 shadow-md">
            <QRCodeSVG
              value={upiUri}
              size={200}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Payee Info */}
          <div className="mt-4 text-center space-y-1">
            <div className="text-xs font-bold text-gray-800">
              Payee: <span className="font-mono text-brand-700">{payeeName}</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5 text-xs text-gray-500">
              <span className="font-mono">{upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="text-brand-600 hover:text-brand-800 p-0.5 rounded"
                title="Copy UPI ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 pt-1">
              Ref: {billNumber}
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onPaymentConfirmed();
              onClose();
            }}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Mark as Paid & Continue</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full text-xs font-semibold text-gray-500 hover:text-gray-800 py-1"
          >
            Cancel / Change Payment Method
          </button>
        </div>

      </div>
    </div>
  );
};
