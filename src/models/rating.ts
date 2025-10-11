export interface Rating {
  ratingId: number
  userId: number
  pizzaId: number
  ratingValue: number
  ratingMessage?: string
  dateCreated: string
  dateUpdated?: string
  dateDeleted?: string
}

export interface RatingRequest {
  pizzaId: number
  ratingValue: number
  ratingMessage?: string
}

export interface RatingResponse {
  userId: number
  pizzaId: number
  ratingValue: number
  ratingMessage?: string
}

export interface PizzaRating {
  pizzaId: number
  averageRating: number
  totalRatings: number
  ratings: RatingResponse[]
}
