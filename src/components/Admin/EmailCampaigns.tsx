import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { emailService } from "@/services/emailService";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Mail,
    Send,
    Eye,
    TrendingUp,
    Users,
    CheckCircle,
    Clock,
    AlertCircle,
    Plus,
} from "lucide-react";

interface EmailCampaign {
    id: string;
    name: string;
    subject: string;
    content: string;
    html_content?: string;
    status: string;
    total_recipients: number;
    total_sent: number;
    total_opened: number;
    total_clicked: number;
    sent_at?: string;
    created_at: string;
}

const EmailCampaigns = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");

    // Fetch campaigns
    const { data: campaigns = [], isLoading } = useQuery({
        queryKey: ["email-campaigns"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("email_campaigns")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as EmailCampaign[];
        },
    });

    // Fetch subscriber count
    const { data: subscriberCount = 0 } = useQuery({
        queryKey: ["active-subscribers-count"],
        queryFn: async () => {
            const { count, error } = await supabase
                .from("newsletter_subscribers")
                .select("*", { count: "exact", head: true })
                .eq("status", "active");

            if (error) throw error;
            return count || 0;
        },
    });

    // Send newsletter mutation
    const sendNewsletterMutation = useMutation({
        mutationFn: async ({ subject, content }: { subject: string; content: string }) => {
            const result = await emailService.sendNewsletter(subject, content);
            if (!result.success) {
                throw new Error(result.error || "Failed to send newsletter");
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
            toast({
                title: "Newsletter Sent! 📧",
                description: "Your newsletter has been sent to all active subscribers.",
            });
            setIsComposerOpen(false);
            setSubject("");
            setContent("");
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to Send",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleSendNewsletter = () => {
        if (!subject.trim() || !content.trim()) {
            toast({
                title: "Missing Information",
                description: "Please provide both subject and content",
                variant: "destructive",
            });
            return;
        }

        sendNewsletterMutation.mutate({ subject, content });
    };

    const stats = React.useMemo(() => {
        const totalCampaigns = campaigns.length;
        const sentCampaigns = campaigns.filter((c) => c.status === "sent").length;
        const totalSent = campaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0);
        const totalOpened = campaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0);
        const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";

        return {
            totalCampaigns,
            sentCampaigns,
            totalSent,
            totalOpened,
            openRate,
        };
    }, [campaigns]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "sent":
                return <Badge variant="default">Sent</Badge>;
            case "sending":
                return <Badge variant="secondary">Sending...</Badge>;
            case "draft":
                return <Badge variant="outline">Draft</Badge>;
            case "failed":
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Email Campaigns</h1>
                    <p className="text-muted-foreground">
                        Send newsletters to your subscribers
                    </p>
                </div>
                <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Campaign
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create Newsletter Campaign</DialogTitle>
                            <DialogDescription>
                                Send an email to all {subscriberCount} active subscribers
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Subject Line</Label>
                                <Input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g., New Irrigation Tips for December"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email Content</Label>
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Write your newsletter content here..."
                                    className="min-h-[300px]"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Tip: Use double line breaks for paragraphs. HTML will be generated automatically.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSendNewsletter}
                                    disabled={sendNewsletterMutation.isPending}
                                    className="flex-1"
                                >
                                    {sendNewsletterMutation.isPending ? (
                                        <>
                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                            Sending to {subscriberCount} subscribers...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send to {subscriberCount} Subscribers
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsComposerOpen(false)}
                                    disabled={sendNewsletterMutation.isPending}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.sentCampaigns} sent
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{subscriberCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Ready to receive emails
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSent}</div>
                        <p className="text-xs text-muted-foreground">
                            All time
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.openRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalOpened} opened
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Campaigns List */}
            <Card>
                <CardHeader>
                    <CardTitle>Campaign History</CardTitle>
                    <CardDescription>
                        View all your sent and draft campaigns
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading campaigns...
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No campaigns yet</p>
                            <p className="text-sm">Create your first newsletter campaign!</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campaign Name</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Recipients</TableHead>
                                    <TableHead>Sent</TableHead>
                                    <TableHead>Opened</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.map((campaign) => (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-medium">
                                            {campaign.name}
                                        </TableCell>
                                        <TableCell>{campaign.subject}</TableCell>
                                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                                        <TableCell>{campaign.total_recipients}</TableCell>
                                        <TableCell>{campaign.total_sent}</TableCell>
                                        <TableCell>
                                            {campaign.total_opened}
                                            {campaign.total_sent > 0 && (
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    ({((campaign.total_opened / campaign.total_sent) * 100).toFixed(0)}%)
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {campaign.sent_at
                                                ? new Date(campaign.sent_at).toLocaleDateString()
                                                : new Date(campaign.created_at).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default EmailCampaigns;
