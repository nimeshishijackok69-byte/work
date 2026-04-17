-- Phase 7 performance tuning: add indexes for hot dashboard queries that
-- emerged during QA.  All indexes are additive and idempotent (IF NOT EXISTS).
--
-- Rationale:
--  * event_master(expiration_date) powers the "upcoming / closing soon"
--    sort on participant & admin event lists.
--  * event_master(created_at DESC) backs the admin dashboard default sort.
--  * submission(created_at DESC) backs submission activity feeds.
--  * review(reviewed_at DESC) backs reviewer performance widgets.
--  * notification partial index on unread rows keeps the notification bell
--    fast as the table grows — the primary index already includes is_read
--    but a partial index is materially smaller and used for the inbox.
--  * transaction_master(created_at DESC) backs the audit log viewer.

CREATE INDEX IF NOT EXISTS idx_event_expiration_date
    ON event_master (expiration_date)
    WHERE expiration_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_created_at_desc
    ON event_master (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submission_created_at_desc
    ON submission (event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_reviewed_at_desc
    ON review (reviewer_id, reviewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_unread
    ON notification (recipient_id, recipient_type, created_at DESC)
    WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_transaction_created_at_desc
    ON transaction_master (event_id, created_at DESC);
