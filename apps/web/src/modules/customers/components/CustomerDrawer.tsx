"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useCreateCustomerMutation, useUpdateCustomerMutation } from "../customer.hooks";
import { customerErrorCode } from "../customer.service";
import {
  toCustomerMutationPayload,
  type CustomerEditorInitialCustomer,
  type CustomerEditorValues,
} from "../customer-editor.schema";
import { CustomerForm } from "./CustomerForm";
import { useTranslations } from "@/i18n";

type CustomerDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerEditorInitialCustomer;
  onSaved?: (customer: CustomerEditorInitialCustomer) => void;
};

export function CustomerDrawer({ open, onOpenChange, customer, onSaved }: CustomerDrawerProps) {
  const { toast } = useToast();
  const { messages } = useTranslations();
  const isEdit = Boolean(customer);
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();
  const mutation = isEdit ? updateMutation : createMutation;

  const save = async (values: CustomerEditorValues) => {
    const payload = toCustomerMutationPayload(values, isEdit);
    try {
      const savedCustomer = isEdit
        ? await updateMutation.mutateAsync({ id: customer!.id, payload })
        : await createMutation.mutateAsync(payload);
      toast({
        title: isEdit ? messages.customers.updatedTitle : messages.customers.createdTitle,
        description: isEdit ? messages.customers.updatedDescription : messages.customers.createdDescription,
      });
      onSaved?.(savedCustomer);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: messages.customers.saveError,
        description: messages.customers.errors[customerErrorCode(error)],
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? messages.customers.editTitle : messages.customers.newTitle}</SheetTitle>
          <SheetDescription>
            {isEdit ? messages.customers.editDescription : messages.customers.newDescription}
          </SheetDescription>
        </SheetHeader>
        <CustomerForm
          customer={customer}
          open={open}
          isSubmitting={mutation.isPending}
          onCancel={() => onOpenChange(false)}
          onSubmit={save}
        />
      </SheetContent>
    </Sheet>
  );
}
