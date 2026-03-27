-- Reviews vs tips + optional stillness (Sanctuary) on anonymous reports

ALTER TABLE experience_reports
  ADD COLUMN IF NOT EXISTS content_kind TEXT NOT NULL DEFAULT 'review'
    CHECK (content_kind IN ('review', 'tip'));

ALTER TABLE experience_reports
  ADD COLUMN IF NOT EXISTS stillness_rating INTEGER
    CHECK (stillness_rating IS NULL OR (stillness_rating >= 1 AND stillness_rating <= 5));

CREATE INDEX IF NOT EXISTS idx_experience_reports_created_at ON experience_reports(created_at DESC);

COMMENT ON COLUMN experience_reports.content_kind IS 'review = longer reflection; tip = short visitor note';
COMMENT ON COLUMN experience_reports.stillness_rating IS '1–5 experiential stillness (Sanctuary); optional';
