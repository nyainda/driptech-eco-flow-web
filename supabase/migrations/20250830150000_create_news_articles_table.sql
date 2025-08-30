
-- Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    published BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 0,
    author TEXT DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(published);
CREATE INDEX IF NOT EXISTS idx_news_articles_created_at ON news_articles(created_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_tags ON news_articles USING GIN(tags);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_news_articles_updated_at
    BEFORE UPDATE ON news_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- Create policies for news_articles
CREATE POLICY "Enable read access for published articles" ON news_articles
    FOR SELECT USING (published = true);

CREATE POLICY "Enable all access for authenticated users" ON news_articles
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert some sample data
INSERT INTO news_articles (title, slug, content, excerpt, published, tags, author, reading_time) VALUES 
(
    'Revolutionary Drip Irrigation Technology Launches in Kenya',
    'revolutionary-drip-irrigation-technology-launches-kenya',
    'DripTech EcoFlow is excited to announce the launch of our revolutionary drip irrigation technology in Kenya. This cutting-edge system promises to transform agriculture across the region by providing efficient, sustainable water management solutions for farmers of all scales.

Our new drip irrigation systems feature advanced micro-controllers that precisely regulate water flow, ensuring optimal hydration for crops while minimizing water waste. The technology incorporates smart sensors that monitor soil moisture levels and weather conditions, automatically adjusting irrigation schedules for maximum efficiency.

Key features of our new system include:
- 40% reduction in water usage compared to traditional irrigation methods
- Increased crop yields by up to 60%
- Remote monitoring capabilities via mobile app
- Solar-powered operation for sustainability
- Easy installation and maintenance

The launch event was attended by agricultural experts, local farmers, and government officials who praised the potential impact of this technology on Kenya''s agricultural sector. Minister of Agriculture Dr. Sarah Wanjiku emphasized the importance of such innovations in addressing food security challenges.

"This technology represents a significant step forward in our efforts to modernize agriculture and ensure sustainable farming practices," said Dr. Wanjiku during the launch ceremony.

Local farmer John Kimani, who participated in our pilot program, shared his success story: "Since installing the DripTech system, my tomato yields have increased by 50%, and I''ve reduced my water bills significantly. It''s truly transformative."

The system is now available for purchase and installation across Kenya, with special financing options available for smallholder farmers. Our technical team provides comprehensive training and ongoing support to ensure successful implementation.',
    'DripTech EcoFlow launches revolutionary drip irrigation technology in Kenya, promising 40% water reduction and 60% yield increase for sustainable farming.',
    true,
    ARRAY['technology', 'launch', 'irrigation', 'sustainability'],
    'DripTech Team',
    5
),
(
    'Sustainable Farming Practices Gain Momentum Across East Africa',
    'sustainable-farming-practices-gain-momentum-east-africa',
    'The adoption of sustainable farming practices is rapidly gaining momentum across East Africa, with farmers increasingly recognizing the long-term benefits of environmentally friendly agricultural methods. Recent studies show a 35% increase in sustainable farming adoption over the past two years.

Key sustainable practices being implemented include:
- Drip irrigation systems for water conservation
- Organic fertilizers and pest management
- Crop rotation and diversification
- Soil health monitoring and improvement
- Integration of renewable energy sources

The shift towards sustainability is driven by multiple factors including climate change concerns, water scarcity, and the need for improved crop yields. Government initiatives and NGO support have also played crucial roles in promoting these practices.

Impact on Local Communities:
Farmers who have adopted sustainable practices report not only improved crop yields but also enhanced soil health and reduced input costs. The long-term sustainability of these methods ensures food security for future generations.

DripTech EcoFlow has been at the forefront of this movement, providing farmers with the tools and knowledge needed to implement sustainable irrigation solutions. Our comprehensive training programs have reached over 5,000 farmers across the region.

Success Stories:
Mary Wanjiru, a smallholder farmer from Kiambu County, transformed her 2-acre farm using sustainable practices. "My maize yields have doubled, and I''ve reduced my water usage by half. The training from DripTech was invaluable," she shares.

The future looks promising as more farmers embrace sustainable agriculture, contributing to food security and environmental conservation across East Africa.',
    'Sustainable farming practices see 35% adoption increase across East Africa as farmers embrace environmentally friendly agricultural methods for long-term benefits.',
    true,
    ARRAY['sustainability', 'farming', 'east-africa', 'environment'],
    'Agricultural Reporter',
    4
),
(
    'Water Conservation Breakthrough: New Micro-Irrigation Systems',
    'water-conservation-breakthrough-micro-irrigation-systems',
    'Water conservation has reached a new milestone with the introduction of advanced micro-irrigation systems that promise to revolutionize agricultural water management. These systems represent a significant leap forward in precision agriculture technology.

The new micro-irrigation technology features:
- Precision water delivery at the root zone
- 60% reduction in water consumption
- Automated scheduling based on crop needs
- Real-time monitoring and adjustments
- Integration with weather forecasting systems

Technical Innovation:
The breakthrough lies in the ultra-precise emitter technology that delivers water droplets directly to plant roots with minimal evaporation loss. Smart sensors continuously monitor soil moisture, temperature, and humidity to optimize irrigation timing and duration.

Research conducted by the Kenya Agricultural Research Institute shows that farms using these micro-irrigation systems achieve:
- 45% increase in water use efficiency
- 30% improvement in crop quality
- 25% reduction in fertilizer usage
- Significant reduction in plant diseases

Environmental Impact:
Beyond water conservation, these systems contribute to reduced soil erosion, decreased chemical runoff, and improved biodiversity in agricultural areas. The technology aligns with Kenya''s Vision 2030 goals for sustainable development.

Farmer Testimonials:
Peter Muthee, who operates a 10-acre farm in Meru County, installed the micro-irrigation system six months ago. "The results are remarkable. My vegetables are healthier, and I''ve cut my water costs by more than half. The system practically runs itself."

Cost-Benefit Analysis:
While the initial investment is substantial, farmers typically recover costs within 18-24 months through increased yields and reduced operational expenses. Government subsidies and flexible payment plans make the technology accessible to more farmers.

The widespread adoption of micro-irrigation systems could transform Kenya''s agricultural landscape, ensuring food security while preserving precious water resources for future generations.',
    'Revolutionary micro-irrigation systems achieve 60% water reduction and 45% efficiency improvement, transforming agricultural water management practices.',
    true,
    ARRAY['water-conservation', 'micro-irrigation', 'technology', 'agriculture'],
    'Tech Innovation Team',
    6
);
