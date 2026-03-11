import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { embedText } from '@/lib/anthropic/client'
import { createServiceClient } from '@/lib/supabase/server'

const CHUNK_SIZE = 512
const CHUNK_OVERLAP = 64

// Naive but effective text chunker
function chunkText(text: string, source: string): { content: string; source: string }[] {
  const words = text.split(/\s+/)
  const chunks: { content: string; source: string }[] = []

  for (let i = 0; i < words.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(' ')
    if (chunk.trim().length > 50) {
      chunks.push({ content: chunk, source })
    }
  }
  return chunks
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const textContent = formData.get('text') as string | null
    const source = (formData.get('source') as string) || 'upload'

    const supabase = createServiceClient()
    let totalChunks = 0

    // Process uploaded files
    for (const file of files) {
      const text = await file.text()
      const chunks = chunkText(text, `${source}:${file.name}`)

      // Batch embed (max 100 at a time)
      for (let i = 0; i < chunks.length; i += 50) {
        const batch = chunks.slice(i, i + 50)
        const embeddings = await Promise.all(
          batch.map((c) => embedText(c.content))
        )

        const rows = batch.map((chunk, j) => ({
          user_id: userId,
          content: chunk.content,
          source: chunk.source,
          embedding: embeddings[j],
          metadata: { file_name: file.name, file_size: file.size },
        }))

        const { error } = await supabase.from('knowledge_chunks').insert(rows)
        if (error) throw error
        totalChunks += batch.length
      }
    }

    // Process raw text
    if (textContent) {
      const chunks = chunkText(textContent, source)
      const embeddings = await Promise.all(chunks.map((c) => embedText(c.content)))
      const rows = chunks.map((chunk, j) => ({
        user_id: userId,
        content: chunk.content,
        source: chunk.source,
        embedding: embeddings[j],
        metadata: {},
      }))
      await supabase.from('knowledge_chunks').insert(rows)
      totalChunks += chunks.length
    }

    // Log ingestion event
    await supabase.from('agent_logs').insert({
      user_id: userId,
      agent_type: 'ingestion',
      message: `Ingested ${totalChunks} knowledge chunks from ${files.length} file(s)`,
      status: 'done',
    })

    return NextResponse.json({ success: true, chunks: totalChunks })
  } catch (error: any) {
    console.error('Ingestion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
