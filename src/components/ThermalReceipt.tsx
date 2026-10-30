import React from 'react';
import { Bill, ShopSettings, PrinterPaperWidth } from '../types/billing';
import { formatCurrency, formatWeightNumeric } from '../utils/formatters';

interface ThermalReceiptProps {
  bill: Bill;
  settings: ShopSettings;
  forcedWidth?: PrinterPaperWidth;
  isPrintContainer?: boolean;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  bill,
  settings,
  forcedWidth,
  isPrintContainer = false,
}) => {
  const widthMode = forcedWidth || settings.printerWidth || '58mm';
  const is58 = widthMode === '58mm';

  const totalWeight = bill.items.reduce((sum, item) => sum + (item.weight || 0), 0);

  return (
    <div
      className={`thermal-receipt-root text-black bg-white select-none ${
        isPrintContainer ? '' : 'mx-auto border border-gray-300 p-4 shadow-md rounded-sm'
      } ${is58 ? 'thermal-58mm' : 'thermal-80mm'}`}
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        color: '#000000',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-base sm:text-lg font-black tracking-wider uppercase leading-tight">
          {settings.shopName || 'BILL A CHICKEN'}
        </h1>
        <p className="text-xs font-bold uppercase tracking-wider mt-0.5">
          CHICKEN SHOP BILL
        </p>
        
        {settings.addressLine1 && (
          <p className="text-[10px] sm:text-[11px] leading-tight mt-1">
            {settings.addressLine1}
          </p>
        )}
        {settings.addressLine2 && (
          <p className="text-[10px] sm:text-[11px] leading-tight">
            {settings.addressLine2}
          </p>
        )}
        {settings.phone && (
          <p className="text-[10px] sm:text-[11px] leading-tight font-bold">
            Ph: {settings.phone} {settings.altPhone ? `| ${settings.altPhone}` : ''}
          </p>
        )}
        {settings.fssai && (
          <p className="text-[9px] sm:text-[10px] leading-tight">
            FSSAI Lic: {settings.fssai}
          </p>
        )}
      </div>

      <div className="dotted-line my-2"></div>

      {/* Bill Metadata */}
      <div className="text-[11px] sm:text-xs leading-relaxed">
        <div className="flex justify-between">
          <span><span className="font-bold">Bill No:</span> {bill.billNumber}</span>
          <span><span className="font-bold">Date:</span> {bill.dateFormatted}</span>
        </div>
        <div className="flex justify-between">
          <span><span className="font-bold">Time:</span> {bill.timeFormatted}</span>
          <span><span className="font-bold">Pay:</span> {bill.paymentMethod}</span>
        </div>
        {(bill.customerName || bill.customerMobile) && (
          <div className="mt-1 pt-1 border-t border-dashed border-gray-400">
            {bill.customerName && (
              <div><span className="font-bold">Cust:</span> {bill.customerName}</div>
            )}
            {bill.customerMobile && (
              <div><span className="font-bold">Mob:</span> {bill.customerMobile}</div>
            )}
          </div>
        )}
      </div>

      <div className="dotted-line my-2"></div>

      {/* Table Headers */}
      {is58 ? (
        /* 58mm compact table header */
        <div className="text-[11px] font-bold flex justify-between border-b border-black pb-1 mb-1">
          <span className="w-[36%] text-left">ITEM</span>
          <span className="w-[20%] text-right">KG</span>
          <span className="w-[20%] text-right">RATE</span>
          <span className="w-[24%] text-right">TOTAL</span>
        </div>
      ) : (
        /* 80mm spacious table header */
        <div className="text-xs font-bold flex justify-between border-b border-black pb-1 mb-1">
          <span className="w-[42%] text-left">ITEM DESCRIPTION</span>
          <span className="w-[18%] text-right">WEIGHT</span>
          <span className="w-[18%] text-right">RATE/KG</span>
          <span className="w-[22%] text-right">TOTAL (₹)</span>
        </div>
      )}

      {/* Items Rows */}
      <div className="space-y-1 my-1 text-[11px] sm:text-xs">
        {bill.items.map((item, idx) => (
          <div key={item.id || idx} className="flex justify-between items-start leading-tight">
            <span className={`${is58 ? 'w-[36%]' : 'w-[42%]'} text-left truncate font-medium`}>
              {item.name || 'Chicken'}
            </span>
            <span className={`${is58 ? 'w-[20%]' : 'w-[18%]'} text-right font-mono`}>
              {item.weight.toFixed(1)}
            </span>
            <span className={`${is58 ? 'w-[20%]' : 'w-[18%]'} text-right font-mono`}>
              {item.pricePerKg.toFixed(2)}
            </span>
            <span className={`${is58 ? 'w-[24%]' : 'w-[22%]'} text-right font-mono font-bold`}>
              {item.total.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="dotted-line my-2"></div>

      {/* Weighment & Count Info */}
      <div className="flex justify-between text-[10px] sm:text-[11px] text-gray-800">
        <span>Items: {bill.items.length}</span>
        <span>Total Wt: {formatWeightNumeric(totalWeight)} KG</span>
      </div>

      <div className="dotted-line my-1.5"></div>

      {/* Calculation Summary */}
      <div className="text-[11px] sm:text-xs space-y-1">
        <div className="flex justify-between">
          <span>Sub Total:</span>
          <span className="font-mono">{formatCurrency(bill.subtotal)}</span>
        </div>

        {bill.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span className="font-mono">-{formatCurrency(bill.discountAmount)}</span>
          </div>
        )}

        <div className="double-line my-1.5"></div>

        <div className="flex justify-between items-center text-xs sm:text-sm font-black">
          <span className="uppercase">TOTAL:</span>
          <span className="font-mono text-sm sm:text-base">{formatCurrency(bill.grandTotal)}</span>
        </div>

        <div className="double-line my-1.5"></div>

        <div className="flex justify-between text-[11px]">
          <span>Payment: {bill.paymentMethod}</span>
          {bill.paymentMethod === 'Cash' && bill.amountReceived > 0 && (
            <span className="font-mono">Paid: {formatCurrency(bill.amountReceived)}</span>
          )}
        </div>

        {bill.paymentMethod === 'Cash' && bill.amountReceived > 0 && bill.changeDue >= 0 && (
          <div className="flex justify-between text-[11px] font-bold">
            <span>Change Return:</span>
            <span className="font-mono">{formatCurrency(bill.changeDue)}</span>
          </div>
        )}
      </div>

      <div className="dotted-line my-2"></div>

      {/* Footer Message */}
      <div className="text-center text-[10px] sm:text-[11px] font-bold space-y-1 pt-1">
        {settings.receiptFooterMessage ? (
          settings.receiptFooterMessage.split('\n').map((line, i) => (
            <p key={i} className="uppercase leading-tight">{line}</p>
          ))
        ) : (
          <p className="uppercase">THANK YOU! VISIT AGAIN</p>
        )}

        {settings.receiptNotice && (
          <p className="text-[8px] sm:text-[9px] font-normal text-gray-700 pt-1 leading-tight">
            {settings.receiptNotice}
          </p>
        )}

        <p className="text-[8px] text-gray-500 pt-1">
          * * * * * * * * * * * * *
        </p>
      </div>

    </div>
  );
};
