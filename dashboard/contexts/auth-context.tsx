'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { authService, User as ApiUser, AuthResponse } from '@/lib/auth-service'

export type UserRole = 'restaurant' | 'admin' | 'user' | 'ngo'

interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
    restaurantName?: string
    restaurantId?: string
    isVerifiedNGO?: boolean
    totalCarbonSaved?: number
    totalMealsRescued?: number
}

interface AuthContextType {
    user: User | null
    role: UserRole
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<AuthResponse>
    adminLogin: (email: string, password: string) => Promise<AuthResponse>
    googleLogin: (idToken: string, metadata?: any) => Promise<AuthResponse>
    logout: () => void
    refreshUser: () => Promise<void>
    setRole: (role: UserRole) => void
    mockLogin: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Transform API user to context user
const transformUser = (apiUser: ApiUser): User => ({
    id: apiUser.id || apiUser._id || '',
    name: apiUser.fullName,
    email: apiUser.email,
    role: apiUser.role as UserRole,
    restaurantName: apiUser.restaurant?.name,
    restaurantId: apiUser.restaurant?.id,
    avatar: apiUser.restaurant?.logo,
    isVerifiedNGO: apiUser.isVerifiedNGO,
    totalCarbonSaved: apiUser.totalCarbonSaved,
    totalMealsRescued: apiUser.totalMealsRescued,
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<UserRole>('restaurant')
    const [isLoading, setIsLoading] = useState(true)

    // Sync role when user changes
    useEffect(() => {
        if (user) {
            setRole(user.role)
        }
    }, [user])

    // Fetch user on mount if token exists
    const fetchUser = useCallback(async () => {
        if (!authService.isAuthenticated()) {
            setIsLoading(false)
            return
        }

        try {
            const response = await authService.getMe()
            if (response.success && response.user) {
                setUser(transformUser(response.user))
            } else {
                // Token is invalid, clear it
                authService.logout()
                setUser(null)
            }
        } catch {
            authService.logout()
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    const login = async (email: string, password: string) => {
        const response = await authService.login({ email, password })

        if (response.success && response.user) {
            // Merge restaurant data into user if present
            const apiUser: ApiUser = {
                ...response.user,
                restaurant: response.restaurant ? {
                    id: response.restaurant.id,
                    name: response.restaurant.name,
                } : response.user.restaurant,
            }
            setUser(transformUser(apiUser))
        }

        return response
    }

    const adminLogin = async (email: string, password: string) => {
        const response = await authService.adminLogin({ email, password })

        if (response.success && response.user) {
            setUser(transformUser(response.user))
        }

        return response
    }

    const googleLogin = async (idToken: string, metadata?: any) => {
        const response = await authService.googleLogin(idToken, metadata)

        if (response.success && response.user) {
            setUser(transformUser(response.user))
        }

        return response
    }

    const logout = () => {
        authService.logout()
        setUser(null)
    }

    const mockLogin = (selectedRole: UserRole) => {
        const mockUser: User = {
            id: selectedRole === 'restaurant' ? '698705b220c17318bc650dee' : '698703a79787cc97db934454', // Real IDs from DB
            name: `Demo ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`,
            email: `${selectedRole}@demo.st`,
            role: selectedRole,
            restaurantName: selectedRole === 'restaurant' ? 'Simulator Grid Node' : undefined,
            restaurantId: selectedRole === 'restaurant' ? '699e597fc02b23a16c79ad5e' : undefined,
            isVerifiedNGO: selectedRole === 'ngo',
            totalCarbonSaved: 1250,
            totalMealsRescued: 450,
        }
        setUser(mockUser)
        setRole(selectedRole)
        // Store a fake token so authService looks authenticated
        if (typeof window !== 'undefined') {
            localStorage.setItem('sp_access_token', 'mock-token')
        }
    }

    const refreshUser = async () => {
        await fetchUser()
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                setRole,
                isAuthenticated: !!user,
                isLoading,
                login,
                adminLogin,
                googleLogin,
                logout,
                refreshUser,
                mockLogin,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
