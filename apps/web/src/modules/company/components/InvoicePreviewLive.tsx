"use client";

import { Card } from "@/components/ui/card";
import { CustomHeaderField } from "../company.schema";
import Image from "next/image";

interface InvoicePreviewLiveProps {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  invoiceFooter?: string;
  legalName?: string;
  commercialName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  currency?: string;
  customHeaderFields?: CustomHeaderField[];
}

export function InvoicePreviewLive({
  logoUrl,
  primaryColor = "#000000",
  secondaryColor = "#666666",
  invoiceFooter,
  legalName,
  commercialName,
  email,
  phone,
  address,
  taxId,
  currency = "USD",
  customHeaderFields = [],
}: InvoicePreviewLiveProps) {
  return (
    <Card className="p-6 bg-white">
      <div className="space-y-6">
        {/* Preview label */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Vista previa
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Así se verá tu factura
            </p>
          </div>
          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Live Preview
          </div>
        </div>

        {/* Invoice preview - simplified version */}
        <div className="border rounded-lg p-6 bg-linear-to-b from-white to-gray-50 shadow-sm scale-90 origin-top">
          {/* Header - affected by Branding */}
          <div
            className="border-b-4 pb-4 mb-4"
            style={{ borderColor: primaryColor }}
          >
            <div className="grid grid-cols-3 gap-4 items-start">
              {/* Grid 1: Logo and company info */}
              <div className="space-y-1">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    width={96}
                    height={40}
                    unoptimized
                    className="h-10 object-contain mb-2"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-10 w-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400 mb-2">
                    Sin logo
                  </div>
                )}
                <h1
                  className="text-sm font-bold"
                  style={{ color: primaryColor }}
                >
                  {commercialName || legalName || "Nombre de tu empresa"}
                </h1>
                {commercialName && legalName && commercialName !== legalName && (
                  <p className="text-xs text-gray-600">{legalName}</p>
                )}
                {taxId && (
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">ID Fiscal:</span> {taxId}
                  </p>
                )}
                <p className="text-xs text-gray-600">
                  <span className="font-medium">País:</span> Costa Rica
                </p>
              </div>

              {/* Grid 2: Contact info */}
              <div className="space-y-1">
                {/* Spacer to align with company name */}
                <div className="h-10 mb-2" />
                <div className="text-sm font-bold mb-1 invisible">Spacer</div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Contacto
                </h3>
                <div className="text-xs text-gray-600 space-y-0.5">
                  {email ? (
                    <p><span className="font-medium">Email:</span> {email}</p>
                  ) : (
                    <p><span className="font-medium">Email:</span> empresa@ejemplo.com</p>
                  )}
                  {phone ? (
                    <p><span className="font-medium">Teléfono:</span> {phone}</p>
                  ) : (
                    <p><span className="font-medium">Teléfono:</span> +506 1234-5678</p>
                  )}
                    {address && (
                      <p><span className="font-medium">Dirección:</span> {address}</p>
                    )}
                </div>
              </div>

              {/* Grid 3: Invoice number - sample */}
              <div className="text-right space-y-1">
                <h2 className="text-lg font-bold" style={{ color: primaryColor }}>
                  FACTURA
                </h2>
                <div className="text-xs space-y-0.5">
                  <p className="text-gray-600">
                    <span className="font-medium">Número:</span> #0001
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Fecha:</span> {new Date().toLocaleDateString('es-CR')}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Estado:</span> <span className="text-green-600 font-semibold">Emitida</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Header Fields */}
            {customHeaderFields.filter(f => f.enabled).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  {customHeaderFields
                    .filter(f => f.enabled)
                    .map((field) => (
                      <div key={field.id}>
                        <span className="font-medium">{field.label}:</span> {field.value}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Customer info - sample */}
          <div className="mb-6 bg-gray-50 rounded p-3 border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Facturado A
                </h3>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Nombre:</span> Cliente de ejemplo
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">ID:</span> 123456789
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Contacto
                </h3>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Email:</span> cliente@ejemplo.com
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Tel(s):</span> +506 8888-8888
                </p>
              </div>
            </div>
          </div>

          {/* Items table - sample */}
          <table className="w-full text-xs mb-6">
            <thead>
              <tr className="border-b-2" style={{ borderColor: secondaryColor }}>
                <th className="text-left py-2 font-semibold" style={{ color: secondaryColor }}>
                  Descripción
                </th>
                <th className="text-center py-2 font-semibold" style={{ color: secondaryColor }}>
                  Cantidad
                </th>
                <th className="text-right py-2 font-semibold" style={{ color: secondaryColor }}>
                  Precio
                </th>
                <th className="text-right py-2 font-semibold" style={{ color: secondaryColor }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">Producto de ejemplo</td>
                <td className="text-center py-3">1</td>
                <td className="text-right py-3">{currency} 100.00</td>
                <td className="text-right py-3">{currency} 100.00</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">Servicio de ejemplo</td>
                <td className="text-center py-3">2</td>
                <td className="text-right py-3">{currency} 50.00</td>
                <td className="text-right py-3">{currency} 100.00</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>{currency} 200.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA (13%):</span>
                <span>{currency} 26.00</span>
              </div>
              <div
                className="flex justify-between text-base font-bold pt-2 border-t-2"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <span>Total:</span>
                <span>{currency} 226.00</span>
              </div>
            </div>
          </div>

          {/* Footer - affected by Branding */}
          {invoiceFooter && (
            <div className="border-t pt-4 mt-6">
              <p className="text-xs text-gray-600 text-center whitespace-pre-wrap">
                {invoiceFooter}
              </p>
            </div>
          )}

          {!invoiceFooter && (
            <div className="border-t pt-4 mt-6">
              <p className="text-xs text-gray-400 text-center italic">
                El pie de página aparecerá aquí
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
