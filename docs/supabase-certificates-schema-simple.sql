-- Version simplifiée pour debug
-- Étape 1: Supprimer la table si elle existe déjà (avec erreurs)
DROP TABLE IF EXISTS certificates CASCADE;

-- Étape 2: Créer la table sans références pour tester
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL,
  user_id UUID,
  verdict TEXT NOT NULL,
  score INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  verify_url TEXT NOT NULL,
  language TEXT DEFAULT 'fr',
  purpose TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100),
  CONSTRAINT valid_verdict CHECK (verdict IN ('AUTHENTIQUE', 'SUSPECT', 'INCERTAIN', 'FAUX'))
);

-- Étape 3: Ajouter les foreign keys après création
ALTER TABLE certificates 
  ADD CONSTRAINT fk_analysis 
  FOREIGN KEY (analysis_id) 
  REFERENCES analyses(id) 
  ON DELETE CASCADE;

ALTER TABLE certificates 
  ADD CONSTRAINT fk_user 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

-- Étape 4: Index
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_analysis ON certificates(analysis_id);
CREATE INDEX idx_certificates_created ON certificates(created_at DESC);

-- Étape 5: RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Politique SELECT
CREATE POLICY "Users can view own certificates"
  ON certificates
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IS NULL
  );

-- Politique INSERT
CREATE POLICY "Users can create certificates for own analyses"
  ON certificates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE id = analysis_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

-- Politique DELETE
CREATE POLICY "Users can delete own certificates"
  ON certificates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Étape 6: Vue publique
CREATE OR REPLACE VIEW public_certificate_verification AS
SELECT
  c.id,
  c.verdict,
  c.score,
  c.verify_url,
  c.created_at,
  a.filename,
  a.combined_score,
  a.confidence_level,
  a.is_ai_generated,
  a.created_at as analyzed_at
FROM certificates c
LEFT JOIN analyses a ON c.analysis_id = a.id;

-- Permissions
GRANT SELECT ON public_certificate_verification TO anon, authenticated;

-- Commentaires
COMMENT ON TABLE certificates IS 'Certificats premium avec QR code';
