import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  History, 
  Settings as SettingsIcon, 
  Printer, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  Clock,
  Calendar,
  Eye
} from 'lucide-react';
import { ShopSettings, PrinterPaperWidth } from '../types/billing';
import { formatDate, formatTime } from '../utils/formatters';

interface HeaderProps {
  settings: ShopSettings;
  activeTab: 'billing' | 'history' | 'settings';
  setActiveTab: (tab: 'billing' | 'history' | 'settings') => void;
  currentBillNumber: string;
  billsCount: number;
  onToggleSound: () => void;
  onPreviewReceipt: () => void;
  onTogglePaperWidth: (width: PrinterPaperWidth) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTab,
  setActiveTab,
  currentBillNumber,
  billsCount,
  onToggleSound,
  onPreviewReceipt,
  onTogglePaperWidth,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Live clock updating every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="bg-brand-dark text-white border-b-4 border-brand-500 shadow-md select-none sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Shop Logo & Name */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg text-2xl border-2 border-brand-400 transform -rotate-3 transition hover:rotate-0">
              🍗
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black tracking-wider text-white uppercase font-sans">
                  {settings.shopName || 'BILL A CHICKEN'}
                </h1>
                <span className="bg-brand-600/80 text-brand-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-brand-400/40">
                  POS v1.0
                </span>
              </div>
              <p className="text-xs text-brand-200 font-medium tracking-wide">
                {settings.tagline || 'Fresh & Tender Chicken Shop Billing'}
              </p>
            </div>
          </div>

          {/* Center: Live Date, Time & Current Bill Badge */}
          <div className="hidden md:flex items-center space-x-4 bg-brand-deep/80 px-4 py-2 rounded-xl border border-brand-700/50">
            <div className="flex items-center space-x-1.5 text-xs text-brand-200 border-r border-brand-700/60 pr-3">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span className="font-semibold text-white">{formatDate(currentTime)}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-brand-200 border-r border-brand-700/60 pr-3">
              <Clock className="w-4 h-4 text-brand-400 animate-pulse" />
              <span className="font-mono font-bold text-white text-sm">{formatTime(currentTime)}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-brand-300">Active Bill:</span>
              <span className="font-mono font-bold text-emerald-300 bg-brand-900/90 px-2 py-0.5 rounded border border-brand-500/40">
                {currentBillNumber}
              </span>
            </div>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Printer Width Toggle */}
            <div className="flex items-center bg-brand-900/90 rounded-lg p-1 border border-brand-700 text-xs">
              <button
                type="button"
                onClick={() => onTogglePaperWidth('58mm')}
                className={`px-2 py-1 rounded font-semibold transition ${
                  settings.printerWidth === '58mm'
                    ? 'bg-brand-500 text-white shadow'
                    : 'text-brand-300 hover:text-white'
                }`}
                title="58mm Thermal Printer (2 inch)"
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => onTogglePaperWidth('80mm')}
                className={`px-2 py-1 rounded font-semibold transition ${
                  settings.printerWidth === '80mm'
                    ? 'bg-brand-500 text-white shadow'
                    : 'text-brand-300 hover:text-white'
                }`}
                title="80mm Thermal Printer (3 inch)"
              >
                80mm
              </button>
            </div>

            {/* Receipt Preview Button */}
            <button
              type="button"
              onClick={onPreviewReceipt}
              className="hidden sm:flex items-center space-x-1 bg-brand-800 hover:bg-brand-700 text-brand-100 px-3 py-2 rounded-lg text-xs font-semibold border border-brand-600 transition"
              title="Preview Thermal Receipt"
            >
              <Eye className="w-3.5 h-3.5 text-brand-300" />
              <span>Preview</span>
            </button>

            {/* Sound Mute/Unmute */}
            <button
              type="button"
              onClick={onToggleSound}
              className="p-2 rounded-lg bg-brand-800 hover:bg-brand-700 text-brand-200 hover:text-white border border-brand-700 transition"
              title={settings.enableSoundEffects ? 'Mute POS Beeps' : 'Enable POS Beeps'}
            >
              {settings.enableSoundEffects ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden lg:flex p-2 rounded-lg bg-brand-800 hover:bg-brand-700 text-brand-200 hover:text-white border border-brand-700 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen POS Mode'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-2 pt-1 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
              activeTab === 'billing'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-900/50 ring-2 ring-brand-300'
                : 'bg-brand-900/70 text-brand-200 hover:bg-brand-800 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Billing Counter</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
              activeTab === 'history'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-900/50 ring-2 ring-brand-300'
                : 'bg-brand-900/70 text-brand-200 hover:bg-brand-800 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Bill History</span>
            {billsCount > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'history' ? 'bg-white text-brand-900' : 'bg-brand-700 text-brand-100'
              }`}>
                {billsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
              activeTab === 'settings'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-900/50 ring-2 ring-brand-300'
                : 'bg-brand-900/70 text-brand-200 hover:bg-brand-800 hover:text-white'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Shop Settings</span>
          </button>

          {/* Mobile Current Bill Badge */}
          <div className="md:hidden ml-auto flex items-center space-x-1 text-xs bg-brand-900 px-3 py-1.5 rounded-lg border border-brand-700">
            <Printer className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-mono font-bold text-emerald-300">{currentBillNumber}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
