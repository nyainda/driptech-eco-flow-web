import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { bookingId, action } = await req.json()

        // Fetch booking details
        const { data: booking, error: bookingError } = await supabaseClient
            .from('service_bookings')
            .select(`
        *,
        service_categories(name),
        technicians(full_name, phone, email)
      `)
            .eq('id', bookingId)
            .single()

        if (bookingError || !booking) {
            throw new Error('Booking not found')
        }

        let emailSubject = ''
        let emailBody = ''
        let smsMessage = ''

        switch (action) {
            case 'booking_created':
                emailSubject = `Booking Confirmation - ${booking.booking_number}`
                emailBody = `
          <h2>Thank you for booking with DripTech!</h2>
          <p>Dear ${booking.customer_name},</p>
          <p>Your service booking has been received successfully.</p>
          
          <h3>Booking Details:</h3>
          <ul>
            <li><strong>Booking Number:</strong> ${booking.booking_number}</li>
            <li><strong>Service:</strong> ${booking.service_categories?.name || booking.service_type}</li>
            <li><strong>Location:</strong> ${booking.location_address}</li>
            <li><strong>Preferred Date:</strong> ${booking.preferred_date || 'To be scheduled'}</li>
            <li><strong>Status:</strong> ${booking.status}</li>
          </ul>
          
          <p>Our team will contact you within 2 hours to confirm your appointment.</p>
          
          <p>For any questions, please contact us:</p>
          <ul>
            <li>Phone: 0794 494 515</li>
            <li>Email: info@driptech.co.ke</li>
          </ul>
          
          <p>Best regards,<br>DripTech Team</p>
        `
                smsMessage = `DripTech: Your booking ${booking.booking_number} has been received. We'll contact you within 2 hours. Call 0757716018 for urgent matters.`
                break

            case 'technician_assigned':
                if (!booking.technicians) {
                    throw new Error('No technician assigned')
                }

                emailSubject = `Technician Assigned - ${booking.booking_number}`
                emailBody = `
          <h2>Technician Assigned to Your Booking</h2>
          <p>Dear ${booking.customer_name},</p>
          <p>Great news! A technician has been assigned to your service request.</p>
          
          <h3>Technician Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${booking.technicians.full_name}</li>
            <li><strong>Phone:</strong> ${booking.technicians.phone}</li>
          </ul>
          
          <h3>Booking Details:</h3>
          <ul>
            <li><strong>Booking Number:</strong> ${booking.booking_number}</li>
            <li><strong>Service:</strong> ${booking.service_categories?.name || booking.service_type}</li>
            <li><strong>Scheduled Date:</strong> ${booking.scheduled_date || booking.preferred_date}</li>
          </ul>
          
          <p>The technician will contact you to confirm the appointment details.</p>
          
          <p>Best regards,<br>DripTech Team</p>
        `
                smsMessage = `DripTech: Technician ${booking.technicians.full_name} (${booking.technicians.phone}) has been assigned to your booking ${booking.booking_number}.`

                // Send WhatsApp notification to technician
                await sendWhatsAppNotification(
                    booking.technicians.phone,
                    `New Service Assignment!\n\nBooking: ${booking.booking_number}\nCustomer: ${booking.customer_name}\nPhone: ${booking.customer_phone}\nLocation: ${booking.location_address}\nService: ${booking.service_categories?.name || booking.service_type}\n\nPlease contact the customer to confirm the appointment.`
                )
                break

            case 'booking_confirmed':
                emailSubject = `Booking Confirmed - ${booking.booking_number}`
                emailBody = `
          <h2>Your Booking is Confirmed!</h2>
          <p>Dear ${booking.customer_name},</p>
          <p>Your service booking has been confirmed.</p>
          
          <h3>Confirmed Details:</h3>
          <ul>
            <li><strong>Booking Number:</strong> ${booking.booking_number}</li>
            <li><strong>Service:</strong> ${booking.service_categories?.name || booking.service_type}</li>
            <li><strong>Date:</strong> ${booking.scheduled_date || booking.preferred_date}</li>
            <li><strong>Location:</strong> ${booking.location_address}</li>
          </ul>
          
          ${booking.technicians ? `
            <h3>Your Technician:</h3>
            <ul>
              <li><strong>Name:</strong> ${booking.technicians.full_name}</li>
              <li><strong>Phone:</strong> ${booking.technicians.phone}</li>
            </ul>
          ` : ''}
          
          <p>Please ensure someone is available at the location during the scheduled time.</p>
          
          <p>Best regards,<br>DripTech Team</p>
        `
                smsMessage = `DripTech: Your booking ${booking.booking_number} is confirmed for ${booking.scheduled_date || booking.preferred_date}. See you soon!`
                break

            case 'booking_completed':
                emailSubject = `Service Completed - ${booking.booking_number}`
                emailBody = `
          <h2>Thank You for Choosing DripTech!</h2>
          <p>Dear ${booking.customer_name},</p>
          <p>Your service has been completed successfully.</p>
          
          <h3>Service Summary:</h3>
          <ul>
            <li><strong>Booking Number:</strong> ${booking.booking_number}</li>
            <li><strong>Service:</strong> ${booking.service_categories?.name || booking.service_type}</li>
            <li><strong>Completed On:</strong> ${new Date(booking.completed_at).toLocaleDateString()}</li>
          </ul>
          
          <p>We'd love to hear about your experience! Please take a moment to rate our service.</p>
          
          <p><a href="https://driptech.co.ke/technician-services" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Leave a Review</a></p>
          
          <p>Thank you for trusting DripTech with your irrigation needs!</p>
          
          <p>Best regards,<br>DripTech Team</p>
        `
                smsMessage = `DripTech: Thank you! Your service (${booking.booking_number}) is complete. Please rate your experience at driptech.co.ke`
                break
        }

        // Send email notification
        if (emailSubject && emailBody) {
            await sendEmailNotification(booking.customer_email, emailSubject, emailBody)
        }

        // Send SMS notification
        if (smsMessage && booking.customer_phone) {
            await sendSMSNotification(booking.customer_phone, smsMessage)
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Notifications sent successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error sending notifications:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})

async function sendEmailNotification(to: string, subject: string, html: string) {
    // TODO: Integrate with your email service (e.g., SendGrid, Resend, etc.)
    // For now, we'll log it
    console.log('Email notification:', { to, subject })

    // Example with Resend (you'll need to add RESEND_API_KEY to your secrets)
    // const resendApiKey = Deno.env.get('RESEND_API_KEY')
    // if (resendApiKey) {
    //   await fetch('https://api.resend.com/emails', {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${resendApiKey}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       from: 'DripTech <notifications@driptech.co.ke>',
    //       to: [to],
    //       subject: subject,
    //       html: html,
    //     }),
    //   })
    // }
}

async function sendSMSNotification(to: string, message: string) {
    // TODO: Integrate with SMS service (e.g., Africa's Talking, Twilio)
    console.log('SMS notification:', { to, message })

    // Example with Africa's Talking
    // const apiKey = Deno.env.get('AFRICASTALKING_API_KEY')
    // const username = Deno.env.get('AFRICASTALKING_USERNAME')
    // if (apiKey && username) {
    //   await fetch('https://api.africastalking.com/version1/messaging', {
    //     method: 'POST',
    //     headers: {
    //       'apiKey': apiKey,
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //     },
    //     body: new URLSearchParams({
    //       username: username,
    //       to: to,
    //       message: message,
    //     }),
    //   })
    // }
}

async function sendWhatsAppNotification(to: string, message: string) {
    // TODO: Integrate with WhatsApp Business API
    console.log('WhatsApp notification:', { to, message })

    // You can use services like:
    // - Twilio WhatsApp API
    // - Africa's Talking WhatsApp
    // - Meta WhatsApp Business API
}
