-- ============================================
-- FAKETECT - Certification / Traçabilité
-- Ajoute une table `certificates` pour stocker:
-- - payload (snapshot des résultats)
-- - empreintes (SHA-256)
-- - signature HMAC (HS256) côté serveur
-- ============================================

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES analysis_batches(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,

  purpose TEXT,
  version INTEGER DEFAULT 1,

  alg TEXT, -- ex: HS256
  payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  signature TEXT,

  pdf_filename TEXT,
  pdf_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_batch_id ON certificates(batch_id);
CREATE INDEX IF NOT EXISTS idx_certificates_report_id ON certificates(report_id);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Par défaut: l'utilisateur ne voit que ses certificats
CREATE POLICY "Users can view own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);

-- Insert: seulement par le user (si vous insérez via client). En pratique, l'API backend (service role) bypass RLS.
CREATE POLICY "Users can insert own certificates" ON certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Delete: uniquement ses certificats
CREATE POLICY "Users can delete own certificates" ON certificates
  FOR DELETE USING (auth.uid() = user_id);
