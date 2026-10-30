import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Trash2, 
  Eye, 
  TrendingUp, 
  Scale, 
  Receipt, 
  Banknote, 
  QrCode,
  FileSpreadsheet
} from 'lucide-react';
import { Bill, ShopSettings } from '../types/billing';
import { formatCurrency, formatWeightNumeric, formatDate } from '../utils/formatters';
import { exportBillsToCSV } from '../utils/storage';

interface BillHistoryViewProps {
  bills: Bill[];
  settings: ShopSettings;
  onReprintBill: (bill: Bill) => void;
  onViewBillDetails: (bill: Bill) => void;
  onDeleteBill: (billId: string) => void;
}

export const BillHistoryView: React.FC<BillHistoryViewProps> = ({
  bills,
  settings: _settings,
  onReprintBill,
  onViewBillDetails,
  onDeleteBill,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Cash' | 'UPI'>('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday'>('all');

  const todayStr = formatDate(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  // Filter bills based on search and filters
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Search term matching bill number, customer name, or mobile
      const matchesSearch =
        searchTerm === '' ||
        b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customerName && b.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.customerMobile && b.customerMobile.includes(searchTerm));

      // Payment method match
      const matchesPayment =
        paymentFilter === 'All' || b.paymentMethod === paymentFilter;

      // Date match
      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = b.dateFormatted === todayStr;
      } else if (dateFilter === 'yesterday') {
        matchesDate = b.dateFormatted === yesterdayStr;
      }

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [bills, searchTerm, paymentFilter, dateFilter, todayStr, yesterdayStr]);

  // Aggregate KPI metrics for the filtered view
  const totalRevenue = useMemo(() => {
    return filteredBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
  }, [filteredBills]);

  const totalWeightKg = useMemo(() => {
    return filteredBills.reduce((sum, b) => {
      const billWeight = b.items.reduce((w, item) => w + (item.weight || 0), 0);
      return sum + billWeight;
    }, 0);
  }, [filteredBills]);

  const cashTotal = useMemo(() => {
    return filteredBills
      .filter((b) => b.paymentMethod === 'Cash')
      .reduce((sum, b) => sum + (b.grandTotal || 0), 0);
  }, [filteredBills]);

  const upiTotal = useMemo(() => {
    return filteredBills
      .filter((b) => b.paymentMethod === 'UPI')
      .reduce((sum, b) => sum + (b.grandTotal || 0), 0);
  }, [filteredBills]);

  return (
    <div className="space-y-6">
      
      {/* Top Sales Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sales Revenue */}
        <div className="bg-white p-5 rounded-2xl border-2 border-brand-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Sales
            </p>
            <h3 className="text-2xl font-black font-mono text-brand-dark mt-1">
              {formatCurrency(totalRevenue)}
            </h3>
            <span className="text-[11px] text-gray-500 font-medium">
              {filteredBills.length} {filteredBills.length === 1 ? 'Bill' : 'Bills'} generated
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Chicken Weight Sold */}
        <div className="bg-white p-5 rounded-2xl border-2 border-brand-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Weight Sold
            </p>
            <h3 className="text-2xl font-black font-mono text-brand-700 mt-1">
              {formatWeightNumeric(totalWeightKg)} <span className="text-sm font-sans">KG</span>
            </h3>
            <span className="text-[11px] text-gray-500 font-medium">
              Chicken weighment volume
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Cash Sales Split */}
        <div className="bg-white p-5 rounded-2xl border-2 border-brand-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Cash Collections
            </p>
            <h3 className="text-xl font-black font-mono text-gray-900 mt-1">
              {formatCurrency(cashTotal)}
            </h3>
            <span className="text-[11px] text-emerald-700 font-semibold">
              💵 Physical cash in drawer
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* UPI Sales Split */}
        <div className="bg-white p-5 rounded-2xl border-2 border-brand-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              UPI Collections
            </p>
            <h3 className="text-xl font-black font-mono text-gray-900 mt-1">
              {formatCurrency(upiTotal)}
            </h3>
            <span className="text-[11px] text-purple-700 font-semibold">
              📱 Online QR transfers
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Bill #, Customer name, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium"
          />
        </div>

        {/* Date Filter & Payment Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          
          {/* Date tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-600">
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === 'all' ? 'bg-white text-brand-900 shadow-2xs' : 'hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === 'today' ? 'bg-white text-brand-900 shadow-2xs' : 'hover:text-gray-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('yesterday')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === 'yesterday' ? 'bg-white text-brand-900 shadow-2xs' : 'hover:text-gray-900'
              }`}
            >
              Yesterday
            </button>
          </div>

          {/* Payment method selector */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as 'All' | 'Cash' | 'UPI')}
            className="text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">All Payments</option>
            <option value="Cash">Cash Only</option>
            <option value="UPI">UPI Only</option>
          </select>

          {/* Export to CSV Button */}
          <button
            type="button"
            onClick={() => exportBillsToCSV(filteredBills)}
            className="text-xs font-bold text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition ml-auto md:ml-0"
            title="Download CSV for Excel / Accounting"
          >
            <FileSpreadsheet className="w-4 h-4 text-brand-700" />
            <span>Export CSV</span>
          </button>

        </div>

      </div>

      {/* Bills Table / Cards List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredBills.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-700">No Bills Found</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {searchTerm || dateFilter !== 'all' || paymentFilter !== 'All'
                ? 'Try adjusting your search query or filters to find bills.'
                : 'Completed bills will be stored here with customer details, items, and reprint options.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Bill No</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-center">Items & Wt</th>
                  <th className="py-3.5 px-4 text-right">Subtotal</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-center">Payment</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBills.map((bill) => {
                  const billWeight = bill.items.reduce((w, i) => w + (i.weight || 0), 0);

                  return (
                    <tr
                      key={bill.id}
                      className="hover:bg-brand-50/40 transition group"
                    >
                      {/* Bill Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-dark">
                        <span className="bg-brand-50 text-brand-900 px-2 py-1 rounded-md border border-brand-200">
                          {bill.billNumber}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-gray-600">
                        <div className="font-semibold text-gray-800">{bill.dateFormatted}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{bill.timeFormatted}</div>
                      </td>

                      {/* Customer info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-800">
                          {bill.customerName || 'Walk-in Customer'}
                        </div>
                        {bill.customerMobile && (
                          <div className="text-[11px] text-gray-500 font-mono">
                            {bill.customerMobile}
                          </div>
                        )}
                      </td>

                      {/* Items & Weight */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-gray-700">
                          {bill.items.length} {bill.items.length === 1 ? 'item' : 'items'}
                        </span>
                        <div className="text-[11px] font-mono text-brand-700 font-semibold">
                          {formatWeightNumeric(billWeight)} KG
                        </div>
                      </td>

                      {/* Subtotal */}
                      <td className="py-3.5 px-4 text-right font-mono text-gray-500">
                        {formatCurrency(bill.subtotal)}
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-black text-brand-dark text-sm">
                          {formatCurrency(bill.grandTotal)}
                        </div>
                        {bill.discountAmount > 0 && (
                          <div className="text-[10px] text-red-500 font-mono">
                            Disc: -{formatCurrency(bill.discountAmount)}
                          </div>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            bill.paymentMethod === 'Cash'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {bill.paymentMethod === 'Cash' ? '💵 Cash' : '📱 UPI'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Reprint */}
                          <button
                            type="button"
                            onClick={() => onReprintBill(bill)}
                            className="p-1.5 rounded-lg text-brand-700 hover:text-brand-900 hover:bg-brand-100 transition"
                            title="Reprint Thermal Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* View */}
                          <button
                            type="button"
                            onClick={() => onViewBillDetails(bill)}
                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                            title="View Receipt Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete Bill #${bill.billNumber}?`)) {
                                onDeleteBill(bill.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
