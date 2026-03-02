'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { OrderCard } from '@/components/orders/order-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download, Printer as Print, RefreshCw } from 'lucide-react'
import { restaurantService, Order as ApiOrder } from '@/lib/restaurant-service'
import { orderService } from '@/lib/order-service'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

interface OrderCardProps {
  id: string
  customerName: string
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  status: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  pickupTime: string
  timeRemaining?: string
}

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'placed' | 'confirmed' | 'preparing' | 'ready' | 'completed'>('all')
  const [dateFilter, setDateFilter] = useState('today')
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const { user, role } = useAuth()

  const fetchOrders = async (showToast = false) => {
    try {
      setIsRefreshing(true)
      const params: any = {}

      if (selectedStatus !== 'all') {
        params.status = selectedStatus
      }

      const isUser = role === 'user' || role === 'ngo'
      const response = isUser
        ? await orderService.getUserOrders(params)
        : await restaurantService.getOrders(params)

      if (response.success) {
        setOrders(response.orders)
        if (showToast) {
          toast({
            title: isUser ? 'History updated' : 'Orders refreshed',
            description: `Loaded ${response.orders.length} events`,
          })
        }
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to fetch node data',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected connection error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchOrders(), 30000)
    return () => clearInterval(interval)
  }, [selectedStatus, dateFilter])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      console.log(`[Orders] Updating status for ${orderId} to ${newStatus}`);
      const response = await restaurantService.updateOrderStatus(orderId, newStatus)

      if (response.success) {
        toast({
          title: 'Success',
          description: `Order successfully moved to ${newStatus}`,
        })
        fetchOrders()
      } else {
        console.error(`[Orders] Failed to update status:`, response.message);
        toast({
          title: 'Update Failed',
          description: response.message || 'The transition was rejected by the server',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error(`[Orders] Unexpected error:`, error);
      toast({
        title: 'Network Error',
        description: 'Check your connection or backend logs',
        variant: 'destructive',
      })
    }
  }

  const transformOrder = (order: ApiOrder): OrderCardProps => {
    const customerName = typeof order.customerId === 'object'
      ? order.customerId.fullName
      : 'User';

    const restaurantName = typeof order.restaurantId === 'object'
      ? (order.restaurantId as any).name
      : 'Restaurant Node';

    const pickupTime = order.pickupTimeSlot
      ? `${order.pickupTimeSlot.startTime} - ${order.pickupTimeSlot.endTime}`
      : 'ASAP';

    const statusMap: Record<string, OrderCardProps['status']> = {
      'placed': 'placed',
      'confirmed': 'confirmed',
      'preparing': 'preparing',
      'ready': 'ready',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };

    return {
      id: order.orderNumber,
      customerName: role === 'restaurant' ? customerName : restaurantName,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.unitPrice,
      })),
      total: order.totalAmount,
      status: (statusMap[order.orderStatus] || 'placed') as OrderCardProps['status'],
      pickupTime,
      timeRemaining: order.orderStatus === 'ready' ? 'Ready for pickup' : undefined,
    };
  };

  const filteredOrders = orders

  const newOrdersCount = orders.filter((o) => o.orderStatus === 'placed').length
  const preparingCount = orders.filter((o) => o.orderStatus === 'preparing').length
  const readyCount = orders.filter((o) => o.orderStatus === 'ready').length

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-neutral-900 uppercase tracking-tight">
              {role === 'restaurant' ? 'Node Activity' : 'Dispatch Logs'}
            </h1>
            <p className="text-neutral-500 font-medium">
              {role === 'restaurant'
                ? 'Manage incoming rescue requests and inventory liquidation'
                : 'Track your personal impact and scheduled pickups'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchOrders(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline">
              <Print className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="card-base bg-white p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-neutral-900 block mb-2">
                Date Filter
              </label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="placed" className="relative">
              New
              {newOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {newOrdersCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="preparing">
              Preparing
              {preparingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {preparingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready">
              Ready
              {readyCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {readyCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {/* Orders Timeline */}
          <TabsContent value={selectedStatus} className="mt-6">
            {isLoading ? (
              <div className="card-base bg-white p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-neutral-600 mt-4">Loading orders...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const orderProps = transformOrder(order);
                  return (
                    <div key={order._id}>
                      <div className="text-sm font-semibold text-neutral-600 mb-2">
                        {orderProps.pickupTime}
                      </div>
                      <OrderCard
                        {...orderProps}
                        onAccept={() => handleStatusUpdate(order._id, 'confirmed')}
                        onReject={() => handleStatusUpdate(order._id, 'cancelled')}
                        onPrepare={() => handleStatusUpdate(order._id, 'preparing')}
                        onMarkReady={() => handleStatusUpdate(order._id, 'ready')}
                        onViewDetails={() => console.log('View details', order._id)}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card-base bg-white p-12 text-center">
                <p className="text-neutral-600 text-lg">No orders found in this status.</p>
                <p className="text-neutral-500 text-sm mt-2">Orders from your app will appear here automatically</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Legend */}
        <div className="card-base bg-white p-4">
          <p className="text-sm font-semibold text-neutral-900 mb-3">Order Status Legend</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🆕</span>
              <span className="text-sm text-neutral-700">New Order</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔵</span>
              <span className="text-sm text-neutral-700">Preparing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span className="text-sm text-neutral-700">Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✔️</span>
              <span className="text-sm text-neutral-700">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
