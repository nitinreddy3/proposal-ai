CREATE TABLE proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  client_name TEXT,
  problem_statement TEXT,
  proposed_solution TEXT,
  budget TEXT,
  timeline TEXT,
  generated_content JSONB,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'generating', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_proposals_select" ON proposals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_proposals_insert" ON proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_proposals_update" ON proposals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "own_proposals_delete" ON proposals
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
