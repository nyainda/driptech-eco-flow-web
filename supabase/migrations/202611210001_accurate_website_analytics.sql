-- Accurate Website Analytics & Lifetime Performance migration
-- 1. Distinguishes human visitors from automated bots/crawlers (historical backfill + trigger)
-- 2. Allows privacy-safe public duration/engagement updates via SECURITY DEFINER RPC
-- 3. Replaces truncated 1000-row client pulls with exact server-side SQL aggregation (Africa/Nairobi)
-- 4. Preserves lifetime totals in analytics_daily_archive if raw analytics cleanup runs later

CREATE OR REPLACE FUNCTION public.is_automated_user_agent(ua TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(ua, '') ~* '(\mbot\M|googlebot|bingbot|duckduckbot|yandexbot|pinterestbot|exabot|ia_archiver|crawler|spider|slurp|mediapartners-google|apis-google|adsbot-google|google-inspectiontool|storebot-google|headlesschrome|lighthouse|pagespeed|chrome-lighthouse|gtmetrix|pingdom|uptimerobot|statuscake|ptst/|phantomjs|playwright|puppeteer|selenium|webdriver|facebookexternalhit|whatsapp|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|applebot|bingpreview|yandex|baiduspider|sogou|bytespider|semrush|ahrefs|mj12bot|dotbot|petalbot|gptbot|oai-searchbot|claudebot|anthropic-ai|perplexitybot|ccbot|curl/|wget|python-requests|python-urllib|axios/|node-fetch|go-http-client|okhttp|postmanruntime|insomnia)';
$$;

ALTER TABLE public.visitor_sessions
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS exit_page BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS scroll_depth INTEGER,
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_bot_start
  ON public.visitor_sessions (is_bot, session_start DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_bot_timestamp
  ON public.page_views (is_bot, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_product_interactions_timestamp_desc
  ON public.product_interactions (timestamp DESC);

-- Tag future inserts automatically even before/if client sends old payload shape
CREATE OR REPLACE FUNCTION public.tag_visitor_session_bot()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_bot IS NOT TRUE AND public.is_automated_user_agent(NEW.user_agent) THEN
    NEW.is_bot := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tag_visitor_session_bot ON public.visitor_sessions;
CREATE TRIGGER trg_tag_visitor_session_bot
  BEFORE INSERT ON public.visitor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.tag_visitor_session_bot();

CREATE OR REPLACE FUNCTION public.tag_page_view_bot()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  session_is_bot BOOLEAN;
BEGIN
  IF NEW.is_bot IS NOT TRUE AND NEW.session_id IS NOT NULL THEN
    SELECT vs.is_bot INTO session_is_bot
    FROM public.visitor_sessions vs
    WHERE vs.id = NEW.session_id;
    IF COALESCE(session_is_bot, false) THEN
      NEW.is_bot := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tag_page_view_bot ON public.page_views;
CREATE TRIGGER trg_tag_page_view_bot
  BEFORE INSERT ON public.page_views
  FOR EACH ROW
  EXECUTE FUNCTION public.tag_page_view_bot();

-- Backfill existing historical bot/crawler sessions and their page views
UPDATE public.visitor_sessions
SET is_bot = true
WHERE is_bot = false
  AND public.is_automated_user_agent(user_agent);

UPDATE public.page_views pv
SET is_bot = true
FROM public.visitor_sessions vs
WHERE pv.session_id = vs.id
  AND vs.is_bot = true
  AND pv.is_bot = false;

-- Persistent historical rollup archive so cleanup jobs never erase lifetime counts
CREATE TABLE IF NOT EXISTS public.analytics_daily_archive (
  summary_date DATE PRIMARY KEY,
  human_sessions BIGINT NOT NULL DEFAULT 0,
  human_page_views BIGINT NOT NULL DEFAULT 0,
  bot_sessions BIGINT NOT NULL DEFAULT 0,
  bot_page_views BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_daily_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read analytics_daily_archive" ON public.analytics_daily_archive;
CREATE POLICY "Authenticated users can read analytics_daily_archive"
  ON public.analytics_daily_archive
  FOR SELECT
  TO authenticated
  USING (true);

-- Override cleanup_all_analytics() so if ever executed, deleted days are archived first
CREATE OR REPLACE FUNCTION public.cleanup_all_analytics()
RETURNS TABLE(
  table_name TEXT,
  rows_deleted BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  cutoff_ts TIMESTAMPTZ := (CURRENT_DATE - INTERVAL '7 days');
  page_views_deleted BIGINT := 0;
  sessions_deleted BIGINT := 0;
  interactions_deleted BIGINT := 0;
BEGIN
  INSERT INTO public.analytics_daily_archive (
    summary_date,
    human_sessions,
    bot_sessions,
    updated_at
  )
  SELECT
    (timezone('Africa/Nairobi', session_start))::DATE AS summary_date,
    COUNT(*) FILTER (WHERE NOT is_bot),
    COUNT(*) FILTER (WHERE is_bot),
    now()
  FROM public.visitor_sessions
  WHERE session_start < cutoff_ts
  GROUP BY 1
  ON CONFLICT (summary_date) DO UPDATE SET
    human_sessions = public.analytics_daily_archive.human_sessions + EXCLUDED.human_sessions,
    bot_sessions = public.analytics_daily_archive.bot_sessions + EXCLUDED.bot_sessions,
    updated_at = now();

  INSERT INTO public.analytics_daily_archive (
    summary_date,
    human_page_views,
    bot_page_views,
    updated_at
  )
  SELECT
    (timezone('Africa/Nairobi', timestamp))::DATE AS summary_date,
    COUNT(*) FILTER (WHERE NOT is_bot),
    COUNT(*) FILTER (WHERE is_bot),
    now()
  FROM public.page_views
  WHERE created_at < cutoff_ts
  GROUP BY 1
  ON CONFLICT (summary_date) DO UPDATE SET
    human_page_views = public.analytics_daily_archive.human_page_views + EXCLUDED.human_page_views,
    bot_page_views = public.analytics_daily_archive.bot_page_views + EXCLUDED.bot_page_views,
    updated_at = now();

  DELETE FROM public.page_views WHERE created_at < cutoff_ts;
  GET DIAGNOSTICS page_views_deleted = ROW_COUNT;

  DELETE FROM public.visitor_sessions WHERE session_start < cutoff_ts;
  GET DIAGNOSTICS sessions_deleted = ROW_COUNT;

  DELETE FROM public.product_interactions WHERE timestamp < cutoff_ts;
  GET DIAGNOSTICS interactions_deleted = ROW_COUNT;

  RETURN QUERY
  SELECT 'page_views'::TEXT, page_views_deleted
  UNION ALL
  SELECT 'visitor_sessions'::TEXT, sessions_deleted
  UNION ALL
  SELECT 'product_interactions'::TEXT, interactions_deleted;
END;
$function$;

-- Secure engagement / duration update RPC for public visitors (requires matching session_id + visitor_id)
CREATE OR REPLACE FUNCTION public.record_visitor_engagement(
  p_session_id UUID,
  p_visitor_id TEXT,
  p_page_view_id UUID DEFAULT NULL,
  p_page_duration INTEGER DEFAULT NULL,
  p_session_duration INTEGER DEFAULT NULL,
  p_mark_exit BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_sec INTEGER;
  v_sess_sec INTEGER;
  v_pv_count INTEGER;
BEGIN
  IF p_session_id IS NULL OR NULLIF(TRIM(COALESCE(p_visitor_id, '')), '') IS NULL THEN
    RETURN;
  END IF;

  IF p_page_duration IS NOT NULL AND p_page_view_id IS NOT NULL THEN
    v_page_sec := GREATEST(0, LEAST(p_page_duration, 1800));
    UPDATE public.page_views
    SET
      time_spent = GREATEST(COALESCE(time_spent, 0), v_page_sec),
      exit_page = COALESCE(exit_page, false) OR COALESCE(p_mark_exit, false)
    WHERE id = p_page_view_id
      AND session_id = p_session_id
      AND visitor_id = p_visitor_id;
  END IF;

  IF p_session_duration IS NOT NULL THEN
    v_sess_sec := GREATEST(0, LEAST(p_session_duration, 14400));
    SELECT COUNT(*)::INTEGER INTO v_pv_count
    FROM public.page_views
    WHERE session_id = p_session_id;

    UPDATE public.visitor_sessions
    SET
      session_end = now(),
      total_duration = GREATEST(COALESCE(total_duration, 0), v_sess_sec),
      updated_at = now()
    WHERE id = p_session_id
      AND visitor_id = p_visitor_id;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'visitor_sessions' AND column_name = 'page_views_count'
    ) THEN
      UPDATE public.visitor_sessions
      SET page_views_count = GREATEST(COALESCE(page_views_count, 0), v_pv_count)
      WHERE id = p_session_id AND visitor_id = p_visitor_id;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_visitor_engagement(UUID, TEXT, UUID, INTEGER, INTEGER, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_visitor_engagement(UUID, TEXT, UUID, INTEGER, INTEGER, BOOLEAN) TO anon, authenticated;

-- Exact server-side analytics report RPC (no 1000-row cap, Africa/Nairobi timezone, human/bot separation)
CREATE OR REPLACE FUNCTION public.get_website_analytics_report(
  p_range TEXT DEFAULT '30d',
  p_include_bots BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_start TIMESTAMPTZ;
  v_today_nairobi DATE := (timezone('Africa/Nairobi', v_now))::DATE;
  v_series_start DATE;
  v_lifetime_visitors BIGINT := 0;
  v_lifetime_sessions BIGINT := 0;
  v_lifetime_page_views BIGINT := 0;
  v_archived_sessions BIGINT := 0;
  v_archived_views BIGINT := 0;
  v_bot_sessions BIGINT := 0;
  v_bot_page_views BIGINT := 0;
  v_earliest TIMESTAMPTZ;
  v_latest TIMESTAMPTZ;
  v_period_visitors BIGINT := 0;
  v_period_sessions BIGINT := 0;
  v_period_page_views BIGINT := 0;
  v_whatsapp_clicks BIGINT := 0;
  v_unique_whatsapp_visitors BIGINT := 0;
  v_avg_duration NUMERIC := 0;
  v_bounce_rate NUMERIC := 0;
  v_engagement_rate NUMERIC := 0;
  v_new_visitors BIGINT := 0;
  v_returning_visitors BIGINT := 0;
  v_peak_hour INTEGER := 0;
  v_peak_day TEXT := 'N/A';
  v_top_pages JSONB := '[]'::jsonb;
  v_top_products JSONB := '[]'::jsonb;
  v_device_breakdown JSONB := '[]'::jsonb;
  v_hourly_activity JSONB := '[]'::jsonb;
  v_daily_activity JSONB := '[]'::jsonb;
  v_browser_stats JSONB := '[]'::jsonb;
  v_traffic_sources JSONB := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  CASE LOWER(COALESCE(p_range, '30d'))
    WHEN '1d' THEN
      v_start := v_now - INTERVAL '1 day';
      v_series_start := v_today_nairobi;
    WHEN '7d' THEN
      v_start := v_now - INTERVAL '7 days';
      v_series_start := v_today_nairobi - 6;
    WHEN '30d' THEN
      v_start := v_now - INTERVAL '30 days';
      v_series_start := v_today_nairobi - 29;
    WHEN '90d' THEN
      v_start := v_now - INTERVAL '90 days';
      v_series_start := v_today_nairobi - 89;
    WHEN 'year' THEN
      v_start := date_trunc('year', timezone('Africa/Nairobi', v_now)) AT TIME ZONE 'Africa/Nairobi';
      v_series_start := NULL;
    ELSE
      v_start := NULL;
      v_series_start := NULL;
  END CASE;

  -- Lifetime raw totals + archived totals + bot totals
  SELECT
    COUNT(*) FILTER (WHERE p_include_bots OR NOT (is_bot OR public.is_automated_user_agent(user_agent))),
    COUNT(DISTINCT visitor_id) FILTER (WHERE p_include_bots OR NOT (is_bot OR public.is_automated_user_agent(user_agent))),
    COUNT(*) FILTER (WHERE is_bot OR public.is_automated_user_agent(user_agent)),
    MIN(session_start) FILTER (WHERE p_include_bots OR NOT (is_bot OR public.is_automated_user_agent(user_agent))),
    MAX(session_start) FILTER (WHERE p_include_bots OR NOT (is_bot OR public.is_automated_user_agent(user_agent)))
  INTO v_lifetime_sessions, v_lifetime_visitors, v_bot_sessions, v_earliest, v_latest
  FROM public.visitor_sessions;

  SELECT
    COUNT(*) FILTER (WHERE p_include_bots OR NOT pv.is_bot),
    COUNT(*) FILTER (WHERE pv.is_bot)
  INTO v_lifetime_page_views, v_bot_page_views
  FROM public.page_views pv;

  SELECT
    COALESCE(SUM(CASE WHEN p_include_bots THEN human_sessions + bot_sessions ELSE human_sessions END), 0),
    COALESCE(SUM(CASE WHEN p_include_bots THEN human_page_views + bot_page_views ELSE human_page_views END), 0)
  INTO v_archived_sessions, v_archived_views
  FROM public.analytics_daily_archive;

  v_lifetime_sessions := v_lifetime_sessions + v_archived_sessions;
  v_lifetime_page_views := v_lifetime_page_views + v_archived_views;

  -- Period summary & behavioral metrics
  WITH eligible_sessions AS (
    SELECT
      vs.id,
      vs.visitor_id,
      vs.session_start,
      vs.total_duration,
      vs.browser,
      vs.device_type,
      vs.referrer,
      vs.user_agent
    FROM public.visitor_sessions vs
    WHERE p_include_bots OR NOT (vs.is_bot OR public.is_automated_user_agent(vs.user_agent))
  ),
  visitor_first_seen AS (
    SELECT visitor_id, MIN(session_start) AS first_seen
    FROM eligible_sessions
    GROUP BY visitor_id
  ),
  period_sessions AS (
    SELECT es.*
    FROM eligible_sessions es
    WHERE v_start IS NULL OR (es.session_start >= v_start AND es.session_start <= v_now)
  ),
  period_views AS (
    SELECT pv.*
    FROM public.page_views pv
    LEFT JOIN public.visitor_sessions vs ON vs.id = pv.session_id
    WHERE (v_start IS NULL OR (pv.timestamp >= v_start AND pv.timestamp <= v_now))
      AND (
        p_include_bots OR (
          NOT pv.is_bot
          AND NOT COALESCE(vs.is_bot OR public.is_automated_user_agent(vs.user_agent), false)
        )
      )
  ),
  session_view_stats AS (
    SELECT
      ps.id AS session_id,
      ps.session_start,
      ps.total_duration,
      COUNT(pv.id)::INTEGER AS view_count,
      MAX(pv.timestamp) AS last_pv_ts
    FROM period_sessions ps
    LEFT JOIN period_views pv ON pv.session_id = ps.id
    GROUP BY ps.id, ps.session_start, ps.total_duration
  ),
  session_durations AS (
    SELECT
      session_id,
      view_count,
      CASE
        WHEN COALESCE(total_duration, 0) > 0 THEN LEAST(total_duration, 14400)
        WHEN view_count > 1 AND last_pv_ts IS NOT NULL AND last_pv_ts > session_start
          THEN LEAST(14400, GREATEST(0, EXTRACT(EPOCH FROM (last_pv_ts - session_start))::INTEGER))
        ELSE 0
      END AS effective_duration
    FROM session_view_stats
  )
  SELECT
    (SELECT COUNT(DISTINCT visitor_id) FROM period_sessions),
    (SELECT COUNT(*) FROM period_sessions),
    (SELECT COUNT(*) FROM period_views),
    COALESCE((SELECT AVG(effective_duration) FROM session_durations WHERE effective_duration > 0), 0),
    CASE
      WHEN (SELECT COUNT(*) FROM period_sessions) > 0
      THEN (SELECT COUNT(*) FILTER (WHERE view_count <= 1) * 100.0 / COUNT(*) FROM session_view_stats)
      ELSE 0
    END,
    CASE
      WHEN (SELECT COUNT(*) FROM period_sessions) > 0
      THEN (SELECT COUNT(*) FILTER (WHERE view_count > 1) * 100.0 / COUNT(*) FROM session_view_stats)
      ELSE 0
    END,
    (
      SELECT COUNT(DISTINCT ps.visitor_id)
      FROM period_sessions ps
      JOIN visitor_first_seen vfs ON vfs.visitor_id = ps.visitor_id
      WHERE v_start IS NULL OR vfs.first_seen >= v_start
    ),
    (
      SELECT COUNT(DISTINCT ps.visitor_id)
      FROM period_sessions ps
      JOIN visitor_first_seen vfs ON vfs.visitor_id = ps.visitor_id
      WHERE v_start IS NOT NULL AND vfs.first_seen < v_start
    )
  INTO
    v_period_visitors,
    v_period_sessions,
    v_period_page_views,
    v_avg_duration,
    v_bounce_rate,
    v_engagement_rate,
    v_new_visitors,
    v_returning_visitors;

  -- WhatsApp clicks in period (excluding bot visitors when filtered)
  SELECT
    COUNT(*),
    COUNT(DISTINCT w.visitor_id)
  INTO v_whatsapp_clicks, v_unique_whatsapp_visitors
  FROM public.whatsapp_click_events w
  LEFT JOIN public.visitor_sessions vs ON vs.id = w.session_id
  WHERE (v_start IS NULL OR (w.clicked_at >= v_start AND w.clicked_at <= v_now))
    AND (
      p_include_bots
      OR NOT COALESCE(vs.is_bot OR public.is_automated_user_agent(vs.user_agent), false)
    );

  -- Peak hour (Africa/Nairobi)
  v_peak_hour := COALESCE((
    SELECT h.hr
    FROM (
      SELECT EXTRACT(HOUR FROM timezone('Africa/Nairobi', vs.session_start))::INTEGER AS hr, COUNT(*) AS cnt
      FROM public.visitor_sessions vs
      WHERE (v_start IS NULL OR (vs.session_start >= v_start AND vs.session_start <= v_now))
        AND (p_include_bots OR NOT (vs.is_bot OR public.is_automated_user_agent(vs.user_agent)))
      GROUP BY 1
      ORDER BY cnt DESC, hr ASC
      LIMIT 1
    ) h
  ), 0);

  -- Peak day (Africa/Nairobi)
  v_peak_day := COALESCE((
    SELECT d.day_str
    FROM (
      SELECT to_char(timezone('Africa/Nairobi', vs.session_start), 'YYYY-MM-DD') AS day_str, COUNT(*) AS cnt
      FROM public.visitor_sessions vs
      WHERE (v_start IS NULL OR (vs.session_start >= v_start AND vs.session_start <= v_now))
        AND (p_include_bots OR NOT (vs.is_bot OR public.is_automated_user_agent(vs.user_agent)))
      GROUP BY 1
      ORDER BY cnt DESC, day_str DESC
      LIMIT 1
    ) d
  ), 'N/A');

  -- Hourly activity (0..23 Africa/Nairobi)
  WITH hrs AS (
    SELECT generate_series(0, 23) AS hour
  ),
  sess_h AS (
    SELECT EXTRACT(HOUR FROM timezone('Africa/Nairobi', vs.session_start))::INTEGER AS hour, COUNT(*) AS sessions
    FROM public.visitor_sessions vs
    WHERE (v_start IS NULL OR (vs.session_start >= v_start AND vs.session_start <= v_now))
      AND (p_include_bots OR NOT (vs.is_bot OR public.is_automated_user_agent(vs.user_agent)))
    GROUP BY 1
  ),
  pv_h AS (
    SELECT EXTRACT(HOUR FROM timezone('Africa/Nairobi', pv.timestamp))::INTEGER AS hour, COUNT(*) AS page_views
    FROM public.page_views pv
    LEFT JOIN public.visitor_sessions vs ON vs.id = pv.session_id
    WHERE (v_start IS NULL OR (pv.timestamp >= v_start AND pv.timestamp <= v_now))
      AND (p_include_bots OR (NOT pv.is_bot AND NOT COALESCE(vs.is_bot OR public.is_automated_user_agent(vs.user_agent), false)))
    GROUP BY 1
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'hour', hrs.hour,
      'sessions', COALESCE(sess_h.sessions, 0),
      'page_views', COALESCE(pv_h.page_views, 0)
    )
    ORDER BY hrs.hour
  ), '[]'::jsonb)
  INTO v_hourly_activity
  FROM hrs
  LEFT JOIN sess_h ON sess_h.hour = hrs.hour
  LEFT JOIN pv_h ON pv_h.hour = hrs.hour;

  -- Daily activity (Africa/Nairobi) with continuous range backfill for 1d/7d/30d/90d
  WITH sess_d AS (
    SELECT
      (timezone('Africa/Nairobi', vs.session_start))::DATE AS day,
      COUNT(*) AS sessions,
      COUNT(DISTINCT vs.visitor_id) AS visitors
    FROM public.visitor_sessions vs
    WHERE (v_start IS NULL OR (vs.session_start >= v_start AND vs.session_start <= v_now))
      AND (p_include_bots OR NOT (vs.is_bot OR public.is_automated_user_agent(vs.user_agent)))
    GROUP BY 1
  ),
  pv_d AS (
    SELECT
      (timezone('Africa/Nairobi', pv.timestamp))::DATE AS day,
      COUNT(*) AS page_views,
      COUNT(DISTINCT pv.visitor_id) AS pv_visitors
    FROM public.page_views pv
    LEFT JOIN public.visitor_sessions vs ON vs.id = pv.session_id
    WHERE (v_start IS NULL OR (pv.timestamp >= v_start AND pv.timestamp <= v_now))
      AND (p_include_bots OR (NOT pv.is_bot AND NOT COALESCE(vs.is_bot OR public.is_automated_user_agent(vs.user_agent), false)))
    GROUP BY 1
  ),
  all_days AS (
    SELECT generate_series(v_series_start, v_today_nairobi, INTERVAL '1 day')::DATE AS day
    WHERE v_series_start IS NOT NULL
    UNION
    SELECT day FROM sess_d
    UNION
    SELECT day FROM pv_d
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'date', to_char(all_days.day, 'YYYY-MM-DD'),
      'visitors', GREATEST(COALESCE(sess_d.visitors, 0), COALESCE(pv_d.pv_visitors, 0)),
      'sessions', COALESCE(sess_d.sessions, 0),
      'page_views', COALESCE(pv_d.page_views, 0)
    )
    ORDER BY all_days.day
  ), '[]'::jsonb)
  INTO v_daily_activity
  FROM all_days
  LEFT JOIN sess_d ON sess_d.day = all_days.day
  LEFT JOIN pv_d ON pv_d.day = all_days.day;

  -- Top Pages (normalized URL path, real average positive time spent)
  WITH cleaned_pv AS (
    SELECT
      COALESCE(NULLIF(regexp_replace(regexp_replace(pv.page_path, '#.*$', ''), '([?&])(fbclid|gclid|gbraid|wbraid|msclkid|ttclid|mc_cid|mc_eid|_gl|_ga|utm_[^=]+)=[^&]*', '', 'gi'), ''), '/') AS clean_path,
      pv.page_title,
      pv.visitor_id,
      pv.time_spent
    FROM public.page_views pv
    LEFT JOIN public.visitor_sessions vs ON vs.id = pv.session_id
    WHERE (v_start IS NULL OR (pv.timestamp >= v_start AND pv.timestamp <= v_now))
      AND (p_include_bots OR (NOT pv.is_bot AND NOT COALESCE(vs.is_bot OR public.is_automated_user_agent(vs.user_agent), false)))
  ),
  normalized_pv AS (
    SELECT
      COALESCE(NULLIF(regexp_replace(clean_path, '[?&]+$', ''), ''), '/') AS page_path,
      page_title,
      visitor_id,
      time_spent
    FROM cleaned_pv
  ),
  grouped_pages AS (
    SELECT
      page_path,
      COALESCE(MAX(NULLIF(page_title, '')), page_path) AS page_title,
      COUNT(*) AS total_views,
      COUNT(DISTINCT visitor_id) AS unique_visitors,
      COALESCE(AVG(NULLIF(time_spent, 0)), 0) AS avg_time_spent
    FROM normalized_pv
    GROUP BY page_path
    ORDER BY total_views DESC
    LIMIT 15
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'page_path', page_path,
      'page_title', page_title,
      'total_views', total_views,
      'unique_visitors', unique_visitors,
      'avg_time_spent', ROUND(avg_time_spent, 1)
    )
    ORDER BY total_views DESC
  ), '[]'::jsonb)
  INTO v_top_pages
  FROM grouped_pages;

  -- Top Products (prioritize clicks/intent over passive scroll views)
  WITH filtered_pi AS (
    SELECT
      pi.product_name,
      pi.interaction_type,
      pi.visitor_id
    FROM public.product_interactions pi
    LEFT JOIN public.visitor_sessions vs ON vs.id = pi.session_id
    WHERE (v_start IS NULL OR (pi.timestamp >= v_start AND pi.timestamp <= v_now))
      AND (p_include_bots OR NOT COALESCE(vs.is_bot OR public.is_automated_user_agent(vs.user_agent), false))
      AND pi.interaction_type <> 'hover'
  ),
  grouped_products AS (
    SELECT
      product_name,
      COUNT(*) FILTER (WHERE interaction_type <> 'view') AS click_count,
      COUNT(*) FILTER (WHERE interaction_type = 'view') AS view_count,
      COUNT(*) AS interaction_count,
      COUNT(DISTINCT visitor_id) AS unique_visitors,
      CASE
        WHEN COUNT(*) FILTER (WHERE interaction_type <> 'view') > 0 THEN 'click'
        ELSE 'view'
      END AS primary_type
    FROM filtered_pi
    GROUP BY product_name
    ORDER BY click_count DESC, unique_visitors DESC, interaction_count DESC
    LIMIT 15
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'product_name', product_name,
      'interaction_count', interaction_count,
      'click_count', click_count,
      'view_count', view_count,
      'interaction_type', primary_type,
      'unique_visitors', unique_visitors
    )
    ORDER BY click_count DESC, unique_visitors DESC, interaction_count DESC
  ), '[]'::jsonb)
  INTO v_top_products
  FROM grouped_products;

  -- Normalized Device Breakdown
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'device_type', device_type,
      'total_sessions', total_sessions,
      'unique_visitors', unique_visitors
    )
    ORDER BY total_sessions DESC
  ), '[]'::jsonb)
  INTO v_device_breakdown
  FROM (
    SELECT
      CASE
        WHEN LOWER(COALESCE(vs.device_type, '')) LIKE '%tablet%' OR LOWER(COALESCE(vs.device_type, '')) LIKE '%ipad%' THEN 'tablet'
        WHEN LOWER(COALESCE(vs.device_type, '')) LIKE '%mobile%' OR LOWER(COALESCE(vs.device_type, '')) LIKE '%phone%' THEN 'mobile'
        WHEN LOWER(COALESCE(vs.device_type, '')) LIKE '%desktop%' THEN 'desktop'
        WHEN NULLIF(TRIM(COALESCE(vs.device_type, '')), '') IS NULL THEN 'unknown'
        ELSE LOWER(TRIM(vs.device_type))
      END AS device_type,
      COUNT(*) AS total_sessions,
      COUNT(DISTINCT vs.visitor_id) AS unique_visitors
    FROM public.visitor_sessions vs
    WHERE (v_start IS NULL OR (vs.session_start >= v_start AND vs.session_start <= v_now))
      AND (p_include_bots OR NOT (vs.is_bot OR public.is_automated_user_agent(vs.user_agent)))
    GROUP BY 1
  ) d;

  -- Browser Stats
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'browser', browser,
      'sessions', sessions,
      'percentage', CASE WHEN v_period_sessions > 0 THEN ROUND((sessions * 100.0) / v_period_sessions)::INTEGER ELSE 0 END
    )
    ORDER BY sessions DESC
  ), '[]'::jsonb)
  INTO v_browser_stats
  FROM (
    SELECT
      COALESCE(NULLIF(TRIM(vs.browser), ''), 'Unknown') AS browser,
      COUNT(*) AS sessions
    FROM public.visitor_sessions vs
    WHERE (v_start IS NULL OR (vs.session_start >= v_start AND vs.session_start <= v_now))
      AND (p_include_bots OR NOT (vs.is_bot OR public.is_automated_user_agent(vs.user_agent)))
    GROUP BY 1
  ) b;

  -- Traffic Sources
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'source', source,
      'sessions', sessions,
      'visitors', visitors,
      'percentage', CASE WHEN v_period_sessions > 0 THEN ROUND((sessions * 100.0) / v_period_sessions)::INTEGER ELSE 0 END
    )
    ORDER BY sessions DESC
  ), '[]'::jsonb)
  INTO v_traffic_sources
  FROM (
    SELECT
      CASE
        WHEN NULLIF(TRIM(COALESCE(vs.referrer, '')), '') IS NULL THEN 'Direct'
        WHEN LOWER(vs.referrer) LIKE '%dripstech.co.ke%' THEN 'Internal'
        WHEN LOWER(vs.referrer) ~ '(google\.|bing\.|duckduckgo\.|yahoo\.|yandex\.|ecosia\.)' THEN 'Organic Search'
        WHEN LOWER(vs.referrer) ~ '(facebook\.|fb\.|instagram\.|t\.co|twitter\.|x\.com|linkedin\.|tiktok\.|youtube\.|whatsapp)' THEN 'Social Media'
        ELSE 'Referrals'
      END AS source,
      COUNT(*) AS sessions,
      COUNT(DISTINCT vs.visitor_id) AS visitors
    FROM public.visitor_sessions vs
    WHERE (v_start IS NULL OR (vs.session_start >= v_start AND vs.session_start <= v_now))
      AND (p_include_bots OR NOT (vs.is_bot OR public.is_automated_user_agent(vs.user_agent)))
    GROUP BY 1
  ) t;

  RETURN jsonb_build_object(
    'lifetime', jsonb_build_object(
      'totalVisitors', v_lifetime_visitors,
      'totalSessions', v_lifetime_sessions,
      'totalPageViews', v_lifetime_page_views,
      'filteredBotSessions', v_bot_sessions,
      'filteredBotPageViews', v_bot_page_views,
      'earliestSessionAt', v_earliest,
      'latestSessionAt', v_latest
    ),
    'period', jsonb_build_object(
      'visitors', v_period_visitors,
      'lifetimeVisitors', v_lifetime_visitors,
      'visitorsOutsidePeriod', GREATEST(0, v_lifetime_visitors - v_period_visitors),
      'whatsappClicks', v_whatsapp_clicks,
      'uniqueWhatsappVisitors', v_unique_whatsapp_visitors,
      'pageViews', v_period_page_views,
      'sessions', v_period_sessions,
      'avgDuration', ROUND(v_avg_duration, 1),
      'bounceRate', ROUND(v_bounce_rate, 1),
      'pagesPerSession', CASE WHEN v_period_sessions > 0 THEN ROUND((v_period_page_views::NUMERIC / v_period_sessions), 2) ELSE 0 END,
      'engagementRate', ROUND(v_engagement_rate, 1),
      'newVisitors', v_new_visitors,
      'returningVisitors', v_returning_visitors,
      'peakHour', v_peak_hour,
      'peakDay', v_peak_day,
      'avgTimeOnSite', ROUND(v_avg_duration, 1),
      'topPages', v_top_pages,
      'topProducts', v_top_products,
      'deviceBreakdown', v_device_breakdown,
      'hourlyActivity', v_hourly_activity,
      'dailyActivity', v_daily_activity,
      'browserStats', v_browser_stats,
      'trafficSources', v_traffic_sources
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_website_analytics_report(TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_website_analytics_report(TEXT, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_website_analytics_report(TEXT, BOOLEAN) TO authenticated;
