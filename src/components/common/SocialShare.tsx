import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Twitter, Linkedin, Link2, MessageCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export interface SocialShareProps {
    url?: string;
    title?: string;
    description?: string;
    className?: string;
}

/**
 * Social Sharing Component
 * Allows users to share content on various social media platforms
 */
export const SocialShare: React.FC<SocialShareProps> = ({
    url = typeof window !== 'undefined' ? window.location.href : '',
    title = 'DripTech EcoFlow - Professional Irrigation Solutions',
    description = 'Check out this irrigation solution from DripTech',
    className = ''
}) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
    };

    const handleShare = async (platform: string) => {
        if (platform === 'native' && navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: description,
                    url
                });
                toast({
                    title: 'Shared Successfully',
                    description: 'Content has been shared.'
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else if (platform === 'copy') {
            try {
                await navigator.clipboard.writeText(url);
                toast({
                    title: 'Link Copied',
                    description: 'Link has been copied to clipboard.'
                });
            } catch (err) {
                toast({
                    title: 'Error',
                    description: 'Failed to copy link. Please try again.',
                    variant: 'destructive'
                });
            }
        } else {
            const shareUrl = shareLinks[platform as keyof typeof shareLinks];
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        }
    };

    return (
        <div className={`social-share flex items-center gap-2 ${className}`}>
            <span className="text-sm text-muted-foreground mr-2">Share:</span>

            {/* Native Share (mobile) */}
            {navigator.share && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare('native')}
                    title="Share"
                    aria-label="Share via native options"
                    className="h-9 w-9"
                >
                    <Share2 className="h-4 w-4" />
                </Button>
            )}

            {/* WhatsApp */}
            <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('whatsapp')}
                title="Share on WhatsApp"
                aria-label="Share on WhatsApp"
                className="h-9 w-9 hover:bg-green-50 hover:text-green-600 hover:border-green-300"
            >
                <MessageCircle className="h-4 w-4" />
            </Button>

            {/* Facebook */}
            <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('facebook')}
                title="Share on Facebook"
                aria-label="Share on Facebook"
                className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            >
                <Facebook className="h-4 w-4" />
            </Button>

            {/* Twitter */}
            <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('twitter')}
                title="Share on Twitter"
                aria-label="Share on Twitter"
                className="h-9 w-9 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-300"
            >
                <Twitter className="h-4 w-4" />
            </Button>

            {/* LinkedIn */}
            <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('linkedin')}
                title="Share on LinkedIn"
                aria-label="Share on LinkedIn"
                className="h-9 w-9 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
            >
                <Linkedin className="h-4 w-4" />
            </Button>

            {/* Copy Link */}
            <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('copy')}
                title="Copy Link"
                aria-label="Copy link to clipboard"
                className="h-9 w-9"
            >
                <Link2 className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default SocialShare;
