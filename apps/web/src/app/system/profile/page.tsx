"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Building2, Calendar, Save } from "lucide-react";
import { t } from "@/i18n";
import { TwoFactorSetup } from "@/modules/auth/components/TwoFactorSetup";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "Usuario Demo",
    email: "usuario@ejemplo.com",
    company: "Mi Empresa",
    role: "Administrador",
    joinedDate: "2026-01-15",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);

  useEffect(() => {
    // Load profile from localStorage
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfile(parsed);
      setTempProfile(parsed);
    }
  }, []);

  const handleSave = () => {
    setProfile(tempProfile);
    localStorage.setItem("userProfile", JSON.stringify(tempProfile));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold">Perfil</h2>
        <p className="text-muted-foreground">
          Gestiona tu información personal y preferencias de cuenta
        </p>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h3 className="text-2xl font-semibold">{profile.name}</h3>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {profile.company}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Unido {new Date(profile.joinedDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información de perfil
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                <User className="inline h-4 w-4 mr-2" />
                Nombre completo
              </Label>
              <Input
                id="name"
                value={isEditing ? tempProfile.name : profile.name}
                onChange={(e) =>
                  setTempProfile({ ...tempProfile, name: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-2" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={isEditing ? tempProfile.email : profile.email}
                onChange={(e) =>
                  setTempProfile({ ...tempProfile, email: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">
                <Building2 className="inline h-4 w-4 mr-2" />
                Empresa
              </Label>
              <Input
                id="company"
                value={isEditing ? tempProfile.company : profile.company}
                onChange={(e) =>
                  setTempProfile({ ...tempProfile, company: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Input
                id="role"
                value={profile.role}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Guardar cambios
              </Button>
              <Button onClick={handleCancel} variant="outline">
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Security Card */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad de la cuenta</CardTitle>
          <CardDescription>
            Gestiona tu contraseña y opciones de seguridad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Cambiar contraseña</Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <TwoFactorSetup userEmail={profile.email} />
    </div>
  );
}
