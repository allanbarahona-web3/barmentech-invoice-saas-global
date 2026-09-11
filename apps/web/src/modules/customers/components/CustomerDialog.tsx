"use client";

import type { Customer } from "../customer.schema";
import { CustomerDrawer } from "./CustomerDrawer";

type CustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
};

// Compatibility entry point for inherited inline-create callers. The former
// dialog implementation and its local-storage mutations are intentionally gone.
export function CustomerDialog({ open, onOpenChange }: CustomerDialogProps) {
  return <CustomerDrawer open={open} onOpenChange={onOpenChange} />;
}
