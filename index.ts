// Core domain types for OmniMind

export type Plan = 'free' | 'solo' | 'operator' | 'empire'
export type AgentType = 'writer' | 'scanner' | 'revenue' | 'scheduler' | 'ingestion'
export type LogStatus = 'done' | 'review' | 'sent' | 'failed'
export type ContentType = 'linkedin' | 'twitter' | 'newsletter' | 'blog'
export type ContentStatus = 'pending_review' | 'approved' | 'published' | 'rejected'

export interface UserProfile {
  id: string
  user_id: string
  professional_identity: string | null
  writing_style: string | null
  communication_tone: 'formal' | 'casual' | 'technical' | 'conversational'
  active_goals: string[]
  pain_points: string[]
  key_relationships: { name: string; relationship: string }[]
  industry: string | null
  content_topics: string[]
  created_at: string
  updated_at: string
}

export interface KnowledgeChunk {
  id: string
  user_id: string
  content: string
  source: string
  metadata: Record<string, any>
  created_at: string
}

export interface AgentLog {
  id: string
  user_id: string
  agent_type: AgentType
  message: string
  status: LogStatus
  metadata: Record<string, any>
  created_at: string
}

export interface ContentItem {
  id: string
  user_id: string
  type: ContentType
  content: string
  status: ContentStatus
  agent: string
  metadata: Record<string, any>
  scheduled_for: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: Plan
  status: 'active' | 'canceled' | 'past_due'
}

export interface UserStats {
  user_id: string
  hours_freed: number
  content_queued: number
  leads_found: number
  mrr_impact: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// Supabase stub — replace with generated types from `npm run db:types`
export interface Database {
  public: {
    Tables: {
      user_profiles: { Row: UserProfile; Insert: Partial<UserProfile>; Update: Partial<UserProfile> }
      knowledge_chunks: { Row: KnowledgeChunk; Insert: Partial<KnowledgeChunk>; Update: Partial<KnowledgeChunk> }
      agent_logs: { Row: AgentLog; Insert: Partial<AgentLog>; Update: Partial<AgentLog> }
      content_queue: { Row: ContentItem; Insert: Partial<ContentItem>; Update: Partial<ContentItem> }
      subscriptions: { Row: Subscription; Insert: Partial<Subscription>; Update: Partial<Subscription> }
      user_stats: { Row: UserStats; Insert: Partial<UserStats>; Update: Partial<UserStats> }
    }
  }
}
