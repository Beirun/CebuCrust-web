export type Pizza = {
  pizzaId: number | null
  pizzaName: string
  pizzaDescription: string
  pizzaCategory: string
  pizzaPrice: number
  pizzaImage?: string | File | null
  stock: number
  isDeleted: boolean
  averageRating?: number
  totalRatings?: number
}
