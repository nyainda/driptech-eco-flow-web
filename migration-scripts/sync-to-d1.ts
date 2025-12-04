/**
 * DripTech Data Sync Script
 * Syncs data from Supabase to Cloudflare D1
 * 
 * Usage:
 *   npm run sync
 *   npm run sync -- --table products
 *   npm run sync -- --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.cloudflare' });

// Configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8787';
const D1_DATABASE_ID = process.env.D1_DATABASE_ID!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !D1_DATABASE_ID) {
    console.error('❌ Missing required environment variables.');
    console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_KEY (or VITE_SUPABASE_ANON_KEY), D1_DATABASE_ID');
    process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const specificTable = args.find(arg => arg.startsWith('--table='))?.split('=')[1];

// Tables to sync
const TABLES = [
    'products',
    'blog_posts',
    'videos',
    'projects',
    'success_stories',
    'news_articles',
    'irrigation_kits'
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface SyncStats {
    table: string;
    fetched: number;
    synced: number;
    errors: number;
    duration: number;
}

async function main() {
    console.log('========================================');
    console.log('DripTech Data Sync: Supabase → D1');
    console.log('========================================\n');

    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No data will be written\n');
    }

    const tablesToSync = specificTable ? [specificTable] : TABLES;
    const stats: SyncStats[] = [];

    for (const table of tablesToSync) {
        const stat = await syncTable(table);
        stats.push(stat);
    }

    // Print summary
    console.log('\n========================================');
    console.log('Sync Summary');
    console.log('========================================\n');

    const totalStats = {
        fetched: 0,
        synced: 0,
        errors: 0,
        duration: 0
    };

    stats.forEach(stat => {
        console.log(`${stat.table}:`);
        console.log(`  Fetched: ${stat.fetched}`);
        console.log(`  Synced: ${stat.synced}`);
        console.log(`  Errors: ${stat.errors}`);
        console.log(`  Duration: ${stat.duration}ms\n`);

        totalStats.fetched += stat.fetched;
        totalStats.synced += stat.synced;
        totalStats.errors += stat.errors;
        totalStats.duration += stat.duration;
    });

    console.log('Total:');
    console.log(`  Fetched: ${totalStats.fetched}`);
    console.log(`  Synced: ${totalStats.synced}`);
    console.log(`  Errors: ${totalStats.errors}`);
    console.log(`  Duration: ${totalStats.duration}ms`);

    if (totalStats.errors > 0) {
        console.log('\n⚠️  Some records failed to sync. Check logs above.');
        process.exit(1);
    } else {
        console.log('\n✅ All data synced successfully!');
    }
}

async function syncTable(tableName: string): Promise<SyncStats> {
    const startTime = Date.now();
    console.log(`\n📦 Syncing ${tableName}...`);

    const stats: SyncStats = {
        table: tableName,
        fetched: 0,
        synced: 0,
        errors: 0,
        duration: 0
    };

    try {
        // Fetch data from Supabase
        const { data, error } = await supabase
            .from(tableName)
            .select('*');

        if (error) {
            console.error(`❌ Error fetching ${tableName}:`, error.message);
            stats.errors++;
            stats.duration = Date.now() - startTime;
            return stats;
        }

        if (!data || data.length === 0) {
            console.log(`   ℹ️  No data found in ${tableName}`);
            stats.duration = Date.now() - startTime;
            return stats;
        }

        stats.fetched = data.length;
        console.log(`   Found ${data.length} records`);

        if (dryRun) {
            console.log(`   [DRY RUN] Would sync ${data.length} records`);
            stats.synced = data.length;
            stats.duration = Date.now() - startTime;
            return stats;
        }

        // Sync to D1 using wrangler
        for (const record of data) {
            try {
                await syncRecordToD1(tableName, record);
                stats.synced++;

                // Progress indicator
                if (stats.synced % 10 === 0) {
                    process.stdout.write(`\r   Synced ${stats.synced}/${stats.fetched}...`);
                }
            } catch (error: any) {
                console.error(`\n   ❌ Error syncing record ${record.id}:`, error.message);
                stats.errors++;
            }
        }

        console.log(`\r   ✅ Synced ${stats.synced}/${stats.fetched} records`);
    } catch (error: any) {
        console.error(`❌ Unexpected error syncing ${tableName}:`, error.message);
        stats.errors++;
    }

    stats.duration = Date.now() - startTime;
    return stats;
}

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

async function syncRecordToD1(table: string, record: any): Promise<void> {
    // Build SQL INSERT statement based on table
    const sql = buildInsertSQL(table, record);

    // Write SQL to temp file to avoid shell escaping issues
    const tempFile = join(process.cwd(), `temp_sync_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`);
    writeFileSync(tempFile, sql);

    // Execute using wrangler d1 execute
    // Use database name 'dripstech-products' and point to config
    const command = `npx wrangler d1 execute dripstech-products --config cloudflare-worker/wrangler.toml --remote --file "${tempFile}"`;

    try {
        execSync(command, { stdio: 'pipe' });
    } catch (error: any) {
        throw new Error(`D1 execution failed: ${error.message}`);
    } finally {
        try {
            unlinkSync(tempFile);
        } catch (e) {
            // Ignore cleanup error
        }
    }
}

function buildInsertSQL(table: string, record: any): string {
    switch (table) {
        case 'products':
            return buildProductsSQL(record);
        case 'blog_posts':
            return buildBlogPostsSQL(record);
        case 'videos':
            return buildVideosSQL(record);
        case 'projects':
            return buildProjectsSQL(record);
        case 'success_stories':
            return buildSuccessStoriesSQL(record);
        case 'news_articles':
            return buildNewsArticlesSQL(record);
        case 'irrigation_kits':
            return buildIrrigationKitsSQL(record);
        default:
            throw new Error(`Unknown table: ${table}`);
    }
}

function buildProductsSQL(record: any): string {
    const escape = (val: any) => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? '1' : '0';
        return val;
    };

    return `INSERT OR REPLACE INTO products (
    id, name, model_number, category, subcategory, description,
    technical_specs, price, images, brochure_url, installation_guide_url,
    maintenance_manual_url, video_url, in_stock, featured, features,
    applications, specifications, stock_quantity, is_featured,
    created_at, updated_at
  ) VALUES (
    ${escape(record.id)}, ${escape(record.name)}, ${escape(record.model_number)},
    ${escape(record.category)}, ${escape(record.subcategory)}, ${escape(record.description)},
    ${escape(record.technical_specs)}, ${escape(record.price)}, ${escape(record.images)},
    ${escape(record.brochure_url)}, ${escape(record.installation_guide_url)},
    ${escape(record.maintenance_manual_url)}, ${escape(record.video_url)},
    ${escape(record.in_stock)}, ${escape(record.featured)}, ${escape(record.features)},
    ${escape(record.applications)}, ${escape(record.specifications)},
    ${escape(record.stock_quantity)}, ${escape(record.is_featured)},
    ${escape(record.created_at)}, ${escape(record.updated_at)}
  )`;
}

function buildBlogPostsSQL(record: any): string {
    const escape = (val: any) => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? '1' : '0';
        return val;
    };

    return `INSERT OR REPLACE INTO blog_posts (
    id, title, slug, excerpt, content, featured_image, featured_image_url,
    category_id, tags, published, published_at, seo_title, seo_description,
    author_id, reading_time, views, created_at, updated_at
  ) VALUES (
    ${escape(record.id)}, ${escape(record.title)}, ${escape(record.slug)},
    ${escape(record.excerpt)}, ${escape(record.content)}, ${escape(record.featured_image)},
    ${escape(record.featured_image_url)}, ${escape(record.category_id)}, ${escape(record.tags)},
    ${escape(record.published)}, ${escape(record.published_at)}, ${escape(record.seo_title)},
    ${escape(record.seo_description)}, ${escape(record.author_id)}, ${escape(record.reading_time)},
    ${escape(record.views)}, ${escape(record.created_at)}, ${escape(record.updated_at)}
  )`;
}

function buildVideosSQL(record: any): string {
    const escape = (val: any) => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? '1' : '0';
        return val;
    };

    return `INSERT OR REPLACE INTO videos (
    id, title, description, video_url, thumbnail_url, category,
    tags, published, featured, views, duration, created_at, updated_at
  ) VALUES (
    ${escape(record.id)}, ${escape(record.title)}, ${escape(record.description)},
    ${escape(record.video_url)}, ${escape(record.thumbnail_url)}, ${escape(record.category)},
    ${escape(record.tags)}, ${escape(record.published)}, ${escape(record.featured)},
    ${escape(record.views)}, ${escape(record.duration)}, ${escape(record.created_at)},
    ${escape(record.updated_at)}
  )`;
}

function buildProjectsSQL(record: any): string {
    const escape = (val: any) => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? '1' : '0';
        return val;
    };

    return `INSERT OR REPLACE INTO projects (
    id, name, customer_id, quote_id, status, start_date, completion_date,
    location, project_type, area_covered, water_saved, yield_improvement,
    before_images, after_images, project_images, testimonial, featured,
    created_at, updated_at
  ) VALUES (
    ${escape(record.id)}, ${escape(record.name)}, ${escape(record.customer_id)},
    ${escape(record.quote_id)}, ${escape(record.status)}, ${escape(record.start_date)},
    ${escape(record.completion_date)}, ${escape(record.location)}, ${escape(record.project_type)},
    ${escape(record.area_covered)}, ${escape(record.water_saved)}, ${escape(record.yield_improvement)},
    ${escape(record.before_images)}, ${escape(record.after_images)}, ${escape(record.project_images)},
    ${escape(record.testimonial)}, ${escape(record.featured)}, ${escape(record.created_at)},
    ${escape(record.updated_at)}
  )`;
}

function buildSuccessStoriesSQL(record: any): string {
    const escape = (val: any) => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? '1' : '0';
        return val;
    };

    return `INSERT OR REPLACE INTO success_stories (
    id, title, description, client_name, client_company, image_url,
    before_image, after_image, results, featured, created_at, updated_at
  ) VALUES (
    ${escape(record.id)}, ${escape(record.title)}, ${escape(record.description)},
    ${escape(record.client_name)}, ${escape(record.client_company)}, ${escape(record.image_url)},
    ${escape(record.before_image)}, ${escape(record.after_image)}, ${escape(record.results)},
    ${escape(record.featured)}, ${escape(record.created_at)}, ${escape(record.updated_at)}
  )`;
}

function buildNewsArticlesSQL(record: any): string {
    const escape = (val: any) => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? '1' : '0';
        return val;
    };

    return `INSERT OR REPLACE INTO news_articles (
    id, title, slug, content, excerpt, featured_image, category,
    tags, published, published_at, author_id, views, created_at, updated_at
  ) VALUES (
    ${escape(record.id)}, ${escape(record.title)}, ${escape(record.slug)},
    ${escape(record.content)}, ${escape(record.excerpt)}, ${escape(record.featured_image)},
    ${escape(record.category)}, ${escape(record.tags)}, ${escape(record.published)},
    ${escape(record.published_at)}, ${escape(record.author_id)}, ${escape(record.views)},
    ${escape(record.created_at)}, ${escape(record.updated_at)}
  )`;
}

function buildIrrigationKitsSQL(record: any): string {
    const escape = (val: any) => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? '1' : '0';
        return val;
    };

    return `INSERT OR REPLACE INTO irrigation_kits (
    id, name, description, category, coverage_area, target_crop, components,
    price, in_stock, featured, maintenance_level, created_at, updated_at,
    active, images, installation_complexity, installation_time_hours,
    kit_type, recommended_crops, warranty_months, water_efficiency_percentage
  ) VALUES (
    ${escape(record.id)}, ${escape(record.name)}, ${escape(record.description)},
    ${escape(record.category)}, ${escape(record.coverage_area)}, ${escape(record.target_crop)},
    ${escape(record.components)}, ${escape(record.price)}, ${escape(record.in_stock)},
    ${escape(record.featured)}, ${escape(record.maintenance_level)}, ${escape(record.created_at)},
    ${escape(record.updated_at)}, ${escape(record.active)}, ${escape(record.images)},
    ${escape(record.installation_complexity)}, ${escape(record.installation_time_hours)},
    ${escape(record.kit_type)}, ${escape(record.recommended_crops)}, ${escape(record.warranty_months)},
    ${escape(record.water_efficiency_percentage)}
  )`;
}

// Run the sync
main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
