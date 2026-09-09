"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export type TimeRange = "today" | "week" | "month" | "quarter" | "year" | "all";

interface DashboardTimeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function DashboardTimeFilter({ value, onChange }: DashboardTimeFilterProps) {
  const options: { value: TimeRange; label: string }[] = [
    { value: "today", label: "Hoy" },
    { value: "week", label: "Esta semana" },
    { value: "month", label: "Este mes" },
    { value: "quarter", label: "Trimestre" },
    { value: "year", label: "Este año" },
    { value: "all", label: "Todo" },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span className="font-medium">Período:</span>
      </div>
      <div className="flex gap-1">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(option.value)}
            className="h-8"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Get date range for a time period
 */
export function getDateRangeForPeriod(period: TimeRange): { from: Date; to: Date } | null {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  switch (period) {
    case "today":
      return {
        from: new Date(year, month, day, 0, 0, 0),
        to: new Date(year, month, day, 23, 59, 59),
      };
    
    case "week": {
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(year, month, day - dayOfWeek);
      const endOfWeek = new Date(year, month, day + (6 - dayOfWeek), 23, 59, 59);
      return { from: startOfWeek, to: endOfWeek };
    }
    
    case "month":
      return {
        from: new Date(year, month, 1),
        to: new Date(year, month + 1, 0, 23, 59, 59),
      };
    
    case "quarter": {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      return {
        from: new Date(year, quarterStartMonth, 1),
        to: new Date(year, quarterStartMonth + 3, 0, 23, 59, 59),
      };
    }
    
    case "year":
      return {
        from: new Date(year, 0, 1),
        to: new Date(year, 11, 31, 23, 59, 59),
      };
    
    case "all":
      return null;
    
    default:
      return null;
  }
}

/**
 * Filter items by date range
 */
export function filterByDateRange<T extends { createdAt: string }>(
  items: T[],
  period: TimeRange
): T[] {
  const range = getDateRangeForPeriod(period);
  
  if (!range) {
    return items; // "all" returns everything
  }

  return items.filter((item) => {
    const itemDate = new Date(item.createdAt);
    return itemDate >= range.from && itemDate <= range.to;
  });
}
