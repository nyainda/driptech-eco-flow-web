-- Extend the product_category enum with 16 new categories
-- Batch 1 (9 categories)
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'pumps_motors';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'pipes_fittings';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'solar_irrigation';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'fertigation_systems';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'greenhouse_systems';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'emitters_drippers';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'valves_regulators';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'water_storage';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'rain_guns';
-- Batch 2 (7 categories)
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'filters_strainers';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'controllers_timers';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'mulching_materials';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'greenhouse_accessories';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'growing_media';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'seedling_trays_nursery';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'borehole_equipment';
