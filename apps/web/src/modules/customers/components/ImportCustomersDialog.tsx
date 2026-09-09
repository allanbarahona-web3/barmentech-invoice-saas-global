"use client";

import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useCreateCustomer } from "../customer.hooks";
import { CustomerInput } from "../customer.schema";
import { useToast } from "@/hooks/use-toast";

interface ImportCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedCustomer {
  name: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  status: "active" | "inactive";
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  addressDetail?: string;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; name: string; error: string }>;
}

export function ImportCustomersDialog({ open, onOpenChange }: ImportCustomersDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCustomer[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateCustomer();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Formato inválido",
        description: "Por favor selecciona un archivo CSV.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());

      if (lines.length < 2) {
        toast({
          title: "Archivo vacío",
          description: "El archivo CSV no contiene datos.",
          variant: "destructive",
        });
        return;
      }

      // Skip header row
      const dataLines = lines.slice(1);
      
      const parsed: ParsedCustomer[] = dataLines.map((line) => {
        // Handle quoted fields
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(val => 
          val.replace(/^"|"$/g, '').trim()
        ) || [];

        return {
          name: values[0] || "",
          email: values[1] || "",
          phone: values[2] || "",
          idNumber: values[3] || "",
          status: (values[4] === "inactive" ? "inactive" : "active") as "active" | "inactive",
          country: values[6] || "",
          city: values[7] || "",
        };
      }).filter(customer => customer.name); // Only keep rows with names

      setParsedData(parsed);
      
      if (parsed.length === 0) {
        toast({
          title: "Sin datos válidos",
          description: "No se encontraron clientes válidos en el archivo.",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setResult(null);

    const results: ImportResult = {
      success: 0,
      errors: [],
    };

    for (let i = 0; i < parsedData.length; i++) {
      const customer = parsedData[i];
      
      try {
        const customerInput: CustomerInput = {
          name: customer.name,
          email: customer.email || "",
          phone: customer.phone,
          idNumber: customer.idNumber,
          status: customer.status,
          country: customer.country,
          state: customer.state,
          city: customer.city,
          zipCode: customer.zipCode,
          addressDetail: customer.addressDetail,
          contactPreferences: {
            preferredChannel: "unspecified",
            consentStatus: "unknown",
            preferredTime: "any",
            allowEmail: false,
            allowWhatsApp: false,
          },
        };

        await createMutation.mutateAsync(customerInput);
        results.success++;
      } catch (error: any) {
        results.errors.push({
          row: i + 2, // +2 because of 0-index and header row
          name: customer.name,
          error: error?.message || "Error desconocido",
        });
      }
    }

    setResult(results);
    setImporting(false);

    if (results.success > 0) {
      toast({
        title: "Importación completada",
        description: `${results.success} clientes importados exitosamente.`,
      });
    }

    if (results.errors.length === 0) {
      // Close dialog after successful import
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setResult(null);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = `Nombre,Email,Teléfono,ID,Estado,Pendiente de Pago,País,Ciudad
Juan Pérez,juan@example.com,+506 8888-8888,1-0123-0456,active,0,Costa Rica,San José
María González,maria@example.com,+506 7777-7777,2-0987-0654,active,0,Costa Rica,Heredia`;

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_clientes.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Plantilla descargada",
      description: "Usa este archivo como referencia para importar.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Clientes desde CSV</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con tus clientes. Asegúrate de seguir el formato correcto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Download Template */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>¿No tienes un archivo CSV? Descarga la plantilla de ejemplo.</span>
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                Descargar plantilla
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          {!file && (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">
                Haz clic para seleccionar un archivo CSV
              </p>
              <p className="text-xs text-muted-foreground">
                o arrastra y suelta aquí
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* File Selected */}
          {file && !result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {parsedData.length} clientes detectados
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFile(null);
                    setParsedData([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Preview */}
              {parsedData.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Vista previa (primeros 5)</h4>
                  <div className="space-y-2">
                    {parsedData.slice(0, 5).map((customer, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.email || "Sin email"} • {customer.phone || "Sin teléfono"}
                          </p>
                        </div>
                        <Badge variant={customer.status === "active" ? "success" : "secondary"}>
                          {customer.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {parsedData.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      +{parsedData.length - 5} más...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Import Result */}
          {result && (
            <div className="space-y-4">
              <Alert variant={result.errors.length > 0 ? "default" : "default"}>
                {result.errors.length === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-warning" />
                )}
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {result.success} clientes importados exitosamente
                    </p>
                    {result.errors.length > 0 && (
                      <p className="text-sm">
                        {result.errors.length} errores encontrados
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Errors List */}
              {result.errors.length > 0 && (
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  <h4 className="font-medium mb-3 text-sm">Errores de importación:</h4>
                  <div className="space-y-2">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm p-2 bg-destructive/10 rounded">
                        <p className="font-medium">Fila {error.row}: {error.name}</p>
                        <p className="text-xs text-muted-foreground">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          {!result && parsedData.length > 0 && (
            <Button onClick={handleImport} disabled={importing}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {importing ? "Importando..." : `Importar ${parsedData.length} clientes`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
