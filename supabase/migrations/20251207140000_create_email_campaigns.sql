-- ============================================
-- EMAIL CAMPAIGNS & TRACKING TABLES
-- ============================================

-- Create email_campaigns table
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  from_email TEXT DEFAULT 'info@dripstech.co.ke',
  from_name TEXT DEFAULT 'DripTech EcoFlow',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  template_type TEXT DEFAULT 'newsletter' CHECK (template_type IN ('welcome', 'newsletter', 'promotional', 'transactional')),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON public.email_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON public.email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_subscriber_id ON public.email_logs(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(template_type);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage email campaigns" ON public.email_campaigns FOR ALL USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);
CREATE POLICY "Admins can view email logs" ON public.email_logs FOR ALL USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage email templates" ON public.email_templates FOR ALL USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

-- Create triggers
CREATE OR REPLACE FUNCTION update_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON public.email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION update_email_updated_at();

DROP TRIGGER IF EXISTS update_email_logs_updated_at ON public.email_logs;
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON public.email_logs FOR EACH ROW EXECUTE FUNCTION update_email_updated_at();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION update_email_updated_at();

-- Insert default welcome email template
INSERT INTO public.email_templates (name, description, subject, template_type, html_content, text_content)
VALUES (
  'Welcome Email',
  'Sent automatically when someone subscribes to the newsletter',
  'Welcome to DripTech EcoFlow Newsletter! 🌱',
  'welcome',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to DripTech EcoFlow</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🌱 Welcome to DripTech EcoFlow!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Thank You for Subscribing!</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 15px 0;">
                We''re thrilled to have you join our community of irrigation enthusiasts and sustainable farming advocates.
              </p>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 15px 0;">
                Here''s what you can expect from our newsletter:
              </p>
              <ul style="color: #4b5563; line-height: 1.8; margin: 0 0 20px 0;">
                <li>Latest irrigation technology updates</li>
                <li>Water conservation tips and best practices</li>
                <li>Exclusive product launches and special offers</li>
                <li>Success stories from our customers</li>
                <li>Expert advice on drip irrigation systems</li>
              </ul>
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                <p style="color: #065f46; margin: 0; font-weight: bold;">💡 Pro Tip:</p>
                <p style="color: #065f46; margin: 5px 0 0 0;">Add info@dripstech.co.ke to your contacts to ensure you never miss our updates!</p>
              </div>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="https://dripstech.co.ke/products" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">Explore Our Products</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                <strong>DripTech EcoFlow</strong><br>
                Nairobi, Kenya<br>
                Phone: 0114575401<br>
                Email: info@dripstech.co.ke
              </p>
              <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
                You received this email because you subscribed to our newsletter.<br>
                <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Welcome to DripTech EcoFlow Newsletter!

Thank you for subscribing!

We''re thrilled to have you join our community of irrigation enthusiasts and sustainable farming advocates.

Here''s what you can expect from our newsletter:
- Latest irrigation technology updates
- Water conservation tips and best practices
- Exclusive product launches and special offers
- Success stories from our customers
- Expert advice on drip irrigation systems

Visit our website: https://dripstech.co.ke

DripTech EcoFlow
Nairobi, Kenya
Phone: 0114575401
Email: info@dripstech.co.ke

You can unsubscribe at any time by clicking the link in our emails.'
) ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE public.email_campaigns IS 'Email marketing campaigns sent to newsletter subscribers';
COMMENT ON TABLE public.email_logs IS 'Individual email send logs and tracking';
COMMENT ON TABLE public.email_templates IS 'Reusable email templates for different purposes';
