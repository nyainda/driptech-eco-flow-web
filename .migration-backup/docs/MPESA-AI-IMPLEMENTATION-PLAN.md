# Implementation Plan: M-Pesa + AI Product Research + Content Generation

## Overview

This document outlines the implementation of three major features:
1. **M-Pesa Payment Integration** - Accept payments via M-Pesa
2. **AI Product Research** - Analyze search trends and suggest products
3. **AI Content Generator** - Create 1000+ products and blogs efficiently

---

## 1. M-Pesa Integration

### Requirements
- M-Pesa Paybill Number (You have this ✅)
- Safaricom Daraja API credentials
- Consumer Key & Consumer Secret
- Passkey for Lipa Na M-Pesa Online

### Implementation Steps

#### A. Backend Setup (Supabase Edge Functions or Cloudflare Worker)

**Option 1: Cloudflare Worker** (Recommended - already using it)
```typescript
// cloudflare-worker/src/mpesa.ts
export async function initiateMpesaPayment(
    phoneNumber: string,
    amount: number,
    accountReference: string
) {
    // 1. Get OAuth token
    const token = await getMpesaToken();
    
    // 2. Initiate STK Push
    const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            BusinessShortCode: env.MPESA_SHORTCODE,
            Password: generatePassword(),
            Timestamp: getTimestamp(),
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: env.MPESA_SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: `${env.WORKER_URL}/api/mpesa/callback`,
            AccountReference: accountReference,
            TransactionDesc: 'DripTech Product Purchase'
        })
    });
    
    return await response.json();
}
```

#### B. Database Schema
```sql
-- M-Pesa Transactions Table (Already exists in your DB)
CREATE TABLE mpesa_transactions (
    id TEXT PRIMARY KEY,
    merchant_request_id TEXT UNIQUE,
    checkout_request_id TEXT UNIQUE,
    phone_number TEXT NOT NULL,
    amount REAL NOT NULL,
    account_reference TEXT,
    transaction_desc TEXT,
    mpesa_receipt_number TEXT,
    transaction_date TIMESTAMP,
    status TEXT DEFAULT 'pending', -- pending, success, failed, cancelled
    result_code TEXT,
    result_desc TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table (Link payments to orders)
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    mpesa_transaction_id TEXT REFERENCES mpesa_transactions(id),
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    items JSONB, -- Array of {product_id, quantity, price}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### C. Frontend Integration
```typescript
// src/services/mpesaService.ts
export async function initiatePayment(
    phoneNumber: string,
    amount: number,
    orderReference: string
) {
    const response = await fetch(`${WORKER_URL}/api/mpesa/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, amount, orderReference })
    });
    
    return await response.json();
}
```

---

## 2. AI Product Research System

### Goal
Analyze what products users are searching for and generate a list of product suggestions.

### Implementation

#### A. Track Search Queries
```typescript
// Add to existing visitor tracking
CREATE TABLE search_queries (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    category TEXT,
    results_count INTEGER,
    user_session_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_queries_query ON search_queries(query);
CREATE INDEX idx_search_queries_created_at ON search_queries(created_at);
```

#### B. AI Analysis Endpoint
```typescript
// cloudflare-worker/src/ai-research.ts
export async function analyzeSearchTrends() {
    // 1. Get top search queries (last 30 days)
    const queries = await db.prepare(`
        SELECT query, COUNT(*) as count
        FROM search_queries
        WHERE created_at > datetime('now', '-30 days')
        GROUP BY query
        ORDER BY count DESC
        LIMIT 50
    `).all();
    
    // 2. Use AI to analyze and suggest products
    const suggestions = await analyzeWithAI(queries);
    
    // 3. Save to database
    await saveSuggestions(suggestions);
    
    return suggestions;
}

async function analyzeWithAI(queries: any[]) {
    const prompt = `
    Analyze these search queries from an irrigation equipment website:
    ${JSON.stringify(queries)}
    
    Generate a list of 20 product suggestions that would satisfy these searches.
    For each product, provide:
    - Name
    - Category (drip_irrigation, sprinkler_systems, etc.)
    - Description
    - Estimated price range
    - Target crops/applications
    
    Format as JSON array.
    `;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
        })
    });
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}
```

#### C. Product Suggestions Table
```sql
CREATE TABLE ai_product_suggestions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    price_range TEXT,
    target_crops TEXT,
    search_volume INTEGER,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, created
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'ai'
);
```

#### D. Admin Dashboard Component
```typescript
// src/components/Admin/AIProductSuggestions.tsx
export default function AIProductSuggestions() {
    const [suggestions, setSuggestions] = useState([]);
    
    const analyzeTrends = async () => {
        const response = await fetch(`${WORKER_URL}/api/ai/analyze-trends`);
        const data = await response.json();
        setSuggestions(data);
    };
    
    const createProduct = async (suggestion) => {
        // Auto-populate product form with AI suggestion
        // Admin can review and approve
    };
    
    return (
        <div>
            <Button onClick={analyzeTrends}>Analyze Search Trends</Button>
            {suggestions.map(s => (
                <Card key={s.id}>
                    <h3>{s.name}</h3>
                    <p>{s.description}</p>
                    <Button onClick={() => createProduct(s)}>Create Product</Button>
                </Card>
            ))}
        </div>
    );
}
```

---

## 3. AI Content Generator (1000+ Products & Blogs)

### Goal
Generate high-quality products and blog posts at scale using AI.

### Implementation

#### A. Bulk Product Generator
```typescript
// src/components/Admin/BulkProductGenerator.tsx
export default function BulkProductGenerator() {
    const [category, setCategory] = useState('');
    const [count, setCount] = useState(10);
    
    const generateProducts = async () => {
        const prompt = `
        Generate ${count} unique irrigation products for category: ${category}.
        
        For each product, provide:
        - name: Professional product name
        - description: Detailed 2-3 paragraph description
        - price: Realistic price in KES
        - technical_specs: JSON object with specs
        - features: Array of key features
        - applications: Array of use cases
        - model_number: Unique model number
        
        Make them realistic and diverse. Format as JSON array.
        `;
        
        const response = await fetch(`${WORKER_URL}/api/ai/generate-products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, count, category })
        });
        
        const products = await response.json();
        
        // Bulk insert to Supabase
        await supabase.from('products').insert(products);
    };
    
    return (
        <Card>
            <h2>Bulk Product Generator</h2>
            <Select value={category} onValueChange={setCategory}>
                <SelectItem value="drip_irrigation">Drip Irrigation</SelectItem>
                <SelectItem value="sprinkler_systems">Sprinkler Systems</SelectItem>
                {/* ... */}
            </Select>
            <Input 
                type="number" 
                value={count} 
                onChange={(e) => setCount(Number(e.target.value))}
                placeholder="Number of products (max 100)"
            />
            <Button onClick={generateProducts}>Generate Products</Button>
        </Card>
    );
}
```

#### B. AI Blog Generator
```typescript
// src/components/Admin/AIBlogGenerator.tsx
export default function AIBlogGenerator() {
    const [topic, setTopic] = useState('');
    
    const generateBlog = async () => {
        const prompt = `
        Write a comprehensive blog post about: ${topic}
        
        Target audience: Farmers and agricultural professionals in Kenya
        Tone: Professional but accessible
        Length: 1500-2000 words
        
        Include:
        - SEO-optimized title
        - Meta description
        - Introduction
        - 5-7 main sections with headings
        - Practical tips and examples
        - Conclusion with call-to-action
        - 5 relevant tags
        
        Format as JSON with: title, slug, content (markdown), excerpt, seo_title, seo_description, tags
        `;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        const blog = JSON.parse(data.choices[0].message.content);
        
        // Save to Supabase
        await supabase.from('blog_posts').insert({
            ...blog,
            author_id: currentUser.id,
            published: false // Admin can review before publishing
        });
    };
    
    return (
        <Card>
            <h2>AI Blog Generator</h2>
            <Input 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Blog topic (e.g., 'Benefits of Drip Irrigation for Tomatoes')"
            />
            <Button onClick={generateBlog}>Generate Blog Post</Button>
        </Card>
    );
}
```

---

## Implementation Priority

### Phase 1: M-Pesa Integration (Week 1)
1. Set up Daraja API credentials
2. Create M-Pesa endpoints in Worker
3. Implement STK Push
4. Add callback handler
5. Create checkout UI
6. Test with sandbox

### Phase 2: AI Product Research (Week 2)
1. Add search tracking
2. Create AI analysis endpoint
3. Build admin suggestions dashboard
4. Test and refine prompts

### Phase 3: AI Content Generator (Week 3)
1. Build bulk product generator
2. Build blog generator
3. Add review/approval workflow
4. Generate initial 100 products
5. Scale to 1000+

---

## Cost Estimates

### OpenAI API Costs
- **GPT-4**: ~$0.03 per 1K tokens
- **1000 products**: ~$30-50 (with optimization)
- **100 blogs**: ~$50-100

### M-Pesa Costs
- Transaction fees: 1-3% per transaction
- No setup fees

---

## Next Steps

1. **Confirm M-Pesa credentials** - Do you have Consumer Key, Secret, and Passkey?
2. **OpenAI API Key** - Do you have an OpenAI API key?
3. **Priority** - Which feature should we implement first?

I recommend starting with **AI Product Research** since it will help you understand what products to create, then **AI Content Generator** to populate the database, and finally **M-Pesa** for payments.

What would you like to start with?
