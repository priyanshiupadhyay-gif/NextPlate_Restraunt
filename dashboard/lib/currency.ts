/**
 * Currency Utility — Global currency formatting
 * Standardized to USD ($) for international audience
 */

const CURRENCY_SYMBOL = '$'
const CURRENCY_CODE = 'USD'

// INR to USD approximate conversion (for display purposes)
const INR_TO_USD_RATE = 0.012

/**
 * Format a number as currency string
 * If value was originally in INR, set `fromINR: true` to auto-convert
 */
export function formatCurrency(value: number, fromINR = false): string {
    const converted = fromINR ? value * INR_TO_USD_RATE : value

    if (converted >= 1000000) {
        return `${CURRENCY_SYMBOL}${(converted / 1000000).toFixed(1)}M`
    }
    if (converted >= 1000) {
        return `${CURRENCY_SYMBOL}${(converted / 1000).toFixed(1)}K`
    }
    if (converted >= 100) {
        return `${CURRENCY_SYMBOL}${Math.round(converted)}`
    }
    return `${CURRENCY_SYMBOL}${converted.toFixed(2)}`
}

/**
 * Get just the currency symbol
 */
export const currencySymbol = CURRENCY_SYMBOL
export const currencyCode = CURRENCY_CODE

/**
 * Role display utilities
 */
export type AppRole = 'admin' | 'ngo' | 'restaurant' | 'user'

interface RoleConfig {
    label: string
    badge: string
    color: string
    bgColor: string
    borderColor: string
    emoji: string
}

const ROLE_MAP: Record<AppRole, RoleConfig> = {
    admin: {
        label: 'Admin',
        badge: 'ADMIN',
        color: 'text-violet-700',
        bgColor: 'bg-violet-50',
        borderColor: 'border-violet-200',
        emoji: '🛡️',
    },
    ngo: {
        label: 'NGO Partner',
        badge: 'NGO',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        emoji: '🌿',
    },
    restaurant: {
        label: 'Restaurant',
        badge: 'RESTAURANT',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        emoji: '🍽️',
    },
    user: {
        label: 'Foodie',
        badge: 'FOODIE',
        color: 'text-sky-700',
        bgColor: 'bg-sky-50',
        borderColor: 'border-sky-200',
        emoji: '🧑‍🍳',
    },
}

export function getRoleConfig(role: string): RoleConfig {
    return ROLE_MAP[role as AppRole] || ROLE_MAP.user
}
