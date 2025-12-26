-- Table pour stocker les conversations du chat IA
-- Permet aux admins de voir et répondre aux utilisateurs

CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'pending')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  admin_notes TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_support_conversations_user_id ON support_conversations(user_id);
CREATE INDEX idx_support_conversations_session_id ON support_conversations(session_id);
CREATE INDEX idx_support_conversations_status ON support_conversations(status);
CREATE INDEX idx_support_conversations_last_message_at ON support_conversations(last_message_at DESC);

-- RLS (Row Level Security)
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres conversations
CREATE POLICY "Users can view their own conversations"
  ON support_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent insérer leurs conversations
CREATE POLICY "Users can insert their own conversations"
  ON support_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs conversations
CREATE POLICY "Users can update their own conversations"
  ON support_conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Les admins peuvent tout voir (via service role key côté API)
-- Note: Cette policy est gérée côté API avec SUPABASE_SERVICE_KEY

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_support_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_conversations_updated_at
  BEFORE UPDATE ON support_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_support_conversations_updated_at();

-- Vue pour statistiques admin
CREATE OR REPLACE VIEW support_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as today_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as week_count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 3600 as avg_response_time_hours
FROM support_conversations;

COMMENT ON TABLE support_conversations IS 'Conversations du chat IA pour support client';
COMMENT ON COLUMN support_conversations.messages IS 'Array JSON de messages {role: user|assistant|admin, content: text, timestamp: ISO8601}';
COMMENT ON COLUMN support_conversations.status IS 'open = en cours, resolved = résolu, pending = en attente admin';
COMMENT ON COLUMN support_conversations.priority IS 'Niveau de priorité de la conversation';
