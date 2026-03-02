'use client'

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const PUBLIC_ROUTES = ['/login', '/admin/login', '/register', '/verify-email', '/', '/story', '/story.html', '/feed', '/live-map', '/community'];

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, user } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

            if (!isAuthenticated && !isPublicRoute) {
                router.push('/login');
            } else if (isAuthenticated && (pathname === '/login' || pathname === '/admin/login' || pathname === '/register')) {
                // Redirect to respective dashboard based on role
                if (user?.role === 'admin') router.push('/admin');
                else if (user?.role === 'restaurant') router.push('/restaurant');
                else if (user?.role === 'ngo') router.push('/ngo');
                else router.push('/feed');
            }
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

    if (!isAuthenticated && !isPublicRoute) {
        return null;
    }

    return <>{children}</>;
}
