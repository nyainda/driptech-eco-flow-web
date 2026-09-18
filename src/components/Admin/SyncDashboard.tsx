import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TABLES = [
    'products',
    'blog_posts',
    'videos',
    'projects',
    'success_stories',
    'news_articles',
    'irrigation_kits',
    'documents',
    'team'
];

const KNOWN_TABLES = [
    // Content Tables (Priority)
    'products',
    'blog_posts',
    'videos',
    'projects',
    'success_stories',
    'news_articles',
    'irrigation_kits',
    'documents',
    'team',

    // Other Tables
    'blog_categories',
    'variants',
    'kit_documents',
    'system_settings',
    'mpesa_transactions',
    'customers',
    'quotes',
    'invoices',
    'contact_submissions',
    'user_roles',
    'page_views',
    'visitor_sessions',
    'product_interactions',
    'notifications'
];

export default function SyncDashboard() {
    const [syncing, setSyncing] = useState<Record<string, boolean>>({});
    const [status, setStatus] = useState<Record<string, 'idle' | 'success' | 'error'>>({});
    const [messages, setMessages] = useState<Record<string, string>>({});
    const [selectedTable, setSelectedTable] = useState<string>("");

    const handleSync = async (table: string) => {
        setSyncing(prev => ({ ...prev, [table]: true }));
        setStatus(prev => ({ ...prev, [table]: 'idle' }));
        setMessages(prev => ({ ...prev, [table]: '' }));

        try {
            // 1. Fetch from Supabase
            const { data, error } = await supabase.from(table).select('*');
            if (error) throw error;

            if (!data || data.length === 0) {
                setMessages(prev => ({ ...prev, [table]: 'No data to sync' }));
                setStatus(prev => ({ ...prev, [table]: 'success' }));
                return;
            }

            // 2. Push to Cloudflare Worker
            const workerUrl = import.meta.env.VITE_WORKER_URL;
            const response = await fetch(`${workerUrl}/api/sync/${table}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Sync failed');
            }

            const result = await response.json();
            setMessages(prev => ({ ...prev, [table]: `Synced ${result.synced} records` }));
            setStatus(prev => ({ ...prev, [table]: 'success' }));

        } catch (error: any) {
            console.error(`Sync error for ${table}:`, error);
            setMessages(prev => ({ ...prev, [table]: error.message }));
            setStatus(prev => ({ ...prev, [table]: 'error' }));
        } finally {
            setSyncing(prev => ({ ...prev, [table]: false }));
        }
    };

    const handleSyncAll = async () => {
        for (const table of TABLES) {
            await handleSync(table);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Data Synchronization</h2>
                    <p className="text-sm text-muted-foreground">Manually sync data from Supabase to Cloudflare D1</p>
                </div>
                <Button onClick={handleSyncAll} disabled={Object.values(syncing).some(Boolean)} className="w-full sm:w-auto">
                    <RefreshCw className={`mr-2 h-4 w-4 ${Object.values(syncing).some(Boolean) ? 'animate-spin' : ''}`} />
                    Sync All Tables
                </Button>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {TABLES.map(table => (
                    <Card key={table}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium capitalize">
                                {table.replace('_', ' ')}
                            </CardTitle>
                            {status[table] === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {status[table] === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mt-2">
                                <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={messages[table]}>
                                    {messages[table] || 'Ready to sync'}
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSync(table)}
                                    disabled={syncing[table]}
                                >
                                    {syncing[table] ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-3 w-3" />
                                    )}
                                    <span className="sr-only">Sync</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Custom Table Sync Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sync Specific Table</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 mt-2">
                            <Select value={selectedTable} onValueChange={setSelectedTable}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a table..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {KNOWN_TABLES.map(table => (
                                        <SelectItem key={table} value={table}>
                                            {table}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    if (selectedTable) handleSync(selectedTable);
                                }}
                                disabled={!selectedTable || syncing[selectedTable]}
                            >
                                {syncing[selectedTable] ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                            Select any table from the database to sync.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Automatic Sync</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    To enable automatic synchronization, configure Supabase Webhooks to point to:
                    <code className="bg-background px-2 py-1 rounded ml-2 text-primary">
                        {import.meta.env.VITE_WORKER_URL}/api/webhooks/supabase
                    </code>
                </p>
                <Button variant="link" className="p-0 h-auto" asChild>
                    <a href="https://supabase.com/dashboard/project/_/database/hooks" target="_blank" rel="noopener noreferrer">
                        Configure Webhooks in Supabase &rarr;
                    </a>
                </Button>
            </div>
        </div>
    );
}
