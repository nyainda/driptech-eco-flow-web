import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

export interface FAQItem {
    question: string;
    answer: string;
}

export interface FAQSectionProps {
    title?: string;
    faqs: FAQItem[];
    className?: string;
}

/**
 * FAQ Section Component with Schema.org markup for AI search engines
 * Optimized for ChatGPT, Perplexity, Google AI Overviews, and other AI crawlers
 * Styled to match Services section design
 */
export const FAQSection: React.FC<FAQSectionProps> = ({
    title = "Frequently Asked Questions",
    faqs,
    className = ""
}) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    // Generate FAQPage schema markup
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    const toggleFAQ = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <>
            {/* Schema markup for AI engines */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            {/* Visual FAQ section */}
            <section className={`py-20 bg-background ${className}`}>
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <Badge variant="secondary" className="mb-4">
                            ❓ Got Questions?
                        </Badge>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                            {title}
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Find answers to common questions about our irrigation systems and services
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 gap-6">
                        {faqs.map((faq, index) => {
                            const isExpanded = expandedIndex === index;

                            return (
                                <Card
                                    key={index}
                                    className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                    onClick={() => toggleFAQ(index)}
                                    itemScope
                                    itemProp="mainEntity"
                                    itemType="https://schema.org/Question"
                                >
                                    <CardContent className="p-6 md:p-8">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                                                <HelpCircle className="h-6 w-6 text-primary" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-4">
                                                    <h3
                                                        className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors"
                                                        itemProp="name"
                                                    >
                                                        {faq.question}
                                                    </h3>
                                                    <div className="flex-shrink-0 mt-1">
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-5 w-5 text-primary" />
                                                        ) : (
                                                            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        )}
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div
                                                        className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300"
                                                        itemScope
                                                        itemProp="acceptedAnswer"
                                                        itemType="https://schema.org/Answer"
                                                    >
                                                        <p
                                                            className="text-muted-foreground leading-relaxed"
                                                            itemProp="text"
                                                        >
                                                            {faq.answer}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
};

export default FAQSection;
