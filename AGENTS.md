# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Static HTML, CSS, and browser JavaScript in `public/`.
- `server.js` mounts the API under `/api` and serves printable invoices. `config.js` holds shop settings, GST rates, and coupon definitions. The app persists records in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements, and records settlement payments.
- `routes/orders.js` lists, looks up, creates, and cancels orders.
- `routes/products.js` lists and filters catalog items and lists active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview, and administrative export.
- `lib/coupons.js` normalizes codes, checks eligibility, and calculates discounts.
- `lib/dates.js` formats local dates, normalizes date filter strings, and derives fiscal-year labels.
- `lib/inventory.js` finds products, checks sellable quantities, adjusts stock or reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` looks up Khata accounts, calculates balances, applies or reverses order debits, and records settlements.
- `lib/orders.js` creates, retrieves, filters, sorts, and cancels order records.
- `lib/pricing.js` calculates checkout subtotals, allocates coupon discounts, and computes per-line GST and totals.
- `lib/reports.js` summarizes the dashboard and compares stored order figures with recalculated invoice figures.
- `lib/store.js` reads and writes `data/db.json` and appends audit entries.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start`, which runs `node server.js`.
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests use in-memory data and never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout calculates GST on discounted lines using HSN rates. The invoice recalculates GST on gross lines and uses the fallback rate when a saved line has no `gstRate`.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
