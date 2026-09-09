"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useToast } from "@/hooks";
import { Plus } from "lucide-react";

const createInvoiceSchema = z.object({
    customerName: z
        .string()
        .min(1, "Customer name is required")
        .min(2, "Customer name must be at least 2 characters"),
    amount: z
        .number()
        .min(0.01, "Amount must be greater than 0"),
    dueDate: z.string().min(1, "Due date is required"),
});

type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;

export function NewInvoiceDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const createInvoice = useCreateInvoice();

    const form = useForm<CreateInvoiceFormData>({
        resolver: zodResolver(createInvoiceSchema),
        defaultValues: {
            customerName: "",
            amount: 0,
            dueDate: "",
        },
    });

    const onSubmit = async (data: CreateInvoiceFormData) => {
        createInvoice.mutate(
            {
                customerId: `customer_${Date.now()}`,
                customerName: data.customerName,
                amount: data.amount,
                dueDate: data.dueDate,
            },
            {
                onSuccess: () => {
                    toast({
                        title: "Success",
                        description: "Invoice created successfully",
                    });
                    form.reset();
                    setOpen(false);
                },
                onError: () => {
                    toast({
                        title: "Error",
                        description: "Failed to create invoice",
                        variant: "destructive",
                    });
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Invoice
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                        Add a new invoice to your system
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="customerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Acme Corporation"
                                            disabled={createInvoice.isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="2500.00"
                                            type="number"
                                            step="0.01"
                                            disabled={createInvoice.isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Due Date</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            disabled={createInvoice.isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-2 justify-end pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={createInvoice.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createInvoice.isPending}
                            >
                                {createInvoice.isPending
                                    ? "Creating..."
                                    : "Create Invoice"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
