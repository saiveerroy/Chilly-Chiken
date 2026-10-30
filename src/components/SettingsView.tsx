import React, { useState } from 'react';
import { 
  Save, 
  Store, 
  Printer, 
  DollarSign, 
  QrCode, 
  RotateCcw, 
  Check, 
  Trash2, 
  Download, 
  Upload 
} from 'lucide-react';
import { ShopSettings, ItemPreset } from '../types/billing';
import { DEFAULT_SETTINGS } from '../utils/storage';
import { formatCurrency } from '../utils/formatters';

interface SettingsViewProps {
  settings: ShopSettings;
  onSaveSettings: (newSettings: ShopSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings: initialSettings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<ShopSettings>({ ...initialSettings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetPrice, setNewPresetPrice] = useState(250);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all shop settings to default values?')) {
      setFormData({ ...DEFAULT_SETTINGS });
      onSaveSettings(DEFAULT_SETTINGS);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleAddPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: ItemPreset = {
      id: 'cut-' + Date.now(),
      name: newPresetName.trim(),
      pricePerKg: Number(newPresetPrice) || 250,
    };
    const updatedPresets = [...(formData.itemPresets || []), newPreset];
    setFormData({ ...formData, itemPresets: updatedPresets });
    setNewPresetName('');
    setNewPresetPrice(250);
  };

  const handleRemovePreset = (id: string) => {
    const updatedPresets = (formData.itemPresets || []).filter(p => p.id !== id);
    setFormData({ ...formData, itemPresets: updatedPresets });
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bill_a_chicken_settings_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.shopName) {
          setFormData({ ...DEFAULT_SETTINGS, ...parsed });
          onSaveSettings({ ...DEFAULT_SETTINGS, ...parsed });
          alert('Settings successfully restored from backup file!');
        } else {
          alert('Invalid settings backup file');
        }
      } catch {
        alert('Failed to read file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-brand-dark uppercase tracking-wide">
            Shop Configuration & Settings
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Customize shop identity, thermal receipt layout, rates, and hardware
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1 animate-pulse">
              <Check className="w-4 h-4" />
              <span>Settings Saved!</span>
            </span>
          )}

          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition flex items-center space-x-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Shop Identity & Header Details */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-brand-900 border-b pb-2">
            <Store className="w-5 h-5 text-brand-600" />
            <h3 className="font-extrabold text-sm uppercase tracking-wide">Shop Identity</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Shop Name *
            </label>
            <input
              type="text"
              required
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              placeholder="BILL A CHICKEN"
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 font-bold text-gray-900 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Fresh, Tender & Hygienic Chicken Daily"
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Shop Address Line 1
            </label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              placeholder="Shop #4, Daily Fresh Meat Market"
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Shop Address Line 2
            </label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              placeholder="Station Road, Opp. Bus Stand"
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Primary Phone *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 font-mono font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Alt Phone (Optional)
              </label>
              <input
                type="text"
                value={formData.altPhone || ''}
                onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                placeholder="+91 98123 45678"
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                FSSAI License No.
              </label>
              <input
                type="text"
                value={formData.fssai || ''}
                onChange={(e) => setFormData({ ...formData, fssai: e.target.value })}
                placeholder="21523000000000"
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                value={formData.gstin || ''}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="36AAAAA0000A1Z5"
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Thermal Printer & Receipt Layout */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-brand-900 border-b pb-2">
            <Printer className="w-5 h-5 text-brand-600" />
            <h3 className="font-extrabold text-sm uppercase tracking-wide">
              Thermal Printer & Receipt
            </h3>
          </div>

          {/* Paper Width Selection: 58mm vs 80mm */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Thermal Printer Paper Width *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border-2 flex flex-col cursor-pointer transition ${
                  formData.printerWidth === '58mm'
                    ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-brand-dark">58mm (2-Inch)</span>
                  <input
                    type="radio"
                    name="printerWidth"
                    checked={formData.printerWidth === '58mm'}
                    onChange={() => setFormData({ ...formData, printerWidth: '58mm' })}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                </div>
                <span className="text-[11px] text-gray-500 mt-1">
                  Compact ticket, POS-58, Bluetooth & USB thermal printers (32 chars)
                </span>
              </label>

              <label
                className={`p-3.5 rounded-xl border-2 flex flex-col cursor-pointer transition ${
                  formData.printerWidth === '80mm'
                    ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-brand-dark">80mm (3-Inch)</span>
                  <input
                    type="radio"
                    name="printerWidth"
                    checked={formData.printerWidth === '80mm'}
                    onChange={() => setFormData({ ...formData, printerWidth: '80mm' })}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                </div>
                <span className="text-[11px] text-gray-500 mt-1">
                  Standard wide ticket, Epson TM-T82, TVS-E, Star printers (48 chars)
                </span>
              </label>
            </div>
          </div>

          {/* Receipt Footer Message */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Receipt Footer Message
            </label>
            <textarea
              rows={3}
              value={formData.receiptFooterMessage}
              onChange={(e) => setFormData({ ...formData, receiptFooterMessage: e.target.value })}
              placeholder="THANK YOU! VISIT AGAIN&#10;Hygiene & Freshness Guaranteed"
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Printed centered at the bottom of the thermal receipt
            </p>
          </div>

          {/* Receipt Notice / Disclaimer */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Notice / Terms
            </label>
            <input
              type="text"
              value={formData.receiptNotice || ''}
              onChange={(e) => setFormData({ ...formData, receiptNotice: e.target.value })}
              placeholder="Goods once sold are not returnable."
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 text-xs"
            />
          </div>

          {/* Bill Prefix & Sequence Counter */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Bill Prefix
              </label>
              <input
                type="text"
                value={formData.billPrefix}
                onChange={(e) => setFormData({ ...formData, billPrefix: e.target.value.toUpperCase() })}
                placeholder="BAC-"
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Next Bill Sequence #
              </label>
              <input
                type="number"
                min="1"
                value={formData.nextBillSequence}
                onChange={(e) => setFormData({ ...formData, nextBillSequence: parseInt(e.target.value) || 1 })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Default Pricing & Cut Presets */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-brand-900 border-b pb-2">
            <DollarSign className="w-5 h-5 text-brand-600" />
            <h3 className="font-extrabold text-sm uppercase tracking-wide">
              Chicken Pricing & Cuts
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Default Chicken Price Per KG (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-sm">
                ₹
              </span>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={formData.defaultPricePerKg}
                onChange={(e) => setFormData({ ...formData, defaultPricePerKg: parseFloat(e.target.value) || 0 })}
                placeholder="250"
                className="w-full text-sm font-mono font-black text-brand-dark pl-8 pr-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Pre-populates new chicken weighment entries automatically
            </p>
          </div>

          {/* Cuts / Item Presets List */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Chicken Cut Presets
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {formData.itemPresets?.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                >
                  <span className="font-semibold text-gray-800">{preset.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-brand-700">
                      {formatCurrency(preset.pricePerKg)}/kg
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePreset(preset.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new preset row */}
            <div className="mt-3 flex items-center space-x-2 pt-2 border-t border-gray-100">
              <input
                type="text"
                placeholder="Cut Name (e.g. Lollipop)"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-300"
              />
              <div className="relative w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="280"
                  value={newPresetPrice}
                  onChange={(e) => setNewPresetPrice(Number(e.target.value))}
                  className="w-full text-xs pl-5 pr-2 py-1.5 rounded-lg border border-gray-300 font-mono text-right"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPreset}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: UPI QR Code & System Preferences */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-brand-900 border-b pb-2">
            <QrCode className="w-5 h-5 text-brand-600" />
            <h3 className="font-extrabold text-sm uppercase tracking-wide">
              UPI Merchant & POS System
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Shop UPI ID / VPA
            </label>
            <input
              type="text"
              value={formData.upiId || ''}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value.toLowerCase().trim() })}
              placeholder="billachicken@okaxis"
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Enables dynamic on-screen customer UPI QR code with amount
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              UPI Merchant Display Name
            </label>
            <input
              type="text"
              value={formData.upiPayeeName || ''}
              onChange={(e) => setFormData({ ...formData, upiPayeeName: e.target.value })}
              placeholder="BILL A CHICKEN STORE"
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2 space-y-2 border-t border-gray-100">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableSoundEffects}
                onChange={(e) => setFormData({ ...formData, enableSoundEffects: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span className="text-xs font-semibold text-gray-700">
                Enable instant POS audible beeps & cash chimes
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoPrintAfterSave}
                onChange={(e) => setFormData({ ...formData, autoPrintAfterSave: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span className="text-xs font-semibold text-gray-700">
                Auto-trigger print dialog when saving bill
              </span>
            </label>
          </div>

          {/* Backup / Export / Reset */}
          <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup JSON</span>
            </button>

            <label className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 ml-auto flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

      </div>

      {/* Save Button Bar */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-end">
        <button
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 text-white font-black text-sm px-8 py-3 rounded-xl shadow-lg shadow-brand-700/20 transition flex items-center space-x-2 active:scale-95"
        >
          <Save className="w-5 h-5" />
          <span>Save All Settings</span>
        </button>
      </div>

    </form>
  );
};
