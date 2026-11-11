-- ============================================================
-- Smart Review Responder - Database Schema
-- Supabase PostgreSQL
-- ============================================================

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the customer_reviews table
CREATE TABLE IF NOT EXISTS customer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    ai_reply TEXT,
    status TEXT NOT NULL CHECK (status IN ('positive', 'negative')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries on status and created_at
CREATE INDEX IF NOT EXISTS idx_customer_reviews_status ON customer_reviews (status);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_created_at ON customer_reviews (created_at DESC);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on the table
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous (anon) users to SELECT (read-only)
CREATE POLICY "Allow public read access"
    ON customer_reviews
    FOR SELECT
    TO anon
    USING (true);

-- Policy: Allow service_role full access (insert, update, delete, select)
-- service_role bypasses RLS by default, but we add explicit policies for clarity
CREATE POLICY "Allow service_role full access"
    ON customer_reviews
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
