/**
 * Payment Methods Constants
 * Different countries support different payment methods
 */

export interface PaymentMethod {
  id: string;
  name: string;
  nameEs: string;
  icon: string; // Emoji icon
  requiresReference?: boolean; // If true, requires transaction reference number
  requiresBankInfo?: boolean; // If true, requires bank account details
}

/**
 * Universal payment methods available across all countries
 */
export const UNIVERSAL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "cash",
    name: "Cash",
    nameEs: "Efectivo",
    icon: "💵",
    requiresReference: false,
    requiresBankInfo: false,
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    nameEs: "Transferencia Bancaria",
    icon: "🏦",
    requiresReference: true,
    requiresBankInfo: true,
  },
  {
    id: "check",
    name: "Check",
    nameEs: "Cheque",
    icon: "📝",
    requiresReference: true,
    requiresBankInfo: false,
  },
  {
    id: "card",
    name: "Card",
    nameEs: "Tarjetas",
    icon: "💳",
    requiresReference: false,
    requiresBankInfo: false,
  },
];

/**
 * Country-specific payment methods
 */
export const COUNTRY_PAYMENT_METHODS: Record<string, PaymentMethod[]> = {
  CR: [
    // Costa Rica
    ...UNIVERSAL_PAYMENT_METHODS,
    {
      id: "sinpe_movil",
      name: "SINPE Móvil",
      nameEs: "SINPE Móvil",
      icon: "📱",
      requiresReference: true, // Phone number
      requiresBankInfo: false,
    },
  ],
  MX: [
    // Mexico
    ...UNIVERSAL_PAYMENT_METHODS,
    {
      id: "spei",
      name: "SPEI Transfer",
      nameEs: "Transferencia SPEI",
      icon: "🏦",
      requiresReference: true,
      requiresBankInfo: true,
    },
    {
      id: "oxxo",
      name: "OXXO",
      nameEs: "OXXO",
      icon: "🏪",
      requiresReference: true,
      requiresBankInfo: false,
    },
  ],
  US: [
    // United States
    ...UNIVERSAL_PAYMENT_METHODS,
    {
      id: "ach",
      name: "ACH Transfer",
      nameEs: "Transferencia ACH",
      icon: "🏦",
      requiresReference: true,
      requiresBankInfo: true,
    },
    {
      id: "wire",
      name: "Wire Transfer",
      nameEs: "Transferencia Internacional",
      icon: "🌐",
      requiresReference: true,
      requiresBankInfo: true,
    },
  ],
  CO: [
    // Colombia
    ...UNIVERSAL_PAYMENT_METHODS,
    {
      id: "pse",
      name: "PSE",
      nameEs: "PSE",
      icon: "🏦",
      requiresReference: true,
      requiresBankInfo: false,
    },
    {
      id: "nequi",
      name: "Nequi",
      nameEs: "Nequi",
      icon: "📱",
      requiresReference: true,
      requiresBankInfo: false,
    },
    {
      id: "daviplata",
      name: "DaviPlata",
      nameEs: "DaviPlata",
      icon: "📱",
      requiresReference: true,
      requiresBankInfo: false,
    },
  ],
  AR: [
    // Argentina
    ...UNIVERSAL_PAYMENT_METHODS,
    {
      id: "mercado_pago",
      name: "Mercado Pago",
      nameEs: "Mercado Pago",
      icon: "💙",
      requiresReference: true,
      requiresBankInfo: false,
    },
  ],
  CL: [
    // Chile
    ...UNIVERSAL_PAYMENT_METHODS,
    {
      id: "khipu",
      name: "Khipu",
      nameEs: "Khipu",
      icon: "🏦",
      requiresReference: true,
      requiresBankInfo: false,
    },
  ],
  BR: [
    // Brazil
    ...UNIVERSAL_PAYMENT_METHODS,
    {
      id: "pix",
      name: "PIX",
      nameEs: "PIX",
      icon: "⚡",
      requiresReference: true,
      requiresBankInfo: false,
    },
    {
      id: "boleto",
      name: "Boleto Bancário",
      nameEs: "Boleto Bancário",
      icon: "📄",
      requiresReference: true,
      requiresBankInfo: false,
    },
  ],
  PE: [
    // Peru
    ...UNIVERSAL_PAYMENT_METHODS,
    {
      id: "yape",
      name: "Yape",
      nameEs: "Yape",
      icon: "📱",
      requiresReference: true,
      requiresBankInfo: false,
    },
    {
      id: "plin",
      name: "Plin",
      nameEs: "Plin",
      icon: "📱",
      requiresReference: true,
      requiresBankInfo: false,
    },
  ],
};

/**
 * Get available payment methods for a specific country
 */
export const getPaymentMethodsByCountry = (countryCode: string): PaymentMethod[] => {
  return COUNTRY_PAYMENT_METHODS[countryCode] || UNIVERSAL_PAYMENT_METHODS;
};

/**
 * Get payment method by ID
 */
export const getPaymentMethodById = (id: string, countryCode?: string): PaymentMethod | undefined => {
  const methods = countryCode 
    ? getPaymentMethodsByCountry(countryCode)
    : UNIVERSAL_PAYMENT_METHODS;
  return methods.find(m => m.id === id);
};

/**
 * Get default payment methods for a country (typically the most common ones pre-selected)
 */
export const getDefaultPaymentMethods = (countryCode: string): string[] => {
  const defaults: Record<string, string[]> = {
    CR: ["cash", "bank_transfer", "sinpe_movil", "card"],
    MX: ["cash", "bank_transfer", "spei", "card"],
    US: ["cash", "bank_transfer", "check", "card"],
    CO: ["cash", "bank_transfer", "pse", "nequi", "card"],
    AR: ["cash", "bank_transfer", "mercado_pago", "card"],
    CL: ["cash", "bank_transfer", "card"],
    BR: ["cash", "pix", "boleto", "card"],
    PE: ["cash", "bank_transfer", "yape", "card"],
  };
  
  return defaults[countryCode] || ["cash", "bank_transfer", "card"];
};
