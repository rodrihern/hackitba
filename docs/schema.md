# schema de supabase

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.brand_points (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL,
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  CONSTRAINT brand_points_pkey PRIMARY KEY (id),
  CONSTRAINT brand_points_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_profiles(id),
  CONSTRAINT brand_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.brand_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  logo text,
  industry text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brand_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT brand_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  description text,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::campaign_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_profiles(id)
);
CREATE TABLE public.challenge_days (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  challenge_id uuid NOT NULL,
  day_number integer NOT NULL,
  title text NOT NULL,
  description text,
  content_type USER-DEFINED NOT NULL DEFAULT 'link'::content_type,
  instructions text,
  CONSTRAINT challenge_days_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_days_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id)
);
CREATE TABLE public.challenge_submissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  challenge_id uuid NOT NULL,
  day_id uuid NOT NULL,
  user_id uuid NOT NULL,
  submission_url text,
  submission_text text,
  score integer CHECK (score >= 1 AND score <= 100),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT challenge_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_submissions_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id),
  CONSTRAINT challenge_submissions_day_id_fkey FOREIGN KEY (day_id) REFERENCES public.challenge_days(id),
  CONSTRAINT challenge_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL,
  is_multi_day boolean NOT NULL DEFAULT false,
  total_days integer NOT NULL DEFAULT 1,
  has_leaderboard boolean NOT NULL DEFAULT true,
  max_winners integer NOT NULL DEFAULT 1,
  scoring_type text NOT NULL DEFAULT 'manual'::text,
  CONSTRAINT challenges_pkey PRIMARY KEY (id),
  CONSTRAINT challenges_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.exchange_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exchange_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'applied'::application_status,
  proposal_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exchange_applications_pkey PRIMARY KEY (id),
  CONSTRAINT exchange_applications_exchange_id_fkey FOREIGN KEY (exchange_id) REFERENCES public.exchanges(id),
  CONSTRAINT exchange_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.exchanges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL,
  requirements jsonb,
  reward_description text,
  reward_type USER-DEFINED NOT NULL DEFAULT 'product'::exchange_reward_type,
  money_amount numeric,
  product_description text,
  slots integer NOT NULL DEFAULT 1,
  deadline timestamp with time zone,
  CONSTRAINT exchanges_pkey PRIMARY KEY (id),
  CONSTRAINT exchanges_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (id),
  CONSTRAINT follows_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id),
  CONSTRAINT follows_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_profiles(id)
);
CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL,
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'exchange'::text,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::invitation_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_profiles(id),
  CONSTRAINT invitations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id),
  CONSTRAINT invitations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  role USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.redemptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reward_id uuid NOT NULL,
  user_id uuid NOT NULL,
  points_used integer NOT NULL DEFAULT 0,
  money_paid numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT redemptions_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id),
  CONSTRAINT redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.rewards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  points_cost integer NOT NULL DEFAULT 0,
  money_cost numeric,
  reward_type USER-DEFINED NOT NULL DEFAULT 'product'::reward_type,
  image text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rewards_pkey PRIMARY KEY (id),
  CONSTRAINT rewards_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_profiles(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  bio text,
  profile_image text,
  instagram_url text,
  tiktok_url text,
  youtube_url text,
  followers_instagram integer NOT NULL DEFAULT 0,
  followers_tiktok integer NOT NULL DEFAULT 0,
  followers_youtube integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  level USER-DEFINED NOT NULL DEFAULT 'Bronze'::user_level,
  category text,
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);