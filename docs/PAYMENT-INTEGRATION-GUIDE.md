# Payment Integration Setup Guide

## 🎯 Quick Start - One-Click Configuration

Your payment integration system is now ready! Here's how to configure it:

### 📍 Access the Payment Dashboard

1. **Navigate to Admin Panel**
   - Go to: `/admin/payment-integrations`
   - Or use the admin sidebar menu

2. **Click "Quick Setup" Button**
   - Located in the top-right corner
   - Opens the configuration wizard

---

## 💳 M-Pesa Integration Setup

### Step 1: Get Your Credentials

1. **Visit Safaricom Developer Portal**
   - URL: https://developer.safaricom.co.ke
   - Create an account if you don't have one
   - Create a new app

2. **Get Your Credentials:**
   - Consumer Key
   - Consumer Secret
   - Pass Key (for Lipa Na M-Pesa Online)
   - Business Short Code (Paybill or Till Number)

### Step 2: Configure in Admin

1. Click **"Quick Setup"** → Select **"M-Pesa"**

2. Fill in the form:
   ```
   Business Name: DripTech EcoFlow
   Environment: Sandbox (for testing) or Production (for live)
   Consumer Key: [Your key from Safaricom]
   Consumer Secret: [Your secret from Safaricom]
   Account Type: Paybill or Till
   Paybill/Till Number: [Your number]
   Pass Key: [Your pass key]
   Callback URL: https://driptech-eco-flow-web.vercel.app/api/mpesa/callback
   ```

3. Click **"Save M-Pesa Configuration"**

### Step 3: Test the Integration

1. Go to the **"M-Pesa Integration"** page in admin
2. Navigate to the **"Testing"** tab
3. Click **"Test Payment (KES 100)"**
4. Check if the test transaction appears in the transactions list

---

## 🏦 Bank Integration Setup

### Supported Banks (Pre-configured)

1. **Equity Bank**
   - SWIFT: EQBLKENA
   
2. **KCB Bank**
   - SWIFT: KCBLKENX
   
3. **Cooperative Bank**
   - SWIFT: KCOOKENX

### Step 1: Configure Bank Accounts

1. Click **"Quick Setup"** → Select **"Bank Transfer"**

2. For each bank you want to enable:
   - **Toggle the switch** to enable
   - Enter **Account Number**
   - Verify **Account Name** (pre-filled: DripTech EcoFlow Ltd)
   - Enter **Branch Code**
   - Verify **SWIFT Code** (pre-filled)

3. Click **"Save Bank Configurations"**

### Step 2: How Bank Payments Work

**Manual Verification Process:**
1. Customer makes bank transfer to your account
2. Customer sends proof of payment (screenshot/reference)
3. Admin verifies the transaction in bank statement
4. Admin manually marks transaction as "completed" in the system

**Future Enhancement (Optional):**
- Banks like Equity and KCB offer API access
- Contact your bank for API credentials
- Add API Key and Secret in the configuration
- Enable automatic transaction verification

---

## 📊 Managing Transactions

### View All Transactions

1. Go to **"Payment Integrations"** page
2. Click **"All Transactions"** tab
3. See all payments from M-Pesa and Banks

### Export Transactions

1. Click the **"Export"** button
2. Downloads CSV file with:
   - Transaction ID
   - Payment Method
   - Amount
   - Status
   - Date

### Filter by Payment Method

- **M-Pesa Tab**: View only M-Pesa transactions
- **Banks Tab**: View only bank transfers
- **Overview Tab**: See summary statistics

---

## 🔧 Advanced Configuration

### M-Pesa Sandbox vs Production

**Sandbox (Testing):**
- Use for development and testing
- Test Paybill: 174379
- No real money involved
- Test phone numbers work

**Production (Live):**
- Use for real customer payments
- Your actual Paybill/Till number
- Real money transactions
- Requires approved Safaricom account

### Callback URL Setup

**Important:** Your callback URL must be:
- Publicly accessible (HTTPS)
- Able to receive POST requests
- Configured in Safaricom Developer Portal

**Current URL:**
```
https://driptech-eco-flow-web.vercel.app/api/mpesa/callback
```

**To Change:**
1. Update in M-Pesa configuration
2. Update in Safaricom Developer Portal
3. Ensure your backend handles the callback

---

## 🚀 Integration Checklist

### M-Pesa Setup ✓
- [ ] Created Safaricom Developer account
- [ ] Created app and got credentials
- [ ] Configured M-Pesa in admin panel
- [ ] Tested with sandbox
- [ ] Switched to production (when ready)
- [ ] Verified callback URL is working

### Bank Setup ✓
- [ ] Enabled required banks
- [ ] Added account numbers
- [ ] Verified branch codes
- [ ] Tested manual transaction flow
- [ ] (Optional) Requested API access from bank

### Testing ✓
- [ ] Test M-Pesa payment works
- [ ] Test bank transfer recording
- [ ] Export transactions CSV
- [ ] Verify transaction statuses
- [ ] Check dashboard statistics

---

## 📱 Customer Payment Flow

### M-Pesa Payment
1. Customer selects M-Pesa payment
2. Enters phone number and amount
3. Receives STK push on phone
4. Enters M-Pesa PIN
5. Payment confirmed automatically
6. Transaction appears in admin dashboard

### Bank Transfer Payment
1. Customer selects bank transfer
2. Sees bank account details
3. Makes transfer via mobile/internet banking
4. Sends proof of payment
5. Admin verifies and confirms
6. Transaction marked as completed

---

## 🛠️ Troubleshooting

### M-Pesa Issues

**Problem:** "Invalid credentials"
- **Solution:** Verify Consumer Key and Secret are correct
- Check if you're using sandbox/production credentials correctly

**Problem:** "Callback not received"
- **Solution:** Ensure callback URL is publicly accessible
- Check Safaricom Developer Portal configuration
- Verify HTTPS is enabled

**Problem:** "Transaction stuck in pending"
- **Solution:** Check M-Pesa transaction status manually
- Verify callback URL is receiving requests
- Check server logs for errors

### Bank Issues

**Problem:** "Can't find transaction"
- **Solution:** Ensure customer sent correct reference number
- Check bank statement for the transaction
- Verify account number is correct

**Problem:** "Wrong amount received"
- **Solution:** Check bank charges/fees
- Verify customer sent correct amount
- Contact customer for clarification

---

## 📞 Support Resources

### Safaricom M-Pesa
- Developer Portal: https://developer.safaricom.co.ke
- Documentation: https://developer.safaricom.co.ke/docs
- Support Email: apisupport@safaricom.co.ke

### Banks
- **Equity Bank:** https://equitybankgroup.com
- **KCB Bank:** https://ke.kcbgroup.com
- **Co-operative Bank:** https://www.co-opbank.co.ke

---

## 🎉 You're All Set!

Your payment integration system is now configured and ready to accept payments via:
- ✅ M-Pesa (Mobile Money)
- ✅ Bank Transfers (Equity, KCB, Co-op)
- ✅ Transaction tracking and reporting
- ✅ Export capabilities

**Next Steps:**
1. Test with small amounts first
2. Monitor transactions daily
3. Keep credentials secure
4. Regular backups of transaction data

---

## 🔐 Security Best Practices

1. **Never share credentials** in plain text
2. **Use environment variables** for sensitive data
3. **Enable 2FA** on Safaricom Developer account
4. **Regular password changes** for bank accounts
5. **Monitor transactions** for suspicious activity
6. **Backup data** regularly
7. **Use HTTPS** for all payment pages

---

Need help? Contact your system administrator or refer to the documentation above.
