import HeroSection from "@/components/Home/HeroSection";
import ServicesSection from "@/components/Home/ServicesSection";
import ProductsShowcase from "@/components/Home/ProductsShowcase";
import ProjectsSection from "@/components/Home/ProjectsSection";
import BlogSection from "@/components/Home/BlogSection";
import SuccessStoriesSection from "@/components/Home/SuccessStoriesSection";
import TeamSection from "@/components/Home/TeamSection";
import PartnersSection from "@/components/Home/PartnersSection";
import ScheduleConsultation from "@/components/Home/ScheduleConsultation";
import { Button } from "@/components/ui/button";
import WhatsAppContact from "@/components/WhatsAppContact"; // Assuming WhatsAppContact is in this path

const Home = () => {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <ProductsShowcase />
      <ProjectsSection />
      <BlogSection />
      <SuccessStoriesSection />
      <PartnersSection />
      <TeamSection />
      <ScheduleConsultation>
        <Button className="w-full">Schedule Free Consultation</Button>
      </ScheduleConsultation>
      <WhatsAppContact variant="floating" />
    </>
  );
};

export default Home;