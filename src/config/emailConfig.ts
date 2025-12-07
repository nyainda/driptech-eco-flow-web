// Email Configuration
// Add this to your app initialization or create a config file

import { emailService } from "@/services/emailService";

// Configure Resend
emailService.setConfig({
  provider: "resend",
  api_key: "re_YOUR_API_KEY_HERE", // Replace with your actual API key
  from_email: "onboarding@resend.dev", // Use this for testing, or "info@dripstech.co.ke" after domain verification
  from_name: "DripTech EcoFlow"
});

// For production with verified domain:
// emailService.setConfig({
//   provider: "resend",
//   api_key: "re_YOUR_API_KEY_HERE",
//   from_email: "info@dripstech.co.ke",
//   from_name: "DripTech EcoFlow"
// });
