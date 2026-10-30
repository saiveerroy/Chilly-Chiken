# 🍗 BILL A CHICKEN – Offline POS & Billing System

**BILL A CHICKEN** is a modern, simple, clean, and responsive Point of Sale (POS) chicken shop billing application built specifically for physical retail chicken shops and meat counters.

---

## 🌟 Key Features

### 1. ⚖️ Dynamic Chicken Weight Entries (Core Feature)
- **Unlimited dynamic entries:** Add single or multiple bird/cut weighments per bill.
- **Support for any weight:** Precision entry for decimal weights (e.g. `0.450 KG`, `1.285 KG`, `2.500 KG`, `10 KG`).
- **Quick Weight Presets:** One-touch buttons for `+0.5 KG`, `+1.0 KG`, `+1.5 KG`, `+2.0 KG`, `+2.5 KG`, `+3.0 KG`, `+5.0 KG`.
- **Micro-adjustment Steppers:** `+0.1 KG` and `-0.1 KG` increment/decrement buttons next to each weight field.
- **Live formula calculation:** `Item Total = Weight × Price Per KG`.
- **Cut/Item Presets:** Select from Standard Chicken, Skinless, With Skin, Boneless, Live Chicken, Wings & Legs, or custom cuts with distinct pre-filled rates.
- **Editable anytime:** Weight and price can be adjusted at any moment with real-time recalculation.

### 2. ⚡ Fast Counter Billing Dashboard
- **Live Clock & Sequential Bill Number:** Automatically updates bill sequence (e.g. `BAC-1001`).
- **Optional Customer Info:** Name and 10-digit mobile number for thermal receipt header.
- **Automatic Calculations:** Subtotal, optional discount (Flat ₹ or % off), and Grand Total.
- **Payment Method Toggle:** 
  - **💵 Cash:** Amount received field, quick cash denomination buttons (`Exact`, `+₹50`, `+₹100`, `+₹200`, `+₹500`, `+₹2000`), and automatic change return indicator.
  - **📱 UPI:** Dynamic on-screen QR code generator that encodes shop VPA, payee name, and exact amount for instant customer scanning with Google Pay, PhonePe, Paytm, or BHIM.
- **Order / Cutting Notes:** Optional field for special butcher instructions (e.g., *Biryani cut*, *Small pieces*).

### 3. 🖨️ Thermal Printer Integration (58mm & 80mm)
- **Supported Thermal Formats:**
  - **58mm (2-inch / 32 characters):** Compact ticket layout for POS-58, Bluetooth, and USB portable receipt printers.
  - **80mm (3-inch / 48 characters):** Wide professional ticket layout for Epson TM-T82, TVS-E, and desktop thermal printers.
- **Clean Receipt Output:** Uses `@media print` CSS and browser `window.print()` to automatically hide all dashboard controls, buttons, sidebars, and navigation, printing **only** the high-contrast black-and-white receipt.
- **Receipt Format:**
  ```text
        BILL A CHICKEN
      CHICKEN SHOP BILL
  Shop #4, Daily Fresh Meat Market
  Ph: +91 98765 43210
  --------------------------------
  Bill No: BAC-1001 Date: 30/10/2026
  Time: 03:15 PM    Pay: Cash
  Cust: Ramesh (9876543210)
  --------------------------------
  ITEM          KG    RATE   TOTAL
  --------------------------------
  Chicken      1.0  250.00  250.00
  Chicken      2.0  250.00  500.00
  --------------------------------
  Sub Total:               ₹750.00
  Discount:                  ₹0.00
  TOTAL:                   ₹750.00
  Payment: Cash   Paid:   ₹1000.00
  Change Return:           ₹250.00
  --------------------------------
      THANK YOU! VISIT AGAIN
  ```
- **Live Receipt Preview:** Visual paper ticket modal with 58mm/80mm toggle and one-click summary copy.

### 4. 📜 Bill History & Analytics
- **Local Persistence:** All completed bills are stored securely in the browser's `localStorage` (works completely offline).
- **Daily Dashboard Metrics:**
  - Total sales revenue (₹)
  - Total chicken weight sold (KG)
  - Cash vs. UPI collection breakdown
  - Total bill count
- **Search & Filter:** Search by bill number, customer name, or phone number; filter by Date (Today, Yesterday, All) and Payment Method.
- **Reprint Bills:** Instant one-click thermal reprinting of any past bill.
- **Export to CSV:** Download full sales records directly for Excel or accounting.

### 5. ⚙️ Shop Settings & Customization
- Shop Name, Tagline, Address lines, Primary & Alt Phone numbers.
- FSSAI License & GSTIN display.
- Default Chicken Price per KG.
- Chicken cut presets and custom prices.
- Thermal printer paper width default (`58mm` / `80mm`).
- Custom receipt footer message & terms.
- Custom bill prefix (e.g. `BAC-`) and sequence counter.
- Audio beeps & cash chime toggle (built with Web Audio API, zero external assets).
- Backup & Restore configuration via JSON.

---

## ⌨️ POS Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| **F2** | Save & Print Thermal Receipt |
| **Ctrl + Enter** | Save Bill & Start New Bill |
| **Escape** | Close Preview / UPI QR Modal |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Start local POS server
npm run dev

# 3. Open in your browser
http://localhost:5173
```

### Production Build
```bash
npm run build
npm run preview
```
