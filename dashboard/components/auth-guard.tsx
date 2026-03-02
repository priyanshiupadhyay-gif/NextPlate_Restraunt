'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface AuthGuardProps {
    children: React.ReactNode
    requiredRole?: 'restaurant' | 'admin' | 'user'
    fallbackPath?: string
}

export function AuthGuard({
    children,
    requiredRole,
    fallbackPath = '/login'
}: AuthGuardProps) {
    const { isAuthenticated, isLoading, user } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (isLoading) return

        if (!isAuthenticated) {
            // Store the intended destination for redirect after login
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('redirectAfterLogin', pathname)
            }
            router.push(fallbackPath)
            return
        }

        // Check role if specified
        if (requiredRole && user?.role !== requiredRole) {
            // Redirect based on user's actual role
            if (user?.role === 'admin') {
                router.push('/admin')
            } else {
                router.push('/')
            }
        }
    }, [isAuthenticated, isLoading, user, requiredRole, router, pathname, fallbackPath])

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    // Don't render children if not authenticated or wrong role
    if (!isAuthenticated) {
        return null
    }

    if (requiredRole && user?.role !== requiredRole) {
        return null
    }

    return <>{children}</>
}

// HOC version for convenience
export function withAuthGuard<P extends object>(
    Component: React.ComponentType<P>,
    options?: { requiredRole?: 'restaurant' | 'admin' | 'user'; fallbackPath?: string }
) {
    return function WrappedComponent(props: P) {
        return (
            <AuthGuard {...options}>
                <Component {...props} />
            </AuthGuard>
        )
    }
}

export default AuthGuard
