"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";
import { verifyTwoFactorCode } from "@/modules/auth/twoFactor.storage";

interface TwoFactorVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function TwoFactorVerifyDialog({
  open,
  onOpenChange,
  email,
  onVerified,
  onCancel,
}: TwoFactorVerifyDialogProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setError("");
    setIsVerifying(true);

    // Simulate async verification
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (verifyTwoFactorCode(email, code)) {
      onVerified();
      setCode("");
    } else {
      setError("Código inválido. Verifica e intenta nuevamente.");
    }

    setIsVerifying(false);
  };

  const handleCancel = () => {
    setCode("");
    setError("");
    onCancel();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verificación de Dos Factores
          </DialogTitle>
          <DialogDescription>
            Ingresa el código de 6 dígitos de Google Authenticator
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="2fa-code">Código de verificación</Label>
            <Input
              id="2fa-code"
              placeholder="123456"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              onKeyPress={handleKeyPress}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-wider"
              autoFocus
              disabled={isVerifying}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              También puedes usar uno de tus códigos de respaldo si no tienes acceso a tu dispositivo.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={handleVerify}
              disabled={code.length !== 6 || isVerifying}
              className="flex-1"
            >
              {isVerifying ? "Verificando..." : "Verificar"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isVerifying}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
