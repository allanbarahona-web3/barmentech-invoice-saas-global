"use client";

import { useState, useEffect } from "react";
import { Repeat } from "lucide-react";
import Image from "next/image";
import { Invoice } from "../invoice.schema";
import { CompanyProfile } from "@/modules/company/company.schema";
import { Customer } from "@/modules/customers/customer.schema";
import { TenantSettings } from "@/schemas/tenantSettings.schema";
import { CustomHeaderField } from "@/modules/company/company.schema";
import { Product } from "@/modules/products/product.schema";
import { calcTotalDiscount } from "../invoice.calc";
import { getCountryBaseCurrency, convertCurrency } from "@/lib/exchangeRates";
import { getStatusDefinition, getStatusLabel } from "@/lib/countryRegistry";
import { getPrimaryTax, getResolvedTaxConfig } from "@/lib/taxConfig";
// import { isCREnabled } from "@/modules/company/company.country";
// import { buildCRFiscalSummary } from "@/country-packs/cr";
import { t } from "@/i18n";

interface InvoicePreviewProps {
  invoice: Invoice;
  companyProfile: CompanyProfile;
  customer: Customer;
  tenantSettings: TenantSettings;
  products?: Product[];
}

export function InvoicePreview({
  invoice,
  companyProfile,
  customer,
  tenantSettings,
  products = [],
}: InvoicePreviewProps) {
  const { branding, legal, fiscal } = companyProfile;
  // const showCRInfo = isCREnabled(legal.country);
  const [customHeaderFields] = useState<CustomHeaderField[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const stored = localStorage.getItem("customHeaderFields");
    if (!stored) {
      return [];
    }

    try {
      const fields = JSON.parse(stored) as CustomHeaderField[];
      return fields.filter((f) => f.enabled);
    } catch (e) {
      console.error("Failed to parse custom header fields:", e);
      return [];
    }
  });

  // Calculate total discount
  const totalDiscount = calcTotalDiscount(invoice.items);

  // Calculate currency conversion if needed
  const baseCurrency = legal.country ? getCountryBaseCurrency(legal.country) : null;
  const showConversion = baseCurrency && baseCurrency !== invoice.currency && invoice.exchangeRate;
  const statusDefinition = getStatusDefinition(invoice.status, legal.country);
  const statusLabel = getStatusLabel(invoice.status, legal.country, t().invoices as Record<string, unknown>);
  const resolvedTaxConfig = getResolvedTaxConfig(tenantSettings, legal.country);
  const primaryTax = getPrimaryTax(resolvedTaxConfig);
  const convertedSubtotal = showConversion ? convertCurrency(invoice.subtotal, invoice.currency, baseCurrency) : null;
  const convertedTax = showConversion ? convertCurrency(invoice.tax, invoice.currency, baseCurrency) : null;
  const convertedDeliveryFee = showConversion
    ? convertCurrency(invoice.deliveryFee || 0, invoice.currency, baseCurrency)
    : null;
  const convertedTotal = showConversion ? convertCurrency(invoice.total, invoice.currency, baseCurrency) : null;

  // Debug recurring config
  useEffect(() => {
    console.log('[InvoicePreview] Rendering with invoice data:', {
      id: invoice.id,
      currency: invoice.currency,
      legalCurrency: legal.currency,
      hasRecurringConfig: !!invoice.recurringConfig,
      enabled: invoice.recurringConfig?.enabled,
      fullConfig: invoice.recurringConfig,
    });
  }, [invoice.recurringConfig, invoice.currency, legal.currency, invoice.id]);

  const getPaymentTermsLabel = () => {
    switch (invoice.paymentTerms) {
      case "due_on_receipt":
        return "Contado";
      case "net_15":
        return "Net 15";
      case "net_30":
        return "Net 30";
      case "net_60":
        return "Net 60";
      case "net_90":
        return "Net 90";
      case "custom":
        return invoice.customNetDays ? `Custom (${invoice.customNetDays} días)` : "Custom";
      default:
        return "Contado";
    }
  };

  // Format currency - use appropriate locale based on currency
  const formatCurrency = (amount: number) => {
    const currencyToFormat = invoice.currency || legal.currency;
    
    // Map currencies to appropriate locales for better formatting
    const localeMap: Record<string, string> = {
      'USD': 'en-US',
      'CRC': 'es-CR',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'MXN': 'es-MX',
      'ARS': 'es-AR',
      'BRL': 'pt-BR',
      'CLP': 'es-CL',
      'COP': 'es-CO',
    };
    
    const locale = localeMap[currencyToFormat] || 'en-US';
    
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyToFormat,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback if currency is not supported
      console.error(`[InvoicePreview] Error formatting ${currencyToFormat}:`, error);
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ` ${currencyToFormat}`;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("es-CR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  };

  return (
    <div className="bg-white text-black min-h-screen p-8 print:min-h-0 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none">
        {/* Header */}
        <div
          className="p-8 border-b-4"
          style={{
            borderColor: branding.primaryColor || "#000000",
          }}
        >
          <div className="grid grid-cols-3 gap-6 items-start">
            {/* Grid 1: Company Info */}
            <div className="space-y-2">
              {branding.logoUrl && (
                <Image
                  src={branding.logoUrl}
                  alt="Logo"
                  width={160}
                  height={56}
                  unoptimized
                  className="h-14 object-contain mb-3"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              )}
              <h1 className="text-xl font-bold text-gray-900">
                {legal.commercialName || legal.legalName}
              </h1>
              {legal.commercialName && legal.legalName !== legal.commercialName && (
                <p className="text-xs text-gray-600">{legal.legalName}</p>
              )}
              {fiscal.taxId && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">ID Fiscal:</span> {fiscal.taxId}
                </p>
              )}
              {legal.country && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">País:</span> {legal.country}
                </p>
              )}
            </div>

            {/* Grid 2: Contact Info */}
            <div className="space-y-2">
              {/* Spacer to align with company name */}
              {branding.logoUrl && <div className="h-14 mb-3" />}
              <div className="text-xl font-bold mb-2 invisible">Spacer</div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Contacto
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                {legal.email && (
                  <p>
                    <span className="font-medium">Email:</span> {legal.email}
                  </p>
                )}
                {legal.phone && (
                  <p>
                    <span className="font-medium">Teléfono:</span> {legal.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Grid 3: Invoice Info */}
            <div className="text-right space-y-2">
              <h2
                className="text-2xl font-bold"
                style={{ color: branding.primaryColor || "#000000" }}
              >
                {invoice.type === "quote" ? t().invoicePreview.quote : t().invoicePreview.invoice}
              </h2>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600">{t().invoicePreview.number}:</span>{" "}
                  <span className="font-semibold">{invoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t().invoicePreview.date}:</span>{" "}
                  <span className="font-medium">{formatDate(invoice.createdAt)}</span>
                </div>
                {invoice.paymentTerms !== "due_on_receipt" && invoice.dueDate && (
                  <>
                    <div>
                      <span className="text-gray-600">Términos:</span>{" "}
                      <span className="font-medium">{getPaymentTermsLabel()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Vence:</span>{" "}
                      <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-gray-600">{t().invoicePreview.status}:</span>{" "}
                  <span
                    className="inline-block px-2 py-1 text-xs font-medium rounded"
                    style={{
                      backgroundColor:
                        statusDefinition?.emphasized
                          ? branding.secondaryColor || "#10b981"
                          : "#d1d5db",
                      color:
                        statusDefinition?.emphasized
                          ? "#ffffff"
                          : "#000000",
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Header Fields */}
          {customHeaderFields.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
              <div className="grid grid-cols-2 gap-2">
                {customHeaderFields.map((field) => (
                  <div key={field.id}>
                    <span className="font-medium">{field.label}:</span> {field.value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exchange Rate Banner (QuickBooks style) */}
          {showConversion && invoice.exchangeRate && baseCurrency && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-blue-50 dark:bg-blue-950 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        Tipo de cambio:
                      </span>
                      <span className="ml-2 text-blue-700 dark:text-blue-300">
                        1 {invoice.currency} = {invoice.exchangeRate.toFixed(4)} {baseCurrency}
                      </span>
                    </div>
                  </div>
                  {invoice.exchangeRateDate && (
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      {new Date(invoice.exchangeRateDate).toLocaleDateString('es-CR')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CR Fiscal Info - Hidden by default, can be enabled via custom header fields in the future */}
          {/* {showCRInfo && fiscal.cr && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
              <div className="grid grid-cols-2 gap-2">
                {buildCRFiscalSummary(fiscal.cr).map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            </div>
          )} */}
        </div>

        {/* Customer Section */}
        <div className="p-8 bg-gray-50">
          <div className="grid grid-cols-2 gap-8">
            {/* Grid 1: Facturado A */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {t().invoicePreview.billedTo}
              </h3>
              <div className="text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Nombre:</span>{" "}
                  <span className="text-gray-900">{customer.name}</span>
                </p>
                {customer.idNumber && (
                  <p className="text-gray-600">
                    <span className="font-medium">ID:</span>{" "}
                    <span className="text-gray-900">{customer.idNumber}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Grid 2: Contact Info */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Contacto
              </h3>
              <div className="text-sm">
                {customer.email && (
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span>{" "}
                    <span className="text-gray-900">{customer.email}</span>
                  </p>
                )}
                {customer.phone && (
                  <p className="text-gray-600">
                    <span className="font-medium">Tel(s):</span>{" "}
                    <span className="text-gray-900">{customer.phone}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recurring Invoice Info (Premium Feature) */}
        {invoice.recurringConfig?.enabled && (
          <div className="px-8 py-3 bg-gray-50 border-y border-gray-300">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-700">
                  Facturación recurrente activa
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span>Próxima fecha de cobro:</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(invoice.recurringConfig.nextGenerationDate)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="p-8">
          <table className="w-full">
            <thead>
              <tr
                className="border-b-2"
                style={{ borderColor: branding.primaryColor || "#000000" }}
              >
                <th className="text-left py-3 font-semibold text-gray-700 w-50">
                  Producto
                </th>
                <th className="text-left py-3 font-semibold text-gray-700">
                  {t().invoicePreview.description}
                </th>
                <th className="text-right py-3 font-semibold text-gray-700 w-24">
                  {t().invoicePreview.qty}
                </th>
                <th className="text-right py-3 font-semibold text-gray-700 w-32">
                  {t().invoicePreview.unitPrice}
                </th>
                <th className="text-right py-3 font-semibold text-gray-700 w-32">
                  {t().invoicePreview.amount}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => {
                const product = item.productId ? products.find(p => p.id === item.productId) : null;
                const lineSubtotal = item.qty * item.unitPrice;
                const lineDiscount = lineSubtotal * ((item.discount || 0) / 100);
                const lineTotal = lineSubtotal - lineDiscount;
                
                return (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-3 text-gray-800">
                      {product ? product.name : "-"}
                    </td>
                    <td className="py-3 text-gray-800">
                      {item.description}
                      {item.discount > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          Descuento: {item.discount}%
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right text-gray-800">{item.qty}</td>
                    <td className="py-3 text-right text-gray-800">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {item.discount > 0 ? (
                        <div>
                          <div className="line-through text-gray-500 text-sm">
                            {formatCurrency(lineSubtotal)}
                          </div>
                          <div>{formatCurrency(lineTotal)}</div>
                        </div>
                      ) : (
                        formatCurrency(lineTotal)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>{t().invoicePreview.subtotal}:</span>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(invoice.subtotal)}</div>
                  {showConversion && convertedSubtotal !== null && baseCurrency && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      ≈ {new Intl.NumberFormat("es-CR", {
                        style: "currency",
                        currency: baseCurrency,
                      }).format(convertedSubtotal)}
                    </div>
                  )}
                </div>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento total:</span>
                  <div className="text-right">
                    <div className="font-medium">-{formatCurrency(totalDiscount)}</div>
                    {showConversion && baseCurrency && (
                      <div className="text-xs text-green-500 mt-0.5">
                        ≈ -{new Intl.NumberFormat("es-CR", {
                          style: "currency",
                          currency: baseCurrency,
                        }).format(convertCurrency(totalDiscount, invoice.currency, baseCurrency) || 0)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {primaryTax?.enabled && invoice.tax > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>
                    {primaryTax.label} ({primaryTax.rate}%):
                  </span>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(invoice.tax)}</div>
                    {showConversion && convertedTax !== null && baseCurrency && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        ≈ {new Intl.NumberFormat("es-CR", {
                          style: "currency",
                          currency: baseCurrency,
                        }).format(convertedTax)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {invoice.deliveryFee > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>{t().invoicePreview.deliveryFee}:</span>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(invoice.deliveryFee)}</div>
                    {showConversion && convertedDeliveryFee !== null && baseCurrency && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        ≈ {new Intl.NumberFormat("es-CR", {
                          style: "currency",
                          currency: baseCurrency,
                        }).format(convertedDeliveryFee)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div
                className="flex justify-between text-lg font-bold pt-2 border-t-2"
                style={{ borderColor: branding.primaryColor || "#000000" }}
              >
                <span>{t().invoicePreview.total}:</span>
                <div className="text-right">
                  <div>{formatCurrency(invoice.total)}</div>
                  {showConversion && convertedTotal !== null && baseCurrency && (
                    <div className="text-sm font-semibold text-gray-600 mt-1">
                      ≈ {new Intl.NumberFormat("es-CR", {
                        style: "currency",
                        currency: baseCurrency,
                      }).format(convertedTotal)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {branding.invoiceFooter && (
          <div className="p-8 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center whitespace-pre-line">
              {branding.invoiceFooter}
            </p>
          </div>
        )}

        {/* Bottom Border */}
        <div
          className="h-2"
          style={{
            backgroundColor: branding.secondaryColor || branding.primaryColor || "#000000",
          }}
        />
      </div>
    </div>
  );
}
