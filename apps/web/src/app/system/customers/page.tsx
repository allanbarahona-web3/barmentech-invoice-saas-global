"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomersTable } from "@/modules/customers/components";
import { CustomerDrawer } from "@/modules/customers/components/CustomerDrawer";
import { t } from "@/i18n";

export default function CustomersPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t().customers.pageTitle}</h1>
          <p className="text-muted-foreground mt-2">{t().customers.pageDescription}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t().customers.newCustomerButton}
          </Button>
        </div>
      </div>

      {/* Table */}
      <CustomersTable />

      <CustomerDrawer open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
