-- Create exams table if it doesn't exist
-- This table stores exam information for the ExamShield system

-- Drop table if it exists (for fresh start)
DROP TABLE IF EXISTS exams CASCADE;

-- Create exams table
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('mcq', 'essay', 'practical')),
    duration INTEGER NOT NULL CHECK (duration > 0), -- Duration in minutes
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    total_marks INTEGER DEFAULT 100,
    passing_marks INTEGER DEFAULT 50,
    instructions TEXT,
    exam_key VARCHAR(50) UNIQUE NOT NULL, -- Unique key for students to join exam
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_exams_college_id ON exams(college_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_start_time ON exams(start_time);
CREATE INDEX idx_exams_created_at ON exams(created_at);

-- Enable Row Level Security
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: College admins can manage their own exams
CREATE POLICY "College admins can manage their exams" ON exams
    FOR ALL USING (
        auth.uid() = college_id
    )
    WITH CHECK (
        auth.uid() = college_id
    );

-- Create RLS policy: College admins can view their own exams
CREATE POLICY "College admins can view their exams" ON exams
    FOR SELECT USING (
        auth.uid() = college_id
    );

-- Insert sample exam data (optional)
INSERT INTO exams (id, college_id, title, description, subject, type, duration, start_time, end_time, status, total_marks, passing_marks, instructions, exam_key) VALUES
    (
        gen_random_uuid(),
        '749e5e00-413a-40d7-9461-279d3b8670dc', -- Using the test college ID
        'Sample Mathematics Exam',
        'This is a sample mathematics exam for testing purposes.',
        'Mathematics',
        'mcq',
        60, -- 60 minutes
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '2 days',
        'draft',
        100,
        50,
        'Please read all questions carefully before answering.',
        'MATH-001'
    ),
    (
        gen_random_uuid(),
        '749e5e00-413a-40d7-9461-279d3b8670dc',
        'Sample Science Exam',
        'This is a sample science exam for testing purposes.',
        'Science',
        'mcq',
        90, -- 90 minutes
        NOW() + INTERVAL '3 days',
        NOW() + INTERVAL '4 days',
        'active',
        100,
        60,
        'Answer all multiple choice questions.',
        'SCI-002'
    );

-- Output success message
DO $$
BEGIN
    RAISE NOTICE 'Exams table created successfully with sample data!';
    RAISE NOTICE 'Table includes: id, college_id, title, description, subject, type, duration, start_time, end_time, status, total_marks, passing_marks, instructions, exam_key';
    RAISE NOTICE 'Indexes created for: college_id, status, start_time, created_at';
    RAISE NOTICE 'RLS policies enabled for college admin access';
    RAISE NOTICE 'Sample data inserted: 2 exam records';
END $$;
$$;
