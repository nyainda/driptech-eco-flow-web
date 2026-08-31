import HeroSectionVibe from "@/components/Home/HeroSectionVibe";
import HomeOfferings from "@/components/Home/HomeOfferings";
import BlogSection from "@/components/Home/BlogSection";
import SuccessStoriesSection from "@/components/Home/SuccessStoriesSection";
import WhatsAppContact from "@/components/common/WhatsAppContact";
import FAQSection from "@/components/SEO/FAQSection";
import { COMMON_FAQS } from "@/lib/seo-config";
import ScrollReveal from "@/components/common/ScrollReveal";

const Home = () => {
  return (
    <>
      <HeroSectionVibe />

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
