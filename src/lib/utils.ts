import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { customAlphabet } from "nanoid"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12)

export function generateId(): string {
  return nanoid()
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

export const TIER_COLORS: Record<string, string> = {
  gold: "bg-yellow-100 text-yellow-800 border-yellow-200",
  silver: "bg-gray-100 text-gray-700 border-gray-200",
  bronze: "bg-orange-100 text-orange-800 border-orange-200",
  custom: "bg-purple-100 text-purple-800 border-purple-200",
}

export const STATUS_COLORS: Record<string, string> = {
  planning: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-600",
}

export const RSVP_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
}

export const TASK_STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
}
