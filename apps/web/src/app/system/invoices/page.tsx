"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoicesTable } from "@/modules/invoices/components/InvoicesTable";
import { TrialBanner } from "@/modules/billing/components/TrialBanner";
import { t } from "@/i18n";
import Link from "next/link";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      <TrialBanner />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t().invoices.pageTitle}</h1>
          <p className="text-muted-foreground mt-2">{t().invoices.pageDescription}</p>
        </div>
        <Link href="/system/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t().invoices.newInvoiceButton}
          </Button>
        </Link>
      </div>

      {/* Table */}
      <InvoicesTable />
    </div>
  );
}
