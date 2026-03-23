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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT, -- REFERENCES public.tenants(id),
    uploaded_by BIGINT REFERENCES public.users(id),
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

-- Enable Realtime for these tables
-- Run these one by one in the Supabase SQL Editor
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_goals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_widgets;
