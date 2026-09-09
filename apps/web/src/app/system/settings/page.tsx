'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronRight, Globe, Sparkles } from 'lucide-react';
import { t } from '@/i18n';
import Link from 'next/link';
import { tenantSettingsService } from '@/services/tenantSettingsService';

// Country pack configuration
const AVAILABLE_COUNTRY_PACKS = [
    {
        code: 'cr',
        name: 'Costa Rica',
        flag: '🇨🇷',
        description: 'Validación fiscal, códigos de actividad, sucursal y terminal para Costa Rica'
    },
    // Future packs can be added here:
    // { code: 'mx', name: 'México', flag: '🇲🇽', description: '...' },
    // { code: 'us', name: 'United States', flag: '🇺🇸', description: '...' },
];

export default function SettingsPage() {
    const [countryPackCR, setCountryPackCR] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tenantCountry, setTenantCountry] = useState<string>('');
    const [tenantSettings, setTenantSettings] = useState<Awaited<ReturnType<typeof tenantSettingsService.getTenantSettings>>>(null);

    // Load tenant settings and country pack status
    useEffect(() => {
        const loadSettings = async () => {
            try {
                // Get tenant's country
                const settings = await tenantSettingsService.getTenantSettings();
                if (settings) {
                    setTenantSettings(settings);
                    setTenantCountry(settings.country);

                    const enabled = settings.countryPack?.enabled ?? true;
                    setCountryPackCR(enabled);
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadSettings();
    }, []);

    // Persist in tenant settings (backend-ready); localStorage fallback is handled by service for compatibility
    const handleToggleCR = async () => {
        if (!tenantSettings) return;

        const newValue = !countryPackCR;
        setCountryPackCR(newValue);

        try {
            const updated = await tenantSettingsService.saveTenantSettings({
                ...tenantSettings,
                countryPack: {
                    code: tenantCountry.toUpperCase(),
                    enabled: newValue,
                    source: "backend",
                },
            });

            setTenantSettings(updated);
        } catch (error) {
            console.error("Error saving country pack settings:", error);
            setCountryPackCR(!newValue);
        }
    };

    // Find the country pack for the tenant's country
    const tenantCountryPack = AVAILABLE_COUNTRY_PACKS.find(
        pack => pack.code === tenantCountry.toLowerCase()
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold">{t().system.settings}</h2>
                </div>
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold">{t().system.settings}</h2>
                <p className="text-muted-foreground">
                    {t().system.configureAccount}
                </p>
            </div>

            {/* Premium Features Section */}
            <Card className="border-2 bg-linear-to-br from-amber-500/5 to-purple-600/5 border-amber-500/30 hover:border-amber-500/50 transition-colors">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <CardTitle>Características Premium</CardTitle>
                    </div>
                    <CardDescription>
                        Descubre funcionalidades avanzadas para automatizar tu facturación
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Facturas recurrentes automáticas</li>
                                <li>Envío programado de facturas</li>
                                <li>CC ilimitados en emails (Business+)</li>
                                <li>Ahorra tiempo y automatiza cobros</li>
                            </ul>
                        </div>
                        <Button asChild className="w-full bg-linear-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700">
                            <Link href="/system/settings/features">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Ver características Premium
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Company Settings Section */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <CardTitle>Configuración de Empresa</CardTitle>
                    </div>
                    <CardDescription>
                        Gestiona el logo, colores, información legal y fiscal de tu empresa
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Logo y paleta de colores</li>
                                <li>Información legal (nombre, dirección, contacto)</li>
                                <li>Datos fiscales y configuración por país</li>
                                <li>Footer personalizado para facturas</li>
                            </ul>
                        </div>
                        <Button asChild className="w-full">
                            <Link href="/system/settings/company">
                                Configurar empresa
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Country Packs Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <CardTitle>{t().system.countryPacksTitle}</CardTitle>
                    </div>
                    <CardDescription>
                        Validaciones y campos específicos según tu país
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {tenantCountryPack ? (
                        // Show country pack for tenant's country
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex-1">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <span className="text-2xl">{tenantCountryPack.flag}</span>
                                    {tenantCountryPack.name}
                                    <Badge variant={countryPackCR ? 'default' : 'secondary'}>
                                        {countryPackCR ? 'Activo' : 'Desactivado'}
                                    </Badge>
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {tenantCountryPack.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Este pack se activó automáticamente al seleccionar {tenantCountryPack.name} durante el onboarding
                                </p>
                            </div>
                            <Button
                                onClick={handleToggleCR}
                                variant={countryPackCR ? 'default' : 'outline'}
                                className="ml-4"
                            >
                                {countryPackCR ? 'Desactivar' : 'Activar'}
                            </Button>
                        </div>
                    ) : (
                        // Show message if no pack available for tenant's country
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold mb-2">
                                Country Pack no disponible
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Actualmente no hay un Country Pack específico para tu país ({tenantCountry}). 
                                Los campos fiscales generales están disponibles en la Configuración de Empresa.
                            </p>
                            <p className="text-xs text-muted-foreground mt-4">
                                Estamos trabajando para agregar más packs regionales.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
