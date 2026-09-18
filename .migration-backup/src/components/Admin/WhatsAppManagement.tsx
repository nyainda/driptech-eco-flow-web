import React, { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    MessageCircle,
    Send,
    Search,
    Phone,
    MoreVertical,
    Archive,
    Trash2,
    Settings,
    CheckCheck,
    Check,
    Clock,
    AlertCircle,
    Image as ImageIcon,
    File,
    Video,
    Mic,
    MapPin,
    User,
    RefreshCw,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface WhatsAppMessage {
    id: string;
    message_id?: string;
    from_number: string;
    to_number: string;
    message_type: string;
    message_content?: string;
    media_url?: string;
    caption?: string;
    timestamp: string;
    status: string;
    direction: "inbound" | "outbound";
    customer_name?: string;
    is_read: boolean;
}

interface WhatsAppConversation {
    id: string;
    phone_number: string;
    customer_name?: string;
    last_message_at?: string;
    last_message_preview?: string;
    unread_count: number;
    status: string;
    tags?: string[];
}

interface WhatsAppConfig {
    id?: string;
    business_phone_number: string;
    business_name?: string;
    api_key?: string;
    api_secret?: string;
    webhook_url?: string;
    provider: string;
    is_active: boolean;
}

const WhatsAppManagement = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messageText, setMessageText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [configDialogOpen, setConfigDialogOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [config, setConfig] = useState<WhatsAppConfig>({
        business_phone_number: "254723407849",
        business_name: "DripTech EcoFlow",
        provider: "twilio",
        is_active: false,
    });

    // Fetch WhatsApp configuration
    const { data: whatsappConfig } = useQuery({
        queryKey: ["whatsapp-config"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("whatsapp_config")
                .select("*")
                .single();

            if (error && error.code !== "PGRST116") throw error;
            return data as WhatsAppConfig | null;
        },
    });

    // Fetch conversations
    const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
        queryKey: ["whatsapp-conversations"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("whatsapp_conversations")
                .select("*")
                .order("last_message_at", { ascending: false });

            if (error) throw error;
            return data as WhatsAppConversation[];
        },
    });

    // Fetch messages for selected conversation
    const { data: messages = [], isLoading: messagesLoading } = useQuery({
        queryKey: ["whatsapp-messages", selectedConversation],
        queryFn: async () => {
            if (!selectedConversation) return [];

            const conversation = conversations.find((c) => c.id === selectedConversation);
            if (!conversation) return [];

            const { data, error } = await supabase
                .from("whatsapp_messages")
                .select("*")
                .or(`from_number.eq.${conversation.phone_number},to_number.eq.${conversation.phone_number}`)
                .order("timestamp", { ascending: true });

            if (error) throw error;
            return data as WhatsAppMessage[];
        },
        enabled: !!selectedConversation,
    });

    // Calculate statistics
    const stats = React.useMemo(() => {
        const totalConversations = conversations.length;
        const activeConversations = conversations.filter(
            (c) => c.status === "active"
        ).length;
        const totalUnread = conversations.reduce(
            (sum, c) => sum + (c.unread_count || 0),
            0
        );

        return {
            totalConversations,
            activeConversations,
            totalUnread,
        };
    }, [conversations]);

    // Save configuration mutation
    const saveConfigMutation = useMutation({
        mutationFn: async (newConfig: WhatsAppConfig) => {
            if (whatsappConfig?.id) {
                const { error } = await supabase
                    .from("whatsapp_config")
                    .update(newConfig)
                    .eq("id", whatsappConfig.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("whatsapp_config")
                    .insert(newConfig);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
            toast({
                title: "Configuration Saved",
                description: "WhatsApp configuration updated successfully",
            });
            setConfigDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async ({ to, message }: { to: string; message: string }) => {
            const { error } = await supabase.from("whatsapp_messages").insert({
                from_number: config.business_phone_number,
                to_number: to,
                message_type: "text",
                message_content: message,
                direction: "outbound",
                status: "sent",
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
            queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
            setMessageText("");
            toast({
                title: "Message Sent",
                description: "Your message has been sent successfully",
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

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (conversationId: string) => {
            const conversation = conversations.find((c) => c.id === conversationId);
            if (!conversation) return;

            await supabase
                .from("whatsapp_messages")
                .update({ is_read: true })
                .eq("from_number", conversation.phone_number)
                .eq("direction", "inbound")
                .eq("is_read", false);

            await supabase
                .from("whatsapp_conversations")
                .update({ unread_count: 0 })
                .eq("id", conversationId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
            queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
        },
    });

    // Load config on mount
    useEffect(() => {
        if (whatsappConfig) {
            setConfig(whatsappConfig);
        }
    }, [whatsappConfig]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Mark conversation as read when selected
    useEffect(() => {
        if (selectedConversation) {
            markAsReadMutation.mutate(selectedConversation);
        }
    }, [selectedConversation]);

    const handleSendMessage = () => {
        if (!messageText.trim() || !selectedConversation) return;

        const conversation = conversations.find((c) => c.id === selectedConversation);
        if (!conversation) return;

        sendMessageMutation.mutate({
            to: conversation.phone_number,
            message: messageText,
        });
    };

    const filteredConversations = conversations.filter((conv) =>
        conv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.phone_number.includes(searchQuery)
    );

    const selectedConv = conversations.find((c) => c.id === selectedConversation);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "delivered":
                return <CheckCheck className="h-3 w-3 text-blue-500" />;
            case "read":
                return <CheckCheck className="h-3 w-3 text-blue-600" />;
            case "sent":
                return <Check className="h-3 w-3 text-gray-400" />;
            case "failed":
                return <AlertCircle className="h-3 w-3 text-red-500" />;
            default:
                return <Clock className="h-3 w-3 text-gray-400" />;
        }
    };

    const getMessageIcon = (type: string) => {
        switch (type) {
            case "image":
                return <ImageIcon className="h-4 w-4" />;
            case "video":
                return <Video className="h-4 w-4" />;
            case "audio":
                return <Mic className="h-4 w-4" />;
            case "document":
                return <File className="h-4 w-4" />;
            case "location":
                return <MapPin className="h-4 w-4" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">WhatsApp Messages</h1>
                    <p className="text-muted-foreground">
                        View and respond to customer WhatsApp messages
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            queryClient.invalidateQueries({
                                queryKey: ["whatsapp-conversations"],
                            })
                        }
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Configure
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>WhatsApp Configuration</DialogTitle>
                                <DialogDescription>
                                    Configure your WhatsApp Business API integration
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Business Phone Number</Label>
                                        <Input
                                            value={config.business_phone_number}
                                            onChange={(e) =>
                                                setConfig((prev) => ({
                                                    ...prev,
                                                    business_phone_number: e.target.value,
                                                }))
                                            }
                                            placeholder="254114575401"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Business Name</Label>
                                        <Input
                                            value={config.business_name || ""}
                                            onChange={(e) =>
                                                setConfig((prev) => ({
                                                    ...prev,
                                                    business_name: e.target.value,
                                                }))
                                            }
                                            placeholder="DripTech EcoFlow"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Provider</Label>
                                        <Select
                                            value={config.provider}
                                            onValueChange={(value) =>
                                                setConfig((prev) => ({ ...prev, provider: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="twilio">Twilio</SelectItem>
                                                <SelectItem value="whatsapp_business">
                                                    WhatsApp Business API
                                                </SelectItem>
                                                <SelectItem value="messagebird">MessageBird</SelectItem>
                                                <SelectItem value="vonage">Vonage</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>API Key</Label>
                                        <Input
                                            type="password"
                                            value={config.api_key || ""}
                                            onChange={(e) =>
                                                setConfig((prev) => ({
                                                    ...prev,
                                                    api_key: e.target.value,
                                                }))
                                            }
                                            placeholder="Enter API key"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>API Secret</Label>
                                        <Input
                                            type="password"
                                            value={config.api_secret || ""}
                                            onChange={(e) =>
                                                setConfig((prev) => ({
                                                    ...prev,
                                                    api_secret: e.target.value,
                                                }))
                                            }
                                            placeholder="Enter API secret"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Webhook URL</Label>
                                        <Input
                                            value={config.webhook_url || ""}
                                            onChange={(e) =>
                                                setConfig((prev) => ({
                                                    ...prev,
                                                    webhook_url: e.target.value,
                                                }))
                                            }
                                            placeholder="https://your-domain.com/api/whatsapp/webhook"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={() => saveConfigMutation.mutate(config)}
                                    disabled={saveConfigMutation.isPending}
                                    className="w-full"
                                >
                                    {saveConfigMutation.isPending
                                        ? "Saving..."
                                        : "Save Configuration"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Conversations
                        </CardTitle>
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalConversations}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeConversations} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Unread Messages
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {stats.totalUnread}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Requires attention
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Badge variant={config.is_active ? "default" : "secondary"}>
                                {config.is_active ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {config.provider || "Not configured"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Chat Interface */}
            <Card className="h-[600px] flex">
                {/* Conversations List */}
                <div className="w-80 border-r flex flex-col">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        {conversationsLoading ? (
                            <div className="p-4 text-center text-muted-foreground">
                                Loading conversations...
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                                No conversations found
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredConversations.map((conversation) => (
                                    <div
                                        key={conversation.id}
                                        onClick={() => setSelectedConversation(conversation.id)}
                                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedConversation === conversation.id
                                            ? "bg-muted"
                                            : ""
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar>
                                                <AvatarFallback>
                                                    <User className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-medium text-sm truncate">
                                                        {conversation.customer_name || conversation.phone_number}
                                                    </h4>
                                                    {conversation.unread_count > 0 && (
                                                        <Badge
                                                            variant="default"
                                                            className="ml-2 h-5 min-w-5 flex items-center justify-center rounded-full text-xs"
                                                        >
                                                            {conversation.unread_count}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {conversation.last_message_preview || "No messages"}
                                                </p>
                                                {conversation.last_message_at && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {new Date(
                                                            conversation.last_message_at
                                                        ).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex flex-col">
                    {selectedConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>
                                            <User className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-medium">
                                            {selectedConv.customer_name || selectedConv.phone_number}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedConv.phone_number}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 p-4">
                                {messagesLoading ? (
                                    <div className="text-center text-muted-foreground">
                                        Loading messages...
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-muted-foreground">
                                        No messages yet
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${message.direction === "outbound"
                                                    ? "justify-end"
                                                    : "justify-start"
                                                    }`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-lg p-3 ${message.direction === "outbound"
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted"
                                                        }`}
                                                >
                                                    {getMessageIcon(message.message_type) && (
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {getMessageIcon(message.message_type)}
                                                            <span className="text-xs">
                                                                {message.message_type}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {message.message_content && (
                                                        <p className="text-sm whitespace-pre-wrap">
                                                            {message.message_content}
                                                        </p>
                                                    )}
                                                    {message.media_url && (
                                                        <div className="mt-2">
                                                            {message.message_type === "image" && (
                                                                <img
                                                                    src={message.media_url}
                                                                    alt="Media"
                                                                    className="rounded max-w-full"
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-end gap-1 mt-1">
                                                        <span className="text-xs opacity-70">
                                                            {new Date(message.timestamp).toLocaleTimeString(
                                                                [],
                                                                { hour: "2-digit", minute: "2-digit" }
                                                            )}
                                                        </span>
                                                        {message.direction === "outbound" &&
                                                            getStatusIcon(message.status)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Message Input */}
                            <div className="p-4 border-t">
                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder="Type a message..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="min-h-[60px] max-h-[120px]"
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={
                                            !messageText.trim() || sendMessageMutation.isPending
                                        }
                                        size="icon"
                                        className="h-[60px] w-[60px]"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>Select a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default WhatsAppManagement;
