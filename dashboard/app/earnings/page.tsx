'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { StatCard } from '@/components/dashboard/stat-card'
import { restaurantService } from '@/lib/restaurant-service'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DollarSign, TrendingUp, PieChart as PieChartIcon, Download, Loader2, Package } from 'lucide-react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#1A4D2E', '#2F855A', '#4ADE80', '#F59E0B', '#FBBF24', '#3B82F6']

export default function EarningsPage() {
  const [period, setPeriod] = useState('all')
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await restaurantService.getOrders({ limit: 100 })
      if (res.success) {
        setOrders(res.orders)
      } else {
        setError(res.message || 'Failed to fetch earnings')
      }
    } catch (err) {
      setError('An error occurred while fetching earnings data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate stats from real orders
  const completedOrders = orders.filter(o => o.orderStatus === 'completed')
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const totalCommission = totalRevenue * 0.15
  const orderCount = completedOrders.length
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

  // Build chart data from orders
  const revenueChartData: any[] = []
  const groupedByDate: Record<string, number> = {}

  completedOrders.slice().reverse().forEach(o => {
    const date = new Date(o.createdAt).toLocaleDateString(undefined, { weekday: 'short' })
    groupedByDate[date] = (groupedByDate[date] || 0) + (o.totalAmount || 0)
  })

  Object.entries(groupedByDate).forEach(([date, revenue]) => {
    revenueChartData.push({ date, revenue })
  })

  // Category breakdown from item data
  const categoryMap: Record<string, number> = {}
  completedOrders.forEach(o => {
    o.items?.forEach((item: any) => {
      const cat = item.category || 'Other'
      categoryMap[cat] = (categoryMap[cat] || 0) + (item.itemTotal || 0)
    })
  })

  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
    percentage: totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0
  }))

  const transactionsData = orders.map(o => ({
    id: o._id,
    date: new Date(o.createdAt).toLocaleDateString(),
    order: o.orderNumber || `#${o._id.substring(o._id.length - 6).toUpperCase()}`,
    amount: o.totalAmount,
    commission: (o.totalAmount || 0) * 0.15,
    status: o.orderStatus
  }))

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Earnings & Analytics</h1>
            <p className="text-neutral-600 mt-1">Track your revenue and commission breakdown — Live Data</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            change={0}
            changeLabel="all time"
            icon={<DollarSign className="w-6 h-6" />}
            variant="success"
          />
          <StatCard
            title="Platform Fee (15%)"
            value={`$${totalCommission.toLocaleString()}`}
            change={0}
            changeLabel="estimated"
            icon={<TrendingUp className="w-6 h-6" />}
            variant="default"
          />
          <StatCard
            title="Completed Orders"
            value={orderCount}
            change={0}
            changeLabel="lifetime"
            icon={<PieChartIcon className="w-6 h-6" />}
            variant="warning"
          />
          <StatCard
            title="Avg Packet Value"
            value={`$${avgOrderValue.toFixed(2)}`}
            change={0}
            changeLabel="per order"
            icon={<DollarSign className="w-6 h-6" />}
            variant="info"
          />
        </div>

        {/* Revenue Chart */}
        <div className="card-base bg-white p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">Revenue Trend</h3>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#EA580C"
                  strokeWidth={3}
                  name="Revenue ($)"
                  dot={{ r: 6, fill: '#EA580C' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-400">
              <p>No revenue data available for this period</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="card-base bg-white p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-6">Revenue by Category</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-neutral-400 font-medium">
                No items sold yet
              </div>
            )}
          </div>

          {/* Commission Breakdown */}
          <div className="card-base bg-white p-6 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-6">Profit Breakdown</h3>

            <div className="space-y-4">
              <div className="border-b border-border pb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-neutral-900">Gross Sales</span>
                  <span className="text-sm font-bold text-neutral-900">${totalRevenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="border-b border-border pb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-orange-600">
                    Platform Service Fee (15%)
                  </span>
                  <span className="text-sm font-bold text-orange-600">
                    -${totalCommission.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full rounded-full"
                    style={{ width: '15%' }}
                  ></div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center bg-orange-50 p-4 rounded-2xl">
                  <span className="font-bold text-neutral-900 text-lg">Net Earnings</span>
                  <span className="font-display font-black text-2xl text-orange-600">${(totalRevenue - totalCommission).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <p className="text-xs text-neutral-600">
                  <span className="font-semibold">Fee Structure:</span> 15% flat commission on successful rescues
                </p>
                <p className="text-xs text-neutral-600">
                  <span className="font-semibold">Settlement:</span> Weekly payouts to registered bank account
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card-base bg-white p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">Transaction Log</h3>
          <div className="overflow-x-auto">
            {transactionsData.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-neutral-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-neutral-700">Order ID</th>
                    <th className="text-right py-3 px-4 font-semibold text-neutral-700">Gross</th>
                    <th className="text-right py-3 px-4 font-semibold text-neutral-700">Fee</th>
                    <th className="text-left py-3 px-4 font-semibold text-neutral-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsData.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border hover:bg-neutral-50">
                      <td className="py-4 px-4 text-neutral-700">{transaction.date}</td>
                      <td className="py-4 px-4 font-mono text-xs text-neutral-900">
                        {transaction.order}
                      </td>
                      <td className="py-4 px-4 text-right text-neutral-900 font-semibold">
                        ${transaction.amount?.toLocaleString() || '0'}
                      </td>
                      <td className="py-4 px-4 text-right text-orange-600 font-semibold">
                        -${transaction.commission?.toLocaleString() || '0'}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${transaction.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-neutral-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No transactions recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
