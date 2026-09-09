"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "./CustomerForm";
import { Customer, CustomerInput } from "../customer.schema";
import { useCreateCustomer, useUpdateCustomer } from "../customer.hooks";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/i18n";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
}

export function CustomerDialog({ open, onOpenChange, customer }: CustomerDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const isEdit = !!customer;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (createMutation.isSuccess || updateMutation.isSuccess) {
      onOpenChange(false);
    }
  }, [createMutation.isSuccess, updateMutation.isSuccess, onOpenChange]);

  const handleSubmit = (data: CustomerInput) => {
    if (isEdit) {
      updateMutation.mutate(
        { id: customer.id, input: data },
        {
          onSuccess: () => {
            toast({
              title: t().customers.updateSuccessTitle,
              description: t().customers.updateSuccessDescription,
            });
          },
          onError: () => {
            toast({
              title: t().customers.updateErrorTitle,
              description: t().customers.updateErrorDescription,
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast({
            title: t().customers.createSuccessTitle,
            description: t().customers.createSuccessDescription,
          });
        },
        onError: () => {
          toast({
            title: t().customers.createErrorTitle,
            description: t().customers.createErrorDescription,
            variant: "destructive",
          });
        },
      });
    }
  };

  const initialData = customer
    ? {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        idNumber: customer.idNumber,
        country: customer.country,
        state: customer.state,
        city: customer.city,
        zipCode: customer.zipCode,
        addressDetail: customer.addressDetail,
        address: customer.address, // Legacy field for migration
        notes: customer.notes,
        status: customer.status,
        contactPreferences: customer.contactPreferences,
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t().customers.editTitle : t().customers.createTitle}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t().customers.editDescription : t().customers.createDescription}
          </DialogDescription>
        </DialogHeader>
        <CustomerForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
