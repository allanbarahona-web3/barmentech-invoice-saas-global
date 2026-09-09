"use client";

import { useState } from "react";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "../product.schema";
import { useProducts, useDeleteProduct } from "../product.hooks";
import { ProductDialog } from "./ProductDialog";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/i18n";

export function ProductsTable() {
  const { data: products, isLoading } = useProducts();
  const deleteMutation = useDeleteProduct();
  const { toast } = useToast();

  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deletingProduct, setDeletingProduct] = useState<Product | undefined>();

  const handleDelete = () => {
    if (!deletingProduct) return;

    deleteMutation.mutate(deletingProduct.id, {
      onSuccess: () => {
        toast({
          title: t().products.deleteSuccessTitle,
          description: t().products.deleteSuccessDescription,
        });
        setDeletingProduct(undefined);
      },
      onError: () => {
        toast({
          title: t().products.deleteErrorTitle,
          description: t().products.deleteErrorDescription,
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">{t().products.emptyTitle}</h3>
        <p className="text-muted-foreground">{t().products.emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t().products.tableHeaderName}</TableHead>
              <TableHead>{t().products.tableHeaderSku}</TableHead>
              <TableHead>{t().products.tableHeaderType}</TableHead>
              <TableHead className="text-right">{t().products.tableHeaderPrice}</TableHead>
              <TableHead>{t().products.tableHeaderStatus}</TableHead>
              <TableHead className="text-right">{t().products.tableHeaderActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {product.sku || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {product.type === "product"
                      ? t().products.typeProduct
                      : t().products.typeService}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  ${product.price.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant={product.status === "active" ? "default" : "secondary"}>
                    {product.status === "active"
                      ? t().products.statusActive
                      : t().products.statusInactive}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingProduct(product)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <ProductDialog
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(undefined)}
        product={editingProduct}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t().products.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {t().products.deleteConfirmDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingProduct(undefined)}
              disabled={deleteMutation.isPending}
            >
              {t().products.cancelButton}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t().products.deleteButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
