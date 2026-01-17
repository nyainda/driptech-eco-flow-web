#!/bin/bash

# DripTech Deployment Script
# Usage: ./deploy.sh

echo "🚀 Starting Deployment Process..."

# 1. Deploy Cloudflare Worker
echo "----------------------------------------"
echo "📦 Deploying Cloudflare Worker..."
echo "----------------------------------------"
cd cloudflare-worker || exit
if npx wrangler deploy; then
    echo "✅ Cloudflare Worker Deployed Successfully!"
else
    echo "❌ Cloudflare Worker Deployment Failed"
    exit 1
fi
cd ..

# 2. Deploy Supabase Edge Functions
echo "----------------------------------------"
echo "⚡ Deploying Supabase Edge Functions..."
echo "----------------------------------------"
if npx supabase functions deploy generate-blog-posts newsletter-subscribe; then
    echo "✅ Edge Function Deployed Successfully!"
else
    echo "❌ Edge Function Deployment Failed"
    exit 1
fi

echo "----------------------------------------"
echo "🎉 All Deployments Complete!"
echo "----------------------------------------"
