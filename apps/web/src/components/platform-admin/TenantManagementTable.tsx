"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

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

function getStatusBadge(isActive: boolean) {
    return isActive
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";
}

export function TenantManagementTable() {
    const [tenants, setTenants] = useState<PlatformTenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchTenants = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await platformAdminService.listTenants();
            setTenants(data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                return;
            }

            toast({
                title: "Error",
                description:
                    axios.isAxiosError(error) && error.response?.status === 403
                        ? "No tienes acceso a los tenants de la plataforma"
                        : "No se pudieron cargar los tenants",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        void fetchTenants();
    }, [fetchTenants]);

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
                                <TableHead>Domain</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Updated</TableHead>
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
                                        {tenant.customDomain || tenant.subdomain || "-"}
                                    </TableCell>
                                    <TableCell>{tenant.countryCode || "-"}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={getStatusBadge(tenant.isActive)}
                                        >
                                            {tenant.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(tenant.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(tenant.updatedAt).toLocaleDateString()}
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
