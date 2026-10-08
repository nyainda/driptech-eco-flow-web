import HeroSectionVibe from "@/components/Home/HeroSectionVibe";
import HomeOfferings from "@/components/Home/HomeOfferings";
import BlogSection from "@/components/Home/BlogSection";
import SuccessStoriesSection from "@/components/Home/SuccessStoriesSection";
import WhatsAppContact from "@/components/common/WhatsAppContact";
import FAQSection from "@/components/SEO/FAQSection";
import { COMMON_FAQS } from "@/lib/seo-config";
import ScrollReveal from "@/components/common/ScrollReveal";
import ProjectsSection from "@/components/Home/ProjectsSection";
import HomeKitsShowcase from "@/components/Home/HomeKitsShowcase";

const Home = () => {
  return (
    <>
      <HeroSectionVibe />
      {/* Products first — the main reason people visit */}
      <ScrollReveal>
        <HomeOfferings />
      </ScrollReveal>

      <ScrollReveal>
        <HomeKitsShowcase />
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <ProjectsSection compact />
      </ScrollReveal>

      <ScrollReveal>
        <SuccessStoriesSection />
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <BlogSection />
      </ScrollReveal>

      <FAQSection faqs={COMMON_FAQS.homepage} />
      <WhatsAppContact variant="floating" />
    </>
  );
};

export default Home;
