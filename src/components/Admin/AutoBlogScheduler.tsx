import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Rocket, Settings, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BlogGenerationSettings {
    id: string;
    posts_per_week: number;
    auto_generate_enabled: boolean;
    notification_email: string | null;
    last_topic_index: number;
}

interface ScheduledPost {
    id: string;
    topic_category: string;
    scheduled_for: string;
    status: "pending" | "generated" | "failed";
    generated_post_id: string | null;
    error_message: string | null;
    created_at: string;
}

const TOPIC_LABELS: Record<string, string> = {
    drip_irrigation_systems: "Drip Irrigation Systems",
    solar_irrigation: "Solar Irrigation",
    irrigation_costs: "Irrigation Costs in Kenya",
    greenhouse_irrigation: "Greenhouse Irrigation",
    smart_irrigation: "Irrigation Controls & Automation",
    irrigation_maintenance: "Irrigation Maintenance & Mistakes",
    water_management: "Water Management for Farms",
};

const AutoBlogScheduler = () => {
    const [settings, setSettings] = useState<BlogGenerationSettings | null>(null);
    const [schedule, setSchedule] = useState<ScheduledPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [triggering, setTriggering] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchSettings();
        fetchSchedule();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from("blog_generation_settings")
                .select("*")
                .single();

            if (error) throw error;
            setSettings(data);
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast({
                title: "Error",
                description: "Failed to fetch automation settings",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedule = async () => {
        try {
            const { data, error } = await supabase
                .from("automated_blog_schedule")
                .select("*")
                .order("scheduled_for", { ascending: true })
                .limit(10);

            if (error) throw error;
            setSchedule(data || []);
        } catch (error) {
            console.error("Error fetching schedule:", error);
        }
    };

    const updateSettings = async (updates: Partial<BlogGenerationSettings>) => {
        if (!settings) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("blog_generation_settings")
                .update(updates)
                .eq("id", settings.id);

            if (error) throw error;

            setSettings({ ...settings, ...updates });
            toast({
                title: "Success",
                description: "Settings updated successfully",
            });
        } catch (error) {
            console.error("Error updating settings:", error);
            toast({
                title: "Error",
                description: "Failed to update settings",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const triggerManualGeneration = async () => {
        setTriggering(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error("Not authenticated");
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-blog-posts`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to trigger generation");
            }

            const result = await response.json();

            toast({
                title: "Success",
                description: `Generated ${result.generated} blog post(s)`,
            });

            fetchSchedule();
        } catch (error) {
            console.error("Error triggering generation:", error);
            toast({
                title: "Error",
                description: "Failed to trigger blog generation",
                variant: "destructive",
            });
        } finally {
            setTriggering(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!settings) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    Failed to load automation settings
                </CardContent>
            </Card>
        );
    }

    const pendingPosts = schedule.filter((s) => s.status === "pending");
    const generatedPosts = schedule.filter((s) => s.status === "generated");
    const failedPosts = schedule.filter((s) => s.status === "failed");

    return (
        <div className="space-y-6">
            {/* Settings Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Automation Settings
                            </CardTitle>
                            <CardDescription>
                                Configure automated blog post generation
                            </CardDescription>
                        </div>
                        <Badge variant={settings.auto_generate_enabled ? "default" : "secondary"}>
                            {settings.auto_generate_enabled ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Enable/Disable */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="auto-generate">Auto-Generate Blog Posts</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically create blog posts twice per week
                            </p>
                        </div>
                        <Switch
                            id="auto-generate"
                            checked={settings.auto_generate_enabled}
                            onCheckedChange={(checked) =>
                                updateSettings({ auto_generate_enabled: checked })
                            }
                            disabled={saving}
                        />
                    </div>

                    {/* Posts Per Week */}
                    <div className="space-y-2">
                        <Label htmlFor="posts-per-week">Posts Per Week</Label>
                        <Select
                            value={settings.posts_per_week.toString()}
                            onValueChange={(value) =>
                                updateSettings({ posts_per_week: parseInt(value) })
                            }
                            disabled={saving}
                        >
                            <SelectTrigger id="posts-per-week">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                        {num} {num === 1 ? "post" : "posts"} per week
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Posts are generated on Monday and Thursday mornings
                        </p>
                    </div>

                    {/* Manual Trigger */}
                    <div className="pt-4 border-t">
                        <Button
                            onClick={triggerManualGeneration}
                            disabled={triggering || !settings.auto_generate_enabled}
                            className="w-full"
                        >
                            {triggering ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Rocket className="mr-2 h-4 w-4" />
                                    Generate Posts Now
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            Manually trigger generation for pending scheduled posts
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Schedule Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Upcoming Schedule
                    </CardTitle>
                    <CardDescription>
                        Next {pendingPosts.length} scheduled blog posts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {pendingPosts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No upcoming posts scheduled
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {pendingPosts.map((post) => (
                                <div
                                    key={post.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">
                                            {TOPIC_LABELS[post.topic_category] || post.topic_category}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(post.scheduled_for), "PPp")}
                                        </p>
                                    </div>
                                    <Badge variant="outline">Pending</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Recently generated and failed posts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {generatedPosts.slice(0, 3).map((post) => (
                            <div
                                key={post.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-sm">
                                        {TOPIC_LABELS[post.topic_category] || post.topic_category}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        Generated {format(new Date(post.created_at), "PPp")}
                                    </p>
                                </div>
                                <Badge variant="default" className="bg-green-500">
                                    Generated
                                </Badge>
                            </div>
                        ))}

                        {failedPosts.slice(0, 2).map((post) => (
                            <div
                                key={post.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card border-destructive/50"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-sm">
                                        {TOPIC_LABELS[post.topic_category] || post.topic_category}
                                    </p>
                                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                        <XCircle className="h-3 w-3" />
                                        {post.error_message || "Generation failed"}
                                    </p>
                                </div>
                                <Badge variant="destructive">Failed</Badge>
                            </div>
                        ))}

                        {generatedPosts.length === 0 && failedPosts.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No recent activity
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AutoBlogScheduler;
