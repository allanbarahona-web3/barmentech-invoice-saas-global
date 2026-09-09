"use client";

// Note: TypeScript control type errors are false positives due to Zod .default() behavior.
// The form works correctly at runtime. See: https://github.com/react-hook-form/resolvers/issues/270

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Trash2, ArrowLeft, Search, MoreVertical, X, Repeat, Sparkles, Clock } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InvoiceInput, invoiceInputSchema } from "@/modules/invoices/invoice.schema";
import { useCreateInvoice } from "@/modules/invoices/invoice.hooks";
import { calculateNextGenerationDate } from "@/modules/invoices/invoice.recurring";
import { useCustomers } from "@/modules/customers/customer.hooks";
import { Customer } from "@/modules/customers/customer.schema";
import { CustomerDialog } from "@/modules/customers/components/CustomerDialog";
import { useProducts } from "@/modules/products/product.hooks";
import { ProductDialog } from "@/modules/products/components/ProductDialog";
import { useCompanyProfile } from "@/modules/company/company.hooks";
import { useTenantSettingsQuery } from "@/hooks/useTenantSettings";
import { useIsTrialActive } from "@/modules/billing/trial.hooks";
import { TrialExpiredDialog } from "@/modules/billing/components/TrialExpiredDialog";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES } from "@/constants/currencies";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { getDocumentTypes, getDocumentTypeLabel } from "@/lib/countryRegistry";
import { calculateTaxAmount, getPrimaryTax, getResolvedTaxConfig } from "@/lib/taxConfig";
import Link from "next/link";

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [showTrialExpired, setShowTrialExpired] = useState(false);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [productDialogIndex, setProductDialogIndex] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [openCustomerPopover, setOpenCustomerPopover] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [openProductPopoverIndex, setOpenProductPopoverIndex] = useState<number | null>(null);
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<"weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual" | "annual">("monthly");
  const [recurringStartDate, setRecurringStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurringEndDate, setRecurringEndDate] = useState<string>("");
  const [scheduledSendEnabled, setScheduledSendEnabled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [scheduledEmail, setScheduledEmail] = useState("");
  const [scheduledMessage, setScheduledMessage] = useState("");
  const previousCustomersLength = useRef<number>(0);
  const previousProductsLength = useRef<number>(0);
  const justClosedCustomerDialog = useRef(false);
  
  const { data: customers } = useCustomers();
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: settings } = useTenantSettingsQuery();
  const { data: companyProfile } = useCompanyProfile();
  const { data: isTrialActive } = useIsTrialActive();
  const createMutation = useCreateInvoice();

  const enableMultiCurrency = companyProfile?.legal?.enableMultiCurrency || false;
  const defaultCurrency = companyProfile?.legal?.currency || settings?.currency || "USD";

  const form = useForm<InvoiceInput>({
    // @ts-expect-error - Zod .default() makes type optional in TypeScript but it works at runtime
    resolver: zodResolver(invoiceInputSchema),
    defaultValues: {
      type: "invoice",
      customerId: "",
      currency: defaultCurrency,
      paymentTerms: "due_on_receipt",
      customNetDays: undefined,
      items: [
        {
          description: "",
          qty: 1,
          unitPrice: 0,
          discount: 0,
          productId: undefined,
        },
      ],
      deliveryFee: 0,
      status: "draft",
    },
  });

  useEffect(() => {
    const current = form.getValues("currency");
    if (!current || (!enableMultiCurrency && current !== defaultCurrency)) {
      form.setValue("currency", defaultCurrency, { shouldValidate: true });
    }
  }, [defaultCurrency, enableMultiCurrency, form]);

  // Pre-select customer from query params
  useEffect(() => {
    const customerIdFromQuery = searchParams.get('customerId');
    if (customerIdFromQuery && customers) {
      const customerExists = customers.find(c => c.id === customerIdFromQuery);
      if (customerExists) {
        form.setValue("customerId", customerIdFromQuery);
      }
    }
  }, [searchParams, customers, form]);

  // Auto-select new customer when created
  useEffect(() => {
    if (customers && customers.length > previousCustomersLength.current && justClosedCustomerDialog.current) {
      // A new customer was just added
      const newestCustomer = customers[customers.length - 1];
      form.setValue("customerId", newestCustomer.id);
      justClosedCustomerDialog.current = false;
    }
    previousCustomersLength.current = customers?.length || 0;
  }, [customers, form]);

  // Auto-select new product when created
  useEffect(() => {
    if (products && products.length > previousProductsLength.current && !openProductDialog && productDialogIndex !== null) {
      // A new product was just added, fill the item at the saved index
      const newestProduct = products[products.length - 1];
      form.setValue(`items.${productDialogIndex}.description`, newestProduct.description || newestProduct.name);
      form.setValue(`items.${productDialogIndex}.unitPrice`, newestProduct.price);
      form.setValue(`items.${productDialogIndex}.productId`, newestProduct.id);
    }
    previousProductsLength.current = products?.length || 0;
  }, [products, openProductDialog, productDialogIndex, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = useWatch({ control: form.control, name: "items" }) ?? [];
  const watchType = useWatch({ control: form.control, name: "type" });
  const watchPaymentTerms = useWatch({ control: form.control, name: "paymentTerms" });
  const watchCurrency = useWatch({ control: form.control, name: "currency" });
  const watchDeliveryFee = useWatch({ control: form.control, name: "deliveryFee" });
  const documentTypes = useMemo(() => getDocumentTypes(settings?.country), [settings?.country]);
  const taxConfig = useMemo(() => getResolvedTaxConfig(settings ?? undefined, settings?.country), [settings]);
  const primaryTax = useMemo(() => getPrimaryTax(taxConfig), [taxConfig]);
  
  // Calculate totals
  const subtotal = watchItems.reduce((sum, item) => {
    const lineSubtotal = (item.qty || 0) * (item.unitPrice || 0);
    const lineDiscount = lineSubtotal * ((item.discount || 0) / 100);
    return sum + (lineSubtotal - lineDiscount);
  }, 0);

  const totalDiscount = watchItems.reduce((sum, item) => {
    const lineSubtotal = (item.qty || 0) * (item.unitPrice || 0);
    const lineDiscount = lineSubtotal * ((item.discount || 0) / 100);
    return sum + lineDiscount;
  }, 0);

  const taxAmount = calculateTaxAmount(subtotal, taxConfig);

  const deliveryFee = Number.isFinite(watchDeliveryFee) ? watchDeliveryFee : 0;
  const total = subtotal + taxAmount + deliveryFee;

  // Format currency based on selected currency in form
  const formatMoney = (amount: number) => {
    const currency = watchCurrency || defaultCurrency;
    
    const localeMap: Record<string, string> = {
      'USD': 'en-US',
      'CRC': 'es-CR',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'MXN': 'es-MX',
      'ARS': 'es-AR',
      'BRL': 'pt-BR',
      'CLP': 'es-CL',
      'COP': 'es-CO',
    };
    
    const locale = localeMap[currency] || 'en-US';
    
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const onSubmit = (data: InvoiceInput, navigateToPreview = false) => {
    console.log('[NewInvoicePage] onSubmit called:', {
      navigateToPreview,
      type: data.type,
      customerId: data.customerId,
      currency: data.currency,
      itemsCount: data.items.length,
      recurringEnabled,
    });

    // Check if trial is active before creating invoice
    if (isTrialActive === false) {
      console.log('[NewInvoicePage] Trial expired, showing dialog');
      setShowTrialExpired(true);
      return;
    }

    // Ensure type field and currency have values
    const invoiceData: InvoiceInput = {
      ...data,
      type: data.type || "invoice",
      currency: data.currency || defaultCurrency, // Explicitly set currency
    };

    console.log('[NewInvoicePage] Invoice data with currency:', {
      currency: invoiceData.currency,
      defaultCurrency,
      original: data.currency,
    });

    // Add recurring configuration if enabled
    if (recurringEnabled && settings?.features?.allowRecurringInvoices) {
      // Calculate next generation date based on frequency
      const nextDate = calculateNextGenerationDate(recurringStartDate, recurringFrequency);
      
      invoiceData.recurringConfig = {
        enabled: true,
        frequency: recurringFrequency,
        startDate: recurringStartDate,
        endDate: recurringEndDate || undefined,
        nextGenerationDate: nextDate, // Calculated based on frequency
        lastGeneratedDate: undefined, // No generation yet
        parentInvoiceId: undefined, // This IS the parent
      };
      console.log('[NewInvoicePage] ✅ Recurring config added:', {
        frequency: recurringFrequency,
        startDate: recurringStartDate,
        nextGenerationDate: nextDate,
      });
    } else {
      console.log('[NewInvoicePage] ❌ Recurring NOT added:', {
        recurringEnabled,
        hasFeatureFlag: settings?.features?.allowRecurringInvoices,
        settings: settings?.features,
      });
    }

    // Add scheduled send configuration if enabled
    if (scheduledSendEnabled && scheduledDateTime && scheduledEmail) {
      invoiceData.scheduledSend = {
        enabled: true,
        scheduledFor: scheduledDateTime,
        toEmail: scheduledEmail,
        message: scheduledMessage || undefined,
        status: "pending",
      };
      console.log('[NewInvoicePage] ✅ Scheduled send config added:', {
        scheduledFor: scheduledDateTime,
        toEmail: scheduledEmail,
      });
    }

    console.log('[NewInvoicePage] Creating invoice/quote with data:', invoiceData);

    createMutation.mutate(invoiceData, {
      onSuccess: (newInvoice) => {
        console.log('[NewInvoicePage] Invoice/quote created successfully:', {
          id: newInvoice.id,
          number: newInvoice.invoiceNumber,
          type: newInvoice.type,
          navigateToPreview,
        });

        if (navigateToPreview) {
          console.log('[NewInvoicePage] Navigating to preview:', `/system/invoices/${newInvoice.id}`);
          // Navigate to preview
          router.push(`/system/invoices/${newInvoice.id}`);
        } else {
          console.log('[NewInvoicePage] Draft saved, navigating to list');
          // Show toast and stay on page or go to list
          toast({
            title: t().invoices.draftSavedTitle,
            description: t().invoices.draftSavedDescription,
          });
          router.push("/system/invoices");
        }
      },
      onError: (error) => {
        console.error('[NewInvoicePage] Error creating invoice/quote:', error);
        toast({
          title: t().invoices.createErrorTitle,
          description: t().invoices.createErrorDescription,
          variant: "destructive",
        });
      },
    });
  };

  const handleSaveDraft = () => {
    console.log('[NewInvoicePage] handleSaveDraft called');
    form.handleSubmit((data) => onSubmit(data as unknown as InvoiceInput, false))();
  };

  const handlePreview = () => {
    console.log('[NewInvoicePage] handlePreview called');
    form.handleSubmit((data) => onSubmit(data as unknown as InvoiceInput, true))();
  };

  const handleProductSelect = (index: number, productId: string) => {
    console.log('[NewInvoicePage] Product selected:', { index, productId });
    if (productId === "NEW_PRODUCT") {
      setProductDialogIndex(index);
      setOpenProductDialog(true);
      return;
    }
    const product = products?.find(p => p.id === productId);
    if (product) {
      console.log('[NewInvoicePage] Product found, filling item:', {
        description: product.description || product.name,
        price: product.price,
      });
      // Use product description if available, otherwise fall back to name
      form.setValue(`items.${index}.description`, product.description || product.name);
      form.setValue(`items.${index}.unitPrice`, product.price);
      form.setValue(`items.${index}.productId`, product.id);
    } else {
      console.warn('[NewInvoicePage] Product not found:', productId);
    }
  };

  const addItem = () => {
    append({
      description: "",
      qty: 1,
      unitPrice: 0,
      discount: 0,
      productId: undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/system/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {watchType === "quote" ? t().invoices.newQuoteTitle : t().invoices.newInvoiceTitle}
          </h1>
          <p className="text-muted-foreground mt-1">
            {watchType === "quote" ? t().invoices.newQuoteDescription : t().invoices.newInvoiceDescription}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {t().invoices.statusDraft}
            </span>
            <span className="text-sm text-muted-foreground">
              {watchType === "quote" ? t().invoices.numberPlaceholderQuote : t().invoices.numberPlaceholderInvoice}
            </span>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          {/* Document Type & Customer Selection */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t().invoices.customerSection}</h3>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Row 1: Document Type + Customer */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t().invoices.documentTypeLabel}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentTypes.map((documentType) => (
                            <SelectItem key={documentType.id} value={documentType.id}>
                              {getDocumentTypeLabel(documentType.id, settings?.country, t().invoices as Record<string, unknown>)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => {
                    const selectedCustomer = customers?.find(c => c.id === field.value);
                    const filteredCustomers = customers?.filter((customer) =>
                      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      (customer.idNumber && customer.idNumber.toLowerCase().includes(customerSearch.toLowerCase())) ||
                      (customer.email && customer.email.toLowerCase().includes(customerSearch.toLowerCase()))
                    );

                    return (
                      <FormItem>
                        <FormLabel>{t().invoices.customerLabel}</FormLabel>
                        <div className="flex items-center gap-2">
                          <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "flex-1 justify-between font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {selectedCustomer ? (
                                    <span className="truncate">{selectedCustomer.name}</span>
                                  ) : (
                                    "Seleccionar cliente"
                                  )}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-100 p-0" align="start">
                              <div className="flex items-center border-b px-3 py-2">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                <Input
                                  placeholder="Buscar por nombre, ID o email..."
                                  value={customerSearch}
                                  onChange={(e) => setCustomerSearch(e.target.value)}
                                  className="border-0 p-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                                {customerSearch && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => setCustomerSearch("")}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <div className="max-h-75 overflow-y-auto">
                                <div className="p-1">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start text-primary font-medium"
                                    onClick={() => {
                                      setOpenCustomerDialog(true);
                                      setOpenCustomerPopover(false);
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Añadir un nuevo cliente
                                  </Button>
                                </div>
                                {filteredCustomers && filteredCustomers.length > 0 && (
                                  <>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                      RECIENTE
                                    </div>
                                    {filteredCustomers.map((customer) => (
                                      <Button
                                        key={customer.id}
                                        variant="ghost"
                                        className="w-full justify-start font-normal px-2"
                                        onClick={() => {
                                          field.onChange(customer.id);
                                          setOpenCustomerPopover(false);
                                          setCustomerSearch("");
                                        }}
                                      >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <span className="truncate">{customer.name}</span>
                                          {customer.idNumber && (
                                            <span className="text-sm text-muted-foreground shrink-0">
                                              • {customer.idNumber}
                                            </span>
                                          )}
                                        </div>
                                      </Button>
                                    ))}
                                  </>
                                )}
                                {filteredCustomers?.length === 0 && customerSearch && (
                                  <div className="p-4 text-sm text-muted-foreground text-center">
                                    No se encontraron clientes
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                          {selectedCustomer && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setEditingCustomer(selectedCustomer);
                                  setOpenCustomerDialog(true);
                                }}>
                                  Actualizar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Row 2: Currency + Payment Terms */}
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => {
                    const selected = CURRENCIES.find((c) => c.code === (field.value || defaultCurrency));
                    const options = enableMultiCurrency
                      ? CURRENCIES
                      : selected
                        ? [selected]
                        : [{ code: defaultCurrency, symbol: "", name: defaultCurrency }];

                    return (
                      <FormItem>
                        <FormLabel>{t().invoices.currencyLabel}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!enableMultiCurrency}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t().invoices.selectCurrency} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {options.map((curr) => (
                              <SelectItem key={curr.code} value={curr.code}>
                                {curr.symbol ? `${curr.symbol} ` : ""}{curr.code}{curr.name ? ` - ${curr.name}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condiciones de pago</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="due_on_receipt">Contado (inmediato)</SelectItem>
                          <SelectItem value="net_15">Crédito: Net 15</SelectItem>
                          <SelectItem value="net_30">Crédito: Net 30</SelectItem>
                          <SelectItem value="net_60">Crédito: Net 60</SelectItem>
                          <SelectItem value="net_90">Crédito: Net 90</SelectItem>
                          <SelectItem value="custom">Crédito: Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />

                      {watchPaymentTerms === "custom" && (
                        <div className="mt-3">
                          <FormField
                            control={form.control}
                            name="customNetDays"
                            render={({ field: daysField }) => (
                              <FormItem>
                                <FormLabel>Días (custom)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={365}
                                    placeholder="Ej: 45"
                                    value={daysField.value ?? ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      daysField.onChange(value === "" ? undefined : Number(value));
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              {/* Recurring Configuration (Premium Feature) - Only show if feature is enabled */}
              {settings?.features?.allowRecurringInvoices && (
              <Card className="p-6 border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            Factura recurrente
                            <Sparkles className="h-4 w-4 text-amber-500" />
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Genera esta factura automáticamente según el período configurado
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={recurringEnabled}
                      onCheckedChange={setRecurringEnabled}
                    />
                  </div>

                  {recurringEnabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Frequency */}
                        <div className="space-y-2">
                          <Label>Frecuencia</Label>
                          <Select value={recurringFrequency} onValueChange={(value) => setRecurringFrequency(value as typeof recurringFrequency)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona frecuencia" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Semanal (cada 7 días)</SelectItem>
                              <SelectItem value="biweekly">Quincenal (cada 15 días)</SelectItem>
                              <SelectItem value="monthly">Mensual (cada mes)</SelectItem>
                              <SelectItem value="quarterly">Trimestral (cada 3 meses)</SelectItem>
                              <SelectItem value="semiannual">Semestral (cada 6 meses)</SelectItem>
                              <SelectItem value="annual">Anual (cada año)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                          <Label>Fecha de inicio</Label>
                          <Input 
                            type="date" 
                            value={recurringStartDate}
                            onChange={(e) => setRecurringStartDate(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Primera factura se generará en esta fecha
                          </p>
                        </div>

                        {/* End Date (optional) */}
                        <div className="space-y-2">
                          <Label>Fecha de fin (opcional)</Label>
                          <Input 
                            type="date" 
                            value={recurringEndDate}
                            onChange={(e) => setRecurringEndDate(e.target.value)}
                            placeholder="Sin fecha de fin" 
                          />
                          <p className="text-xs text-muted-foreground">
                            Deja vacío para facturación sin límite
                          </p>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                        <div className="flex gap-2">
                          <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium text-blue-900 dark:text-blue-100">Ejemplo de uso:</p>
                            <p className="text-blue-700 dark:text-blue-300 mt-1">
                              Si configurás <strong>Quincenal</strong> con inicio <strong>hoy</strong>, la primera factura se creará hoy, 
                              la segunda en 15 días, la tercera en 30 días, y así sucesivamente.
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 mt-2">
                              Para dar <strong>días gratis</strong>, simplemente configurá la fecha de inicio en el futuro. 
                              Por ejemplo: inicio en 14 días = 2 semanas gratis antes de la primera factura.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </Card>

          {/* Scheduled Send Section - Only show if feature is enabled */}
          {settings?.features?.allowScheduledSend && (
          <Card className="p-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold">
                        Programar envío automático
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {scheduledSendEnabled 
                        ? "La factura se enviará automáticamente en la fecha y hora programada"
                        : "Programa el envío automático de esta factura por email"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={scheduledSendEnabled}
                  onCheckedChange={setScheduledSendEnabled}
                />
              </div>

              {scheduledSendEnabled && (
                <div className="space-y-4 pt-4 border-t mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Date and Time */}
                    <div className="space-y-2">
                      <Label htmlFor="scheduledDateTime">
                        Fecha y hora de envío <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="scheduledDateTime"
                        type="datetime-local" 
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      <p className="text-xs text-muted-foreground">
                        La factura se enviará automáticamente en esta fecha
                      </p>
                    </div>

                    {/* Recipient Email */}
                    <div className="space-y-2">
                      <Label htmlFor="scheduledEmail">
                        Email del destinatario <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="scheduledEmail"
                        type="email" 
                        value={scheduledEmail}
                        onChange={(e) => setScheduledEmail(e.target.value)}
                        placeholder="cliente@ejemplo.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email donde se enviará la factura
                      </p>
                    </div>
                  </div>

                  {/* Message (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="scheduledMessage">Mensaje personalizado (opcional)</Label>
                    <textarea 
                      id="scheduledMessage"
                      className="w-full min-h-20 px-3 py-2 text-sm border rounded-md bg-background"
                      value={scheduledMessage}
                      onChange={(e) => setScheduledMessage(e.target.value)}
                      placeholder="Mensaje adicional que se incluirá en el email..."
                    />
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg">
                    <div className="flex gap-2">
                      <div className="text-emerald-600 dark:text-emerald-400 mt-0.5">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-emerald-900 dark:text-emerald-100">
                          Envío programado
                        </p>
                        <p className="text-emerald-700 dark:text-emerald-300 mt-1">
                          La factura quedará guardada como borrador y se enviará automáticamente 
                          en la fecha programada. Podrás cancelar o modificar el envío en cualquier momento.
                        </p>
                        <p className="text-emerald-700 dark:text-emerald-300 mt-2">
                          <strong>Nota:</strong> Esta función requiere conexión con el backend para ejecutarse.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
          )}

          {/* Items */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t().invoices.itemsSection}</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                {t().invoices.addItemButton}
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">{t().invoices.itemDescription}</TableHead>
                    <TableHead className="w-[12%]">{t().invoices.itemQty}</TableHead>
                    <TableHead className="w-[15%]">{t().invoices.itemPrice}</TableHead>
                    <TableHead className="w-[15%]">Descuento</TableHead>
                    <TableHead className="w-[18%] text-right">{t().invoices.itemTotal}</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const item = watchItems[index];
                    const lineSubtotal = (item?.qty || 0) * (item?.unitPrice || 0);
                    const lineTotal = lineSubtotal * (1 - (item?.discount || 0) / 100);

                    // Find the selected product if productId exists
                    const selectedProduct = item?.productId 
                      ? products?.find((p) => p.id === item.productId)
                      : null;

                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <div className="flex gap-2">
                            {!loadingProducts && products && products.length > 0 && (
                              <div className="w-50">
                                <Popover 
                                  open={openProductPopoverIndex === index} 
                                  onOpenChange={(open) => setOpenProductPopoverIndex(open ? index : null)}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      role="combobox"
                                      className="w-full justify-between font-normal text-sm"
                                    >
                                      <span className="truncate">
                                        {selectedProduct ? selectedProduct.name : t().invoices.selectProduct}
                                      </span>
                                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-87.5 p-0" align="start">
                                    <div className="flex items-center border-b px-3 py-2">
                                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                      <Input
                                        placeholder="Buscar producto..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="border-0 p-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                                      />
                                      {productSearch && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => setProductSearch("")}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                    <div className="max-h-75 overflow-y-auto">
                                      <div className="p-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          className="w-full justify-start text-primary font-medium"
                                          onClick={() => {
                                            handleProductSelect(index, "NEW_PRODUCT");
                                            setOpenProductPopoverIndex(null);
                                          }}
                                        >
                                          <Plus className="mr-2 h-4 w-4" />
                                          Añadir un nuevo producto
                                        </Button>
                                      </div>
                                      {products
                                        .filter((product) =>
                                          product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                          product.description?.toLowerCase().includes(productSearch.toLowerCase())
                                        )
                                        .map((product) => (
                                          <Button
                                            key={product.id}
                                            type="button"
                                            variant="ghost"
                                            className="w-full justify-start font-normal px-2 h-auto py-2"
                                            onClick={() => {
                                              handleProductSelect(index, product.id);
                                              setOpenProductPopoverIndex(null);
                                              setProductSearch("");
                                            }}
                                          >
                                            <div className="flex flex-col items-start flex-1 min-w-0 text-left">
                                              <span className="truncate w-full font-medium">{product.name}</span>
                                              <span className="text-xs text-muted-foreground">
                                                {formatMoney(product.price)}
                                              </span>
                                            </div>
                                          </Button>
                                        ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            )}
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      placeholder={t().invoices.itemDescriptionPlaceholder}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.qty`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.discount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      step="1"
                                      min="0"
                                      max="100"
                                      placeholder=""
                                      className="pr-7"
                                      value={field.value === 0 ? "" : field.value}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value === "" ? 0 : parseFloat(value));
                                      }}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                      %
                                    </span>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(lineTotal)}
                        </TableCell>
                        <TableCell>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Totals */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t().invoices.totalsSection}</h3>
            <div className="space-y-2 max-w-sm ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t().invoices.subtotal}</span>
                <span className="font-medium">{formatMoney(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="font-medium text-red-600">-{formatMoney(totalDiscount)}</span>
                </div>
              )}
              {primaryTax?.enabled && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {primaryTax.label} ({primaryTax.rate}%)
                  </span>
                  <span className="font-medium">{formatMoney(taxAmount)}</span>
                </div>
              )}
              <FormField
                control={form.control}
                name="deliveryFee"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between text-sm">
                    <FormLabel className="text-muted-foreground">
                      {t().invoices.deliveryFee}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-32 text-right"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>{t().invoices.total}</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-between gap-3">
            <Link href="/system/invoices">
              <Button type="button" variant="ghost">
                {t().invoices.cancelButton}
              </Button>
            </Link>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t().invoices.saveDraftButton}
              </Button>
              <Button
                type="button"
                onClick={handlePreview}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t().invoices.previewButton}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Trial Expired Dialog */}
      <TrialExpiredDialog
        open={showTrialExpired}
        onOpenChange={setShowTrialExpired}
      />

      {/* Customer Dialog */}
      <CustomerDialog
        open={openCustomerDialog}
        customer={editingCustomer}
        onOpenChange={(open) => {
          if (!open) {
            // Only mark for auto-select if we were creating a new customer (not editing)
            if (!editingCustomer) {
              justClosedCustomerDialog.current = true;
            }
            setEditingCustomer(undefined);
          }
          setOpenCustomerDialog(open);
        }}
      />

      {/* Product Dialog */}
      <ProductDialog
        open={openProductDialog}
        onOpenChange={(open) => {
          setOpenProductDialog(open);
          if (!open) {
            setProductDialogIndex(null);
          }
        }}
      />
    </div>
  );
}
