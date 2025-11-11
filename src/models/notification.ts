export interface Notification {
  notificationId?: number
  userId?: number | null
  notificationTitle: string | null
  notificationMessage: string | null
  notificationStatus?: string | null
  dateCreated?: string
}
