export function getStoreNotificationEmails(): string[] {
  const raw = process.env.STORE_NOTIFICATION_EMAIL
  if (!raw?.trim()) {
    return []
  }

  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
}

export function isStoreNotificationConfigured(): boolean {
  return getStoreNotificationEmails().length > 0
}
