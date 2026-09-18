import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EmailCampaigns from "@/components/Admin/EmailCampaigns";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Mail,
    Users,
    TrendingUp,
    Download,
    RefreshCw,
    Trash2,
    UserX,
    UserCheck,
    Send,
    Filter,
    Search,
    Calendar,
    BarChart3,
} from "lucide-react";

interface NewsletterSubscriber {
    id: string;
    email: string;
    name?: string;
    status: "active" | "unsubscribed" | "bounced";
    source?: string;
    subscribed_at: string;
    unsubscribed_at?: string;
    last_email_sent_at?: string;
    email_count: number;
    metadata?: any;
    created_at: string;
    updated_at: string;
}

const NewsletterManagement = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);

    // Fetch all subscribers
    const { data: subscribers = [], isLoading } = useQuery({
        queryKey: ["newsletter-subscribers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("newsletter_subscribers")
                .select("*")
                .order("subscribed_at", { ascending: false });

            if (error) throw error;
            return data as NewsletterSubscriber[];
        },
    });

    // Calculate statistics
    const stats = React.useMemo(() => {
        const totalSubscribers = subscribers.length;
        const activeSubscribers = subscribers.filter(
            (s) => s.status === "active"
        ).length;
        const unsubscribed = subscribers.filter(
            (s) => s.status === "unsubscribed"
        ).length;
        const bounced = subscribers.filter((s) => s.status === "bounced").length;

        // Calculate growth (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSubscribers = subscribers.filter(
            (s) => new Date(s.subscribed_at) > thirtyDaysAgo
        ).length;

        // Calculate sources
        const sources = subscribers.reduce((acc, s) => {
            const source = s.source || "unknown";
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalSubscribers,
            activeSubscribers,
            unsubscribed,
            bounced,
            recentSubscribers,
            sources,
            growthRate:
                totalSubscribers > 0
                    ? ((recentSubscribers / totalSubscribers) * 100).toFixed(1)
                    : "0",
        };
    }, [subscribers]);

    // Filter subscribers
    const filteredSubscribers = React.useMemo(() => {
        return subscribers.filter((subscriber) => {
            const matchesSearch =
                searchQuery === "" ||
                subscriber.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                subscriber.name?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" || subscriber.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [subscribers, searchQuery, statusFilter]);

    // Delete subscriber mutation
    const deleteSubscriberMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("newsletter_subscribers")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
            toast({
                title: "Subscriber Deleted",
                description: "The subscriber has been removed from the list.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({
            id,
            status,
        }: {
            id: string;
            status: "active" | "unsubscribed" | "bounced";
        }) => {
            const updates: any = { status };
            if (status === "unsubscribed") {
                updates.unsubscribed_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from("newsletter_subscribers")
                .update(updates)
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
            toast({
                title: "Status Updated",
                description: "Subscriber status has been updated successfully.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Export to CSV
    const handleExport = () => {
        const csvContent = [
            ["Email", "Name", "Status", "Source", "Subscribed At", "Email Count"],
            ...filteredSubscribers.map((s) => [
                s.email,
                s.name || "",
                s.status,
                s.source || "",
                new Date(s.subscribed_at).toLocaleDateString(),
                s.email_count.toString(),
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Bulk delete
    const handleBulkDelete = async () => {
        if (selectedSubscribers.length === 0) return;

        try {
            const { error } = await supabase
                .from("newsletter_subscribers")
                .delete()
                .in("id", selectedSubscribers);

            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
            setSelectedSubscribers([]);
            toast({
                title: "Subscribers Deleted",
                description: `${selectedSubscribers.length} subscribers have been removed.`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Newsletter Management</h1>
                    <p className="text-muted-foreground">
                        Manage your email subscribers and campaigns
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            queryClient.invalidateQueries({
                                queryKey: ["newsletter-subscribers"],
                            })
                        }
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Subscribers
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalSubscribers}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeSubscribers} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Subscribers
                        </CardTitle>
                        <UserCheck className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.activeSubscribers}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {((stats.activeSubscribers / stats.totalSubscribers) * 100 || 0).toFixed(1)}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            30-Day Growth
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            +{stats.recentSubscribers}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.growthRate}% growth rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
                        <UserX className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {stats.unsubscribed}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.bounced} bounced
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="subscribers" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
                    <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="campaigns" className="space-y-4">
                    <EmailCampaigns />
                </TabsContent>

                <TabsContent value="subscribers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Subscriber List</CardTitle>
                                    <CardDescription>
                                        Manage your newsletter subscribers
                                    </CardDescription>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:flex-initial">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search subscribers..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-8 w-full sm:w-64"
                                        />
                                    </div>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full sm:w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                                            <SelectItem value="bounced">Bounced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {selectedSubscribers.length > 0 && (
                                <div className="mb-4 flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm font-medium">
                                        {selectedSubscribers.length} selected
                                    </span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleBulkDelete}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Selected
                                    </Button>
                                </div>
                            )}

                            {isLoading ? (
                                <div className="text-center py-8">Loading subscribers...</div>
                            ) : filteredSubscribers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No subscribers found
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            selectedSubscribers.length ===
                                                            filteredSubscribers.length
                                                        }
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedSubscribers(
                                                                    filteredSubscribers.map((s) => s.id)
                                                                );
                                                            } else {
                                                                setSelectedSubscribers([]);
                                                            }
                                                        }}
                                                        className="rounded border-gray-300"
                                                    />
                                                </TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Source</TableHead>
                                                <TableHead>Subscribed</TableHead>
                                                <TableHead>Emails Sent</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSubscribers.map((subscriber) => (
                                                <TableRow key={subscriber.id}>
                                                    <TableCell>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSubscribers.includes(
                                                                subscriber.id
                                                            )}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedSubscribers([
                                                                        ...selectedSubscribers,
                                                                        subscriber.id,
                                                                    ]);
                                                                } else {
                                                                    setSelectedSubscribers(
                                                                        selectedSubscribers.filter(
                                                                            (id) => id !== subscriber.id
                                                                        )
                                                                    );
                                                                }
                                                            }}
                                                            className="rounded border-gray-300"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {subscriber.email}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                subscriber.status === "active"
                                                                    ? "default"
                                                                    : subscriber.status === "unsubscribed"
                                                                        ? "secondary"
                                                                        : "destructive"
                                                            }
                                                        >
                                                            {subscriber.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {subscriber.source || "unknown"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(
                                                            subscriber.subscribed_at
                                                        ).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>{subscriber.email_count}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {subscriber.status !== "active" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        updateStatusMutation.mutate({
                                                                            id: subscriber.id,
                                                                            status: "active",
                                                                        })
                                                                    }
                                                                >
                                                                    <UserCheck className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {subscriber.status === "active" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        updateStatusMutation.mutate({
                                                                            id: subscriber.id,
                                                                            status: "unsubscribed",
                                                                        })
                                                                    }
                                                                >
                                                                    <UserX className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    deleteSubscriberMutation.mutate(subscriber.id)
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Subscription Sources</CardTitle>
                                <CardDescription>
                                    Where your subscribers are coming from
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.entries(stats.sources).map(([source, count]) => (
                                        <div key={source} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full bg-primary" />
                                                <span className="text-sm font-medium capitalize">
                                                    {source}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    {count}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    (
                                                    {((count / stats.totalSubscribers) * 100 || 0).toFixed(1)}
                                                    %)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Stats</CardTitle>
                                <CardDescription>Overview of your subscriber base</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Total Subscribers</span>
                                        <span className="text-sm font-bold">
                                            {stats.totalSubscribers}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Active Rate</span>
                                        <span className="text-sm font-bold text-green-600">
                                            {((stats.activeSubscribers / stats.totalSubscribers) * 100 || 0).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Unsubscribe Rate</span>
                                        <span className="text-sm font-bold text-red-600">
                                            {((stats.unsubscribed / stats.totalSubscribers) * 100 || 0).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">30-Day Growth</span>
                                        <span className="text-sm font-bold text-emerald-600">
                                            +{stats.recentSubscribers}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default NewsletterManagement;
