import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export { formatCurrency, formatDate, formatDateTime, formatNumber } from "./formatters";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
