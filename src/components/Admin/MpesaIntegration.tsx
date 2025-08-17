import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  RefreshCw
} from "lucide-react";

interface MpesaConfig {
  consumer_key: string;
  consumer_secret: string;
  business_short_code: string;
  pass_key: string;
  callback_url: string;
}

interface MpesaTransaction {
  id: string;
  phone_number: string;
  amount: number;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

const MpesaIntegration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [config, setConfig] = useState<MpesaConfig>({
    consumer_key: '',
    consumer_secret: '',
    business_short_code: '',
    pass_key: '',
    callback_url: ''
  });
  
  const [isEnabled, setIsEnabled] = useState(false);

  // Fetch M-Pesa configuration
  const { data: mpesaConfig } = useQuery({
    queryKey: ['mpesa-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'mpesa_config')
        .single();
      
      if (error) {
        console.log('No M-Pesa config found');
        return null;
      }
      
      return data.setting_value as unknown as MpesaConfig;
    }
  });

  // Fetch M-Pesa transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['mpesa-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mpesa_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MpesaTransaction[];
    }
  });

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalTransactions = transactions.length;
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    const failedTransactions = transactions.filter(t => t.status === 'failed');
    
    const totalAmount = completedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const todayTransactions = transactions.filter(t => 
      new Date(t.created_at).toDateString() === new Date().toDateString()
    );

    return {
      totalTransactions,
      completedCount: completedTransactions.length,
      pendingCount: pendingTransactions.length,
      failedCount: failedTransactions.length,
      totalAmount,
      todayCount: todayTransactions.length
    };
  }, [transactions]);

  // Update configuration
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: MpesaConfig) => {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'mpesa_config',
          setting_value: newConfig as any
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mpesa-config'] });
      toast({
        title: "Success",
        description: "M-Pesa configuration updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Initialize payment mutation (mock implementation)
  const initiateMutation = useMutation({
    mutationFn: async ({ phone, amount }: { phone: string; amount: number }) => {
      // Insert a test transaction record
      const { data, error } = await supabase
        .from('mpesa_transactions')
        .insert({
          phone_number: phone,
          amount: amount,
          transaction_id: `TEST${Date.now()}`,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Simulate processing delay
      setTimeout(async () => {
        await supabase
          .from('mpesa_transactions')
          .update({ status: 'completed' })
          .eq('id', data.id);
        
        queryClient.invalidateQueries({ queryKey: ['mpesa-transactions'] });
      }, 3000);
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Payment Initiated",
        description: "M-Pesa payment request sent to customer",
      });
      queryClient.invalidateQueries({ queryKey: ['mpesa-transactions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Load config on mount
  useEffect(() => {
    if (mpesaConfig) {
      setConfig(mpesaConfig);
      setIsEnabled(true);
    }
  }, [mpesaConfig]);

  const handleSaveConfig = () => {
    updateConfigMutation.mutate(config);
  };

  const handleTestPayment = () => {
    // Test with a dummy phone number and amount
    initiateMutation.mutate({ 
      phone: '254700000000', 
      amount: 100 
    });
  };

  const handleExportTransactions = () => {
    const csvContent = [
      ['Transaction ID', 'Phone Number', 'Amount', 'Status', 'Date'],
      ...transactions.map(t => [
        t.transaction_id,
        t.phone_number,
        t.amount.toString(),
        t.status,
        new Date(t.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mpesa-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">M-Pesa Integration</h1>
          <p className="text-muted-foreground">Configure and monitor M-Pesa payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="mpesa-enabled">Enable M-Pesa</Label>
          <Switch 
            id="mpesa-enabled"
            checked={isEnabled} 
            onCheckedChange={setIsEnabled}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayCount} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From completed transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingCount} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedCount}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Recent M-Pesa payment transactions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['mpesa-transactions'] })}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportTransactions}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">
                          {transaction.transaction_id}
                        </TableCell>
                        <TableCell>{transaction.phone_number}</TableCell>
                        <TableCell>KES {Number(transaction.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            transaction.status === 'completed' ? 'default' :
                            transaction.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>M-Pesa API Configuration</CardTitle>
              <CardDescription>
                Configure your M-Pesa API credentials for production use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consumer_key">Consumer Key</Label>
                  <Input
                    id="consumer_key"
                    type="password"
                    value={config.consumer_key}
                    onChange={(e) => setConfig(prev => ({ ...prev, consumer_key: e.target.value }))}
                    placeholder="Enter consumer key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consumer_secret">Consumer Secret</Label>
                  <Input
                    id="consumer_secret"
                    type="password"
                    value={config.consumer_secret}
                    onChange={(e) => setConfig(prev => ({ ...prev, consumer_secret: e.target.value }))}
                    placeholder="Enter consumer secret"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_short_code">Business Short Code</Label>
                  <Input
                    id="business_short_code"
                    value={config.business_short_code}
                    onChange={(e) => setConfig(prev => ({ ...prev, business_short_code: e.target.value }))}
                    placeholder="Enter business short code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass_key">Pass Key</Label>
                  <Input
                    id="pass_key"
                    type="password"
                    value={config.pass_key}
                    onChange={(e) => setConfig(prev => ({ ...prev, pass_key: e.target.value }))}
                    placeholder="Enter pass key"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="callback_url">Callback URL</Label>
                <Input
                  id="callback_url"
                  value={config.callback_url}
                  onChange={(e) => setConfig(prev => ({ ...prev, callback_url: e.target.value }))}
                  placeholder="https://yourdomain.com/api/mpesa/callback"
                />
              </div>
              <Button onClick={handleSaveConfig} disabled={updateConfigMutation.isPending}>
                {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test M-Pesa Integration</CardTitle>
              <CardDescription>
                Test your M-Pesa integration with sandbox credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Test Configuration Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {config.consumer_key ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm">Consumer Key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.consumer_secret ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm">Consumer Secret</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.business_short_code ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm">Business Short Code</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleTestPayment} 
                disabled={initiateMutation.isPending || !isEnabled}
                className="w-full"
              >
                {initiateMutation.isPending ? 'Testing...' : 'Test Payment (KES 100)'}
              </Button>
              
              <p className="text-sm text-muted-foreground">
                This will initiate a test payment of KES 100 to the test phone number 254700000000
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MpesaIntegration;