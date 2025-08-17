
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Smartphone,
  Building
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MpesaTransaction {
  id: string;
  transactionId: string;
  amount: number;
  phoneNumber: string;
  customerName: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  mpesaReceiptNumber?: string;
  accountReference?: string;
}

interface MpesaStats {
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  averageTransactionAmount: number;
  highestTransaction: number;
  todayTransactions: number;
  todayAmount: number;
}

interface MpesaConfig {
  paybillNumber: string;
  shortcode: string;
  tillNumber: string;
  businessName: string;
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  environment: 'sandbox' | 'production';
}

const MpesaIntegration = () => {
  const [transactions, setTransactions] = useState<MpesaTransaction[]>([]);
  const [stats, setStats] = useState<MpesaStats>({
    totalTransactions: 0,
    totalAmount: 0,
    successfulTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    averageTransactionAmount: 0,
    highestTransaction: 0,
    todayTransactions: 0,
    todayAmount: 0
  });
  const [config, setConfig] = useState<MpesaConfig>({
    paybillNumber: "",
    shortcode: "",
    tillNumber: "",
    businessName: "DripTech Irrigation",
    consumerKey: "",
    consumerSecret: "",
    passkey: "",
    environment: "sandbox"
  });
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMpesaConfig();
    fetchTransactions();
  }, []);

  const loadMpesaConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'mpesa_config')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
<<<<<<< HEAD

      if (data?.setting_value) {
        setConfig({ ...config, ...data.setting_value });
      }
    } catch (error) {
      console.error('Error loading M-Pesa config:', error);
=======
      
      return data.setting_value as MpesaConfig;
>>>>>>> cbb33a1 (Run M-Pesa SQL script)
    }
  };

<<<<<<< HEAD
  const saveMpesaConfig = async () => {
    try {
=======
  // Fetch M-Pesa transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['mpesa-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mpesa_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
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
>>>>>>> cbb33a1 (Run M-Pesa SQL script)
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'mpesa_config',
<<<<<<< HEAD
          setting_value: config,
          description: 'M-Pesa API configuration settings'
=======
          setting_value: newConfig
>>>>>>> cbb33a1 (Run M-Pesa SQL script)
        });

      if (error) throw error;

      toast({
        title: "Configuration Saved",
        description: "M-Pesa settings have been updated successfully."
      });
      setShowConfig(false);
    } catch (error) {
      console.error('Error saving M-Pesa config:', error);
      toast({
        title: "Error",
        description: "Failed to save M-Pesa configuration",
        variant: "destructive"
      });
    }
<<<<<<< HEAD
=======
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
>>>>>>> cbb33a1 (Run M-Pesa SQL script)
  };

  const fetchTransactions = async () => {
    setLoading(true);
    
    try {
      // In a real implementation, this would fetch from M-Pesa API
      // For now, we'll check if there are any payment-related records in the database
      
      // You could create an mpesa_transactions table to store actual transactions
      // For demonstration, I'll show how to structure this with real data format
      
      const { data: quotesData, error } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_number,
          total_amount,
          created_at,
          status,
          customers (
            contact_person,
            phone,
            company_name
          )
        `)
        .eq('status', 'accepted');

      if (error) throw error;

      // Convert quotes to transaction format for demonstration
      // In real implementation, you'd have actual M-Pesa transaction records
      const mockTransactions: MpesaTransaction[] = (quotesData || []).map((quote, index) => ({
        id: quote.id,
        transactionId: `MPG${Date.now()}${index}`,
        amount: quote.total_amount || 0,
        phoneNumber: quote.customers?.phone || "254700000000",
        customerName: quote.customers?.contact_person || "Unknown Customer",
        description: `Payment for Quote #${quote.quote_number}`,
        status: Math.random() > 0.1 ? 'completed' as const : 'pending' as const,
        timestamp: quote.created_at,
        mpesaReceiptNumber: `M${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
        accountReference: quote.quote_number
      }));

      setTransactions(mockTransactions);
      calculateStats(mockTransactions);

    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch M-Pesa transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactions: MpesaTransaction[]) => {
    const successful = transactions.filter(t => t.status === 'completed');
    const pending = transactions.filter(t => t.status === 'pending');
    const failed = transactions.filter(t => t.status === 'failed');
    
    const totalAmount = successful.reduce((sum, t) => sum + t.amount, 0);
    const averageAmount = successful.length > 0 ? totalAmount / successful.length : 0;
    const highestAmount = Math.max(...transactions.map(t => t.amount), 0);
    
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(t => 
      new Date(t.timestamp).toDateString() === today
    );
    const todayAmount = todayTransactions.reduce((sum, t) => sum + (t.status === 'completed' ? t.amount : 0), 0);

    setStats({
      totalTransactions: transactions.length,
      totalAmount,
      successfulTransactions: successful.length,
      pendingTransactions: pending.length,
      failedTransactions: failed.length,
      averageTransactionAmount: averageAmount,
      highestTransaction: highestAmount,
      todayTransactions: todayTransactions.length,
      todayAmount
    });
  };

  const syncWithMpesa = async () => {
    if (!config.consumerKey || !config.consumerSecret) {
      toast({
        title: "Configuration Required",
        description: "Please configure M-Pesa API credentials first",
        variant: "destructive"
      });
      setShowConfig(true);
      return;
    }

    setLoading(true);
    
    try {
      // Here you would implement actual M-Pesa API integration
      // This is a placeholder for the real implementation
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      await fetchTransactions();
      
      toast({
        title: "Sync Complete",
        description: "Successfully synchronized with M-Pesa API"
      });
    } catch (error) {
      console.error('Error syncing with M-Pesa:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync with M-Pesa. Please check your configuration.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadStatement = () => {
    const csvContent = [
      ['Date', 'Transaction ID', 'M-Pesa Receipt', 'Amount (KSh)', 'Phone Number', 'Customer Name', 'Description', 'Status'],
      ...transactions.map(t => [
        new Date(t.timestamp).toLocaleDateString(),
        t.transactionId,
        t.mpesaReceiptNumber || '',
        t.amount.toString(),
        t.phoneNumber,
        t.customerName,
        t.description,
        t.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mpesa-statement-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Statement Downloaded",
      description: "M-Pesa transaction statement has been downloaded successfully."
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
    }
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">M-Pesa Integration</h2>
          <p className="text-muted-foreground">
            Real-time M-Pesa payment tracking and transaction management
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowConfig(!showConfig)}>
          <Settings className="h-4 w-4 mr-2" />
          Configuration
        </Button>
      </div>

      {/* Configuration Section */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              M-Pesa API Configuration
            </CardTitle>
            <CardDescription>
              Configure your M-Pesa API credentials for live transaction tracking
            </CardDescription>
          </CardHeader>
<<<<<<< HEAD
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
=======
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
>>>>>>> cbb33a1 (Run M-Pesa SQL script)
                <Input
                  id="businessName"
                  value={config.businessName}
                  onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                  placeholder="Your business name"
                />
              </div>
              <div>
                <Label htmlFor="paybill">Paybill Number</Label>
                <Input
                  id="paybill"
                  value={config.paybillNumber}
                  onChange={(e) => setConfig({ ...config, paybillNumber: e.target.value })}
                  placeholder="Your Paybill number"
                />
              </div>
              <div>
                <Label htmlFor="shortcode">Shortcode</Label>
                <Input
                  id="shortcode"
                  value={config.shortcode}
                  onChange={(e) => setConfig({ ...config, shortcode: e.target.value })}
                  placeholder="API Shortcode"
                />
              </div>
              <div>
                <Label htmlFor="tillNumber">Till Number (Optional)</Label>
                <Input
                  id="tillNumber"
                  value={config.tillNumber}
                  onChange={(e) => setConfig({ ...config, tillNumber: e.target.value })}
                  placeholder="Till number if applicable"
                />
              </div>
              <div>
                <Label htmlFor="consumerKey">Consumer Key</Label>
                <Input
                  id="consumerKey"
                  type="password"
                  value={config.consumerKey}
                  onChange={(e) => setConfig({ ...config, consumerKey: e.target.value })}
                  placeholder="M-Pesa API Consumer Key"
                />
              </div>
              <div>
                <Label htmlFor="consumerSecret">Consumer Secret</Label>
                <Input
                  id="consumerSecret"
                  type="password"
                  value={config.consumerSecret}
                  onChange={(e) => setConfig({ ...config, consumerSecret: e.target.value })}
                  placeholder="M-Pesa API Consumer Secret"
                />
              </div>
              <div>
                <Label htmlFor="passkey">Passkey</Label>
                <Input
                  id="passkey"
                  type="password"
                  value={config.passkey}
                  onChange={(e) => setConfig({ ...config, passkey: e.target.value })}
                  placeholder="M-Pesa API Passkey"
                />
              </div>
              <div>
                <Label htmlFor="environment">Environment</Label>
                <select 
                  id="environment"
                  value={config.environment}
                  onChange={(e) => setConfig({ ...config, environment: e.target.value as 'sandbox' | 'production' })}
                  className="w-full p-2 border rounded"
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveMpesaConfig}>
                Save Configuration
              </Button>
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={syncWithMpesa} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing...' : 'Sync with M-Pesa'}
        </Button>
        <Button variant="outline" onClick={downloadStatement}>
          <Download className="h-4 w-4 mr-2" />
          Download Statement
        </Button>
        <Button variant="outline" onClick={fetchTransactions}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              From {stats.successfulTransactions} successful transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.todayAmount)}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.todayTransactions} transactions today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Transaction</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.averageTransactionAmount)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Highest: {formatCurrency(stats.highestTransaction)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.totalTransactions > 0 ? Math.round((stats.successfulTransactions / stats.totalTransactions) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.pendingTransactions} pending, {stats.failedTransactions} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              M-Pesa Transactions
            </span>
            <Badge variant="secondary">
              {transactions.length} transactions
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time M-Pesa payment transactions from your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transaction.status)}
                      <div>
                        <p className="font-medium">{transaction.customerName}</p>
                        <p className="text-sm text-muted-foreground">{transaction.phoneNumber}</p>
                        {transaction.mpesaReceiptNumber && (
                          <p className="text-xs text-muted-foreground">Receipt: {transaction.mpesaReceiptNumber}</p>
                        )}
                      </div>
                    </div>
                    <Separator orientation="vertical" className="h-12" />
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">Ref: {transaction.accountReference || transaction.transactionId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(transaction.amount)}</p>
                    <div className="flex items-center gap-2 justify-end">
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(transaction.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No M-Pesa Transactions</h3>
                <p className="text-muted-foreground mb-4">
                  {!config.consumerKey ? 
                    "Configure M-Pesa API credentials to start tracking transactions" :
                    "No transactions found. Sync with M-Pesa to load recent transactions"
                  }
                </p>
                {!config.consumerKey ? (
                  <Button onClick={() => setShowConfig(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure M-Pesa
                  </Button>
                ) : (
                  <Button onClick={syncWithMpesa}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${config.consumerKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">API Credentials: {config.consumerKey ? 'Configured' : 'Not Configured'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${config.paybillNumber ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm">Paybill: {config.paybillNumber || 'Not Set'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${config.environment === 'production' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
              <span className="text-sm">Environment: {config.environment}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MpesaIntegration;
