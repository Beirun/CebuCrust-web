export type Pizza = {
  pizzaId: number | null
  pizzaName: string
  pizzaDescription: string
  pizzaCategory: string
  pizzaPrice: number
  pizzaImage?: string | File | null
  stock: number
  isDeleted: boolean
  favoriteCount?: number
  averageRating?: number
  totalRatings?: number
}
