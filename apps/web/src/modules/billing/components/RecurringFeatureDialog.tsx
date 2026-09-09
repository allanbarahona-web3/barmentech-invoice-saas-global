"use client";

import { Repeat, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface RecurringFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecurringFeatureDialog({
  open,
  onOpenChange,
}: RecurringFeatureDialogProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push("/system/billing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-2.5">
                <Repeat className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  Facturación Recurrente
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </DialogTitle>
              </div>
            </div>
          </div>
          <DialogDescription className="pt-4 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                La facturación recurrente es una funcionalidad <strong className="text-foreground">Premium</strong> que te permite automatizar la generación de facturas periódicas para tus clientes.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
              <h5 className="font-medium text-sm text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Incluye con el Plan Premium:
              </h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-medium">✓</span>
                  <span><strong className="text-foreground">6 Frecuencias de cobro:</strong> Semanal, Quincenal, Mensual, Trimestral, Semestral y Anual</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-medium">✓</span>
                  <span><strong className="text-foreground">Generación automática:</strong> Las facturas se crean y envían sin intervención manual</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-medium">✓</span>
                  <span><strong className="text-foreground">Períodos de prueba:</strong> Configura fechas futuras para ofrecer días gratis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-medium">✓</span>
                  <span><strong className="text-foreground">Control total:</strong> Establece fechas de inicio y fin de suscripciones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-medium">✓</span>
                  <span><strong className="text-foreground">Reportes avanzados:</strong> Seguimiento de ingresos recurrentes y métricas MRR</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                <strong>💡 Perfecto para:</strong> Servicios de suscripción, mantenimientos mensuales, membresías, alquileres y cualquier negocio con cobros periódicos.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Ahora no
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Ver Planes Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
