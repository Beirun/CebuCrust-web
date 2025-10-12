import type { Location } from './location'

export interface OrderItem {
  pizzaId: number
  quantity: number
}

export interface Order {
  orderId: number
  userId: number
  locationId: number
  firstName?: string | null
  lastName?: string | null
  phoneNumber?: string | null
  orderInstruction?: string | null
  orderStatus?: string | null
  orderEstimate?: string | null
  orderTotal?: number | null
  dateCreated?: Date | null
  location?: Location | null
  orderLists: OrderItem[]
}
