import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CreditCard,
    Building2,
    Smartphone,
    TrendingUp,
    DollarSign,
    CheckCircle,
    AlertCircle,
    Download,
    RefreshCw,
    Settings,
    Banknote,
    ArrowRight,
    Info,
    ExternalLink,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MpesaConfig {
    businessName: string;
    consumerKey: string;
    consumerSecret: string;
    environment: "sandbox" | "production";
    passkey: string;
    paybillNumber: string;
    tillNumber: string;
    shortcode: string;
    callbackUrl: string;
    accountType?: "paybill" | "till";
}

interface BankConfig {
    bankName: string;
    accountNumber: string;
    accountName: string;
    branchCode: string;
    swiftCode: string;
    apiKey?: string;
    apiSecret?: string;
    webhookUrl?: string;
    enabled: boolean;
}

interface Transaction {
    id: string;
    phone_number?: string;
    amount: number;
    transaction_id: string;
    status: "pending" | "completed" | "failed";
    payment_method: "mpesa" | "bank" | "cash";
    bank_name?: string;
    created_at: string;
    updated_at: string;
}

const PaymentIntegrations = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("overview");
    const [setupWizardOpen, setSetupWizardOpen] = useState(false);
    const [setupType, setSetupType] = useState<"mpesa" | "bank">("mpesa");

    // M-Pesa Configuration State
    const [mpesaConfig, setMpesaConfig] = useState<MpesaConfig>({
        businessName: "",
        consumerKey: "",
        consumerSecret: "",
        environment: "sandbox",
        passkey: "",
        paybillNumber: "",
        tillNumber: "",
        shortcode: "",
        callbackUrl: "https://driptech-eco-flow-web.vercel.app/api/mpesa/callback",
        accountType: "paybill",
    });

    // Bank Configuration State
    const [bankConfigs, setBankConfigs] = useState<BankConfig[]>([
        {
            bankName: "Equity Bank",
            accountNumber: "",
            accountName: "DripTech EcoFlow Ltd",
            branchCode: "",
            swiftCode: "EQBLKENA",
            enabled: false,
        },
        {
            bankName: "KCB Bank",
            accountNumber: "",
            accountName: "DripTech EcoFlow Ltd",
            branchCode: "",
            swiftCode: "KCBLKENX",
            enabled: false,
        },
        {
            bankName: "Cooperative Bank",
            accountNumber: "",
            accountName: "DripTech EcoFlow Ltd",
            branchCode: "",
            swiftCode: "KCOOKENX",
            enabled: false,
        },
    ]);

    // Fetch M-Pesa configuration
    const { data: savedMpesaConfig } = useQuery({
        queryKey: ["mpesa-config"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("system_settings")
                .select("setting_value")
                .eq("setting_key", "mpesa_config")
                .single();

            if (error) return null;
            return data.setting_value as unknown as MpesaConfig;
        },
    });

    // Fetch Bank configurations
    const { data: savedBankConfigs } = useQuery({
        queryKey: ["bank-configs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("system_settings")
                .select("setting_value")
                .eq("setting_key", "bank_configs")
                .single();

            if (error) return null;
            return data.setting_value as unknown as BankConfig[];
        },
    });

    // Fetch all transactions (M-Pesa + Bank)
    const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
        queryKey: ["all-transactions"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("mpesa_transactions")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Transaction[];
        },
    });

    // Calculate statistics
    const stats = React.useMemo(() => {
        const totalTransactions = transactions.length;
        const completedTransactions = transactions.filter(
            (t) => t.status === "completed"
        );
        const pendingTransactions = transactions.filter(
            (t) => t.status === "pending"
        );
        const failedTransactions = transactions.filter(
            (t) => t.status === "failed"
        );

        const totalAmount = completedTransactions.reduce(
            (sum, t) => sum + Number(t.amount),
            0
        );

        const mpesaTransactions = transactions.filter(
            (t) => t.payment_method === "mpesa" || !t.payment_method
        );
        const bankTransactions = transactions.filter(
            (t) => t.payment_method === "bank"
        );

        return {
            totalTransactions,
            completedCount: completedTransactions.length,
            pendingCount: pendingTransactions.length,
            failedCount: failedTransactions.length,
            totalAmount,
            mpesaCount: mpesaTransactions.length,
            bankCount: bankTransactions.length,
        };
    }, [transactions]);

    // Save M-Pesa configuration
    const saveMpesaConfig = useMutation({
        mutationFn: async (config: MpesaConfig) => {
            const { data: existing } = await supabase
                .from("system_settings")
                .select("setting_key")
                .eq("setting_key", "mpesa_config")
                .single();

            let result;
            if (existing) {
                result = await supabase
                    .from("system_settings")
                    .update({ setting_value: config as any })
                    .eq("setting_key", "mpesa_config");
            } else {
                result = await supabase.from("system_settings").insert({
                    setting_key: "mpesa_config",
                    setting_value: config as any,
                });
            }

            if (result.error) throw result.error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mpesa-config"] });
            toast({
                title: "Success",
                description: "M-Pesa configuration saved successfully",
            });
            setSetupWizardOpen(false);
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Save Bank configurations
    const saveBankConfigs = useMutation({
        mutationFn: async (configs: BankConfig[]) => {
            const { data: existing } = await supabase
                .from("system_settings")
                .select("setting_key")
                .eq("setting_key", "bank_configs")
                .single();

            let result;
            if (existing) {
                result = await supabase
                    .from("system_settings")
                    .update({ setting_value: configs as any })
                    .eq("setting_key", "bank_configs");
            } else {
                result = await supabase.from("system_settings").insert({
                    setting_key: "bank_configs",
                    setting_value: configs as any,
                });
            }

            if (result.error) throw result.error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bank-configs"] });
            toast({
                title: "Success",
                description: "Bank configurations saved successfully",
            });
            setSetupWizardOpen(false);
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Load saved configs
    React.useEffect(() => {
        if (savedMpesaConfig) {
            setMpesaConfig(savedMpesaConfig);
        }
    }, [savedMpesaConfig]);

    React.useEffect(() => {
        if (savedBankConfigs) {
            setBankConfigs(savedBankConfigs);
        }
    }, [savedBankConfigs]);

    const handleExportTransactions = () => {
        const csvContent = [
            ["Transaction ID", "Payment Method", "Amount", "Status", "Date"],
            ...transactions.map((t) => [
                t.transaction_id,
                t.payment_method || "mpesa",
                t.amount.toString(),
                t.status,
                new Date(t.created_at).toLocaleString(),
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Payment Integrations</h1>
                    <p className="text-muted-foreground">
                        Manage M-Pesa and Bank payment methods
                    </p>
                </div>
                <Dialog open={setupWizardOpen} onOpenChange={setSetupWizardOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg">
                            <Settings className="h-4 w-4 mr-2" />
                            Quick Setup
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Payment Integration Setup Wizard</DialogTitle>
                            <DialogDescription>
                                Choose a payment method to configure
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Setup Type Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card
                                    className={`cursor-pointer transition-all ${setupType === "mpesa" ? "ring-2 ring-emerald-500" : ""}`}
                                    onClick={() => setSetupType("mpesa")}
                                >
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                                                <Smartphone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">M-Pesa</CardTitle>
                                                <CardDescription>Mobile payments</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>

                                <Card
                                    className={`cursor-pointer transition-all ${setupType === "bank" ? "ring-2 ring-blue-500" : ""}`}
                                    onClick={() => setSetupType("bank")}
                                >
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">Bank Transfer</CardTitle>
                                                <CardDescription>Direct banking</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </div>

                            {/* M-Pesa Setup */}
                            {setupType === "mpesa" && (
                                <div className="space-y-4">
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>M-Pesa Integration Guide</AlertTitle>
                                        <AlertDescription>
                                            Get your credentials from{" "}
                                            <a
                                                href="https://developer.safaricom.co.ke"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-emerald-600 hover:underline inline-flex items-center gap-1"
                                            >
                                                Safaricom Developer Portal
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </AlertDescription>
                                    </Alert>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Business Name</Label>
                                            <Input
                                                value={mpesaConfig.businessName}
                                                onChange={(e) =>
                                                    setMpesaConfig((prev) => ({
                                                        ...prev,
                                                        businessName: e.target.value,
                                                    }))
                                                }
                                                placeholder="DripTech EcoFlow"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Environment</Label>
                                            <Select
                                                value={mpesaConfig.environment}
                                                onValueChange={(value: "sandbox" | "production") =>
                                                    setMpesaConfig((prev) => ({
                                                        ...prev,
                                                        environment: value,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sandbox">
                                                        Sandbox (Testing)
                                                    </SelectItem>
                                                    <SelectItem value="production">
                                                        Production (Live)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Consumer Key</Label>
                                            <Input
                                                type="password"
                                                value={mpesaConfig.consumerKey}
                                                onChange={(e) =>
                                                    setMpesaConfig((prev) => ({
                                                        ...prev,
                                                        consumerKey: e.target.value,
                                                    }))
                                                }
                                                placeholder="Enter consumer key"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Consumer Secret</Label>
                                            <Input
                                                type="password"
                                                value={mpesaConfig.consumerSecret}
                                                onChange={(e) =>
                                                    setMpesaConfig((prev) => ({
                                                        ...prev,
                                                        consumerSecret: e.target.value,
                                                    }))
                                                }
                                                placeholder="Enter consumer secret"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Account Type</Label>
                                            <Select
                                                value={mpesaConfig.accountType}
                                                onValueChange={(value: "paybill" | "till") =>
                                                    setMpesaConfig((prev) => ({
                                                        ...prev,
                                                        accountType: value,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="paybill">Paybill</SelectItem>
                                                    <SelectItem value="till">Till Number</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>
                                                {mpesaConfig.accountType === "paybill"
                                                    ? "Paybill Number"
                                                    : "Till Number"}
                                            </Label>
                                            <Input
                                                value={
                                                    mpesaConfig.accountType === "paybill"
                                                        ? mpesaConfig.paybillNumber
                                                        : mpesaConfig.tillNumber
                                                }
                                                onChange={(e) =>
                                                    setMpesaConfig((prev) => ({
                                                        ...prev,
                                                        [mpesaConfig.accountType === "paybill"
                                                            ? "paybillNumber"
                                                            : "tillNumber"]: e.target.value,
                                                        shortcode: e.target.value,
                                                    }))
                                                }
                                                placeholder="Enter number"
                                            />
                                        </div>

                                        <div className="space-y-2 col-span-2">
                                            <Label>Pass Key</Label>
                                            <Input
                                                type="password"
                                                value={mpesaConfig.passkey}
                                                onChange={(e) =>
                                                    setMpesaConfig((prev) => ({
                                                        ...prev,
                                                        passkey: e.target.value,
                                                    }))
                                                }
                                                placeholder="Enter pass key"
                                            />
                                        </div>

                                        <div className="space-y-2 col-span-2">
                                            <Label>Callback URL</Label>
                                            <Input
                                                value={mpesaConfig.callbackUrl}
                                                onChange={(e) =>
                                                    setMpesaConfig((prev) => ({
                                                        ...prev,
                                                        callbackUrl: e.target.value,
                                                    }))
                                                }
                                                placeholder="https://your-domain.com/api/mpesa/callback"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => saveMpesaConfig.mutate(mpesaConfig)}
                                        disabled={saveMpesaConfig.isPending}
                                        className="w-full"
                                    >
                                        {saveMpesaConfig.isPending
                                            ? "Saving..."
                                            : "Save M-Pesa Configuration"}
                                    </Button>
                                </div>
                            )}

                            {/* Bank Setup */}
                            {setupType === "bank" && (
                                <div className="space-y-4">
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Bank Integration Setup</AlertTitle>
                                        <AlertDescription>
                                            Configure your bank accounts for receiving payments. Contact
                                            your bank for API credentials if available.
                                        </AlertDescription>
                                    </Alert>

                                    {bankConfigs.map((bank, index) => (
                                        <Card key={index}>
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Building2 className="h-5 w-5 text-blue-600" />
                                                        <CardTitle className="text-lg">
                                                            {bank.bankName}
                                                        </CardTitle>
                                                    </div>
                                                    <Switch
                                                        checked={bank.enabled}
                                                        onCheckedChange={(checked) => {
                                                            const newConfigs = [...bankConfigs];
                                                            newConfigs[index].enabled = checked;
                                                            setBankConfigs(newConfigs);
                                                        }}
                                                    />
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Account Number</Label>
                                                        <Input
                                                            value={bank.accountNumber}
                                                            onChange={(e) => {
                                                                const newConfigs = [...bankConfigs];
                                                                newConfigs[index].accountNumber = e.target.value;
                                                                setBankConfigs(newConfigs);
                                                            }}
                                                            placeholder="Enter account number"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Account Name</Label>
                                                        <Input
                                                            value={bank.accountName}
                                                            onChange={(e) => {
                                                                const newConfigs = [...bankConfigs];
                                                                newConfigs[index].accountName = e.target.value;
                                                                setBankConfigs(newConfigs);
                                                            }}
                                                            placeholder="Account holder name"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Branch Code</Label>
                                                        <Input
                                                            value={bank.branchCode}
                                                            onChange={(e) => {
                                                                const newConfigs = [...bankConfigs];
                                                                newConfigs[index].branchCode = e.target.value;
                                                                setBankConfigs(newConfigs);
                                                            }}
                                                            placeholder="Branch code"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>SWIFT Code</Label>
                                                        <Input
                                                            value={bank.swiftCode}
                                                            onChange={(e) => {
                                                                const newConfigs = [...bankConfigs];
                                                                newConfigs[index].swiftCode = e.target.value;
                                                                setBankConfigs(newConfigs);
                                                            }}
                                                            placeholder="SWIFT/BIC code"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Button
                                        onClick={() => saveBankConfigs.mutate(bankConfigs)}
                                        disabled={saveBankConfigs.isPending}
                                        className="w-full"
                                    >
                                        {saveBankConfigs.isPending
                                            ? "Saving..."
                                            : "Save Bank Configurations"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            KES {stats.totalAmount.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            From {stats.completedCount} completed transactions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            M-Pesa Payments
                        </CardTitle>
                        <Smartphone className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.mpesaCount}</div>
                        <p className="text-xs text-muted-foreground">Mobile transactions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Bank Transfers
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.bankCount}</div>
                        <p className="text-xs text-muted-foreground">Bank transactions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {stats.pendingCount}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.failedCount} failed
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="transactions">All Transactions</TabsTrigger>
                    <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
                    <TabsTrigger value="banks">Banks</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* M-Pesa Status */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                                            <Smartphone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <CardTitle>M-Pesa Integration</CardTitle>
                                            <CardDescription>Mobile money payments</CardDescription>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={savedMpesaConfig ? "default" : "secondary"}
                                        className={
                                            savedMpesaConfig
                                                ? "bg-emerald-600"
                                                : "bg-gray-400"
                                        }
                                    >
                                        {savedMpesaConfig ? "Active" : "Not Configured"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {savedMpesaConfig ? (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Business:</span>
                                                <span className="font-medium">
                                                    {savedMpesaConfig.businessName}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Environment:
                                                </span>
                                                <Badge variant="outline">
                                                    {savedMpesaConfig.environment}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Account Type:
                                                </span>
                                                <span className="font-medium">
                                                    {savedMpesaConfig.accountType}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => {
                                                setSetupType("mpesa");
                                                setSetupWizardOpen(true);
                                            }}
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Reconfigure
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        className="w-full"
                                        onClick={() => {
                                            setSetupType("mpesa");
                                            setSetupWizardOpen(true);
                                        }}
                                    >
                                        <ArrowRight className="h-4 w-4 mr-2" />
                                        Setup M-Pesa
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Bank Status */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <CardTitle>Bank Integrations</CardTitle>
                                            <CardDescription>Direct bank transfers</CardDescription>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={
                                            savedBankConfigs?.some((b) => b.enabled)
                                                ? "default"
                                                : "secondary"
                                        }
                                        className={
                                            savedBankConfigs?.some((b) => b.enabled)
                                                ? "bg-blue-600"
                                                : "bg-gray-400"
                                        }
                                    >
                                        {savedBankConfigs?.filter((b) => b.enabled).length || 0}{" "}
                                        Active
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {savedBankConfigs && savedBankConfigs.length > 0 ? (
                                    <>
                                        <div className="space-y-2">
                                            {savedBankConfigs.map((bank, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Banknote className="h-4 w-4 text-blue-600" />
                                                        <span className="text-sm font-medium">
                                                            {bank.bankName}
                                                        </span>
                                                    </div>
                                                    <Badge
                                                        variant={bank.enabled ? "default" : "outline"}
                                                        className="text-xs"
                                                    >
                                                        {bank.enabled ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => {
                                                setSetupType("bank");
                                                setSetupWizardOpen(true);
                                            }}
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Manage Banks
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        className="w-full"
                                        onClick={() => {
                                            setSetupType("bank");
                                            setSetupWizardOpen(true);
                                        }}
                                    >
                                        <ArrowRight className="h-4 w-4 mr-2" />
                                        Setup Banks
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>All Transactions</CardTitle>
                                    <CardDescription>
                                        Complete payment transaction history
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            queryClient.invalidateQueries({
                                                queryKey: ["all-transactions"],
                                            })
                                        }
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Refresh
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportTransactions}
                                    >
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
                                            <TableHead>Method</TableHead>
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
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {transaction.payment_method || "mpesa"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    KES {Number(transaction.amount).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            transaction.status === "completed"
                                                                ? "default"
                                                                : transaction.status === "pending"
                                                                    ? "secondary"
                                                                    : "destructive"
                                                        }
                                                    >
                                                        {transaction.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        transaction.created_at
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="mpesa">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>M-Pesa Integration</AlertTitle>
                        <AlertDescription>
                            For detailed M-Pesa management, testing, and advanced configuration,
                            please use the dedicated M-Pesa Integration page.
                        </AlertDescription>
                    </Alert>
                </TabsContent>

                <TabsContent value="banks">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Bank Integration</AlertTitle>
                        <AlertDescription>
                            Bank integrations are configured for manual verification. Transactions
                            will be marked as completed after manual confirmation.
                        </AlertDescription>
                    </Alert>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PaymentIntegrations;
