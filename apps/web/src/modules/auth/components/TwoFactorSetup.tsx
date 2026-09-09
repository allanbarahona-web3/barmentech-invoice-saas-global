"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Copy, Check, QrCode, KeyRound } from "lucide-react";
import { useToast } from "@/hooks";
import { 
  enableTwoFactor, 
  disableTwoFactor, 
  getTwoFactorConfig,
  verifyTwoFactorCode 
} from "@/modules/auth/twoFactor.storage";

interface TwoFactorSetupProps {
  userEmail: string;
}

export function TwoFactorSetup({ userEmail }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(() => {
    const config = getTwoFactorConfig(userEmail);
    return config?.enabled ?? false;
  });
  const [setupStep, setSetupStep] = useState<"idle" | "setup" | "verify">("idle");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  const handleEnable = () => {
    const result = enableTwoFactor(userEmail);
    setSecret(result.secret);
    setBackupCodes(result.backupCodes);
    setQrCodeUrl(result.qrCodeUrl);
    setSetupStep("setup");
  };

  const handleVerifyAndComplete = () => {
    if (verifyTwoFactorCode(userEmail, verificationCode)) {
      setIsEnabled(true);
      setSetupStep("idle");
      toast({
        title: "2FA Activado",
        description: "Autenticación de dos factores configurada correctamente",
      });
    } else {
      toast({
        title: "Código inválido",
        description: "El código ingresado no es correcto. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleDisable = () => {
    disableTwoFactor(userEmail);
    setIsEnabled(false);
    setSetupStep("idle");
    toast({
      title: "2FA Desactivado",
      description: "Autenticación de dos factores deshabilitada",
    });
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  if (setupStep === "setup") {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Configurar Google Authenticator
          </CardTitle>
          <CardDescription>
            Paso 1: Escanea el código QR o ingresa la clave manualmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Descarga Google Authenticator en tu dispositivo móvil si aún no lo tienes
            </AlertDescription>
          </Alert>

          {/* QR Code Display */}
          <div className="space-y-4">
            <div className="flex justify-center p-8 bg-muted rounded-lg">
              <div className="text-center space-y-4">
                <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center border-2">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeUrl)}`}
                    alt="QR Code"
                    className="w-full h-full p-4"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Escanea con Google Authenticator
                </p>
              </div>
            </div>

            {/* Manual Setup */}
            <div className="space-y-2">
              <Label>O ingresa esta clave manualmente:</Label>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                >
                  {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Backup Codes */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Códigos de respaldo
              </Label>
              <p className="text-xs text-muted-foreground">
                Guarda estos códigos en un lugar seguro. Puedes usarlos si pierdes acceso a tu dispositivo.
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
                {backupCodes.map((code, i) => (
                  <div key={i}>{code}</div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyBackupCodes}
                className="w-full"
              >
                {copiedBackup ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar códigos de respaldo
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setSetupStep("verify")} className="flex-1">
              Continuar a verificación
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                disableTwoFactor(userEmail);
                setSetupStep("idle");
              }}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (setupStep === "verify") {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Verificar configuración</CardTitle>
          <CardDescription>
            Paso 2: Ingresa el código de 6 dígitos de Google Authenticator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Código de verificación</Label>
            <Input
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-wider"
            />
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Ingresa el código de 6 dígitos que aparece en Google Authenticator para completar la configuración
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={handleVerifyAndComplete}
              disabled={verificationCode.length !== 6}
              className="flex-1"
            >
              Verificar y activar
            </Button>
            <Button variant="outline" onClick={() => setSetupStep("setup")}>
              Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Autenticación de Dos Factores (2FA)
        </CardTitle>
        <CardDescription>
          Agrega una capa extra de seguridad a tu cuenta con Google Authenticator
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <p className="font-medium">
              {isEnabled ? "2FA Activado" : "2FA Desactivado"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isEnabled
                ? "Tu cuenta está protegida con autenticación de dos factores"
                : "Protege tu cuenta con un código adicional al iniciar sesión"}
            </p>
          </div>
          <Button
            variant={isEnabled ? "destructive" : "default"}
            onClick={isEnabled ? handleDisable : handleEnable}
          >
            {isEnabled ? "Desactivar" : "Activar 2FA"}
          </Button>
        </div>

        {isEnabled && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Si pierdes acceso a tu dispositivo, puedes usar uno de tus códigos de respaldo para iniciar sesión.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
