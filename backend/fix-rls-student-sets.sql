-- Allow students to view their own randomized question sets
CREATE POLICY "Students can view their own randomized question sets" ON student_question_sets
  FOR SELECT USING (
    student_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM students WHERE id = student_id AND id = auth.uid()
    )
  );

-- Also ensure Colleges can still see everything they need (already exists but adding for safety)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'student_question_sets' AND policyname = 'Colleges can view their student question sets'
    ) THEN
        CREATE POLICY "Colleges can view their student question sets" ON student_question_sets
          FOR SELECT USING (
            exam_id IN (
              SELECT id FROM exams WHERE college_id = auth.uid()
            )
          );
    END IF;
END
$$;
