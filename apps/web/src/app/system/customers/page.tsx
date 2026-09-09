"use client";

import { useState } from "react";
import { UserPlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomersTable, ImportCustomersDialog } from "@/modules/customers/components";
import { CustomerDialog } from "@/modules/customers/components/CustomerDialog";
import { t } from "@/i18n";

export default function CustomersPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t().customers.pageTitle}</h1>
          <p className="text-muted-foreground mt-2">{t().customers.pageDescription}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t().customers.newCustomerButton}
          </Button>
        </div>
      </div>

      {/* Table */}
      <CustomersTable />

      {/* Create Dialog */}
      <CustomerDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Import Dialog */}
      <ImportCustomersDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
    </div>
  );
}
