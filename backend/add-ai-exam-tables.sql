-- =====================================================
-- Add missing tables for AI Question Generator functionality
-- =====================================================

-- Add new columns to exams table for AI generation and randomization
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS question_randomization BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS title VARCHAR(255); -- Add title column for compatibility

-- =====================================================
-- TABLE: exam_questions (stores questions for each exam)
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'subjective', 'coding', 'mixed')),
  marks INTEGER NOT NULL DEFAULT 1,
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_data JSONB, -- Store complete question object
  order_index INTEGER NOT NULL, -- Order of questions in exam
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: student_question_sets (stores randomized question sets for each student)
-- =====================================================
CREATE TABLE IF NOT EXISTS student_question_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id VARCHAR(255), -- ID from the question data
  question_order INTEGER NOT NULL, -- Order for this specific student
  question_data JSONB NOT NULL, -- Complete question with variations
  random_seed FLOAT, -- Seed for reproducibility
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id, question_order)
);

-- =====================================================
-- TABLE: exam_assignments (track student exam assignments)
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'started', 'submitted', 'completed', 'abandoned')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(exam_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON exam_questions(exam_id, order_index);
CREATE INDEX IF NOT EXISTS idx_student_question_sets_exam_student ON student_question_sets(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_exam_student ON exam_assignments(exam_id, student_id);

-- Enable RLS (Row Level Security)
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exam_questions
CREATE POLICY "Colleges can view their exam questions" ON exam_questions
  FOR SELECT USING (
    exam_id IN (
      SELECT id FROM exams WHERE college_id = auth.uid()
    )
  );

CREATE POLICY "Colleges can insert their exam questions" ON exam_questions
  FOR INSERT WITH CHECK (
    exam_id IN (
      SELECT id FROM exams WHERE college_id = auth.uid()
    )
  );

CREATE POLICY "Colleges can update their exam questions" ON exam_questions
  FOR UPDATE USING (
    exam_id IN (
      SELECT id FROM exams WHERE college_id = auth.uid()
    )
  );

CREATE POLICY "Colleges can delete their exam questions" ON exam_questions
  FOR DELETE USING (
    exam_id IN (
      SELECT id FROM exams WHERE college_id = auth.uid()
    )
  );

-- RLS Policies for student_question_sets
CREATE POLICY "Colleges can view their student question sets" ON student_question_sets
  FOR SELECT USING (
    exam_id IN (
      SELECT id FROM exams WHERE college_id = auth.uid()
    )
  );

CREATE POLICY "Colleges can insert their student question sets" ON student_question_sets
  FOR INSERT WITH CHECK (
    exam_id IN (
      SELECT id FROM exams WHERE college_id = auth.uid()
    )
  );

CREATE POLICY "Colleges can update their student question sets" ON student_question_sets
  FOR UPDATE USING (
    exam_id IN (
      SELECT id FROM exams WHERE college_id = auth.uid()
    )
  );

CREATE POLICY "Colleges can delete their student question sets" ON student_question_sets
  FOR DELETE USING (
    exam_id IN (
      SELECT id FROM exams WHERE college_id = auth.uid()
    )
  );

-- RLS Policies for exam_assignments
CREATE POLICY "Colleges can view their exam assignments" ON exam_assignments
  FOR SELECT USING (
    exam_id IN (
      SELECT id FROM exams WHERE college_id = auth.uid()
    )
  );

CREATE POLICY "Colleges can insert their exam assignments" ON exam_assignments
  FOR INSERT WITH CHECK (
    exam_id IN (
      SELECT id FROM exams WHERE college_id = auth.uid()
    )
  );

CREATE POLICY "Colleges can update their exam assignments" ON exam_assignments
  FOR UPDATE USING (
    exam_id IN (
      SELECT id FROM exams WHERE college_id = auth.uid()
    )
  );

CREATE POLICY "Colleges can delete their exam assignments" ON exam_assignments
  FOR DELETE USING (
    exam_id IN (
      SELECT id FROM exams WHERE college_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON exam_questions TO authenticated;
GRANT ALL ON student_question_sets TO authenticated;
GRANT ALL ON exam_assignments TO authenticated;

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_exam_questions_updated_at BEFORE UPDATE ON exam_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
