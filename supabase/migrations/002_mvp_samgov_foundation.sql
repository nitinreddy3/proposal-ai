ALTER TABLE proposals
  ADD COLUMN opportunity_id UUID,
  ADD COLUMN template_id UUID,
  ADD COLUMN generation_context JSONB DEFAULT '{}'::jsonb;

CREATE TABLE vendor_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  capability_statement TEXT DEFAULT '',
  naics_codes TEXT[] DEFAULT '{}',
  capabilities TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  past_performance_summary TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL DEFAULT 'sam.gov',
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  agency_name TEXT,
  due_date TIMESTAMPTZ,
  posted_date TIMESTAMPTZ,
  set_aside TEXT,
  naics_code TEXT,
  description TEXT,
  opportunity_url TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, source, external_id)
);

CREATE TABLE proposal_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  style_profile TEXT NOT NULL DEFAULT 'formal',
  section_layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  prompt_directives TEXT DEFAULT '',
  is_system BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE opportunity_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  match_score NUMERIC(5,2) NOT NULL,
  keyword_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  naics_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  set_aside_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  urgency_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  rationale TEXT NOT NULL DEFAULT '',
  rank INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (opportunity_id, profile_id)
);

CREATE TABLE proposal_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  extracted_text TEXT DEFAULT '',
  include_in_prompt BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE proposals
  ADD CONSTRAINT proposals_opportunity_id_fkey
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL,
  ADD CONSTRAINT proposals_template_id_fkey
    FOREIGN KEY (template_id) REFERENCES proposal_templates(id) ON DELETE SET NULL;

CREATE INDEX opportunities_user_due_idx
  ON opportunities (user_id, due_date);

CREATE INDEX opportunities_user_updated_idx
  ON opportunities (user_id, updated_at DESC);

CREATE INDEX opportunity_matches_user_rank_idx
  ON opportunity_matches (user_id, match_score DESC, rank ASC);

CREATE INDEX proposal_attachments_proposal_idx
  ON proposal_attachments (proposal_id, include_in_prompt);

CREATE INDEX proposals_opportunity_idx
  ON proposals (opportunity_id);

CREATE INDEX proposals_template_idx
  ON proposals (template_id);

ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_vendor_profiles_select" ON vendor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_vendor_profiles_insert" ON vendor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_vendor_profiles_update" ON vendor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "own_vendor_profiles_delete" ON vendor_profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_opportunities_select" ON opportunities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_opportunities_insert" ON opportunities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_opportunities_update" ON opportunities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "own_opportunities_delete" ON opportunities
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "templates_select" ON proposal_templates
  FOR SELECT USING (
    auth.uid() = user_id OR (is_system = true AND user_id IS NULL)
  );

CREATE POLICY "templates_insert" ON proposal_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "templates_update" ON proposal_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "templates_delete" ON proposal_templates
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_opportunity_matches_select" ON opportunity_matches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_opportunity_matches_insert" ON opportunity_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_opportunity_matches_update" ON opportunity_matches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "own_opportunity_matches_delete" ON opportunity_matches
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_proposal_attachments_select" ON proposal_attachments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_proposal_attachments_insert" ON proposal_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_proposal_attachments_update" ON proposal_attachments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "own_proposal_attachments_delete" ON proposal_attachments
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER vendor_profiles_updated_at
  BEFORE UPDATE ON vendor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proposal_templates_updated_at
  BEFORE UPDATE ON proposal_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER opportunity_matches_updated_at
  BEFORE UPDATE ON opportunity_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proposal_attachments_updated_at
  BEFORE UPDATE ON proposal_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

INSERT INTO proposal_templates (
  user_id,
  name,
  description,
  style_profile,
  section_layout,
  prompt_directives,
  is_system
) VALUES
(
  NULL,
  'Government Compliant',
  'Structured template focused on compliance and mandatory requirements.',
  'formal',
  '[
    "Executive Summary",
    "Agency Goals Alignment",
    "Technical Approach",
    "Management Plan",
    "Compliance Matrix",
    "Timeline and Milestones",
    "Pricing and Cost Narrative",
    "Risk Management"
  ]'::jsonb,
  'Prioritize federal compliance language, measurable outcomes, and clear assumptions.',
  true
),
(
  NULL,
  'Executive Brief',
  'Concise template for leadership audiences and rapid review.',
  'persuasive',
  '[
    "Opportunity Snapshot",
    "Why Us",
    "Strategic Approach",
    "Value and ROI",
    "Delivery Plan",
    "Commercial Terms"
  ]'::jsonb,
  'Keep sections concise, focus on strategic outcomes and differentiators.',
  true
),
(
  NULL,
  'Technical Deep Dive',
  'Detailed architecture and implementation focused proposal.',
  'technical',
  '[
    "Technical Executive Summary",
    "Current-State Analysis",
    "Target Architecture",
    "Implementation Workstreams",
    "Security and Compliance",
    "Testing and Quality",
    "Operations and Support",
    "Detailed Timeline"
  ]'::jsonb,
  'Emphasize technical specifics, standards, and implementation detail.',
  true
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-attachments', 'proposal-attachments', false);

CREATE POLICY "proposal_attachments_storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'proposal-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "proposal_attachments_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'proposal-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "proposal_attachments_storage_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'proposal-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "proposal_attachments_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'proposal-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
