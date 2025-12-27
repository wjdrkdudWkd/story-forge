-- Story Forge Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- Table: events
-- 모든 사용자 인터랙션 이벤트 저장
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  anon_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID,
  route TEXT,
  app_version TEXT,
  meta JSONB
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_events_anon_id_ts ON events(anon_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_id_ts ON events(user_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_session_id_ts ON events(session_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_name_ts ON events(name, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts DESC);

-- RLS Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own events
CREATE POLICY "Users can read own events"
  ON events
  FOR SELECT
  USING (user_id = auth.uid());

-- Server-side inserts only (client cannot directly insert)
-- Inserts will be done via API routes using service role

-- ============================================================================
-- Table: ai_calls
-- AI 호출 로그 (prompt, response, metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  anon_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID,
  stage TEXT NOT NULL, -- "idea" | "acts" | "blocks_overview" | "block_detail" | etc.
  mode TEXT NOT NULL, -- "mock" | "server"
  model TEXT,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  prompt_chars INT NOT NULL,
  response_chars INT NOT NULL,
  latency_ms INT,
  ok BOOLEAN NOT NULL DEFAULT TRUE,
  error TEXT,
  meta JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_calls_anon_id_ts ON ai_calls(anon_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_user_id_ts ON ai_calls(user_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_project_id_ts ON ai_calls(project_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_stage_ts ON ai_calls(stage, ts DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_ts ON ai_calls(ts DESC);

-- RLS Policies
ALTER TABLE ai_calls ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own AI calls
CREATE POLICY "Users can read own ai_calls"
  ON ai_calls
  FOR SELECT
  USING (user_id = auth.uid());

-- Server-side inserts only

-- ============================================================================
-- Helper function to link anonymous events to user
-- ============================================================================
CREATE OR REPLACE FUNCTION link_anon_events_to_user(
  p_anon_id TEXT,
  p_user_id UUID,
  p_project_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_events_updated INT;
  v_ai_calls_updated INT;
BEGIN
  -- Update events
  UPDATE events
  SET user_id = p_user_id,
      project_id = COALESCE(project_id, p_project_id)
  WHERE anon_id = p_anon_id
    AND user_id IS NULL;

  GET DIAGNOSTICS v_events_updated = ROW_COUNT;

  -- Update ai_calls
  UPDATE ai_calls
  SET user_id = p_user_id,
      project_id = COALESCE(project_id, p_project_id)
  WHERE anon_id = p_anon_id
    AND user_id IS NULL;

  GET DIAGNOSTICS v_ai_calls_updated = ROW_COUNT;

  RETURN json_build_object(
    'events_updated', v_events_updated,
    'ai_calls_updated', v_ai_calls_updated
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION link_anon_events_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION link_anon_events_to_user TO service_role;
