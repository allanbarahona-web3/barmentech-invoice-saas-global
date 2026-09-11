"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useCreateCustomerMutation, useUpdateCustomerMutation } from "../customer.hooks";
import { customerErrorMessage } from "../customer.service";
import {
  toCustomerMutationPayload,
  type CustomerEditorInitialCustomer,
  type CustomerEditorValues,
} from "../customer-editor.schema";
import { CustomerForm } from "./CustomerForm";

type CustomerDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerEditorInitialCustomer;
  onSaved?: (customer: CustomerEditorInitialCustomer) => void;
};

export function CustomerDrawer({ open, onOpenChange, customer, onSaved }: CustomerDrawerProps) {
  const { toast } = useToast();
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
        title: isEdit ? "Cliente actualizado" : "Cliente creado",
        description: isEdit ? "Los cambios se guardaron correctamente." : "El cliente se creó correctamente.",
      });
      onSaved?.(savedCustomer);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "No se pudo guardar el cliente",
        description: customerErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar cliente" : "Nuevo cliente"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Actualiza la información del cliente." : "Agrega la información principal ahora; lo demás puede completarse después."}
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
