-- Strepsil Local Database Schema (SQLite)
-- Self-hosted AI usage tracking

-- Settings table for storing API keys and configuration
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    encrypted BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI providers configuration
CREATE TABLE IF NOT EXISTS ai_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    base_url TEXT,
    api_key_encrypted TEXT,
    models JSON,
    pricing JSON,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI calls table (main tracking table)
CREATE TABLE IF NOT EXISTS ai_calls (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model_type TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    cost_per_token_in REAL DEFAULT 0,
    cost_per_token_out REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'retry', 'hallucination')),
    error_message TEXT,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tags table for organizing AI calls
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#3B82F6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI call tags junction table
CREATE TABLE IF NOT EXISTS ai_call_tags (
    ai_call_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (ai_call_id, tag_id),
    FOREIGN KEY (ai_call_id) REFERENCES ai_calls(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_calls_created_at ON ai_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_calls_provider ON ai_calls(provider);
CREATE INDEX IF NOT EXISTS idx_ai_calls_model_type ON ai_calls(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_calls_endpoint ON ai_calls(endpoint);
CREATE INDEX IF NOT EXISTS idx_ai_calls_status ON ai_calls(status);
CREATE INDEX IF NOT EXISTS idx_ai_calls_total_cost ON ai_calls(total_cost);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_settings_timestamp 
    AFTER UPDATE ON settings
    BEGIN
        UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_ai_providers_timestamp 
    AFTER UPDATE ON ai_providers
    BEGIN
        UPDATE ai_providers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_ai_calls_timestamp 
    AFTER UPDATE ON ai_calls
    BEGIN
        UPDATE ai_calls SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('app_name', 'Strepsil'),
    ('app_version', '1.0.0'),
    ('setup_completed', 'false'),
    ('default_currency', 'USD');

-- Insert default AI providers
INSERT OR IGNORE INTO ai_providers (name, base_url, models, pricing, active) VALUES 
    ('OpenAI', 'https://api.openai.com/v1', 
     json('[{"name":"gpt-4","context":8192},{"name":"gpt-4-32k","context":32768},{"name":"gpt-3.5-turbo","context":4096}]'),
     json('{"gpt-4":{"input":0.00003,"output":0.00006},"gpt-4-32k":{"input":0.00006,"output":0.00012},"gpt-3.5-turbo":{"input":0.0000015,"output":0.000002}}'),
     true),
    ('Anthropic', 'https://api.anthropic.com/v1',
     json('[{"name":"claude-3-opus-20240229","context":200000},{"name":"claude-3-sonnet-20240229","context":200000},{"name":"claude-3-haiku-20240307","context":200000}]'),
     json('{"claude-3-opus-20240229":{"input":0.000015,"output":0.000075},"claude-3-sonnet-20240229":{"input":0.000003,"output":0.000015},"claude-3-haiku-20240307":{"input":0.00000025,"output":0.00000125}}'),
     false);