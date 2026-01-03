-- Create event_registration table in public schema
CREATE TABLE IF NOT EXISTS public.event_registration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public."Event"(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    student_participation_sign BOOLEAN NOT NULL DEFAULT false,
    parent_participation_sign BOOLEAN NOT NULL DEFAULT false,
    student_participation_date DATE,
    parent_participation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- Prevent duplicate registrations
);

-- Create index on event_id for faster queries
CREATE INDEX IF NOT EXISTS idx_event_registration_event_id ON public.event_registration(event_id);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_event_registration_user_id ON public.event_registration(user_id);

-- Add comment to table
COMMENT ON TABLE public.event_registration IS 'Stores event registrations with student and parent signatures';

