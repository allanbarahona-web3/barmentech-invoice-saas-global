"use client";

import { InvoiceEvent } from "../invoice.schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { t } from "@/i18n";

interface InvoiceActivityProps {
  events?: InvoiceEvent[];
}

function getEventLabel(eventType: InvoiceEvent["type"]): string {
  const labels: Record<InvoiceEvent["type"], string> = {
    CREATED: t().invoiceActivity.eventCreated,
    CREATED_DRAFT: t().invoiceActivity.eventCreatedDraft,
    CREATED_FROM_QUOTE: t().invoiceActivity.eventCreatedFromQuote,
    UPDATED: t().invoiceActivity.eventUpdated,
    EXPORTED_PDF: t().invoiceActivity.eventExportedPdf,
    MARKED_ISSUED: t().invoiceActivity.eventMarkedIssued,
    SENT: t().invoiceActivity.eventSent,
    QUOTE_SENT: t().invoiceActivity.eventQuoteSent,
    CONVERTED_TO_INVOICE: t().invoiceActivity.eventConvertedToInvoice,
    ARCHIVED: t().invoiceActivity.eventArchived,
  };
  return labels[eventType] || eventType;
}

function getEventVariant(eventType: InvoiceEvent["type"]): "default" | "secondary" | "outline" | "destructive" {
  if (eventType === "CREATED" || eventType === "MARKED_ISSUED" || eventType === "CREATED_FROM_QUOTE") return "default";
  if (eventType === "SENT" || eventType === "QUOTE_SENT" || eventType === "CONVERTED_TO_INVOICE") return "default";
  if (eventType === "ARCHIVED") return "outline";
  return "secondary";
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function InvoiceActivity({ events }: InvoiceActivityProps) {
  const sortedEvents = events ? [...events].reverse() : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t().invoiceActivity.title}
        </CardTitle>
        <CardDescription>{t().invoiceActivity.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!sortedEvents || sortedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t().invoiceActivity.noActivity}
          </p>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getEventVariant(event.type)}>
                      {getEventLabel(event.type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(event.at)}
                    </span>
                  </div>

                  {/* Show metadata if available */}
                  {event.meta && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      {event.meta.toEmail && typeof event.meta.toEmail === "string" ? (
                        <div>
                          {t().invoiceActivity.sentTo.replace("{email}", event.meta.toEmail)}
                        </div>
                      ) : null}
                      {event.meta.message && typeof event.meta.message === "string" ? (
                        <div className="italic">
                          {t().invoiceActivity.withMessage.replace(
                            "{message}",
                            event.meta.message.length > 50
                              ? event.meta.message.substring(0, 50) + "..."
                              : event.meta.message
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
