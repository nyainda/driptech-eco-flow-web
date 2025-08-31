import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/Layout/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Products from "./pages/Products";
import Services from "./pages/Services";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import VideosPage from "./pages/VideosPage";
import About from "./pages/About";
import NewsArticle from "./pages/NewsArticle";
import Technicians from "./pages/Technicians";
import SuccessStories from "./pages/SuccessStories";
import Contact from "./pages/Contact";
import TechnicalSupport from "./pages/TechnicalSupport";
import CaseStudies from "./pages/CaseStudies";
import InstallationGuides from "@/pages/InstallationGuides";
import News from "./pages/News";
import Certifications from "./pages/Certifications";
import BlogPage from "@/components/Home/BlogPage";
import BlogPostPage from "@/components/Home/BlogPostPage";
import VideoSection from "./components/Home/VideoSection";
import VisitorTracker from "./components/Analytics/VisitorTracker";
import ScrollToTop from "@/components/common/ScrollToTop";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <VisitorTracker />
          <Routes>
            {/* Main pages */}
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />

            {/* Product routes */}
            <Route path="/products" element={<Products />} />
            <Route path="/products/:category" element={<Products />} />
            <Route path="/products/:category/:product" element={<Products />} />

            {/* Service routes */}
            <Route path="/services" element={<Services />} />
            <Route path="/services/:service" element={<Services />} />

            {/* Support and info pages */}
            <Route path="/installation-guides" element={<InstallationGuides />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/technical-support" element={<TechnicalSupport />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/success-stories" element={<SuccessStories />} />

            {/* Team and company */}
            <Route path="/team" element={<Team />} />
            <Route path="/about" element={<About />} />
            <Route path="/technicians" element={<Technicians />} />
            <Route path="/contact" element={<Contact />} />

            {/* News and certifications */}
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsArticle />} />
            <Route path="/certifications" element={<Certifications />} />

            {/* Blog routes */}
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />

            {/* Video section */}
            <Route path="/video" element={<VideoSection />} />
            <Route path="/videos" element={<VideosPage />} />

            {/* Legal pages */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ScrollToTop />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;