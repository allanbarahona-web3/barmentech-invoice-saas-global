"use client";

import { useEffect, useState } from "react";
import { t } from "@/i18n";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks";
import {
    platformAdminService,
    PlatformTenant,
} from "@/services/platformAdminService";

function getStatusBadge(status: PlatformTenant["status"]) {
    const colors = {
        active: "bg-green-100 text-green-800",
        trial: "bg-blue-100 text-blue-800",
        suspended: "bg-red-100 text-red-800",
        cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status];
}

export function TenantManagementTable() {
    const [tenants, setTenants] = useState<PlatformTenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionId, setActionId] = useState<number | null>(null);
    const { toast } = useToast();

    const fetchTenants = async () => {
        setIsLoading(true);
        try {
            const data = await platformAdminService.listTenants();
            setTenants(data);
        } catch {
            toast({
                title: "Error",
                description: "No se pudieron cargar los tenants",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const toggleTenantStatus = async (tenant: PlatformTenant) => {
        setActionId(tenant.id);
        try {
            if (tenant.status === "suspended") {
                await platformAdminService.activateTenant(tenant.id);
            } else {
                await platformAdminService.suspendTenant(
                    tenant.id,
                    "Suspension triggered from platform admin FE",
                );
            }

            await fetchTenants();
            toast({
                title: "Éxito",
                description:
                    tenant.status === "suspended"
                        ? "Tenant activado"
                        : "Tenant suspendido",
            });
        } catch {
            toast({
                title: "Error",
                description: "No se pudo actualizar el estado del tenant",
                variant: "destructive",
            });
        } finally {
            setActionId(null);
        }
    };

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Tenants</h2>
                        <p className="text-sm text-muted-foreground">
                            Manage all platform tenants (live data)
                        </p>
                    </div>
                    <Button size="sm" onClick={fetchTenants} disabled={isLoading}>
                        Refresh
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tenant Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        Loading tenants...
                                    </TableCell>
                                </TableRow>
                            )}

                            {!isLoading && tenants.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No tenants found
                                    </TableCell>
                                </TableRow>
                            )}

                            {tenants.map((tenant) => (
                                <TableRow key={tenant.id}>
                                    <TableCell className="font-medium">
                                        {tenant.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {tenant.slug}
                                    </TableCell>
                                    <TableCell>{tenant.countryCode || "-"}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={getStatusBadge(tenant.status)}
                                        >
                                            {tenant.status.charAt(0).toUpperCase() +
                                                tenant.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(tenant.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={actionId === tenant.id}
                                            onClick={() => toggleTenantStatus(tenant)}
                                        >
                                            {tenant.status === "suspended"
                                                ? "Activate"
                                                : "Suspend"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </Card>
    );
}
