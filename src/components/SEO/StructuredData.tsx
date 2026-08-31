import React from 'react';

export type SchemaType =
  | "faq"
  | "product"
  | "howto"
  | "article"
  | "breadcrumb"
  | "organization"
  | "itemlist";

export interface StructuredDataProps {
  type: SchemaType;
  data: any;
}

/**
 * Structured Data Component for generating Schema.org markup
 * Optimized for AI search engines and Google Rich Results
 */
export const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const generateSchema = () => {
    switch (type) {
      case "faq":
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity:
            data.questions?.map((q: any) => ({
              "@type": "Question",
              name: q.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: q.answer,
              },
            })) || [],
        };

      case "product":
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          name: data.name,
          description: data.description,
          image: data.image,
          brand: {
            "@type": "Brand",
            name: data.brand || "DripTech EcoFlow",
          },
          offers: {
            "@type": "Offer",
            price: data.price,
            priceCurrency: data.currency || "KES",
            availability: data.availability || "https://schema.org/InStock",
            seller: {
              "@type": "Organization",
              name: "DripTech EcoFlow",
            },
          },
          ...(data.rating && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: data.rating.value,
              reviewCount: data.rating.count,
            },
          }),
        };

      case "itemlist":
        return {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: data.name || "DripTech Irrigation Products",
          description:
            data.description ||
            "Quality irrigation products for farms in Kenya — driplines, sprinklers, pumps, filters and complete kits.",
          numberOfItems: data.items?.length || 0,
          itemListElement:
            data.items?.map((item: any, index: number) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "Product",
                name: item.name,
                description: item.description || undefined,
                image: item.image || undefined,
                url: item.url || undefined,
                brand: {
                  "@type": "Brand",
                  name: "DripTech EcoFlow",
                },
                ...(item.price != null && {
                  offers: {
                    "@type": "Offer",
                    price: item.price,
                    priceCurrency: item.currency || "KES",
                    availability: item.inStock
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                    seller: {
                      "@type": "Organization",
                      name: "DripTech EcoFlow",
                    },
                  },
                }),
              },
            })) || [],
        };

      case "howto":
        return {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: data.name,
          description: data.description,
          step:
            data.steps?.map((step: any, index: number) => ({
              "@type": "HowToStep",
              position: index + 1,
              name: step.name,
              text: step.text,
              ...(step.image && { image: step.image }),
            })) || [],
        };

      case "article":
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: data.headline,
          description: data.description,
          image: data.image,
          datePublished: data.datePublished,
          dateModified: data.dateModified || data.datePublished,
          author: {
            "@type": data.author?.type || "Person",
            name: data.author?.name || "DripTech EcoFlow",
          },
          publisher: {
            "@type": "Organization",
            name: "DripTech EcoFlow",
            logo: {
              "@type": "ImageObject",
              url: "https://www.dripstech.co.ke/driptech-logo.png",
            },
          },
        };

      case "breadcrumb":
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement:
            data.items?.map((item: any, index: number) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              item: item.url,
            })) || [],
        };

      case "organization":
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: data.name || "DripTech EcoFlow",
          url: data.url || "https://www.dripstech.co.ke",
          logo: data.logo || "https://www.dripstech.co.ke/driptech-logo.png",
          description: data.description,
          contactPoint: {
            "@type": "ContactPoint",
            telephone: data.phone || "",
            contactType: "customer service",
            email: data.email || "driptech2025@gmail.com",
          },
          ...(data.social && {
            sameAs: data.social,
          }),
        };

      default:
        return null;
    }
  };

  const schema = generateSchema();

  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default StructuredData;
