'use client'

import { useEffect, useRef } from 'react'
import { getFCMToken, onForegroundMessage } from '@/lib/firebase'
import api from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'

/**
 * useNotifications
 * - Requests push permission on first load
 * - Saves FCM token to backend
 * - Shows toast for foreground messages
 */
export function useNotifications() {
    const tokenSavedRef = useRef(false)
    const { isAuthenticated } = useAuth()

    useEffect(() => {
        if (tokenSavedRef.current) return
        if (!isAuthenticated) return
        if (typeof window === 'undefined') return
        if (!('Notification' in window)) return

        const initPush = async () => {
            try {
                const token = await getFCMToken()
                if (!token) return

                // Save token to backend
                await api.post('/fcm/token', { token })
                tokenSavedRef.current = true
                console.info('✅ FCM push notifications registered')
            } catch (err) {
                console.warn('Push notification setup skipped:', err)
            }
        }

        initPush()
    }, [isAuthenticated])

    // Listen for foreground push messages
    useEffect(() => {
        const unsubscribe = onForegroundMessage((payload) => {
            const title = payload.notification?.title || '📦 NextPlate'
            const body = payload.notification?.body || 'You have a new update.'
            const type = payload.data?.type

            // Show styled toast notification
            if (type === 'ready' || type === 'pickup_reminder') {
                toast.success(title, {
                    description: body,
                    duration: 8000,
                    icon: '🏃',
                })
            } else if (type === 'cancelled') {
                toast.error(title, { description: body, duration: 6000 })
            } else if (type === 'new_surplus') {
                toast.info(title, {
                    description: body,
                    duration: 10000,
                    icon: '🌱',
                    action: {
                        label: 'View Feed',
                        onClick: () => window.location.href = '/feed'
                    }
                })
            } else {
                toast(title, { description: body, icon: '🔔', duration: 5000 })
            }
        })

        return unsubscribe
    }, [])
}
