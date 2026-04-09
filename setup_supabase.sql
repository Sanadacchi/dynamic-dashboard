-- 1. Create Documents Bucket in Storage
-- Run this in the Supabase Storage UI or via API if possible.
-- Name: 'documents'
-- Public: true

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS public.tenants (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    daily_burn REAL DEFAULT 0,
    total_balance REAL DEFAULT 0,
    company_type TEXT,
    dashboard_layout TEXT,
    primary_color TEXT,
    custom_labels TEXT,
    persona TEXT DEFAULT 'Tech Startup',
    north_star_title TEXT DEFAULT 'Define your ultimate objective',
    north_star_description TEXT DEFAULT 'The North Star Metric is the single key performance indicator that best captures the core value your product delivers to customers.',
    north_star_milestones JSONB DEFAULT '[]',
    north_star_chart_data JSONB DEFAULT '[{"name": "Jan", "value": 400}, {"name": "Feb", "value": 300}, {"name": "Mar", "value": 600}, {"name": "Apr", "value": 800}, {"name": "May", "value": 500}, {"name": "Jun", "value": 900}]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed a default tenant if you haven't yet
-- INSERT INTO public.tenants (name, daily_burn, total_balance, company_type) VALUES ('Grahamly Corp', 500, 25000, 'Tech Startup');

CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT REFERENCES public.tenants(id),
    name TEXT NOT NULL,
    role TEXT,
    status TEXT DEFAULT 'Offline',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id BIGINT, -- REFERENCES public.tenants(id),
    title TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT 'indigo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id BIGINT, -- REFERENCES public.tenants(id),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'Medium',
    assignee_id BIGINT REFERENCES public.users(id),
    assignee_name TEXT,
    comments JSONB DEFAULT '[]',
    activity JSONB DEFAULT '[]-Task created',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id BIGINT REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT, -- REFERENCES public.tenants(id),
    uploaded_by BIGINT REFERENCES public.users(id),
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    size BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_goals (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT,
    goal_text TEXT NOT NULL,
    category TEXT DEFAULT 'Development',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_widgets (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT,
    user_id BIGINT,
    label TEXT NOT NULL,
    type TEXT NOT NULL,
    goal_value REAL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.social_posts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT,
    author_id BIGINT REFERENCES public.users(id),
    author_name TEXT NOT NULL,
    author_role TEXT,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blockers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT,
    author_id BIGINT REFERENCES public.users(id),
    task TEXT NOT NULL,
    blocker_text TEXT NOT NULL,
    is_escalated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.eod_reports (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT,
    author_id BIGINT REFERENCES public.users(id),
    report_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Disable RLS for all tables (for development simplicity)
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_widgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.eod_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;

-- 4. Enable Storage Policies for the 'documents' bucket
-- Note: Make sure the 'documents' bucket exists first!
-- These allow anyone to upload/download/delete for development.
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING ( bucket_id = 'documents' ) WITH CHECK ( bucket_id = 'documents' );

-- Enable Realtime for these tables
-- Run these one by one in the Supabase SQL Editor
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_goals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_widgets;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.blockers;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.eod_reports;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.folders;
