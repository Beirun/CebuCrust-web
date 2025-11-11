export type Location = {
  locationId: number
  locationCity: string
  locationBrgy: string
  locationStreet: string
  locationHouseNo: string
  isDefault: boolean
  isDeleted: boolean
  locationPostal?: string | null
  locationLandmark?: string | null
}
