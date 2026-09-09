import { CountryPackManifest } from "../types";

export const CR_DOCUMENT_TYPES = ["invoice", "quote"] as const;
export const CR_STATUS_IDS = ["draft", "issued", "sent", "paid", "archived"] as const;

export type CRDocumentType = (typeof CR_DOCUMENT_TYPES)[number];
export type CRDocumentStatus = (typeof CR_STATUS_IDS)[number];

export const CR_MANIFEST: CountryPackManifest = {
  countryCode: "CR",
  documentTypes: [
    { id: "invoice", labelToken: "documentTypeInvoice", defaultLabel: "Factura" },
    { id: "quote", labelToken: "documentTypeQuote", defaultLabel: "Cotizacion" },
  ],
  statusModel: {
    defaultStatus: "draft",
    statuses: [
      {
        id: "draft",
        labelToken: "statusDraft",
        defaultLabel: "Borrador",
        emphasized: false,
        badgeVariant: "secondary",
      },
      {
        id: "issued",
        labelToken: "statusIssued",
        defaultLabel: "Emitida",
        emphasized: true,
        badgeVariant: "default",
        badgeClassName: "bg-green-600 hover:bg-green-700",
      },
      {
        id: "sent",
        labelToken: "statusSent",
        defaultLabel: "Enviada",
        emphasized: true,
        badgeVariant: "default",
        badgeClassName: "bg-blue-600 hover:bg-blue-700",
      },
      {
        id: "paid",
        defaultLabel: "Pagada",
        emphasized: true,
        badgeVariant: "default",
        badgeClassName: "bg-emerald-600 hover:bg-emerald-700",
      },
      {
        id: "archived",
        labelToken: "statusArchived",
        defaultLabel: "Archivada",
        emphasized: false,
        badgeVariant: "secondary",
      },
    ],
  },
  localeConfig: {
    language: "es",
    dateLocale: "es-CR",
    currencyLocales: {
      CRC: "es-CR",
      USD: "en-US",
      EUR: "de-DE",
      MXN: "es-MX",
      COP: "es-CO",
    },
  },
  taxConfig: {
    mode: "single_rate",
    defaultTaxId: "vat",
    taxes: [
      {
        id: "vat",
        label: "IVA",
        rate: 13,
        enabledByDefault: true,
      },
    ],
  },
  enabledModules: ["invoices", "quotes", "customers", "products", "company", "payments"],
  featureFlags: {
    allowRecurringInvoices: true,
    allowScheduledSend: true,
    allowUnlimitedCC: true,
    crFiscalFields: true,
  },
};
