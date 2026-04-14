import HeroSectionVibe from "@/components/Home/HeroSectionVibe";
import HomeOfferings from "@/components/Home/HomeOfferings";
import BlogSection from "@/components/Home/BlogSection";
import SuccessStoriesSection from "@/components/Home/SuccessStoriesSection";
import BookSiteVisit from "@/components/Home/BookSiteVisit";
import ScheduleConsultation from "@/components/Home/ScheduleConsultation";
import { Button } from "@/components/ui/button";
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
        <BookSiteVisit />
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <BlogSection />
      </ScrollReveal>

      <ScrollReveal>
        <SuccessStoriesSection />
      </ScrollReveal>

      <FAQSection faqs={COMMON_FAQS.homepage} />
      <ScheduleConsultation>
        <Button className="w-full">Schedule Free Consultation</Button>
      </ScheduleConsultation>
      <WhatsAppContact variant="floating" />
    </>
  );
};

export default Home;