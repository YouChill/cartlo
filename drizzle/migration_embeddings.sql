-- Migration: Add pgvector support for product embeddings
-- This enables semantic search and auto-categorization of products

-- 1. Enable pgvector extension (Neon supports this natively)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to products table
-- Using 1536 dimensions (OpenAI text-embedding-3-small)
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Create HNSW index for fast approximate nearest neighbor search
-- Using cosine distance operator class
CREATE INDEX IF NOT EXISTS idx_products_embedding
  ON products
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
