"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Users, FileBarChart } from "lucide-react";
import Link from "next/link";

const reports = [
  {
    id: "invoices",
    title: "Reporte de Facturas",
    description: "Exporta y analiza facturas por período de tiempo",
    icon: FileText,
    href: "/system/reports/invoices",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "income",
    title: "Reporte de Ingresos",
    description: "Análisis de ingresos y tendencias",
    icon: TrendingUp,
    href: "/system/reports/income",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    comingSoon: true,
  },
  {
    id: "customers",
    title: "Reporte de Clientes",
    description: "Balance, morosidad y estado de cuenta",
    icon: Users,
    href: "/system/reports/customers",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    id: "taxes",
    title: "Reporte de Impuestos", 
    description: "Resumen de IVA y retenciones",
    icon: FileBarChart,
    href: "/system/reports/taxes",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    comingSoon: true,
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground mt-2">
          Genera reportes detallados para análisis y contabilidad
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;
          const content = (
            <Card 
              className={`relative overflow-hidden transition-all ${
                report.comingSoon 
                  ? "opacity-60 cursor-not-allowed" 
                  : "hover:shadow-lg cursor-pointer hover:scale-[1.02]"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${report.bgColor}`}>
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  {report.comingSoon && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium">
                      Próximamente
                    </span>
                  )}
                </div>
                <CardTitle className="mt-4">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-primary font-medium flex items-center gap-1">
                  {report.comingSoon ? "En desarrollo" : "Abrir reporte"}
                  {!report.comingSoon && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </CardContent>
            </Card>
          );

          if (report.comingSoon) {
            return <div key={report.id}>{content}</div>;
          }

          return (
            <Link key={report.id} href={report.href}>
              {content}
            </Link>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">💡 Acerca de los Reportes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Los reportes te permiten generar documentos detallados para análisis financiero y contabilidad.
          </p>
          <p>
            Todos los reportes pueden exportarse a <strong>Excel</strong> para análisis detallado
            y <strong>PDF</strong> para presentación profesional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
