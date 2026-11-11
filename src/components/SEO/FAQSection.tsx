import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
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
            <section className={`dt-section bg-background border-t border-border ${className}`}>
                <div className="dt-container">
                    <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
                        <p className="dt-section-label mb-3">Questions</p>
                        <h2 className="dt-section-title">
                            {title === "Frequently Asked Questions" ? (
                                <>
                                    Common questions about{" "}
                                    <span className="text-primary">our products</span>
                                </>
                            ) : (
                                title
                            )}
                        </h2>
                        <p className="dt-section-subtitle mx-auto mt-3">
                            Straight answers on kits, driplines, install and delivery in Kenya.
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

                                                <div
                                                    hidden={!isExpanded}
                                                    aria-hidden={!isExpanded}
                                                    className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300"
                                                >
                                                    <p
                                                        className="text-muted-foreground leading-relaxed"
                                                    >
                                                        {faq.answer}
                                                    </p>
                                                </div>
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
