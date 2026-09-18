import { supabase } from "@/integrations/supabase/client";

interface EmailConfig {
    from_email?: string;
    from_name?: string;
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
    api_key?: string;
    provider?: "smtp" | "resend" | "sendgrid" | "mailgun";
}

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from_email?: string;
    from_name?: string;
}

class EmailService {
    private config: EmailConfig = {
        from_email: "info@dripstech.co.ke",
        from_name: "DripTech EcoFlow",
        provider: "smtp", // Default to SMTP
    };

    /**
     * Send welcome email to new subscriber
     */
    async sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
        try {
            // Get welcome email template
            const { data: template, error: templateError } = await supabase
                .from("email_templates")
                .select("*")
                .eq("template_type", "welcome")
                .eq("is_active", true)
                .single();

            if (templateError || !template) {
                console.error("Welcome template not found:", templateError);
                return false;
            }

            // Replace placeholders
            let htmlContent = template.html_content;
            let textContent = template.text_content || "";

            if (name) {
                htmlContent = htmlContent.replace(/{{name}}/g, name);
                textContent = textContent.replace(/{{name}}/g, name);
            }

            // Add unsubscribe URL
            const unsubscribeUrl = `${window.location.origin}/unsubscribe?email=${encodeURIComponent(email)}`;
            htmlContent = htmlContent.replace(/{{unsubscribe_url}}/g, unsubscribeUrl);
            textContent = textContent.replace(/{{unsubscribe_url}}/g, unsubscribeUrl);

            // Send email
            const sent = await this.sendEmail({
                to: email,
                subject: template.subject,
                html: htmlContent,
                text: textContent,
            });

            // Log the email
            if (sent) {
                await supabase.from("email_logs").insert({
                    email,
                    subject: template.subject,
                    status: "sent",
                    sent_at: new Date().toISOString(),
                    metadata: {
                        template_id: template.id,
                        template_type: "welcome",
                    },
                });
            }

            return sent;
        } catch (error) {
            console.error("Error sending welcome email:", error);
            return false;
        }
    }

    /**
     * Send newsletter campaign to all active subscribers
     */
    async sendNewsletter(
        subject: string,
        content: string,
        htmlContent?: string
    ): Promise<{ success: boolean; campaignId?: string; error?: string }> {
        try {
            // Create campaign
            const { data: campaign, error: campaignError } = await supabase
                .from("email_campaigns")
                .insert({
                    name: subject,
                    subject,
                    content,
                    html_content: htmlContent || this.generateHTMLFromText(content),
                    status: "sending",
                })
                .select()
                .single();

            if (campaignError || !campaign) {
                return { success: false, error: "Failed to create campaign" };
            }

            // Get all active subscribers
            const { data: subscribers, error: subscribersError } = await supabase
                .from("newsletter_subscribers")
                .select("id, email, name")
                .eq("status", "active");

            if (subscribersError || !subscribers) {
                return { success: false, error: "Failed to fetch subscribers" };
            }

            // Update campaign with recipient count
            await supabase
                .from("email_campaigns")
                .update({ total_recipients: subscribers.length })
                .eq("id", campaign.id);

            // Send emails to all subscribers
            let sentCount = 0;
            let failedCount = 0;

            for (const subscriber of subscribers) {
                try {
                    const sent = await this.sendEmail({
                        to: subscriber.email,
                        subject,
                        html: htmlContent || this.generateHTMLFromText(content),
                        text: content,
                    });

                    if (sent) {
                        sentCount++;
                        await supabase.from("email_logs").insert({
                            campaign_id: campaign.id,
                            subscriber_id: subscriber.id,
                            email: subscriber.email,
                            subject,
                            status: "sent",
                            sent_at: new Date().toISOString(),
                        });

                        // Update subscriber email count directly
                        await supabase
                            .from("newsletter_subscribers")
                            .update({
                                email_count: subscriber.email_count + 1,
                                last_email_sent_at: new Date().toISOString(),
                            })
                            .eq("id", subscriber.id);
                    } else {
                        failedCount++;
                        await supabase.from("email_logs").insert({
                            campaign_id: campaign.id,
                            subscriber_id: subscriber.id,
                            email: subscriber.email,
                            subject,
                            status: "failed",
                            failed_at: new Date().toISOString(),
                            error_message: "Failed to send email",
                        });
                    }
                } catch (error) {
                    failedCount++;
                    console.error(`Failed to send to ${subscriber.email}:`, error);
                }
            }

            // Update campaign status
            await supabase
                .from("email_campaigns")
                .update({
                    status: "sent",
                    sent_at: new Date().toISOString(),
                    total_sent: sentCount,
                    total_failed: failedCount,
                })
                .eq("id", campaign.id);

            return {
                success: true,
                campaignId: campaign.id,
            };
        } catch (error) {
            console.error("Error sending newsletter:", error);
            return { success: false, error: "Unexpected error occurred" };
        }
    }

    /**
     * Send email using configured provider
     */
    private async sendEmail(params: SendEmailParams): Promise<boolean> {
        const { to, subject, html, text, from_email, from_name } = params;

        try {
            // For now, we'll use a simple approach
            // In production, you would integrate with an actual email service

            // Option 1: Use Resend (recommended)
            if (this.config.provider === "resend" && this.config.api_key) {
                return await this.sendViaResend(params);
            }

            // Option 2: Use SendGrid
            if (this.config.provider === "sendgrid" && this.config.api_key) {
                return await this.sendViaSendGrid(params);
            }

            // Option 3: Use Mailgun
            if (this.config.provider === "mailgun" && this.config.api_key) {
                return await this.sendViaMailgun(params);
            }

            // Fallback: Log to console (development mode)
            console.log("📧 Email would be sent:", {
                to,
                from: `${from_name || this.config.from_name} <${from_email || this.config.from_email}>`,
                subject,
                html: html.substring(0, 100) + "...",
            });

            // In development, return true to simulate success
            return true;
        } catch (error) {
            console.error("Error sending email:", error);
            return false;
        }
    }

    /**
     * Send email via Resend
     */
    private async sendViaResend(params: SendEmailParams): Promise<boolean> {
        try {
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.config.api_key}`,
                },
                body: JSON.stringify({
                    from: `${params.from_name || this.config.from_name} <${params.from_email || this.config.from_email}>`,
                    to: params.to,
                    subject: params.subject,
                    html: params.html,
                    text: params.text,
                }),
            });

            return response.ok;
        } catch (error) {
            console.error("Resend error:", error);
            return false;
        }
    }

    /**
     * Send email via SendGrid
     */
    private async sendViaSendGrid(params: SendEmailParams): Promise<boolean> {
        try {
            const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.config.api_key}`,
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: params.to }] }],
                    from: {
                        email: params.from_email || this.config.from_email,
                        name: params.from_name || this.config.from_name,
                    },
                    subject: params.subject,
                    content: [
                        { type: "text/html", value: params.html },
                        { type: "text/plain", value: params.text || "" },
                    ],
                }),
            });

            return response.ok;
        } catch (error) {
            console.error("SendGrid error:", error);
            return false;
        }
    }

    /**
     * Send email via Mailgun
     */
    private async sendViaMailgun(params: SendEmailParams): Promise<boolean> {
        try {
            const formData = new FormData();
            formData.append(
                "from",
                `${params.from_name || this.config.from_name} <${params.from_email || this.config.from_email}>`
            );
            formData.append("to", params.to);
            formData.append("subject", params.subject);
            formData.append("html", params.html);
            if (params.text) formData.append("text", params.text);

            const response = await fetch(
                `https://api.mailgun.net/v3/${this.config.smtp_host}/messages`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Basic ${btoa(`api:${this.config.api_key}`)}`,
                    },
                    body: formData,
                }
            );

            return response.ok;
        } catch (error) {
            console.error("Mailgun error:", error);
            return false;
        }
    }

    /**
     * Generate HTML from plain text
     */
    private generateHTMLFromText(text: string): string {
        const paragraphs = text
            .split("\n\n")
            .map((p) => `<p style="margin-bottom: 15px;">${p.replace(/\n/g, "<br>")}</p>`)
            .join("");

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 40px;">
          <tr>
            <td>
              <div style="color: #333333; line-height: 1.6;">
                ${paragraphs}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 30px; border-top: 1px solid #eeeeee; margin-top: 30px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                DripTech EcoFlow | Nairobi, Kenya | info@dripstech.co.ke
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
    }

    /**
     * Configure email service
     */
    setConfig(config: Partial<EmailConfig>) {
        this.config = { ...this.config, ...config };
    }
}

// Export singleton instance
export const emailService = new EmailService();
