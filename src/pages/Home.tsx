import HeroSection from "@/components/Home/HeroSection";
import ServicesSection from "@/components/Home/ServicesSection";
import ProductsShowcase from "@/components/Home/ProductsShowcase";
import ProjectsSection from "@/components/Home/ProjectsSection";
import BlogSection from "@/components/Home/BlogSection";
import VideoSection from "@/components/Home/VideoSection";
import SuccessStoriesSection from "@/components/Home/SuccessStoriesSection";
import TeamSection from "@/components/Home/TeamSection";
import ScheduleConsultation from "@/components/Home/ScheduleConsultation";
import { Button } from "@/components/ui/button";

const Home = () => {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <ProductsShowcase />
      <ProjectsSection />
      <VideoSection />
      <BlogSection />
      <SuccessStoriesSection />
      <TeamSection />
      <ScheduleConsultation>
        <Button className="w-full">Schedule Free Consultation</Button>
      </ScheduleConsultation>
    </>
  );
};

export default Home;
