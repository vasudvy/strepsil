-- Strepsil Database Schema
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    organization TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Teams table
CREATE TABLE public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Team members table
CREATE TABLE public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(team_id, user_id)
);

-- AI calls table (main tracking table)
CREATE TABLE public.ai_calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    model_type TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    cost_per_token_in DECIMAL(10, 8) DEFAULT 0,
    cost_per_token_out DECIMAL(10, 8) DEFAULT 0,
    total_cost DECIMAL(10, 6) DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'retry', 'hallucination')),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- API keys table
CREATE TABLE public.api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    permissions TEXT[] DEFAULT ARRAY['read', 'write'],
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_ai_calls_user_id ON public.ai_calls(user_id);
CREATE INDEX idx_ai_calls_created_at ON public.ai_calls(created_at);
CREATE INDEX idx_ai_calls_model_type ON public.ai_calls(model_type);
CREATE INDEX idx_ai_calls_endpoint ON public.ai_calls(endpoint);
CREATE INDEX idx_ai_calls_status ON public.ai_calls(status);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key ON public.api_keys(key);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Teams policies
CREATE POLICY "Users can view teams they belong to" ON public.teams
    FOR SELECT USING (
        id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Team owners can update teams" ON public.teams
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create teams" ON public.teams
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Team members policies
CREATE POLICY "Users can view team members of their teams" ON public.team_members
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Team owners and admins can manage members" ON public.team_members
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- AI calls policies
CREATE POLICY "Users can view own AI calls" ON public.ai_calls
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own AI calls" ON public.ai_calls
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own AI calls" ON public.ai_calls
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own AI calls" ON public.ai_calls
    FOR DELETE USING (user_id = auth.uid());

-- API keys policies
CREATE POLICY "Users can view own API keys" ON public.api_keys
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own API keys" ON public.api_keys
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own API keys" ON public.api_keys
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own API keys" ON public.api_keys
    FOR DELETE USING (user_id = auth.uid());

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_teams
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_ai_calls
    BEFORE UPDATE ON public.ai_calls
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_api_keys
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, organization)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'organization', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();