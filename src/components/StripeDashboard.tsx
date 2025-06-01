// src/components/stripe/StripeDashboard.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useAuth, useConfig, useTranslation } from '@payloadcms/ui'
import type { DocumentViewClientProps } from 'payload'
import { Gutter } from '@payloadcms/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type {
  SanitizedGlobalConfig,
  ClientConfig,
  User as PayloadUser,
  Permissions,
  VisibleEntities,
  Payload,
} from 'payload'
import I18n from 'payload'

// Define interfaces based on your actual Stripe data structure
interface DashboardStats {
  totalRevenue: number
  totalPayments: number
  successfulPayments: number
  pendingPayments: number
  totalProducts: number
}

interface Payment {
  id: string
  stripePaymentId: string
  amount: { value: number; currency: string }
  status: string
  customerEmail: string
  createdAt: string
  method?: string
}

interface Product {
  id: string
  name: string
  price: number
  status: string
  createdAt: string
}

// Props that Payload actually passes to a client component for a Global's edit view
interface StripeDashboardViewProps extends DocumentViewClientProps {
  docConfig?: SanitizedGlobalConfig // The config for the Global this view represents
  clientConfig: ClientConfig
  permissions?: any // Permissions for this specific global
  // `params` and `searchParams` are usually available through Next.js router hooks,
  // but Payload might pass them if the component is rendered in a context where hooks aren't directly usable.
  // For simplicity, we'll assume they are not primary props here and DefaultTemplate can handle their absence if needed.
}

const StripeDashboard: React.FC<StripeDashboardViewProps> = (props) => {
  const { docConfig: globalConfigFromProps, clientConfig: clientConfigFromProps } = props

  const { user } = useAuth<PayloadUser>() // Get the authenticated Payload user
  const { config: clientConfigFromHook } = useConfig() // Get the client-side Payload config
  const { i18n } = useTranslation() // Get the i18n instance

  const effectiveClientConfig = clientConfigFromProps || clientConfigFromHook

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))
        // 🚧 Your actual API calls to fetch Stripe data should go here 🚧
        const mockPayments: Payment[] = [
          {
            id: '1',
            stripePaymentId: 'pi_very_long_id_123',
            amount: { value: 120.5, currency: 'eur' },
            status: 'succeeded',
            customerEmail: 'jane.doe@example.com',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            method: 'card',
          },
          {
            id: '2',
            stripePaymentId: 'pi_another_id_456',
            amount: { value: 75.0, currency: 'eur' },
            status: 'pending',
            customerEmail: 'john.smith@example.com',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            method: 'ideal',
          },
        ]
        const mockProducts: Product[] = [
          {
            id: 'p1',
            name: 'Premium Subscription',
            price: 49.99,
            status: 'active',
            createdAt: new Date().toISOString(),
          },
        ]

        const totalRevenue = mockPayments
          .filter((p) => p.status === 'succeeded')
          .reduce((sum, p) => sum + p.amount.value, 0)
        setStats({
          totalRevenue,
          totalPayments: mockPayments.length,
          successfulPayments: mockPayments.filter((p) => p.status === 'succeeded').length,
          pendingPayments: mockPayments.filter((p) => p.status === 'pending').length,
          totalProducts: mockProducts.length,
        })
        setRecentPayments(mockPayments)
        setProducts(mockProducts)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      succeeded: 'default',
      pending: 'secondary',
      failed: 'destructive',
      canceled: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    )
  }

  return (
    <div className="stripe-dashboard">
      <Gutter className="stripe-dashboard__wrap py-6">
        <div className="space-y-6">
          {!user && <p>Please log in to view the Stripe Dashboard.</p>}
          {user && loading && <p>Loading Stripe Dashboard...</p>}
          {user && !loading && stats && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPayments}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Successful</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.successfulPayments}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="payments" className="mt-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                </TabsList>
                <TabsContent value="payments">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentPayments.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-mono text-xs">
                                {p.stripePaymentId}
                              </TableCell>
                              <TableCell>{p.customerEmail}</TableCell>
                              <TableCell>€{p.amount.value.toFixed(2)}</TableCell>
                              <TableCell>{getStatusBadge(p.status)}</TableCell>
                              <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="products">
                  <Card>
                    <CardHeader>
                      <CardTitle>Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell>{p.name}</TableCell>
                              <TableCell>€{p.price.toFixed(2)}</TableCell>
                              <TableCell>{getStatusBadge(p.status)}</TableCell>
                              <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
          {user && !loading && !stats && <p>Could not load dashboard statistics.</p>}
        </div>
      </Gutter>
    </div>
  )
}

export default StripeDashboard
