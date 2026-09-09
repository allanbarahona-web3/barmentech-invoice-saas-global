/**
 * Exchange Rate Service
 * 
 * Provides currency conversion rates for international invoicing.
 * For MVP: Uses configurable rates stored locally.
 * Future: Can be connected to external APIs (OpenExchangeRates, Fixer.io, etc.)
 */

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

// Default exchange rates (can be updated manually)
// Base currency: USD
const DEFAULT_RATES: Record<string, number> = {
  "USD": 1,
  "CRC": 520.00,  // Costa Rica Colón
  "EUR": 0.92,    // Euro
  "GBP": 0.79,    // British Pound
  "CAD": 1.36,    // Canadian Dollar
  "MXN": 17.50,   // Mexican Peso
  "ARS": 350.00,  // Argentine Peso
  "BRL": 5.00,    // Brazilian Real
  "CLP": 920.00,  // Chilean Peso
  "COP": 4000.00, // Colombian Peso
};

/**
 * Get the current exchange rates from localStorage or defaults
 */
function getStoredRates(): Record<string, number> {
  try {
    const stored = localStorage.getItem("exchangeRates");
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_RATES, ...parsed.rates };
    }
  } catch (e) {
    console.error("Error loading exchange rates:", e);
  }
  return DEFAULT_RATES;
}

/**
 * Get the last update date for exchange rates
 */
function getLastUpdateDate(): string {
  try {
    const stored = localStorage.getItem("exchangeRates");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.lastUpdated || new Date().toISOString();
    }
  } catch (e) {
    console.error("Error loading exchange rate date:", e);
  }
  return new Date().toISOString();
}

/**
 * Update exchange rates in localStorage
 */
export function updateExchangeRates(rates: Record<string, number>): void {
  const data = {
    rates: { ...DEFAULT_RATES, ...rates },
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem("exchangeRates", JSON.stringify(data));
}

/**
 * Get exchange rate between two currencies
 * @param from Source currency code (e.g., "USD")
 * @param to Target currency code (e.g., "CRC")
 * @returns Exchange rate or null if not available
 */
export function getExchangeRate(from: string, to: string): ExchangeRate | null {
  const rates = getStoredRates();
  
  // Same currency
  if (from === to) {
    return {
      from,
      to,
      rate: 1,
      lastUpdated: getLastUpdateDate(),
    };
  }

  // Convert both currencies to USD base
  const fromRate = rates[from];
  const toRate = rates[to];

  if (!fromRate || !toRate) {
    console.warn(`Exchange rate not available for ${from} -> ${to}`);
    return null;
  }

  // Calculate cross rate: (1 FROM) * (toRate / fromRate) = X TO
  const rate = toRate / fromRate;

  return {
    from,
    to,
    rate: parseFloat(rate.toFixed(4)),
    lastUpdated: getLastUpdateDate(),
  };
}

/**
 * Convert an amount from one currency to another
 * @param amount Amount in source currency
 * @param from Source currency code
 * @param to Target currency code
 * @returns Converted amount or null if rate not available
 */
export function convertCurrency(amount: number, from: string, to: string): number | null {
  const exchangeRate = getExchangeRate(from, to);
  if (!exchangeRate) return null;

  return parseFloat((amount * exchangeRate.rate).toFixed(2));
}

/**
 * Check if conversion should be shown for a country/currency pair
 * @param countryCurrency Company's base currency (from country)
 * @param invoiceCurrency Invoice currency
 * @returns true if conversion info should be displayed
 */
export function shouldShowConversion(countryCurrency: string, invoiceCurrency: string): boolean {
  return countryCurrency !== invoiceCurrency;
}

/**
 * Get the base currency for a country
 */
export function getCountryBaseCurrency(countryCode: string): string {
  const countryToCurrency: Record<string, string> = {
    "CR": "CRC",  // Costa Rica
    "US": "USD",  // United States
    "MX": "MXN",  // Mexico
    "AR": "ARS",  // Argentina
    "BR": "BRL",  // Brazil
    "CL": "CLP",  // Chile
    "CO": "COP",  // Colombia
    "EU": "EUR",  // European Union
    "GB": "GBP",  // United Kingdom
    "CA": "CAD",  // Canada
  };
  
  return countryToCurrency[countryCode] || "USD";
}
