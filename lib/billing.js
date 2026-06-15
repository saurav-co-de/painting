function roundCurrency(value) {
  const number = Number(value);
  const safeNumber = Number.isFinite(number) ? number : 0;
  return Math.round((safeNumber + Number.EPSILON) * 100) / 100;
}

function toFiniteNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function createLineItemId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number.isFinite(number) ? number : 0);
}

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen"
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety"
];

function wordsBelowHundred(value) {
  if (value < 20) {
    return ones[value];
  }

  return `${tens[Math.floor(value / 10)]} ${ones[value % 10]}`.trim();
}

function wordsBelowThousand(value) {
  const hundred = Math.floor(value / 100);
  const remainder = value % 100;

  if (!hundred) {
    return wordsBelowHundred(remainder);
  }

  return `${ones[hundred]} Hundred ${wordsBelowHundred(remainder)}`.trim();
}

export function formatRupeesInWords(value) {
  const amount = Math.round(Number(value || 0));

  if (!amount) {
    return "Rupees Zero Only";
  }

  const parts = [];
  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const remainder = amount % 1000;

  if (crore) {
    parts.push(`${wordsBelowThousand(crore)} Crore`);
  }

  if (lakh) {
    parts.push(`${wordsBelowThousand(lakh)} Lakh`);
  }

  if (thousand) {
    parts.push(`${wordsBelowThousand(thousand)} Thousand`);
  }

  if (remainder) {
    parts.push(wordsBelowThousand(remainder));
  }

  return `Rupees ${parts.join(" ")} Only`;
}

export function calculateInvoice(items = [], taxMode = "intra") {
  const isWithoutGst = taxMode === "none";
  const isInterState = taxMode === "inter";
  const normalizedItems = items
    .filter((item) => item.description?.trim())
    .map((item) => {
      const quantity = toFiniteNumber(item.quantity);
      const rate = toFiniteNumber(item.rate);
      const gstPercentage = isWithoutGst ? 0 : toFiniteNumber(item.gstPercentage);
      const amount = roundCurrency(quantity * rate);
      const gstAmount = isWithoutGst ? 0 : roundCurrency((amount * gstPercentage) / 100);

      return {
        id: item.id || createLineItemId(),
        description: item.description.trim(),
        unit: item.unit?.trim() || "Nos",
        quantity,
        rate,
        gstPercentage,
        amount,
        gstAmount,
        cgst: isInterState ? 0 : roundCurrency(gstAmount / 2),
        sgst: isInterState ? 0 : roundCurrency(gstAmount / 2),
        igst: isInterState ? gstAmount : 0
      };
    });

  const totals = normalizedItems.reduce(
    (summary, item) => ({
      subtotal: roundCurrency(summary.subtotal + item.amount),
      gstTotal: roundCurrency(summary.gstTotal + item.gstAmount),
      cgstTotal: roundCurrency(summary.cgstTotal + item.cgst),
      sgstTotal: roundCurrency(summary.sgstTotal + item.sgst),
      igstTotal: roundCurrency(summary.igstTotal + item.igst),
      grandTotal: roundCurrency(summary.grandTotal + item.amount + item.gstAmount)
    }),
    {
      subtotal: 0,
      gstTotal: 0,
      cgstTotal: 0,
      sgstTotal: 0,
      igstTotal: 0,
      grandTotal: 0
    }
  );

  return {
    items: normalizedItems,
    totals
  };
}

export function createInvoiceNumber(existingInvoices = []) {
  const year = new Date().getFullYear();
  const sequence = String(existingInvoices.length + 1).padStart(3, "0");
  return `BB-${year}-${sequence}`;
}

export function derivePaymentStatus(invoice) {
  if (invoice.paymentStatus === "Paid") {
    return "Paid";
  }

  if (new Date(invoice.dueDate).getTime() < Date.now()) {
    return "Overdue";
  }

  return invoice.paymentStatus || "Pending";
}

export function buildDashboardStats(invoices = []) {
  const normalized = invoices.map((invoice) => ({
    ...invoice,
    paymentStatus: derivePaymentStatus(invoice)
  }));

  return normalized.reduce(
    (stats, invoice) => {
      const invoiceMonth = new Date(invoice.invoiceDate).getMonth();
      const currentMonth = new Date().getMonth();

      stats.totalInvoices += 1;

      if (invoice.paymentStatus === "Paid") {
        stats.paidInvoices += 1;
      }

      if (invoice.paymentStatus === "Pending" || invoice.paymentStatus === "Overdue") {
        stats.pendingPayments += invoice.balanceDue ?? invoice.totals.grandTotal;
      }

      if (invoiceMonth === currentMonth) {
        stats.monthlyRevenue += invoice.totals.grandTotal;
      }

      return stats;
    },
    {
      totalInvoices: 0,
      monthlyRevenue: 0,
      pendingPayments: 0,
      paidInvoices: 0
    }
  );
}
