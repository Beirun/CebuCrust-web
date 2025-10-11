export interface OrderItem {
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  customerName: string
  phone: string
  dateTime: string
  address: string
  instructions: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
  createdAt: string
  updatedAt: string
}
