-- pgvector's vector HNSW operator classes support at most 2,000 dimensions.
-- Keep the canonical 2,048-dimension vector while indexing its half-precision representation.
CREATE INDEX "knowledge_chunks_embedding_hnsw_idx"
ON "knowledge_chunks"
USING hnsw (("embedding"::halfvec(2048)) halfvec_cosine_ops);
