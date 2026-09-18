-- Migration: Create Technician Services System
-- Description: Tables for managing technician services, bookings, and scheduling

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Service Categories Table
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name for UI
  base_price DECIMAL(10, 2), -- Base price (optional, can be null for "Request Quote")
  pricing_type TEXT CHECK (pricing_type IN ('fixed', 'hourly', 'per_acre', 'subscription', 'quote')),
  pricing_details JSONB, -- Additional pricing info (e.g., {"hourly_rate": 50, "minimum_hours": 2})
  features TEXT[], -- Array of feature bullet points
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Packages Table (e.g., "Annual Maintenance Plan")
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  service_category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  duration_months INTEGER, -- For subscription packages
  included_services TEXT[], -- Array of included service descriptions
  visit_frequency TEXT, -- e.g., "monthly", "quarterly", "annual"
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technicians Table
CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Link to auth user if they have login
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  profile_image_url TEXT,
  bio TEXT,
  specializations TEXT[], -- e.g., ["drip_irrigation", "sprinkler_systems", "smart_controllers"]
  certifications TEXT[], -- e.g., ["Certified Irrigation Technician", "Pump Specialist"]
  years_experience INTEGER,
  rating DECIMAL(3, 2) DEFAULT 0.00, -- Average rating from reviews
  total_reviews INTEGER DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  availability_schedule JSONB, -- Weekly schedule: {"monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"], ...}
  service_areas TEXT[], -- Array of locations/regions they serve
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Bookings Table
CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL, -- Human-readable booking reference (e.g., "SB-2026-0001")
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If customer has account
  
  -- Service Details
  service_category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  service_package_id UUID REFERENCES service_packages(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL, -- e.g., "installation", "maintenance", "repair"
  service_description TEXT, -- Customer's description of what they need
  
  -- Location Details
  farm_name TEXT,
  location_address TEXT NOT NULL,
  location_coordinates JSONB, -- {"lat": -1.286389, "lng": 36.817223}
  farm_size_acres DECIMAL(10, 2),
  
  -- Scheduling
  preferred_date DATE,
  preferred_time_slot TEXT, -- e.g., "morning", "afternoon", "any"
  scheduled_date TIMESTAMPTZ,
  estimated_duration_hours DECIMAL(4, 2),
  
  -- Assignment
  assigned_technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  
  -- Status & Progress
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Pricing
  quoted_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded')),
  
  -- Additional Details
  special_requirements TEXT,
  internal_notes TEXT, -- Admin/technician notes
  completion_notes TEXT, -- Notes added when job is completed
  
  -- Timestamps
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking Schedules Table (for tracking technician calendar)
CREATE TABLE IF NOT EXISTS booking_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES service_bookings(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent overlapping schedules for same technician
  CONSTRAINT no_overlap EXCLUDE USING gist (
    technician_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status != 'cancelled')
);

-- Service Reviews Table
CREATE TABLE IF NOT EXISTS service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES service_bookings(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  
  -- Ratings (1-5 scale)
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  
  -- Review Content
  review_title TEXT,
  review_text TEXT,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  admin_response TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One review per booking
  UNIQUE(booking_id)
);

-- Create Indexes for Performance
CREATE INDEX idx_service_bookings_status ON service_bookings(status);
CREATE INDEX idx_service_bookings_customer_email ON service_bookings(customer_email);
CREATE INDEX idx_service_bookings_assigned_technician ON service_bookings(assigned_technician_id);
CREATE INDEX idx_service_bookings_scheduled_date ON service_bookings(scheduled_date);
CREATE INDEX idx_booking_schedules_technician ON booking_schedules(technician_id);
CREATE INDEX idx_booking_schedules_time ON booking_schedules(start_time, end_time);
CREATE INDEX idx_service_reviews_technician ON service_reviews(technician_id);
CREATE INDEX idx_service_reviews_approved ON service_reviews(is_approved);

-- Function to auto-generate booking numbers
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_booking_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(booking_number FROM 9) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM service_bookings
  WHERE booking_number LIKE 'SB-' || year_part || '-%';
  
  new_booking_number := 'SB-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  NEW.booking_number := new_booking_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate booking number
CREATE TRIGGER set_booking_number
BEFORE INSERT ON service_bookings
FOR EACH ROW
WHEN (NEW.booking_number IS NULL)
EXECUTE FUNCTION generate_booking_number();

-- Function to update technician rating when review is added/updated
CREATE OR REPLACE FUNCTION update_technician_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE technicians
  SET 
    rating = (
      SELECT AVG(overall_rating)::DECIMAL(3,2)
      FROM service_reviews
      WHERE technician_id = NEW.technician_id AND is_approved = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM service_reviews
      WHERE technician_id = NEW.technician_id AND is_approved = true
    )
  WHERE id = NEW.technician_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update technician rating
CREATE TRIGGER update_technician_rating_on_review
AFTER INSERT OR UPDATE ON service_reviews
FOR EACH ROW
WHEN (NEW.is_approved = true)
EXECUTE FUNCTION update_technician_rating();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_packages_updated_at BEFORE UPDATE ON service_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON service_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_schedules_updated_at BEFORE UPDATE ON booking_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_reviews_updated_at BEFORE UPDATE ON service_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Default Service Categories
INSERT INTO service_categories (name, slug, description, icon, pricing_type, features, display_order) VALUES
('Installation Services', 'installation', 'Professional installation of new irrigation systems tailored to your farm''s needs', 'Wrench', 'quote', ARRAY['Site assessment and planning', 'Complete system installation', 'Pressure testing and calibration', 'Operator training included', '1-year warranty'], 1),
('Maintenance Services', 'maintenance', 'Regular maintenance to keep your irrigation system running at peak efficiency', 'Settings', 'subscription', ARRAY['Filter cleaning and replacement', 'Emitter inspection', 'Pressure testing', 'Seasonal preparation', 'Priority support'], 2),
('Repair Services', 'repair', 'Fast and reliable repair services to minimize downtime', 'Tool', 'hourly', ARRAY['Emergency 24/7 availability', 'Leak detection and repair', 'Component replacement', 'System diagnostics', 'Same-day service available'], 3),
('System Audit & Consultation', 'consultation', 'Expert analysis and recommendations for system optimization', 'ClipboardCheck', 'fixed', ARRAY['Comprehensive system audit', 'Water efficiency analysis', 'Upgrade recommendations', 'ROI calculations', 'Detailed report'], 4),
('Training Services', 'training', 'Hands-on training for operators and maintenance staff', 'GraduationCap', 'fixed', ARRAY['On-site operator training', 'Maintenance workshops', 'Troubleshooting techniques', 'Smart system operation', 'Certificate of completion'], 5),
('Emergency Services', 'emergency', '24/7 emergency response for critical system failures', 'AlertTriangle', 'hourly', ARRAY['24/7 availability', 'Rapid response time', 'Critical failure resolution', 'Temporary solutions', 'Follow-up support'], 6);

-- Enable Row Level Security
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public can read active services
CREATE POLICY "Public can view active service categories"
  ON service_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view active service packages"
  ON service_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view active technicians"
  ON technicians FOR SELECT
  USING (is_active = true);

-- RLS Policies: Anyone can create bookings
CREATE POLICY "Anyone can create service bookings"
  ON service_bookings FOR INSERT
  WITH CHECK (true);

-- RLS Policies: Customers can view their own bookings
CREATE POLICY "Customers can view their own bookings"
  ON service_bookings FOR SELECT
  USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS Policies: Public can view approved reviews
CREATE POLICY "Public can view approved reviews"
  ON service_reviews FOR SELECT
  USING (is_approved = true);

-- Note: Admin policies will be added separately with is_admin() function
