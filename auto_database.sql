-- ============================================================
-- Smart Review Responder - Auto Database Setup
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS customer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    ai_reply TEXT,
    status TEXT NOT NULL CHECK (status IN ('positive', 'negative')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON customer_reviews (created_at DESC);

ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
    ON customer_reviews FOR SELECT TO anon USING (true);

CREATE POLICY "Allow service_role full access"
    ON customer_reviews FOR ALL TO service_role
    USING (true) WITH CHECK (true);
