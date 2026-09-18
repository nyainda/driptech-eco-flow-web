import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Topic categories for rotation
const TOPIC_CATEGORIES = [
    {
        value: "drip_irrigation_systems",
        label: "Drip Irrigation Systems",
        keywords: "drip irrigation Kenya, drip system setup, drip tape installation"
    },
    {
        value: "solar_irrigation",
        label: "Solar Irrigation",
        keywords: "solar water pump Kenya, solar irrigation cost, off-grid irrigation"
    },
    {
        value: "irrigation_costs",
        label: "Irrigation Costs in Kenya",
        keywords: "irrigation cost per acre Kenya, drip irrigation price, irrigation investment"
    },
    {
        value: "greenhouse_irrigation",
        label: "Greenhouse Irrigation",
        keywords: "greenhouse irrigation Kenya, tomato irrigation, greenhouse drip system"
    },
    {
        value: "smart_irrigation",
        label: "Irrigation Controls & Automation",
        keywords: "automated irrigation Kenya, smart farming, irrigation controller"
    },
    {
        value: "irrigation_maintenance",
        label: "Irrigation Maintenance & Mistakes",
        keywords: "irrigation maintenance tips, common irrigation mistakes, drip system care"
    },
    {
        value: "water_management",
        label: "Water Management for Farms",
        keywords: "water conservation Kenya, farm water efficiency, irrigation scheduling"
    }
];

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client with service role key
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        console.log('Starting automated blog post generation...')

        // 1. Check if auto-generation is enabled
        const { data: settings, error: settingsError } = await supabase
            .from('blog_generation_settings')
            .select('*')
            .single()

        if (settingsError) {
            console.error('Error fetching settings:', settingsError)
            throw new Error('Failed to fetch generation settings')
        }

        if (!settings.auto_generate_enabled) {
            console.log('Auto-generation is disabled')
            return new Response(
                JSON.stringify({ message: 'Auto-generation is disabled' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Get Gemini API key
        const { data: apiKeyData, error: apiKeyError } = await supabase
            .from('system_settings')
            .select('setting_value')
            .eq('setting_key', 'gemini_api_key')
            .single()

        if (apiKeyError || !apiKeyData?.setting_value) {
            console.error('Gemini API key not found')
            throw new Error('Gemini API key not configured')
        }

        const geminiApiKey = apiKeyData.setting_value

        // 3. Get pending scheduled posts for now
        const now = new Date()
        const { data: scheduledPosts, error: scheduleError } = await supabase
            .from('automated_blog_schedule')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_for', now.toISOString())
            .order('scheduled_for', { ascending: true })
            .limit(2) // Process 2 posts at a time

        if (scheduleError) {
            console.error('Error fetching scheduled posts:', scheduleError)
            throw new Error('Failed to fetch scheduled posts')
        }

        if (!scheduledPosts || scheduledPosts.length === 0) {
            console.log('No pending posts to generate')
            return new Response(
                JSON.stringify({ message: 'No pending posts to generate' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Found ${scheduledPosts.length} posts to generate`)

        const results = []

        // 4. Generate each post
        for (const schedule of scheduledPosts) {
            try {
                console.log(`Generating post for topic: ${schedule.topic_category}`)

                const topic = TOPIC_CATEGORIES.find(t => t.value === schedule.topic_category)
                if (!topic) {
                    throw new Error(`Invalid topic category: ${schedule.topic_category}`)
                }

                // Generate content using Gemini API
                const blogData = await generateBlogContent(geminiApiKey, topic)

                // Save to blog_posts table as draft
                const { data: newPost, error: insertError } = await supabase
                    .from('blog_posts')
                    .insert({
                        title: blogData.title,
                        slug: blogData.slug,
                        excerpt: blogData.excerpt,
                        content: blogData.content,
                        tags: blogData.tags,
                        seo_title: blogData.seo_title,
                        seo_description: blogData.seo_description,
                        reading_time: blogData.reading_time,
                        published: false, // Always draft
                        published_at: null,
                    })
                    .select()
                    .single()

                if (insertError) {
                    console.error('Error inserting blog post:', insertError)
                    throw insertError
                }

                console.log(`Created blog post: ${newPost.id}`)

                // Sync to Cloudflare D1 if published
                if (newPost.published) {
                    try {
                        await syncToCloudflareD1(newPost)
                        console.log(`Synced to Cloudflare D1: ${newPost.id}`)
                    } catch (syncError) {
                        console.error(`Warning: Failed to sync to D1:`, syncError)
                        // Don't fail the whole operation if D1 sync fails
                    }
                }

                // Update schedule status
                await supabase
                    .from('automated_blog_schedule')
                    .update({
                        status: 'generated',
                        generated_post_id: newPost.id,
                    })
                    .eq('id', schedule.id)

                results.push({
                    schedule_id: schedule.id,
                    post_id: newPost.id,
                    title: blogData.title,
                    status: 'success'
                })

                // Send email notification (fire and forget)
                if (settings.notification_email) {
                    sendEmailNotification(newPost, settings.notification_email, schedule.topic_category).catch(console.error)
                }

            } catch (error) {
                console.error(`Error generating post for schedule ${schedule.id}:`, error)

                // Update schedule with error
                await supabase
                    .from('automated_blog_schedule')
                    .update({
                        status: 'failed',
                        error_message: error.message,
                    })
                    .eq('id', schedule.id)

                results.push({
                    schedule_id: schedule.id,
                    status: 'failed',
                    error: error.message
                })
            }
        }

        // 5. Schedule next week's posts if needed
        const { data: upcomingSchedule } = await supabase
            .from('automated_blog_schedule')
            .select('id')
            .eq('status', 'pending')
            .gte('scheduled_for', now.toISOString())

        if (!upcomingSchedule || upcomingSchedule.length < 4) {
            console.log('Scheduling next week\'s posts...')
            await supabase.rpc('schedule_next_blog_posts')
        }

        return new Response(
            JSON.stringify({
                success: true,
                generated: results.filter(r => r.status === 'success').length,
                failed: results.filter(r => r.status === 'failed').length,
                results
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Edge function error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})

// Generate blog content using Gemini API
async function generateBlogContent(apiKey: string, topic: any) {
    const prompt = `You are a careful field writer helping Kenyan farmers make practical irrigation decisions. Write a clear, useful blog post about "${topic.label}" without inflated marketing language.

=== TARGET AUDIENCE ===
- Small & medium-scale farmers in Kenya
- Agribusiness owners
- Greenhouse farmers
- Irrigation buyers & decision-makers

=== TONE & STYLE ===
- Clear, practical, confident
- Simple English (avoid jargon)
- Kenyan context: KES currency, local crops (tomatoes, peppers, kale, cabbage, onions, maize), Kenyan climate and regions
- No fluff, no generic AI phrasing
- Actionable advice
- **Use emojis** 🌿💧☀️ where appropriate to make content engaging (in headings and lists)
- **Short paragraphs**: 2-3 sentences max per paragraph for easy reading on mobile

=== STYLE REFERENCE ===
Structure your content similar to this style:
"a) Automated Drip Irrigation for Vegetables and Greenhouses 🍅
This is arguably the most popular and efficient choice for crops like tomatoes, peppers, kale (sukuma wiki), cabbage, onions, and fruit trees. Water is delivered slowly, drop by drop, directly to the plant roots.

Components: Drip lines with emitters, a main supply line, a filter, pressure regulator, automated valves, and a smart controller with soil moisture sensors.
Ideal for: Small to medium-scale farms, greenhouse operations, horticulture.
Cost Insight: The drip irrigation cost per acre Kenya can range from KES 50,000 to KES 150,000, depending on system complexity, water source, and type of emitters."

=== SEO REQUIREMENTS ===
- Target keywords: ${topic.keywords}
- Optimize for featured snippets
- Target long-tail keywords (e.g., "drip irrigation cost per acre Kenya")
- Include money keywords where relevant (e.g., "buy drip irrigation kit Kenya")
- Problem-solving focus

=== CONTENT STRUCTURE (CRITICAL - PROPER HTML) ===
1. **Introduction** (100-150 words)
   - Problem-focused hook
   - Use <p> tags with proper spacing
   - Include primary keyword naturally

2. **Main Content** (3-4 sections)
   - Use <h2> headings with relevant emojis
   - Subsections with <h3> where needed
   - Use <p> tags for short paragraphs
   - Use <ul><li> for lists with emojis as bullets where fit
   - Use <strong> for emphasis on key terms (like "Components:", "Ideal for:", "Cost Insight:")
   - Include practical tips and real-world examples

3. **FAQ Section** (CRITICAL - Accordion-Ready Format)
   - Minimum 5 FAQs
   - Structure EXACTLY as follows:
   
   <div class="faq-section">
     <h2>Frequently Asked Questions ❓</h2>
     <div class="faq-item">
       <h3 class="faq-question">Question 1 here?</h3>
       <div class="faq-answer">
         <p>Answer paragraph with helpful information.</p>
       </div>
     </div>
     <div class="faq-item">
       <h3 class="faq-question">Question 2 here?</h3>
       <div class="faq-answer">
         <p>Answer paragraph.</p>
         <ul><li>Bullet point if needed</li></ul>
       </div>
     </div>
     <!-- Repeat for all 5+ FAQs -->
   </div>

4. **Call-to-Action Section**
   - Strong CTA encouraging action
   - Include WhatsApp consultation offer
   - Professional irrigation assessment mention
   - Use <div class="cta-section"> wrapper
   - **REQUIRED CTA TEXT**: "Need help choosing an irrigation system? Contact DripTech for a free consultation. Call or WhatsApp **0723407849** and tell us your crop, plot size and water source."

=== INTERNAL LINKING (MANDATORY) ===
Naturally include 3-4 internal links with relevant anchor text:
- <a href="/irrigation-kits" class="internal-link">explore our irrigation kits</a>
- <a href="/products" class="internal-link">browse drip irrigation products</a>
- <a href="/success-stories" class="internal-link">see how farmers are succeeding</a>
- <a href="/contact" class="internal-link">get a free consultation</a>

=== KENYA-SPECIFIC REQUIREMENTS ===
- Reference local crops: tomatoes, kale (sukuma wiki), peppers, cabbage, onions, maize
- Use KES for pricing (matches reference style: "KES 50,000 to KES 150,000")
- Mention Kenyan regions where relevant (e.g., Rift Valley, Central Kenya)
- Reference Kenyan climate challenges (dry seasons, water scarcity)

=== WORD COUNT ===
800 - 1,200 words total (Keep it concise and punchy)

=== OUTPUT FORMAT (JSON ONLY, NO MARKDOWN) ===
{
  "title": "Clear, specific title without emojis or hype (50-60 characters)",
  "slug": "url-friendly-slug-from-title",
  "excerpt": "Engaging 150-160 character summary that hooks readers and includes primary keyword",
  "content": "Full blog post in HTML format with proper structure as specified above. MUST include properly formatted FAQ section and CTA section.",
  "tags": ["5-8 relevant tags", "irrigation", "kenya", "farming", "drip-systems"],
  "seo_title": "SEO-optimized title with primary keyword (55-60 characters)",
  "seo_description": "Meta description with keywords and value proposition (150-160 characters)",
  "reading_time": 5
}

Generate plain, useful content that sounds like advice from an experienced irrigation technician. Avoid phrases such as "revolutionize", "transform", "cutting-edge", "game-changing", "unlock", "empower", "bountiful harvests", and "comprehensive". Do not use emojis in the title. Focus on practical solutions and actionable advice.`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
            }),
        }
    )

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to generate content')
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
        throw new Error('No content generated')
    }

    // Parse JSON response
    const cleanJson = generatedText.replace(/```json\n?|\n?```/g, '').trim()
    const blogData = JSON.parse(cleanJson)

    return blogData
}

// Sync blog post to Cloudflare D1
async function syncToCloudflareD1(post: any) {
    const workerUrl = Deno.env.get('CLOUDFLARE_WORKER_URL') || 'https://dripstech-api.YOUR_SUBDOMAIN.workers.dev'

    try {
        const response = await fetch(`${workerUrl}/api/sync/blog_posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([post])
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`D1 sync failed: ${error}`)
        }

        return await response.json()
    } catch (error) {
        console.error('D1 sync error:', error)
        throw error
    }
}

// Send email notification using Resend
async function sendEmailNotification(post: any, toEmail: string, topic: string) {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey || !toEmail) return

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'DripTech Blog <info@dripstech.co.ke>',
                to: [toEmail],
                subject: `🎯 New Blog Post Generated: ${post.title}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #16a34a;">New Content Generated 🌿</h1>
                        <p>The SEO Content Engine has just created a new draft.</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h2 style="margin-top: 0;">${post.title}</h2>
                            <p><strong>Topic:</strong> ${topic}</p>
                            <p><strong>Excerpt:</strong> ${post.excerpt}</p>
                            <p><strong>Status:</strong> Ready for Review</p>
                        </div>
                        
                        <a href="https://dripstech.co.ke/admin/blog" 
                           style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                           Review and Publish Now
                        </a>
                    </div>
                `
            })
        })

        if (!response.ok) {
            console.error('Failed to send email:', await response.text())
        } else {
            console.log(`Email notification sent to ${toEmail}`)
        }
    } catch (error) {
        console.error('Email sending error:', error)
    }
}
