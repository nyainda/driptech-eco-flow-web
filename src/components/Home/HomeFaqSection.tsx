import FAQSection from "@/components/SEO/FAQSection";
import { COMMON_FAQS } from "@/lib/seo-config";

const HomeFaqSection = () => {
  return (
    <FAQSection
      title="Questions before you choose?"
      faqs={COMMON_FAQS.homepage}
      className="py-7 sm:py-14"
    />
  );
};

export default HomeFaqSection;
