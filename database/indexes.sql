-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_recipient ON notification(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_created ON notification(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_unread ON notification(recipient_user_id, is_read);
