"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductsTable } from "@/modules/products/components/ProductsTable";
import { ProductDialog } from "@/modules/products/components/ProductDialog";
import { t } from "@/i18n";

export default function ProductsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t().products.pageTitle}</h1>
          <p className="text-muted-foreground mt-2">{t().products.pageDescription}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t().products.newProductButton}
        </Button>
      </div>

      {/* Table */}
      <ProductsTable />

      {/* Create Dialog */}
      <ProductDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
