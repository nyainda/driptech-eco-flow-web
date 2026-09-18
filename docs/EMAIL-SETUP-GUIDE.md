# 📧 Email Setup Guide - Send Real Emails!

## 🔍 Current Status

Right now, your emails show "success" but **aren't actually being sent** because:
- ✅ System is in development mode
- ✅ Emails are logged to database
- ❌ **No email provider configured**
- ❌ Emails only simulated (console.log)

---

## 🚀 Solution: Configure Resend (Free & Easy)

### **Why Resend?**
- ✅ **100% FREE** for 3,000 emails/month
- ✅ Easy 5-minute setup
- ✅ Great deliverability
- ✅ Perfect for newsletters
- ✅ No credit card required

---

## 📋 Step-by-Step Setup

### **Step 1: Create Resend Account**

1. Go to **[resend.com](https://resend.com)**
2. Click **"Sign Up"** (top right)
3. Enter your email
4. Verify your email
5. You're in! 🎉

### **Step 2: Get API Key**

1. In Resend Dashboard, click **"API Keys"** (left sidebar)
2. Click **"Create API Key"**
3. Name: `DripTech Newsletter`
4. Permission: **"Sending access"**
5. Click **"Add"**
6. **COPY THE KEY** (starts with `re_...`)
   - ⚠️ Save it somewhere safe!
   - You won't see it again!

### **Step 3: Test Email Setup (Quick)**

For immediate testing, Resend provides a test domain:

**Test Configuration:**
- From Email: `onboarding@resend.dev`
- Limitation: Only sends to YOUR email
- Perfect for testing!

### **Step 4: Add to Your App**

Open your browser console and run this:

```javascript
// In browser console (F12)
import { emailService } from "./src/services/emailService";

emailService.setConfig({
  provider: "resend",
  api_key: "re_YOUR_API_KEY_HERE", // Replace with your actual key
  from_email: "onboarding@resend.dev",
  from_name: "DripTech EcoFlow"
});
```

**OR** create a config file:

**File:** `/src/config/emailConfig.ts`

```typescript
import { emailService } from "@/services/emailService";

// Initialize email service on app load
export function initializeEmailService() {
  emailService.setConfig({
    provider: "resend",
    api_key: "re_YOUR_API_KEY_HERE", // Replace with your key
    from_email: "onboarding@resend.dev", // For testing
    from_name: "DripTech EcoFlow"
  });
}
```

Then import in your `main.tsx`:

```typescript
import { initializeEmailService } from "@/config/emailConfig";

// Initialize email service
initializeEmailService();
```

### **Step 5: Test It!**

1. Go to your website footer
2. Subscribe with YOUR email
3. Check your inbox! 📧
4. You should receive the welcome email!

---

## 🏢 Production Setup (Use Your Domain)

### **Step 1: Verify Your Domain**

1. In Resend Dashboard, click **"Domains"**
2. Click **"Add Domain"**
3. Enter: `dripstech.co.ke`
4. Resend will show DNS records to add

### **Step 2: Add DNS Records**

Add these records to your domain DNS (where you bought the domain):

**Example DNS Records:**
```
Type: TXT
Name: resend._domainkey
Value: [Resend will provide this]

Type: MX
Name: @
Value: feedback-smtp.resend.com
Priority: 10
```

### **Step 3: Wait for Verification**

- Usually takes 5-10 minutes
- Resend will email you when verified
- Check status in Resend dashboard

### **Step 4: Update Configuration**

Once verified, update your config:

```typescript
emailService.setConfig({
  provider: "resend",
  api_key: "re_YOUR_API_KEY_HERE",
  from_email: "info@dripstech.co.ke", // Now you can use your domain!
  from_name: "DripTech EcoFlow"
});
```

---

## 🎯 Quick Test Commands

### **Test Welcome Email:**

```typescript
// In browser console
import { emailService } from "./src/services/emailService";

// Send test welcome email
await emailService.sendWelcomeEmail("your-email@example.com");
```

### **Test Newsletter:**

```typescript
// In browser console
import { emailService } from "./src/services/emailService";

// Send test newsletter
await emailService.sendNewsletter(
  "Test Newsletter",
  "This is a test newsletter content.\n\nIt works!"
);
```

---

## 📊 Check Email Logs

### **In Resend Dashboard:**
1. Click **"Emails"** (left sidebar)
2. See all sent emails
3. Check delivery status
4. View email content

### **In Your Database:**
1. Go to Supabase
2. Open `email_logs` table
3. See all email attempts
4. Check status and errors

---

## 🔧 Alternative: Use SendGrid

If you prefer SendGrid:

### **Setup:**
1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up (free tier: 100 emails/day)
3. Get API key
4. Configure:

```typescript
emailService.setConfig({
  provider: "sendgrid",
  api_key: "SG.YOUR_API_KEY_HERE",
  from_email: "info@dripstech.co.ke",
  from_name: "DripTech EcoFlow"
});
```

---

## 🔧 Alternative: Use Mailgun

If you prefer Mailgun:

### **Setup:**
1. Go to [mailgun.com](https://mailgun.com)
2. Sign up (free tier: 5,000 emails/month)
3. Verify domain
4. Get API key
5. Configure:

```typescript
emailService.setConfig({
  provider: "mailgun",
  api_key: "YOUR_API_KEY_HERE",
  smtp_host: "mg.dripstech.co.ke",
  from_email: "info@dripstech.co.ke",
  from_name: "DripTech EcoFlow"
});
```

---

## 🚨 Troubleshooting

### **Emails still not sending?**

**Check 1: API Key**
```javascript
// In console
console.log(emailService.config);
// Should show your API key
```

**Check 2: Provider**
```javascript
// Should be "resend", not "smtp"
console.log(emailService.config.provider);
```

**Check 3: Browser Console**
- Open DevTools (F12)
- Check Console tab
- Look for email-related logs
- Should see "📧 Email would be sent" or actual API calls

**Check 4: Network Tab**
- Open DevTools (F12)
- Go to Network tab
- Subscribe to newsletter
- Look for request to `api.resend.com`
- Check response

### **Emails going to spam?**

1. **Verify domain** (production only)
2. **Add SPF record** (Resend provides)
3. **Add DKIM record** (Resend provides)
4. **Warm up domain** (send gradually)
5. **Avoid spam words** in subject/content

### **"From" email not working?**

- **Testing:** Use `onboarding@resend.dev`
- **Production:** Verify your domain first
- **Can't use:** Random emails (must own domain)

---

## 📝 Environment Variables (Recommended)

For security, use environment variables:

**File:** `.env.local`

```env
VITE_EMAIL_PROVIDER=resend
VITE_EMAIL_API_KEY=re_YOUR_API_KEY_HERE
VITE_EMAIL_FROM=info@dripstech.co.ke
VITE_EMAIL_FROM_NAME=DripTech EcoFlow
```

**File:** `/src/config/emailConfig.ts`

```typescript
import { emailService } from "@/services/emailService";

export function initializeEmailService() {
  emailService.setConfig({
    provider: import.meta.env.VITE_EMAIL_PROVIDER || "smtp",
    api_key: import.meta.env.VITE_EMAIL_API_KEY,
    from_email: import.meta.env.VITE_EMAIL_FROM || "info@dripstech.co.ke",
    from_name: import.meta.env.VITE_EMAIL_FROM_NAME || "DripTech EcoFlow"
  });
}
```

---

## ✅ Verification Checklist

- [ ] Resend account created
- [ ] API key obtained
- [ ] Configuration added to app
- [ ] Test email sent successfully
- [ ] Email received in inbox
- [ ] Welcome email works
- [ ] Newsletter campaign works
- [ ] (Optional) Domain verified for production

---

## 🎉 Summary

### **For Testing (Right Now):**

1. **Sign up:** [resend.com](https://resend.com)
2. **Get API key:** Copy from dashboard
3. **Configure:** Add to your app
4. **Test:** Subscribe and check email!

### **For Production (Later):**

1. **Verify domain:** Add DNS records
2. **Update config:** Use `info@dripstech.co.ke`
3. **Go live:** Send to all subscribers!

---

## 📞 Quick Start Command

Run this in your browser console after getting API key:

```javascript
// Replace with your actual API key
const API_KEY = "re_YOUR_KEY_HERE";

// Configure email service
import("./src/services/emailService").then(({ emailService }) => {
  emailService.setConfig({
    provider: "resend",
    api_key: API_KEY,
    from_email: "onboarding@resend.dev",
    from_name: "DripTech EcoFlow"
  });
  
  console.log("✅ Email service configured!");
  console.log("Now try subscribing to the newsletter!");
});
```

---

**Get your Resend API key and start sending real emails!** 📧🚀

**Free tier:** 3,000 emails/month - Perfect for newsletters!
