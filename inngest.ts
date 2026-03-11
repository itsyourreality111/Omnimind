import { Inngest } from 'inngest'
import { anthropic } from '@/lib/anthropic/client'
import { createServiceClient } from '@/lib/supabase/server'
import { semanticSearch } from '@/lib/anthropic/client'

export const inngest = new Inngest({ id: 'omnimind' })

// ── NIGHTLY AGENT SWARM ────────────────────────────────────
// Triggered every night at 2am for each active user
export const nightlySwarm = inngest.createFunction(
  { id: 'nightly-agent-swarm', name: 'Nightly Agent Swarm' },
  { cron: '0 2 * * *' },
  async ({ step }) => {
    const supabase = createServiceClient()

    // Get all active users
    const { data: users } = await supabase
      .from('subscriptions')
      .select('user_id, plan')
      .eq('status', 'active')

    if (!users) return

    // Fan out — run each user's swarm in parallel
    await Promise.all(
      users.map((user) =>
        step.invoke(`run-swarm-${user.user_id}`, {
          function: runUserSwarm,
          data: { userId: user.user_id, plan: user.plan },
        })
      )
    )
  }
)

// ── PER-USER SWARM ─────────────────────────────────────────
export const runUserSwarm = inngest.createFunction(
  { id: 'run-user-swarm', name: 'Run User Agent Swarm' },
  { event: 'omnimind/swarm.run' },
  async ({ event, step }) => {
    const { userId, plan } = event.data
    const supabase = createServiceClient()

    // Load user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!profile) return

    // Run writer agent
    await step.run('writer-agent', async () => {
      const voiceSamples = await semanticSearch('writing samples blog posts', userId, 10)

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: `You are a content writer mimicking this person exactly.
Writing style: ${profile.writing_style}
Topics they care about: ${profile.content_topics?.join(', ')}
Voice samples: ${voiceSamples.map((s) => s.content).join('\n---\n')}`,
        messages: [
          {
            role: 'user',
            content: `Generate today's content. Return JSON:
{
  "linkedin_post": "string — 150-250 words, their voice",
  "twitter_thread": ["tweet1", "tweet2", "tweet3", "tweet4", "tweet5"],
  "brief_reason": "string — why these topics today"
}`,
          },
        ],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
      const content = JSON.parse(text.replace(/```json|```/g, '').trim())

      await supabase.from('content_queue').insert({
        user_id: userId,
        type: 'linkedin',
        content: content.linkedin_post,
        status: 'pending_review',
        agent: 'writer',
        metadata: { thread: content.twitter_thread },
      })

      await supabase.from('agent_logs').insert({
        user_id: userId,
        agent_type: 'writer',
        message: `Drafted LinkedIn post + Twitter thread on "${content.brief_reason}"`,
        status: 'review',
      })
    })

    // Run opportunity scanner (Operator+ only)
    if (plan === 'operator' || plan === 'empire') {
      await step.run('opportunity-scanner', async () => {
        // In production: scrape Twitter/HN/Reddit here
        // For now: use AI to generate opportunity-hunting queries
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [
            {
              role: 'user',
              content: `Given this professional profile: ${JSON.stringify(profile)}
Generate 3 specific search queries to find the best opportunities on Twitter/LinkedIn/HN today.
Return JSON: { "queries": [{ "platform": string, "query": string, "intent": string }] }`,
            },
          ],
        })

        const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
        const { queries } = JSON.parse(text.replace(/```json|```/g, '').trim())

        await supabase.from('agent_logs').insert({
          user_id: userId,
          agent_type: 'scanner',
          message: `Generated ${queries.length} opportunity search queries for today's scan`,
          status: 'done',
          metadata: { queries },
        })
      })
    }
  }
)

// ── SINGLE INGESTION JOB ───────────────────────────────────
export const processIngestion = inngest.createFunction(
  { id: 'process-ingestion' },
  { event: 'omnimind/ingest' },
  async ({ event, step }) => {
    const { userId } = event.data
    const supabase = createServiceClient()

    // After ingestion, rebuild user profile
    await step.run('rebuild-profile', async () => {
      const { data: chunks } = await supabase
        .from('knowledge_chunks')
        .select('content, source')
        .eq('user_id', userId)
        .limit(50)

      if (!chunks || chunks.length < 5) return

      const { buildUserProfile } = await import('@/lib/anthropic/client')
      const profile = await buildUserProfile(userId, chunks.map((c) => c.content))

      if (profile) {
        await supabase.from('user_profiles').upsert({
          user_id: userId,
          ...profile,
          updated_at: new Date().toISOString(),
        })
      }
    })
  }
)
