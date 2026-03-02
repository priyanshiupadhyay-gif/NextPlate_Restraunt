'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './auth-context'
import { toast } from 'sonner'

interface SocketContextType {
    socket: Socket | null
    isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
})

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth()
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        // Use backend URL from env or fallback
        const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'

        const socketInstance = io(backendUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        })

        socketInstance.on('connect', () => {
            console.log('🔌 Connected to Socket.io')
            setIsConnected(true)

            // Join user-specific room if logged in
            if (user?._id) {
                socketInstance.emit('join-user', user._id)
            }
        })

        socketInstance.on('disconnect', () => {
            console.log('🔌 Disconnected from Socket.io')
            setIsConnected(false)
        })

        // Listen for global order updates
        socketInstance.on('order:statusUpdate', (data: any) => {
            toast.info(`Order #${data.orderNumber} status changed to ${data.status}`, {
                description: `New status: ${data.status.toUpperCase()}`,
            })
        })

        // Listen for new surplus notifications
        socketInstance.on('surplus:new', (data: any) => {
            toast.success(`New Surplus Alert!`, {
                description: `${data.restaurantName} just listed ${data.itemName}`,
            })
        })

        // Rescue audit results
        socketInstance.on('rescue:audit', (data: any) => {
            const variant = data.verdict === 'APPROVED' ? 'success' : 'warning'
            toast[variant === 'success' ? 'success' : 'warning'](`Audit Result: ${data.verdict}`, {
                description: `Order #${data.orderId.slice(-6)} audit complete at ${data.restaurant}`,
            })
        })

        setSocket(socketInstance)

        return () => {
            socketInstance.disconnect()
        }
    }, [user])

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    )
}
