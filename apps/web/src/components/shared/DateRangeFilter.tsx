"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, X } from "lucide-react";

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangeFilterProps {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  onApply?: () => void;
}

export function DateRangeFilter({ value, onChange, onApply }: DateRangeFilterProps) {
  const [localFrom, setLocalFrom] = useState(value?.from || "");
  const [localTo, setLocalTo] = useState(value?.to || "");

  const getPresetRange = (preset: string): DateRange => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    switch (preset) {
      case "thisMonth": {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return {
          from: firstDay.toISOString().split('T')[0],
          to: lastDay.toISOString().split('T')[0],
        };
      }
      case "lastMonth": {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        return {
          from: firstDay.toISOString().split('T')[0],
          to: lastDay.toISOString().split('T')[0],
        };
      }
      case "last3Months": {
        const firstDay = new Date(year, month - 2, 1);
        const lastDay = new Date(year, month + 1, 0);
        return {
          from: firstDay.toISOString().split('T')[0],
          to: lastDay.toISOString().split('T')[0],
        };
      }
      case "thisYear": {
        const firstDay = new Date(year, 0, 1);
        const lastDay = new Date(year, 11, 31);
        return {
          from: firstDay.toISOString().split('T')[0],
          to: lastDay.toISOString().split('T')[0],
        };
      }
      case "lastYear": {
        const firstDay = new Date(year - 1, 0, 1);
        const lastDay = new Date(year - 1, 11, 31);
        return {
          from: firstDay.toISOString().split('T')[0],
          to: lastDay.toISOString().split('T')[0],
        };
      }
      default:
        return { from: "", to: "" };
    }
  };

  const handlePresetClick = (preset: string) => {
    const range = getPresetRange(preset);
    setLocalFrom(range.from);
    setLocalTo(range.to);
    onChange(range);
    onApply?.();
  };

  const handleApply = () => {
    if (localFrom && localTo) {
      onChange({ from: localFrom, to: localTo });
      onApply?.();
    }
  };

  const handleClear = () => {
    setLocalFrom("");
    setLocalTo("");
    onChange(null);
    onApply?.();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Período de Tiempo</CardTitle>
          </div>
          {value && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
        <CardDescription>
          Selecciona un rango de fechas para filtrar los resultados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick("thisMonth")}
          >
            Este mes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick("lastMonth")}
          >
            Mes pasado
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick("last3Months")}
          >
            Últimos 3 meses
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick("thisYear")}
          >
            Este año
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick("lastYear")}
          >
            Año pasado
          </Button>
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Desde</Label>
            <Input
              id="dateFrom"
              type="date"
              value={localFrom}
              onChange={(e) => setLocalFrom(e.target.value)}
              max={localTo || undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">Hasta</Label>
            <Input
              id="dateTo"
              type="date"
              value={localTo}
              onChange={(e) => setLocalTo(e.target.value)}
              min={localFrom || undefined}
            />
          </div>
        </div>

        {/* Apply Button for Custom Range */}
        {localFrom && localTo && !value && (
          <Button onClick={handleApply} className="w-full">
            Aplicar Filtro
          </Button>
        )}

        {/* Current Selection Display */}
        {value && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">Período seleccionado:</p>
            <p className="text-muted-foreground">
              {new Date(value.from).toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
              {' '}—{' '}
              {new Date(value.to).toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
