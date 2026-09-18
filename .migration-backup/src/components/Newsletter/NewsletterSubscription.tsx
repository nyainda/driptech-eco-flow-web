import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, CheckCircle, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { emailService } from "@/services/emailService";

interface NewsletterSubscriptionProps {
    variant?: "default" | "compact" | "inline";
    showDescription?: boolean;
    className?: string;
}

const NewsletterSubscription: React.FC<NewsletterSubscriptionProps> = ({
    variant = "default",
    showDescription = true,
    className = "",
}) => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [error, setError] = useState("");
    const { toast } = useToast();

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setError("Please enter your email address");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Call Edge Function to handle subscription and email
            const { data, error: functionError } = await supabase.functions.invoke('newsletter-subscribe', {
                body: { email: email.toLowerCase() }
            });

            if (functionError) throw functionError;

            // Handle response
            if (data?.message === 'Already subscribed') {
                setError("You're already subscribed!");
                toast({
                    title: "Already Subscribed",
                    description: "This email is already on our mailing list.",
                });
                setIsLoading(false);
                return;
            }

            // Success
            toast({
                title: "Successfully Subscribed! 🎉",
                description: "Check your email for a welcome message!",
            });

            setIsSubscribed(true);
            setEmail("");

            // Reset success state after 5 seconds
            setTimeout(() => {
                setIsSubscribed(false);
            }, 5000);
        } catch (err: any) {
            console.error("Newsletter subscription error:", err);
            setError("Something went wrong. Please try again.");
            toast({
                title: "Subscription Failed",
                description: "Unable to subscribe. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (variant === "compact") {
        return (
            <div className={`space-y-3 ${className}`}>
                <form onSubmit={handleSubscribe} className="flex gap-2">
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                        }}
                        className="flex-1 h-9 text-sm"
                        disabled={isLoading || isSubscribed}
                        required
                    />
                    <Button
                        type="submit"
                        size="sm"
                        className="h-9"
                        disabled={isLoading || isSubscribed}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isSubscribed ? (
                            <CheckCircle className="h-4 w-4" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
                {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {error}
                    </p>
                )}
                {isSubscribed && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Successfully subscribed!
                    </p>
                )}
            </div>
        );
    }

    if (variant === "inline") {
        return (
            <form onSubmit={handleSubscribe} className={`flex gap-2 ${className}`}>
                <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                    }}
                    className="flex-1 h-10"
                    disabled={isLoading || isSubscribed}
                    required
                />
                <Button
                    type="submit"
                    disabled={isLoading || isSubscribed}
                    className="h-10"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Subscribing...
                        </>
                    ) : isSubscribed ? (
                        <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Subscribed!
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4 mr-2" />
                            Subscribe
                        </>
                    )}
                </Button>
            </form>
        );
    }

    // Default variant
    return (
        <div className={`space-y-4 ${className}`}>
            {showDescription && (
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h3 className="text-2xl font-semibold text-foreground">
                            Stay Updated with Industry Insights
                        </h3>
                    </div>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Get the latest irrigation technology updates, maintenance tips, and
                        industry best practices delivered to your inbox.
                    </p>
                </div>
            )}

            <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md mx-auto"
            >
                <div className="flex-1">
                    <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                        }}
                        className={`h-10 ${error ? "border-red-500" : ""}`}
                        disabled={isLoading || isSubscribed}
                        required
                    />
                </div>
                <Button
                    type="submit"
                    className="sm:w-auto w-full h-10"
                    disabled={isLoading || isSubscribed}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Subscribing...
                        </>
                    ) : isSubscribed ? (
                        <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Subscribed!
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4 mr-2" />
                            Subscribe
                        </>
                    )}
                </Button>
            </form>

            {error && (
                <div className="flex items-center justify-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}

            {isSubscribed && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600 animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle className="h-4 w-4" />
                    <p>Thank you for subscribing! Check your inbox for confirmation.</p>
                </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
                We respect your privacy. Unsubscribe at any time.
            </p>
        </div>
    );
};

export default NewsletterSubscription;
