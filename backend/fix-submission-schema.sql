-- Professional fix-submission-schema.sql
-- Run this in Supabase SQL Editor: https://jzxvxxgsfbzqhrirnqfm.supabase.co

-- 1. Ensure students can correctly read/write answers
ALTER TABLE IF EXISTS answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can maintain their own answers" ON answers;
CREATE POLICY "Students can maintain their own answers" ON answers 
FOR ALL USING (student_id = auth.uid());

-- 2. Add missing evaluation columns to answers (with individual checks)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='answers' AND column_name='is_correct') THEN
        ALTER TABLE answers ADD COLUMN is_correct BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='answers' AND column_name='marks_obtained') THEN
        ALTER TABLE answers ADD COLUMN marks_obtained INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='answers' AND column_name='is_evaluated') THEN
        ALTER TABLE answers ADD COLUMN is_evaluated BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Create or Update results table (Industrial Strength)
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  mcq_marks INTEGER DEFAULT 0,
  subjective_marks INTEGER DEFAULT 0,
  coding_marks INTEGER DEFAULT 0,
  total_marks INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pass', 'fail', 'pending')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

-- 4. Enable RLS and add basic policies
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view their own results" ON results;
CREATE POLICY "Students can view their own results" ON results FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can insert their own results" ON results;
CREATE POLICY "Students can insert their own results" ON results FOR INSERT WITH CHECK (student_id = auth.uid());

-- 5. Grant permissions to all roles
GRANT ALL ON results TO authenticated;
GRANT ALL ON answers TO authenticated;
GRANT ALL ON exam_sessions TO authenticated;
GRANT SELECT ON questions TO authenticated;
GRANT SELECT ON exams TO authenticated;
