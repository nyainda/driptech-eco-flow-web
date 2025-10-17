import { Helmet } from "react-helmet-async";

interface ProductSchemaProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    images?: string[];
    category?: string;
    inStock?: boolean;
    features?: string[];
  };
}

export default function ProductSchema({ product }: ProductSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description ||
      `${product.name} - Professional irrigation solution from DripTech`,
    image:
      product.images && product.images.length > 0
        ? product.images[0]
        : "https://www.dripstech.co.ke/default-product.jpg",
    brand: {
      "@type": "Brand",
      name: "DripTech",
    },
    offers: {
      "@type": "Offer",
      price: product.price || 0,
      priceCurrency: "KES",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "DripTech",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
    },
    category: product.category || "Irrigation System",
  };

  if (product.features && product.features.length > 0) {
    schema["additionalProperty"] = product.features.map((feature) => ({
      "@type": "PropertyValue",
      name: "Feature",
      value: feature,
    }));
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
