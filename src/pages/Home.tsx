import HeroSectionVibe from "@/components/Home/HeroSectionVibe";
import HomeOfferings from "@/components/Home/HomeOfferings";
import BlogSection from "@/components/Home/BlogSection";
import SuccessStoriesSection from "@/components/Home/SuccessStoriesSection";
import WhatsAppContact from "@/components/common/WhatsAppContact";
import FAQSection from "@/components/SEO/FAQSection";
import StructuredData from "@/components/SEO/StructuredData";
import { COMMON_FAQS, SEO_CONFIG } from "@/lib/seo-config";
import ScrollReveal from "@/components/common/ScrollReveal";

const Home = () => {
  return (
    <>
      <StructuredData
        type="organization"
        data={{
          name: SEO_CONFIG.siteName,
          url: SEO_CONFIG.siteUrl,
          description: SEO_CONFIG.defaultDescription,
          email: SEO_CONFIG.email,
          phone: SEO_CONFIG.phone,
        }}
      />

      <HeroSectionVibe />

      {/* Products are the centrepiece of the homepage */}
      <ScrollReveal>
        <HomeOfferings />
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <BlogSection />
      </ScrollReveal>

      <ScrollReveal>
        <SuccessStoriesSection />
      </ScrollReveal>

      <FAQSection faqs={COMMON_FAQS.homepage} />
      <WhatsAppContact variant="floating" />
    </>
  );
};

export default Home;
