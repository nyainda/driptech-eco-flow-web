import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-my-custom-header',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email } = await req.json()

        if (!email) {
            throw new Error('Email is required')
        }

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Save to Database
        const { data: existing } = await supabase
            .from('newsletter_subscribers')
            .select('id, status')
            .eq('email', email)
            .single()

        if (existing) {
            if (existing.status === 'active') {
                return new Response(
                    JSON.stringify({ message: 'Already subscribed' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            } else {
                // Reactivate
                await supabase
                    .from('newsletter_subscribers')
                    .update({ status: 'active', unsubscribed_at: null })
                    .eq('id', existing.id)
            }
        } else {
            // Create new
            const { error: insertError } = await supabase
                .from('newsletter_subscribers')
                .insert({ email, source: 'website' })

            if (insertError) throw insertError
        }

        // 2. Send Welcome Email via Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        console.log(`[Newsletter] Attempting to send email to ${email}. Has API Key: ${!!resendApiKey}`)

        if (resendApiKey) {
            const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'DripTech Team <info@dripstech.co.ke>',
                    to: [email],
                    subject: 'Welcome to DripTech Eco Flow! 🌿',
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h1 style="color: #16a34a;">Welcome to DripTech!</h1>
                            <p>Thank you for subscribing to our newsletter. We're excited to have you with us.</p>
                            <p>You'll now receive updates on:</p>
                            <ul>
                                <li>Latest irrigation technologies</li>
                                <li>Farming tips and best practices</li>
                                <li>Exclusive offers and product launches</li>
                            </ul>
                            <p>Stay tuned for our next update!</p>
                            <br>
                            <p style="color: #666; font-size: 12px;">
                                © ${new Date().getFullYear()} DripTech Eco Flow. All rights reserved.
                            </p>
                        </div>
                    `
                })
            })

            if (!emailResponse.ok) {
                const errorText = await emailResponse.text()
                console.error('[Newsletter] Resend API Error:', errorText)
            } else {
                console.log('[Newsletter] Email sent successfully')
            }
        } else {
            console.error('[Newsletter] Missing RESEND_API_KEY')
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Subscribed successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Subscription error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
