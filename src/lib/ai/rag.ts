import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '@/lib/ai/gemini'

// Use service role client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Split text into chunks of approximately `chunkSize` characters,
 * trying to split on paragraph or sentence boundaries.
 */
export function chunkText(text: string, chunkSize: number = 1000): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/)
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = ''
    }
    currentChunk += paragraph + '\n\n'
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  // If any chunk is still too large, split by sentences
  const finalChunks: string[] = []
  for (const chunk of chunks) {
    if (chunk.length > chunkSize * 1.5) {
      const sentences = chunk.split(/(?<=[.!?])\s+/)
      let subChunk = ''
      for (const sentence of sentences) {
        if (subChunk.length + sentence.length > chunkSize && subChunk.length > 0) {
          finalChunks.push(subChunk.trim())
          subChunk = ''
        }
        subChunk += sentence + ' '
      }
      if (subChunk.trim().length > 0) {
        finalChunks.push(subChunk.trim())
      }
    } else {
      finalChunks.push(chunk)
    }
  }

  return finalChunks
}

/**
 * Process text content: chunk it, generate embeddings, and store in DB
 */
export async function processAndStoreKnowledge(
  agentId: string,
  sourceName: string,
  text: string,
  sourceType: 'text' | 'pdf' | 'csv' | 'docx' | 'url' = 'text'
) {
  const chunks = chunkText(text)

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i])

    const { error } = await supabase.from('knowledge_chunks').insert({
      agent_id: agentId,
      source_name: sourceName,
      chunk_text: chunks[i],
      embedding: JSON.stringify(embedding),
      source_type: sourceType,
      chunk_index: i,
    })

    if (error) {
      console.error(`Error storing chunk ${i}:`, error)
      throw error
    }
  }

  return chunks.length
}

/**
 * Search for relevant knowledge chunks using vector similarity
 */
export async function searchKnowledge(
  agentId: string,
  query: string,
  limit: number = 5
): Promise<string> {
  const queryEmbedding = await generateEmbedding(query)

  // Use Supabase RPC for vector similarity search
  const { data, error } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_agent_id: agentId,
    match_threshold: 0.5,
    match_count: limit,
  })

  if (error) {
    console.error('Error searching knowledge:', error)
    return ''
  }

  if (!data || data.length === 0) {
    return ''
  }

  return data
    .map((chunk: { chunk_text: string; similarity: number }) => chunk.chunk_text)
    .join('\n\n---\n\n')
}
