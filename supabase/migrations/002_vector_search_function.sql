-- Vector similarity search function for RAG
create or replace function match_knowledge_chunks(
  query_embedding vector(768),
  match_agent_id uuid,
  match_threshold float default 0.5,
  match_count int default 5
)
returns table (
  id uuid,
  agent_id uuid,
  source_name text,
  chunk_text text,
  chunk_index int,
  similarity float
)
language sql stable
as $$
  select
    kc.id,
    kc.agent_id,
    kc.source_name,
    kc.chunk_text,
    kc.chunk_index,
    1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  where kc.agent_id = match_agent_id
    and kc.embedding is not null
    and 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;
