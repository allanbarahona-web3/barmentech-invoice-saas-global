"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { Product, ProductInput } from "../product.schema";
import { useCreateProduct, useUpdateProduct } from "../product.hooks";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/i18n";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const isEdit = !!product;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (createMutation.isSuccess || updateMutation.isSuccess) {
      onOpenChange(false);
    }
  }, [createMutation.isSuccess, updateMutation.isSuccess, onOpenChange]);

  const handleSubmit = (data: ProductInput) => {
    if (isEdit) {
      updateMutation.mutate(
        { id: product.id, input: data },
        {
          onSuccess: () => {
            toast({
              title: t().products.updateSuccessTitle,
              description: t().products.updateSuccessDescription,
            });
          },
          onError: () => {
            toast({
              title: t().products.updateErrorTitle,
              description: t().products.updateErrorDescription,
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast({
            title: t().products.createSuccessTitle,
            description: t().products.createSuccessDescription,
          });
        },
        onError: () => {
          toast({
            title: t().products.createErrorTitle,
            description: t().products.createErrorDescription,
            variant: "destructive",
          });
        },
      });
    }
  };

  const initialData = product
    ? {
        name: product.name,
        description: product.description,
        sku: product.sku,
        price: product.price,
        type: product.type,
        status: product.status,
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t().products.editTitle : t().products.createTitle}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t().products.editDescription : t().products.createDescription}
          </DialogDescription>
        </DialogHeader>
        <ProductForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
