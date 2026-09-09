// TODO: replace with API calls

import type { Invoice, InvoiceInput, InvoiceItem, InvoiceEvent, PaymentTerms } from "./invoice.schema";
import { calcInvoiceTotals } from "./invoice.calc";
import { 
  generateDraftNumber, 
  generateQuoteNumber, 
  generateInvoiceNumber,
  incrementDraftNumber,
  incrementQuoteNumber,
  incrementInvoiceNumber 
} from "./invoice.numbering";
import {
  ARCHIVED_STATUS,
  DRAFT_STATUS,
  INVOICE_TYPE,
  ISSUED_STATUS,
  PAID_STATUS,
  QUOTE_TYPE,
  SENT_STATUS,
  getDefaultInvoiceStatus,
  isValidInvoiceDocumentType,
  isValidInvoiceStatus,
} from "./invoice.runtime";
import { tenantSettingsService } from "@/services/tenantSettingsService";
import { getExchangeRate, getCountryBaseCurrency } from "@/lib/exchangeRates";
import { getCompanyProfile } from "@/modules/company/company.storage";

const STORAGE_KEY = "invoices";

function getNetDaysFromTerms(
  paymentTerms: PaymentTerms,
  customNetDays?: number
): number | undefined {
  switch (paymentTerms) {
    case "due_on_receipt":
      return undefined;
    case "net_15":
      return 15;
    case "net_30":
      return 30;
    case "net_60":
      return 60;
    case "net_90":
      return 90;
    case "custom":
      return typeof customNetDays === "number" ? customNetDays : undefined;
    default:
      return undefined;
  }
}

function computeDueDate(
  createdAtIso: string,
  paymentTerms: PaymentTerms,
  customNetDays?: number
): string | undefined {
  const days = getNetDaysFromTerms(paymentTerms, customNetDays);
  if (!days) return undefined;

  const base = new Date(createdAtIso);
  if (Number.isNaN(base.getTime())) return undefined;

  base.setDate(base.getDate() + days);
  return base.toISOString();
}

function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Helper: Append an event to an invoice's event log
 */
function appendInvoiceEvent(
  invoice: Invoice,
  eventType: InvoiceEvent["type"],
  meta?: Record<string, string>
): Invoice {
  const event: InvoiceEvent = {
    id: generateEventId(),
    type: eventType,
    at: new Date().toISOString(),
    meta,
  };

  return {
    ...invoice,
    events: [...(invoice.events || []), event],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Migrate old invoices to new schema with type field
 */
function migrateInvoices(invoices: unknown[]): Invoice[] {
  return invoices.map((raw): Invoice => {
    const invoice = (raw && typeof raw === "object" ? raw : {}) as Partial<Invoice> & Record<string, unknown>;
    // Add type field if missing (default to "invoice")
    if (!invoice.type || !isValidInvoiceDocumentType(invoice.type)) {
      invoice.type = INVOICE_TYPE;
    }
    
    // Ensure status includes new values
    if (!isValidInvoiceStatus(invoice.status ? String(invoice.status) : "")) {
      invoice.status = getDefaultInvoiceStatus();
    }

    // Ensure items array exists and each item has an ID
    if (!invoice.items) {
      invoice.items = [];
    } else {
      invoice.items = invoice.items.map((item) => {
        const normalizedItem =
          item && typeof item === "object"
            ? (item as Partial<InvoiceItem> & Record<string, unknown>)
            : ({} as Partial<InvoiceItem> & Record<string, unknown>);

        if (!normalizedItem.id) {
          normalizedItem.id = generateItemId();
        }

        return normalizedItem as InvoiceItem;
      });
    }

    // Ensure events array exists
    if (!invoice.events) {
      invoice.events = [];
    } else {
      const validEventTypes = [
        "CREATED", "CREATED_DRAFT", "UPDATED", "EXPORTED_PDF", 
        "MARKED_ISSUED", "SENT", "QUOTE_SENT", "CONVERTED_TO_INVOICE",
        "CREATED_FROM_QUOTE", "ARCHIVED", "MARKED_PAID", "PAYMENT_REGISTERED", "PAYMENT_DELETED"
      ];
      
      // Ensure each event has required fields
      invoice.events = invoice.events
        .filter((event) => Boolean(event && typeof event === "object"))
        .map((event) => {
          const normalizedEvent = event as Partial<InvoiceEvent> & Record<string, unknown>;

          if (!normalizedEvent.id) {
            normalizedEvent.id = generateEventId();
          }
          if (!normalizedEvent.at) {
            normalizedEvent.at = new Date().toISOString();
          }
          // Ensure type is valid
          if (
            typeof normalizedEvent.type !== "string" ||
            !validEventTypes.includes(normalizedEvent.type)
          ) {
            normalizedEvent.type = "UPDATED";
          }
          // Ensure meta is either undefined or an object
          if (
            normalizedEvent.meta !== undefined &&
            (typeof normalizedEvent.meta !== "object" || Array.isArray(normalizedEvent.meta))
          ) {
            delete normalizedEvent.meta;
          }
          return normalizedEvent as InvoiceEvent;
        });
    }

    // Ensure required fields exist with defaults
    if (!invoice.currency) {
      invoice.currency = "USD";
    }

    if (!invoice.createdAt) {
      invoice.createdAt = new Date().toISOString();
    }

    if (!invoice.updatedAt) {
      invoice.updatedAt = invoice.createdAt || new Date().toISOString();
    }

    // Ensure numeric fields are numbers
    if (typeof invoice.subtotal !== 'number') {
      invoice.subtotal = 0;
    }
    if (typeof invoice.tax !== 'number') {
      invoice.tax = 0;
    }
    if (typeof invoice.deliveryFee !== 'number') {
      invoice.deliveryFee = 0;
    }
    if (typeof invoice.total !== 'number') {
      invoice.total = 0;
    }

    // Clean up sent field - must be undefined or a valid InvoiceSent object
    if (invoice.sent !== undefined) {
      if (!invoice.sent || typeof invoice.sent !== 'object' || !invoice.sent.sentAt) {
        // Invalid sent object, remove it
        delete invoice.sent;
      } else {
        // Ensure sent has default method if missing
        if (!invoice.sent.method) {
          invoice.sent.method = "manual";
        }
      }
    }

    // Payment terms (credit)
    if (!invoice.paymentTerms) {
      invoice.paymentTerms = "due_on_receipt";
    }

    if (invoice.paymentTerms !== "custom") {
      // Avoid stale custom days when not needed
      if (invoice.customNetDays !== undefined) {
        delete invoice.customNetDays;
      }
    }

    if (invoice.paymentTerms === "custom") {
      if (typeof invoice.customNetDays !== "number" || !Number.isFinite(invoice.customNetDays) || invoice.customNetDays <= 0) {
        // If custom was selected but days are invalid, fall back to due_on_receipt
        invoice.paymentTerms = "due_on_receipt";
        delete invoice.customNetDays;
      }
    }

    if (!invoice.dueDate) {
      const dueDate = computeDueDate(invoice.createdAt, invoice.paymentTerms, invoice.customNetDays);
      if (dueDate) invoice.dueDate = dueDate;
    }
    
    return invoice as Invoice;
  });
}

function getStoredInvoices(): Invoice[] {
  try {
    console.log('[invoice.storage] getStoredInvoices - Reading from key:', STORAGE_KEY);
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log('[invoice.storage] getStoredInvoices - Raw localStorage data:', stored ? `${stored.substring(0, 100)}...` : 'null');
    
    if (!stored) {
      console.log('[invoice.storage] getStoredInvoices - No data in localStorage, returning empty array');
      return [];
    }

    const parsed = JSON.parse(stored);
    console.log('[invoice.storage] getStoredInvoices - Parsed count:', parsed.length);
    
    // Migrate old invoices to new schema
    const migrated = migrateInvoices(parsed);
    console.log('[invoice.storage] getStoredInvoices - After migration, returning', migrated.length, 'invoices');
    
    return migrated;
  } catch (error) {
    console.error('[invoice.storage] getStoredInvoices - Error reading from localStorage:', error);
    return [];
  }
}

function saveInvoices(invoices: Invoice[]): void {
  console.log('[invoice.storage] saveInvoices - Saving', invoices.length, 'invoices to key:', STORAGE_KEY);
  console.log('[invoice.storage] saveInvoices - Invoice IDs being saved:', invoices.map(inv => inv.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  console.log('[invoice.storage] saveInvoices - Save complete, verifying...');
  const verification = localStorage.getItem(STORAGE_KEY);
  if (verification) {
    const verifiedCount = JSON.parse(verification).length;
    console.log('[invoice.storage] saveInvoices - Verification: Successfully saved', verifiedCount, 'invoices');
  } else {
    console.error('[invoice.storage] saveInvoices - Verification FAILED: localStorage is empty!');
  }
}

/**
 * Update invoice payment status based on payments
 * This should be called whenever a payment is created or deleted
 */
export async function updateInvoicePaymentStatus(
  invoiceId: string, 
  payments: Array<{ invoiceId: string; amount: number }>
): Promise<void> {
  const invoices = getStoredInvoices();
  const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
  
  if (invoiceIndex === -1) {
    return;
  }

  const invoice = invoices[invoiceIndex];
  
  // Only update payment status for invoices (not quotes)
  if (invoice.type !== INVOICE_TYPE) {
    return;
  }

  // Calculate total paid
  const invoicePayments = payments.filter(p => p.invoiceId === invoiceId);
  const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
  const balance = invoice.total - totalPaid;

  const previousStatus = invoice.status;
  let newStatus = invoice.status;

  // Determine new status based on payment
  if (balance <= 0 && totalPaid > 0) {
    // Fully paid - change to paid regardless of previous status (except archived)
    if (previousStatus !== ARCHIVED_STATUS) {
      newStatus = PAID_STATUS;
    }
  } else if (balance > 0 && totalPaid > 0) {
    // Partially paid - keep as issued/sent
    if (previousStatus === PAID_STATUS) {
      // Was paid but payment was removed, revert to sent
      newStatus = SENT_STATUS;
    }
  } else if (totalPaid === 0) {
    // No payments - if was paid, revert to sent
    if (previousStatus === PAID_STATUS) {
      newStatus = SENT_STATUS;
    }
  }

  // Update status if changed
  if (newStatus !== previousStatus) {
    let updatedInvoice = {
      ...invoice,
      status: newStatus as Invoice['status'],
      updatedAt: new Date().toISOString(),
    };

    // Add appropriate event
    if (newStatus === PAID_STATUS) {
      updatedInvoice = appendInvoiceEvent(updatedInvoice, 'MARKED_PAID', {
        totalPaid: totalPaid.toString(),
        paymentsCount: invoicePayments.length.toString(),
      });
    }

    invoices[invoiceIndex] = updatedInvoice;
    saveInvoices(invoices);
  }
}

export async function listInvoices(): Promise<Invoice[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return getStoredInvoices();
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  console.log('[invoice.storage] getInvoiceById called:', id);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const invoices = getStoredInvoices();
  const invoice = invoices.find(inv => inv.id === id) ?? null;
  
  if (invoice) {
    console.log('[invoice.storage] Invoice found:', {
      id: invoice.id,
      number: invoice.invoiceNumber,
      type: invoice.type,
      status: invoice.status,
      customerId: invoice.customerId,
    });
  } else {
    console.warn('[invoice.storage] Invoice not found:', id);
  }
  
  return invoice;
}

export async function createInvoice(input: InvoiceInput): Promise<Invoice> {
  console.log('[invoice.storage] createInvoice called:', {
    type: input.type,
    status: input.status,
    customerId: input.customerId,
    currency: input.currency,
    itemsCount: input.items.length,
  });

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));

  const invoices = getStoredInvoices();
  const settings = await tenantSettingsService.getTenantSettings();
  const companyProfile = await getCompanyProfile();

  if (!settings) {
    console.error('[invoice.storage] Tenant settings not found');
    throw new Error("Tenant settings not found");
  }

  // Calculate exchange rate if needed
  const invoiceCurrency = input.currency || settings.currency;
  let exchangeRate: number | undefined;
  let exchangeRateDate: string | undefined;
  
  if (companyProfile?.legal?.country) {
    const baseCurrency = getCountryBaseCurrency(companyProfile.legal.country);
    if (baseCurrency !== invoiceCurrency) {
      const rate = getExchangeRate(invoiceCurrency, baseCurrency);
      if (rate) {
        exchangeRate = rate.rate;
        exchangeRateDate = rate.lastUpdated;
        console.log('[invoice.storage] Exchange rate calculated:', {
          from: invoiceCurrency,
          to: baseCurrency,
          rate: exchangeRate,
        });
      }
    }
  }

  // Generate appropriate document number based on type and status
  let invoiceNumber: string;
  let incrementFunction: () => Promise<void>;
  
  if (input.type === QUOTE_TYPE) {
    // Quotes always use COT- numbering
    invoiceNumber = await generateQuoteNumber();
    incrementFunction = incrementQuoteNumber;
  } else if (input.status === DRAFT_STATUS) {
    // Draft invoices use DRF- numbering
    invoiceNumber = await generateDraftNumber();
    incrementFunction = incrementDraftNumber;
  } else {
    // Issued invoices use official INV- numbering
    invoiceNumber = await generateInvoiceNumber();
    incrementFunction = incrementInvoiceNumber;
  }

  console.log('[invoice.storage] Generated document number:', {
    number: invoiceNumber,
    type: input.type,
    status: input.status,
  });

  // Add IDs to items
  const items: InvoiceItem[] = input.items.map(item => ({
    id: generateItemId(),
    ...item,
  }));

  // Calculate totals
  const { subtotal, tax, deliveryFee, total } = calcInvoiceTotals(
    items,
    settings,
    settings.country,
    input.deliveryFee ?? 0
  );

  const now = new Date().toISOString();
  const paymentTerms: PaymentTerms = input.paymentTerms || "due_on_receipt";
  const customNetDays = paymentTerms === "custom" ? input.customNetDays : undefined;
  const dueDate = computeDueDate(now, paymentTerms, customNetDays);

  let newInvoice: Invoice = {
    id: generateId(),
    type: input.type || INVOICE_TYPE,
    invoiceNumber,
    customerId: input.customerId,
    currency: input.currency || settings.currency,
    items,
    subtotal,
    tax,
    deliveryFee,
    total,
    status: input.status,
    createdAt: now,
    updatedAt: now,
    paymentTerms,
    customNetDays,
    dueDate,
    exchangeRate,
    exchangeRateDate,
    events: [],
    recurringConfig: input.recurringConfig, // Add recurring configuration
    scheduledSend: input.scheduledSend, // Add scheduled send configuration
  };

  console.log('[invoice.storage] Invoice object created:', {
    id: newInvoice.id,
    currency: newInvoice.currency,
    inputCurrency: input.currency,
    settingsCurrency: settings.currency,
    hasRecurringConfig: !!newInvoice.recurringConfig,
    recurringEnabled: newInvoice.recurringConfig?.enabled,
    hasScheduledSend: !!newInvoice.scheduledSend,
    scheduledEnabled: newInvoice.scheduledSend?.enabled,
  });

  // Register appropriate creation event based on status
  if (input.status === DRAFT_STATUS) {
    newInvoice = appendInvoiceEvent(newInvoice, "CREATED_DRAFT");
  } else {
    newInvoice = appendInvoiceEvent(newInvoice, "CREATED");
  }

  // If status is issued, register MARKED_ISSUED event
  if (input.status === ISSUED_STATUS) {
    newInvoice = appendInvoiceEvent(newInvoice, "MARKED_ISSUED");
  }

  invoices.push(newInvoice);
  console.log('[invoice.storage] createInvoice - About to save', invoices.length, 'invoices (including new one)');
  saveInvoices(invoices);

  // Verify the invoice was saved
  const verifyRead = getStoredInvoices();
  const savedInvoice = verifyRead.find(inv => inv.id === newInvoice.id);
  console.log('[invoice.storage] createInvoice - Verification: New invoice present after save?', !!savedInvoice);

  // Increment the appropriate document number counter
  await incrementFunction();

  console.log('[invoice.storage] Invoice created successfully:', {
    id: newInvoice.id,
    number: newInvoice.invoiceNumber,
    type: newInvoice.type,
    status: newInvoice.status,
    eventsCount: newInvoice.events?.length ?? 0,
  });

  return newInvoice;
}

export async function updateInvoice(id: string, input: InvoiceInput): Promise<Invoice> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const invoices = getStoredInvoices();
  const index = invoices.findIndex(inv => inv.id === id);

  if (index === -1) {
    throw new Error("Invoice not found");
  }

  const settings = await tenantSettingsService.getTenantSettings();

  if (!settings) {
    throw new Error("Tenant settings not found");
  }

  // Preserve existing item IDs or generate new ones
  const existingItems = invoices[index].items;
  const items: InvoiceItem[] = input.items.map((item, idx) => ({
    id: existingItems[idx]?.id || generateItemId(),
    ...item,
  }));

  // Recalculate totals
  const { subtotal, tax, deliveryFee, total } = calcInvoiceTotals(
    items,
    settings,
    settings.country,
    typeof input.deliveryFee === "number" ? input.deliveryFee : invoices[index].deliveryFee ?? 0
  );

  const paymentTerms: PaymentTerms = input.paymentTerms || invoices[index].paymentTerms || "due_on_receipt";
  const customNetDays = paymentTerms === "custom" ? input.customNetDays : undefined;
  const dueDate = computeDueDate(invoices[index].createdAt, paymentTerms, customNetDays);

  let updatedInvoice: Invoice = {
    ...invoices[index],
    customerId: input.customerId,
    items,
    subtotal,
    tax,
    deliveryFee,
    total,
    status: input.status,
    paymentTerms,
    customNetDays,
    dueDate,
    recurringConfig: input.recurringConfig, // Update recurring configuration
    scheduledSend: input.scheduledSend, // Update scheduled send configuration
    updatedAt: new Date().toISOString(),
  };

  console.log('[invoice.storage] Invoice updated with recurringConfig:', {
    id,
    hasRecurringConfig: !!updatedInvoice.recurringConfig,
    recurringEnabled: updatedInvoice.recurringConfig?.enabled,
    hasScheduledSend: !!updatedInvoice.scheduledSend,
    scheduledEnabled: updatedInvoice.scheduledSend?.enabled,
  });

  // Register UPDATED event
  updatedInvoice = appendInvoiceEvent(updatedInvoice, "UPDATED");

  invoices[index] = updatedInvoice;
  saveInvoices(invoices);

  return updatedInvoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 250));

  const invoices = getStoredInvoices();
  const filtered = invoices.filter(inv => inv.id !== id);

  if (filtered.length === invoices.length) {
    throw new Error("Invoice not found");
  }

  saveInvoices(filtered);
}

export async function updateInvoiceStatus(
  id: string,
  status: Invoice["status"]
): Promise<Invoice> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const invoices = getStoredInvoices();
  const index = invoices.findIndex(inv => inv.id === id);

  if (index === -1) {
    throw new Error("Invoice not found");
  }

  const previousStatus = invoices[index].status;
  const previousNumber = invoices[index].invoiceNumber;

  let updatedInvoice: Invoice = {
    ...invoices[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  // If converting draft to issued, generate official invoice number
  if (previousStatus === DRAFT_STATUS && status === ISSUED_STATUS) {
    const officialNumber = await generateInvoiceNumber();
    updatedInvoice.invoiceNumber = officialNumber;
    
    console.log('[invoice.storage] Converting draft to issued:', {
      previousNumber,
      newNumber: officialNumber,
    });
    
    // Increment official invoice counter
    await incrementInvoiceNumber();
  }

  // Register MARKED_ISSUED event if changing to issued
  if (status === ISSUED_STATUS) {
    updatedInvoice = appendInvoiceEvent(updatedInvoice, "MARKED_ISSUED");
  }

  invoices[index] = updatedInvoice;
  saveInvoices(invoices);

  return updatedInvoice;
}

export async function recordInvoiceExportPdf(id: string): Promise<Invoice> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));

  const invoices = getStoredInvoices();
  const index = invoices.findIndex(inv => inv.id === id);

  if (index === -1) {
    throw new Error("Invoice not found");
  }

  const updatedInvoice = appendInvoiceEvent(
    invoices[index],
    "EXPORTED_PDF"
  );

  invoices[index] = updatedInvoice;
  saveInvoices(invoices);

  return updatedInvoice;
}

export async function recordInvoiceSent(
  id: string,
  toEmail?: string,
  message?: string
): Promise<Invoice> {
  console.log('[invoice.storage] recordInvoiceSent called:', { id, toEmail, hasMessage: !!message });
  
  // Check localStorage directly before calling getStoredInvoices
  const rawData = localStorage.getItem(STORAGE_KEY);
  console.log('[invoice.storage] recordInvoiceSent - Direct localStorage check:', rawData ? `Has data (${rawData.length} chars)` : 'EMPTY/NULL');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const invoices = getStoredInvoices();
  console.log('[invoice.storage] All invoice IDs:', invoices.map(inv => inv.id));
  const index = invoices.findIndex(inv => inv.id === id);

  if (index === -1) {
    console.error('[invoice.storage] Invoice not found with id:', id);
    throw new Error("Invoice not found");
  }

  const meta: Record<string, string> = {};
  if (toEmail) meta.toEmail = toEmail;
  if (message) meta.message = message;

  let updatedInvoice: Invoice = {
    ...invoices[index],
    status: SENT_STATUS,
    sent: {
      toEmail,
      message,
      sentAt: new Date().toISOString(),
      method: "manual",
    },
  };

  // Use different event type based on document type
  const eventType = updatedInvoice.type === QUOTE_TYPE ? "QUOTE_SENT" : "SENT";
  updatedInvoice = appendInvoiceEvent(updatedInvoice, eventType, meta);

  invoices[index] = updatedInvoice;
  saveInvoices(invoices);

  return updatedInvoice;
}

export async function archiveInvoice(id: string): Promise<Invoice> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const invoices = getStoredInvoices();
  const index = invoices.findIndex(inv => inv.id === id);

  if (index === -1) {
    throw new Error("Invoice not found");
  }

  let updatedInvoice: Invoice = {
    ...invoices[index],
    status: ARCHIVED_STATUS,
    archivedAt: new Date().toISOString(),
  };

  updatedInvoice = appendInvoiceEvent(updatedInvoice, "ARCHIVED");

  invoices[index] = updatedInvoice;
  saveInvoices(invoices);

  return updatedInvoice;
}

/**
 * Convert a quote to an invoice
 * Creates a new invoice document from the quote data with proper traceability
 */
export async function convertQuoteToInvoice(quoteId: string): Promise<Invoice> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));

  const invoices = getStoredInvoices();
  const quote = invoices.find(inv => inv.id === quoteId);

  if (!quote) {
    throw new Error("Quote not found");
  }

  if (quote.type !== QUOTE_TYPE) {
    throw new Error("Document is not a quote");
  }

  const settings = await tenantSettingsService.getTenantSettings();

  if (!settings) {
    throw new Error("Tenant settings not found");
  }

  // Generate new invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Clone items with new IDs
  const items: InvoiceItem[] = quote.items.map(item => ({
    ...item,
    id: generateItemId(),
  }));

  const now = new Date().toISOString();
  const paymentTerms: PaymentTerms = (quote.paymentTerms as PaymentTerms) || "due_on_receipt";
  const customNetDays = paymentTerms === "custom" ? quote.customNetDays : undefined;
  const dueDate = computeDueDate(now, paymentTerms, customNetDays);

  // Create new invoice from quote
  let newInvoice: Invoice = {
    id: generateId(),
    type: INVOICE_TYPE,
    invoiceNumber,
    customerId: quote.customerId,
    currency: quote.currency,
    items,
    subtotal: quote.subtotal,
    tax: quote.tax,
    deliveryFee: quote.deliveryFee ?? 0,
    total: quote.total,
    status: DRAFT_STATUS,
    originQuoteId: quoteId, // Link back to original quote
    createdAt: now,
    updatedAt: now,
    paymentTerms,
    customNetDays,
    dueDate,
    events: [],
  };

  // Register creation event with origin reference
  newInvoice = appendInvoiceEvent(newInvoice, "CREATED_FROM_QUOTE", {
    originQuoteId: quoteId,
    originQuoteNumber: quote.invoiceNumber,
  });

  // Update the quote to record conversion
  const quoteIndex = invoices.findIndex(inv => inv.id === quoteId);
  if (quoteIndex !== -1) {
    const updatedQuote = appendInvoiceEvent(
      invoices[quoteIndex],
      "CONVERTED_TO_INVOICE",
      {
        newInvoiceId: newInvoice.id,
        newInvoiceNumber: newInvoice.invoiceNumber,
      }
    );
    invoices[quoteIndex] = updatedQuote;
  }

  // Add new invoice to storage
  invoices.push(newInvoice);
  console.log('[invoice.storage] convertQuoteToInvoice - About to save', invoices.length, 'invoices (including new invoice)');
  saveInvoices(invoices);

  // Verify the invoice was saved
  const verifyRead = getStoredInvoices();
  const savedInvoice = verifyRead.find(inv => inv.id === newInvoice.id);
  console.log('[invoice.storage] convertQuoteToInvoice - Verification: New invoice present after save?', !!savedInvoice);

  // Increment invoice number for next invoice
  await incrementInvoiceNumber();

  return newInvoice;
}
