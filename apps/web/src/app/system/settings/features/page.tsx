'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, Clock, Repeat, Mail, Crown } from 'lucide-react';
import { useTenantSettingsQuery } from '@/hooks/useTenantSettings';
import { t } from '@/i18n';
import Link from 'next/link';

const FEATURES = [
    {
        id: 'allowRecurringInvoices',
        name: 'Facturas Recurrentes',
        icon: Repeat,
        description: 'Automatiza cobros periódicos para suscripciones y servicios recurrentes',
        benefits: [
            'Genera facturas automáticamente según frecuencia configurada',
            'Ideal para suscripciones, alquileres y servicios mensuales',
            'Configura frecuencia: semanal, quincenal, mensual, trimestral, etc.',
            'Define fecha de inicio y fecha de fin (opcional)',
            'Perfecto para dar días gratis antes del primer cobro'
        ],
        tier: 'Premium',
        color: 'from-purple-500 to-indigo-600'
    },
    {
        id: 'allowScheduledSend',
        name: 'Envío Programado',
        icon: Clock,
        description: 'Programa el envío automático de facturas en fechas específicas',
        benefits: [
            'Envía facturas automáticamente en fecha y hora específica',
            'Programa con anticipación tus envíos',
            'Ideal para facturación de fin de mes o inicio de período',
            'Personaliza mensaje del email por factura',
            'Cancela o modifica envíos programados cuando quieras'
        ],
        tier: 'Premium',
        color: 'from-emerald-500 to-teal-600'
    },
    {
        id: 'allowUnlimitedCC',
        name: 'CC Ilimitados',
        icon: Mail,
        description: 'Envía copias de facturas a múltiples destinatarios sin límite',
        benefits: [
            'Agrega tantos correos CC como necesites',
            'Plan básico: máximo 2 emails CC',
            'Plan Business+: CC ilimitados',
            'Útil para contadores, gerentes o múltiples contactos',
            'Todos reciben la misma factura simultáneamente'
        ],
        tier: 'Business+',
        color: 'from-amber-500 to-orange-600'
    }
];

const PLANS = [
    {
        name: 'Básico',
        price: 'Gratis',
        features: {
            allowRecurringInvoices: false,
            allowScheduledSend: false,
            allowUnlimitedCC: false
        },
        limits: {
            cc: '2 emails máximo'
        }
    },
    {
        name: 'Premium',
        price: '$29/mes',
        highlight: true,
        features: {
            allowRecurringInvoices: true,
            allowScheduledSend: true,
            allowUnlimitedCC: false
        },
        limits: {
            cc: '2 emails máximo'
        }
    },
    {
        name: 'Business+',
        price: '$79/mes',
        features: {
            allowRecurringInvoices: true,
            allowScheduledSend: true,
            allowUnlimitedCC: true
        },
        limits: {
            cc: 'Ilimitado'
        }
    }
];

export default function FeaturesPage() {
    const { data: settings, isLoading } = useTenantSettingsQuery();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold">Características Premium</h2>
                </div>
                <div className="text-muted-foreground">Cargando...</div>
            </div>
        );
    }

    const currentFeatures = settings?.features || {
        allowRecurringInvoices: false,
        allowScheduledSend: false,
        allowUnlimitedCC: false
    };

    // Determine current plan
    const getCurrentPlan = () => {
        if (currentFeatures.allowUnlimitedCC) return 'Business+';
        if (currentFeatures.allowRecurringInvoices || currentFeatures.allowScheduledSend) return 'Premium';
        return 'Básico';
    };

    const currentPlan = getCurrentPlan();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-8 w-8 text-amber-500" />
                    <h2 className="text-3xl font-bold">Características Premium</h2>
                </div>
                <p className="text-muted-foreground">
                    Descubre las funcionalidades avanzadas para potenciar tu facturación
                </p>
            </div>

            {/* Current Plan Banner */}
            <Card className="border-2 border-primary">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Plan Actual: {currentPlan}
                                {currentPlan !== 'Básico' && (
                                    <Badge className="bg-gradient-to-r from-amber-500 to-purple-600">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Premium
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="mt-2">
                                {currentPlan === 'Básico' && 'Actualiza tu plan para acceder a características avanzadas'}
                                {currentPlan === 'Premium' && 'Disfruta de facturación automatizada y envíos programados'}
                                {currentPlan === 'Business+' && 'Acceso completo a todas las características premium'}
                            </CardDescription>
                        </div>
                        {currentPlan === 'Básico' && (
                            <Button className="bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Actualizar Plan
                            </Button>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Features Grid */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Características Disponibles</h3>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {FEATURES.map((feature) => {
                        const Icon = feature.icon;
                        const isActive = currentFeatures[feature.id as keyof typeof currentFeatures];

                        return (
                            <Card 
                                key={feature.id} 
                                className={`${isActive ? 'border-2 border-primary' : 'border-dashed'}`}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.color}`}>
                                                <Icon className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    {feature.name}
                                                    {isActive ? (
                                                        <Badge variant="default" className="bg-green-500">
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Activo
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            <X className="h-3 w-3 mr-1" />
                                                            No disponible
                                                        </Badge>
                                                    )}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {feature.description}
                                                </CardDescription>
                                                <div className="mt-2">
                                                    <Badge className={`bg-gradient-to-r ${feature.color} text-white`}>
                                                        {feature.tier}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {feature.benefits.map((benefit, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span className="text-muted-foreground">{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Comparison Table */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Comparación de Planes</h3>
                <Card>
                    <CardContent className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-4 px-4 font-semibold">Característica</th>
                                        {PLANS.map((plan) => (
                                            <th 
                                                key={plan.name} 
                                                className={`text-center py-4 px-4 ${plan.highlight ? 'bg-primary/5' : ''}`}
                                            >
                                                <div className="font-semibold">{plan.name}</div>
                                                <div className="text-sm text-muted-foreground font-normal">
                                                    {plan.price}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-4 px-4 font-medium">Facturas Recurrentes</td>
                                        {PLANS.map((plan) => (
                                            <td 
                                                key={`${plan.name}-recurring`} 
                                                className={`text-center py-4 ${plan.highlight ? 'bg-primary/5' : ''}`}
                                            >
                                                {plan.features.allowRecurringInvoices ? (
                                                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-4 px-4 font-medium">Envío Programado</td>
                                        {PLANS.map((plan) => (
                                            <td 
                                                key={`${plan.name}-scheduled`} 
                                                className={`text-center py-4 ${plan.highlight ? 'bg-primary/5' : ''}`}
                                            >
                                                {plan.features.allowScheduledSend ? (
                                                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-4 px-4 font-medium">Emails CC</td>
                                        {PLANS.map((plan) => (
                                            <td 
                                                key={`${plan.name}-cc`} 
                                                className={`text-center py-4 ${plan.highlight ? 'bg-primary/5' : ''}`}
                                            >
                                                <span className="text-sm text-muted-foreground">
                                                    {plan.limits.cc}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {currentPlan === 'Básico' && (
                            <div className="mt-6 flex justify-center">
                                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700">
                                    <Sparkles className="h-5 w-5 mr-2" />
                                    Actualizar a Premium
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* CTA Card */}
            <Card className="bg-gradient-to-r from-amber-500/10 to-purple-600/10 border-2 border-amber-500/20">
                <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-gradient-to-r from-amber-500 to-purple-600">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">
                                ¿Listo para automatizar tu facturación?
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Ahorra tiempo y mejora tu flujo de caja con facturas recurrentes y envíos programados. 
                                Perfecto para negocios de suscripción, servicios recurrentes y facturación masiva.
                            </p>
                            <div className="flex gap-3">
                                <Button className="bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700">
                                    Ver Planes y Precios
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/system/settings">
                                        Volver a Configuración
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
