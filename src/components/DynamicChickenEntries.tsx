import React, { useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Scale, 
  Sparkles
} from 'lucide-react';
import { ChickenItem, ItemPreset } from '../types/billing';
import { formatCurrency, formatWeightNumeric, round2 } from '../utils/formatters';

interface DynamicChickenEntriesProps {
  items: ChickenItem[];
  defaultPricePerKg: number;
  itemPresets: ItemPreset[];
  onAddItem: (weight?: number, name?: string, price?: number) => void;
  onUpdateItem: (id: string, updates: Partial<ChickenItem>) => void;
  onRemoveItem: (id: string) => void;
  onClearAllItems: () => void;
}

export const DynamicChickenEntries: React.FC<DynamicChickenEntriesProps> = ({
  items,
  defaultPricePerKg,
  itemPresets,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onClearAllItems,
}) => {
  const latestInputRef = useRef<HTMLInputElement>(null);

  // Quick weight presets for fast counter billing
  const weightPresets = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0];

  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  // Handler for weight change with validation
  const handleWeightChange = (id: string, valStr: string, currentPrice: number) => {
    // Allow empty string for typing experience
    if (valStr === '') {
      onUpdateItem(id, { weight: 0, total: 0 });
      return;
    }

    const val = parseFloat(valStr);
    if (isNaN(val) || val < 0) return;

    const roundedWeight = Math.round(val * 1000) / 1000;
    const total = round2(roundedWeight * currentPrice);
    onUpdateItem(id, { weight: roundedWeight, total });
  };

  // Handler for price per KG change with validation
  const handlePriceChange = (id: string, valStr: string, currentWeight: number) => {
    if (valStr === '') {
      onUpdateItem(id, { pricePerKg: 0, total: 0 });
      return;
    }

    const val = parseFloat(valStr);
    if (isNaN(val) || val < 0) return;

    const roundedPrice = round2(val);
    const total = round2(currentWeight * roundedPrice);
    onUpdateItem(id, { pricePerKg: roundedPrice, total });
  };

  // Stepper helper to increment/decrement weight by 0.1 KG or 0.05 KG
  const handleWeightStep = (id: string, currentWeight: number, currentPrice: number, delta: number) => {
    const newWeight = Math.max(0.05, Math.round((currentWeight + delta) * 100) / 100);
    const total = round2(newWeight * currentPrice);
    onUpdateItem(id, { weight: newWeight, total });
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-brand-100 shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* Header bar */}
      <div className="bg-gradient-to-r from-brand-50 to-white px-5 py-4 border-b border-brand-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-brand-dark uppercase tracking-wide">
                Chicken Weight Entries
              </h2>
              <span className="bg-brand-100 text-brand-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-brand-200">
                {items.length} {items.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Dynamic weighment calculation • Weight × Rate = Item Total
            </p>
          </div>
        </div>

        {/* Quick Summary Pill & Clear button */}
        <div className="flex items-center space-x-2">
          {items.length > 0 && (
            <>
              <div className="bg-brand-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm">
                <span className="text-brand-300 font-normal">Total Wt:</span>
                <span className="font-mono text-emerald-300 text-sm">{totalWeight.toFixed(3)} KG</span>
              </div>
              <button
                type="button"
                onClick={onClearAllItems}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 font-semibold transition"
                title="Remove all chicken entries"
              >
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Add Presets Bar */}
      <div className="bg-emerald-50/50 p-3.5 border-b border-emerald-100/70">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-brand-900 uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Quick Weight Presets (One-Click Add)</span>
          </span>
          <span className="text-[11px] text-gray-500 font-medium">Default: {formatCurrency(defaultPricePerKg)}/KG</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {weightPresets.map((wt) => (
            <button
              key={wt}
              type="button"
              onClick={() => onAddItem(wt)}
              className="bg-white hover:bg-brand-600 hover:text-white text-brand-900 font-mono font-bold text-xs px-3 py-1.5 rounded-lg border border-brand-200 shadow-sm transition active:scale-95 flex items-center space-x-1"
            >
              <Plus className="w-3 h-3 text-brand-500 group-hover:text-white" />
              <span>+{wt.toFixed(1)} KG</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onAddItem(1.0)}
            className="ml-auto bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm transition flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Entry</span>
          </button>
        </div>
      </div>

      {/* Chicken Cut Quick Filter Pills (Optional preset pick for current or next entry) */}
      <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100 flex items-center space-x-2 overflow-x-auto text-xs">
        <span className="text-gray-400 font-semibold uppercase text-[10px] whitespace-nowrap">
          Quick Cuts:
        </span>
        {itemPresets.slice(0, 5).map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onAddItem(1.0, preset.name, preset.pricePerKg)}
            className="whitespace-nowrap bg-white hover:bg-brand-100 text-gray-700 hover:text-brand-900 font-semibold px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs transition text-xs flex items-center space-x-1"
          >
            <span>{preset.name}</span>
            <span className="text-[10px] text-brand-700 font-mono font-bold">
              ({formatCurrency(preset.pricePerKg)}/kg)
            </span>
          </button>
        ))}
      </div>

      {/* Entries List Area */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[320px]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-3xl mb-3 shadow-inner">
              🍗
            </div>
            <h3 className="text-base font-extrabold text-gray-800 uppercase tracking-wide">
              No Chicken Entries Added Yet
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1 mb-5">
              Click any quick weight preset above or press the button below to add your first chicken weighment entry.
            </p>
            <button
              type="button"
              onClick={() => onAddItem(1.0)}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-brand-700/20 transition flex items-center space-x-2 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>+ Add Chicken Entry (1.0 KG)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table Header for Desktop */}
            <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-2 bg-gray-100/80 rounded-xl text-xs font-bold text-gray-600 uppercase tracking-wider">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Chicken Cut / Item</div>
              <div className="col-span-3 text-center">Weight (KG)</div>
              <div className="col-span-2 text-right">Rate / KG</div>
              <div className="col-span-2 text-right">Item Total (₹)</div>
            </div>

            {/* List of Dynamic Entries */}
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white border-2 border-gray-200 hover:border-brand-300 rounded-xl p-3.5 sm:p-4 shadow-sm transition-all hover:shadow-md"
              >
                {/* Desktop Grid Layout */}
                <div className="hidden lg:grid grid-cols-12 gap-3 items-center">
                  
                  {/* Row # */}
                  <div className="col-span-1 text-center font-mono font-bold text-gray-400 text-sm">
                    {index + 1}
                  </div>

                  {/* Cut / Description */}
                  <div className="col-span-4 flex items-center space-x-2">
                    <select
                      value={item.name}
                      onChange={(e) => {
                        const selectedPreset = itemPresets.find(p => p.name === e.target.value);
                        onUpdateItem(item.id, {
                          name: e.target.value,
                          pricePerKg: selectedPreset ? selectedPreset.pricePerKg : item.pricePerKg,
                          total: round2(item.weight * (selectedPreset ? selectedPreset.pricePerKg : item.pricePerKg))
                        });
                      }}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    >
                      {itemPresets.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({formatCurrency(p.pricePerKg)}/kg)
                        </option>
                      ))}
                      {!itemPresets.some(p => p.name === item.name) && (
                        <option value={item.name}>{item.name}</option>
                      )}
                    </select>
                  </div>

                  {/* Weight in KG */}
                  <div className="col-span-3">
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleWeightStep(item.id, item.weight, item.pricePerKg, -0.1)}
                        className="w-8 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center transition active:scale-95"
                        title="Decrease by 0.1 KG"
                      >
                        -
                      </button>
                      <div className="relative flex-1">
                        <input
                          ref={index === items.length - 1 ? latestInputRef : null}
                          type="number"
                          step="0.001"
                          min="0.001"
                          placeholder="0.000"
                          value={item.weight === 0 ? '' : item.weight}
                          onChange={(e) => handleWeightChange(item.id, e.target.value, item.pricePerKg)}
                          className="w-full bg-brand-50/60 font-mono font-black text-brand-900 text-base text-right pr-9 pl-2 py-1.5 rounded-lg border-2 border-brand-200 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-700 pointer-events-none">
                          KG
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleWeightStep(item.id, item.weight, item.pricePerKg, 0.1)}
                        className="w-8 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center transition active:scale-95"
                        title="Increase by 0.1 KG"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price per KG */}
                  <div className="col-span-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="250"
                        value={item.pricePerKg === 0 ? '' : item.pricePerKg}
                        onChange={(e) => handlePriceChange(item.id, e.target.value, item.weight)}
                        className="w-full bg-gray-50 font-mono font-bold text-gray-800 text-sm text-right pl-6 pr-2.5 py-1.5 rounded-lg border border-gray-300 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Calculated Item Total & Delete */}
                  <div className="col-span-2 flex items-center justify-end space-x-2">
                    <div className="text-right">
                      <div className="font-mono font-black text-brand-dark text-base">
                        {formatCurrency(item.total)}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {item.weight} × ₹{item.pricePerKg}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-1"
                      title="Remove this entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

                {/* Mobile / Tablet Responsive Card Layout */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-800 font-mono font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <select
                        value={item.name}
                        onChange={(e) => {
                          const selectedPreset = itemPresets.find(p => p.name === e.target.value);
                          onUpdateItem(item.id, {
                            name: e.target.value,
                            pricePerKg: selectedPreset ? selectedPreset.pricePerKg : item.pricePerKg,
                            total: round2(item.weight * (selectedPreset ? selectedPreset.pricePerKg : item.pricePerKg))
                          });
                        }}
                        className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 text-sm font-semibold text-gray-800 focus:bg-white"
                      >
                        {itemPresets.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-600 p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    {/* Weight Field */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                        Weight (KG)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          placeholder="0.000"
                          value={item.weight === 0 ? '' : item.weight}
                          onChange={(e) => handleWeightChange(item.id, e.target.value, item.pricePerKg)}
                          className="w-full bg-brand-50/60 font-mono font-black text-brand-900 text-lg text-right pr-9 pl-2 py-2 rounded-xl border-2 border-brand-300"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-700 pointer-events-none">
                          KG
                        </span>
                      </div>
                    </div>

                    {/* Rate Field */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                        Rate / KG
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="250"
                          value={item.pricePerKg === 0 ? '' : item.pricePerKg}
                          onChange={(e) => handlePriceChange(item.id, e.target.value, item.weight)}
                          className="w-full bg-gray-50 font-mono font-bold text-gray-800 text-base text-right pl-6 pr-2.5 py-2 rounded-xl border border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Item Total Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 bg-emerald-50/40 p-2 rounded-lg">
                    <span className="text-xs font-semibold text-gray-600">
                      Calculated Item Total:
                    </span>
                    <span className="font-mono font-black text-brand-dark text-lg">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onAddItem(1.0)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm px-5 py-3 rounded-xl shadow-md shadow-brand-700/20 transition flex items-center space-x-2 active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>+ Add Another Chicken Weighment</span>
          </button>
        </div>

        {/* Live Subtotal Pill */}
        <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-right">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Total Weight
            </div>
            <div className="font-mono font-black text-brand-700 text-sm">
              {formatWeightNumeric(totalWeight)} KG
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div className="text-right">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Items Subtotal
            </div>
            <div className="font-mono font-black text-brand-dark text-lg">
              {formatCurrency(itemsSubtotal)}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
