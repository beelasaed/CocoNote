-- Create notifications table
CREATE TABLE IF NOT EXISTS notification (
    notification_id SERIAL PRIMARY KEY,
    recipient_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    actor_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    note_id INT REFERENCES note(note_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'upvote' or 'download'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_recipient ON notification(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_created ON notification(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_unread ON notification(recipient_user_id, is_read);
