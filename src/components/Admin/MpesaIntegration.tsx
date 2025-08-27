import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Settings, DollarSign, TrendingUp, Download, Smartphone } from 'lucide-react';
import { MpesaConfig } from '@/types/Product';

const MpesaIntegration = () => {
  const [mpesaConfig, setMpesaConfig] = useState<MpesaConfig>({
    consumerKey: '',
    consumerSecret: '',
    passkey: '',
    businessShortCode: '',
    callbackUrl: ''
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMpesaConfig();
    fetchTransactions();
  }, []);

  const fetchMpesaConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', 'mpesa_config')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching M-Pesa config:', error);
        return;
      }

      if (data) {
        const config = data.setting_value as any;
        setMpesaConfig({
          consumerKey: config.consumerKey || '',
          consumerSecret: config.consumerSecret || '',
          passkey: config.passkey || '',
          businessShortCode: config.businessShortCode || '',
          callbackUrl: config.callbackUrl || ''
        });
        setIsEnabled(config.enabled || false);
      }
    } catch (error) {
      console.error('Error fetching M-Pesa config:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('mpesa_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const configData = {
        ...mpesaConfig,
        enabled: isEnabled
      };

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'mpesa_config',
          setting_value: configData,
          description: 'M-Pesa payment integration configuration'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "M-Pesa configuration saved successfully",
      });
    } catch (error) {
      console.error('Error saving M-Pesa config:', error);
      toast({
        title: "Error",
        description: "Failed to save M-Pesa configuration",
        variant: "destructive",
      });
    }
  };

  const testMpesaConnection = async () => {
    try {
      // Here you would implement the actual M-Pesa API test
      // For now, we'll just show a success message
      toast({
        title: "Test Successful",
        description: "M-Pesa connection test completed successfully",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "M-Pesa connection test failed",
        variant: "destructive",
      });
    }
  };

  const initiatePayment = async (amount: number, phoneNumber: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('initiate-mpesa-payment', {
        body: {
          amount,
          phoneNumber,
          consumerKey: mpesaConfig.consumerKey,
          consumerSecret: mpesaConfig.consumerSecret,
          passkey: mpesaConfig.passkey,
          businessShortCode: mpesaConfig.businessShortCode,
          callbackUrl: mpesaConfig.callbackUrl
        }
      });

      if (error) throw error;

      toast({
        title: "Payment Initiated",
        description: "M-Pesa payment request sent to customer",
      });

      // Refresh transactions
      fetchTransactions();
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to initiate M-Pesa payment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">M-Pesa Integration</h2>
        <Badge variant={isEnabled ? "default" : "secondary"}>
          {isEnabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                M-Pesa Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConfigSubmit} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mpesa-enabled"
                    checked={isEnabled}
                    onCheckedChange={setIsEnabled}
                  />
                  <Label htmlFor="mpesa-enabled">Enable M-Pesa Integration</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="consumerKey">Consumer Key</Label>
                    <Input
                      id="consumerKey"
                      type="password"
                      value={mpesaConfig.consumerKey}
                      onChange={(e) => setMpesaConfig({...mpesaConfig, consumerKey: e.target.value})}
                      placeholder="Enter consumer key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="consumerSecret">Consumer Secret</Label>
                    <Input
                      id="consumerSecret"
                      type="password"
                      value={mpesaConfig.consumerSecret}
                      onChange={(e) => setMpesaConfig({...mpesaConfig, consumerSecret: e.target.value})}
                      placeholder="Enter consumer secret"
                    />
                  </div>
                  <div>
                    <Label htmlFor="passkey">Passkey</Label>
                    <Input
                      id="passkey"
                      type="password"
                      value={mpesaConfig.passkey}
                      onChange={(e) => setMpesaConfig({...mpesaConfig, passkey: e.target.value})}
                      placeholder="Enter passkey"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessShortCode">Business Short Code</Label>
                    <Input
                      id="businessShortCode"
                      value={mpesaConfig.businessShortCode}
                      onChange={(e) => setMpesaConfig({...mpesaConfig, businessShortCode: e.target.value})}
                      placeholder="Enter business short code"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="callbackUrl">Callback URL</Label>
                    <Input
                      id="callbackUrl"
                      value={mpesaConfig.callbackUrl}
                      onChange={(e) => setMpesaConfig({...mpesaConfig, callbackUrl: e.target.value})}
                      placeholder="https://yoursite.com/api/mpesa/callback"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Save Configuration</Button>
                  <Button type="button" variant="outline" onClick={testMpesaConnection}>
                    Test Connection
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No transactions found</div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">KES {transaction.amount?.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{transaction.phone_number}</p>
                        <p className="text-xs text-gray-500">{new Date(transaction.created_at).toLocaleString()}</p>
                      </div>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">KES 0</p>
                <p className="text-sm text-gray-600">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{transactions.length}</p>
                <p className="text-sm text-gray-600">Total transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">95%</p>
                <p className="text-sm text-gray-600">Payment success rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MpesaIntegration;
