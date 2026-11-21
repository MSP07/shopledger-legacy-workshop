'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function summarize({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function assertFigures(order, expectedInvoice, expectedCheckout) {
  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(summarize(printed), expectedInvoice.totals, 'invoice totals');
  assert.deepEqual(summarize(checkout), expectedCheckout.totals, 'checkout totals');
  assert.deepEqual(
    printed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, tax: lineTax })),
    expectedInvoice.gst,
    'invoice GST by line'
  );
  assert.deepEqual(
    checkout.lines.map(({ gstPercent, tax }) => ({ gstPercent, tax })),
    expectedCheckout.gst,
    'checkout GST by line'
  );
}

test('CURRENT BEHAVIOUR: #1001-style invoice uses 5% and 12% HSN slabs without a coupon', () => {
  // These lines omit gstRate so the two calculations must resolve GST themselves.
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
      { name: 'Ghee', price: 250, qty: 1, hsn: '0405' }
    ]
  };

  const expected = {
    totals: { subtotal: 890, discount: 0, tax: 62, cgst: 31, sgst: 31, total: 952 },
    gst: [{ gstPercent: 5, tax: 32 }, { gstPercent: 12, tax: 30 }]
  };
  assertFigures(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1002-style SAVE10 invoice calculates GST after discount', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 300, qty: 2, hsn: '0902', gstRate: 18 }]
  };

  const expected = {
    totals: { subtotal: 600, discount: 60, tax: 97.20, cgst: 48.60, sgst: 48.60, total: 637.20 },
    gst: [{ gstPercent: 18, tax: 97.20 }]
  };
  assertFigures(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1004-style SAVE10 invoice applies the Rs 150 cap on Rs 2,240', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 2, hsn: '1006', gstRate: 5 },
      { name: 'Ghee', price: 480, qty: 2, hsn: '0405', gstRate: 12 }
    ]
  };

  const expected = {
    totals: { subtotal: 2240, discount: 150, tax: 167.20, cgst: 83.60, sgst: 83.60, total: 2257.20 },
    gst: [{ gstPercent: 5, tax: 59.71 }, { gstPercent: 12, tax: 107.49 }]
  };
  assertFigures(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1008-style all-18% invoice matches checkout without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 350, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 225, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };

  const expected = {
    totals: { subtotal: 925, discount: 0, tax: 166.50, cgst: 83.25, sgst: 83.25, total: 1091.50 },
    gst: [{ gstPercent: 18, tax: 126 }, { gstPercent: 18, tax: 40.50 }]
  };
  assertFigures(order, expected, expected);
});

test('invoice uses checkout GST slabs and the capped discount before tax', () => {
  const items = [
    { name: 'Rice', price: 1000, qty: 1, hsn: '1006' },
    { name: 'Ghee', price: 500, qty: 2, hsn: '0405' },
    { name: 'Tea', price: 240, qty: 1, hsn: '0902' }
  ];
  const coupon = 'SAVE10';
  const expected = {
    totals: { subtotal: 2240, discount: 150, tax: 198.92, cgst: 99.46, sgst: 99.46, total: 2288.92 },
    gst: [{ gstPercent: 5, tax: 46.65 }, { gstPercent: 12, tax: 111.96 }, { gstPercent: 18, tax: 40.31 }]
  };
  const order = { id: 1010, items, coupon, ...expected.totals };

  assertFigures(order, expected, expected);
  const html = invoice.render(order);
  assert.match(html, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹150\.00/);
  assert.match(html, /Invoice Total<\/td><td[^>]*>₹2288\.92/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
