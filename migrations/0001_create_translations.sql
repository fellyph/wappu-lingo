-- Create translations table
CREATE TABLE IF NOT EXISTS translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  user_email TEXT,
  project_slug TEXT NOT NULL,
  project_name TEXT,
  locale TEXT NOT NULL,
  original_id TEXT NOT NULL,
  original_string TEXT NOT NULL,
  translation TEXT NOT NULL,
  context TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_translations_user_id ON translations(user_id);
CREATE INDEX idx_translations_project ON translations(project_slug);
CREATE INDEX idx_translations_locale ON translations(locale);
CREATE INDEX idx_translations_created_at ON translations(created_at);
CREATE INDEX idx_translations_status ON translations(status);
