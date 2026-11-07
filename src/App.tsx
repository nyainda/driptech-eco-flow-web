import { HelmetProvider } from 'react-helmet-async'; // Add this import
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/Layout/ThemeProvider";
import { lazy, Suspense } from "react";
import LoadingSpinner from "./components/common/LoadingSpinner";
import useWebVitals from "./hooks/useWebVitals";

// Homepage is eager-loaded for faster LCP; other routes stay lazy
import Index from "./pages/Index";

const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const Products = lazy(() => import("./pages/Products"));
const Services = lazy(() => import("./pages/Services"));
const Projects = lazy(() => import("./pages/Projects"));
const Team = lazy(() => import("./pages/Team"));
const VideosPage = lazy(() => import("./pages/VideosPage"));
const About = lazy(() => import("./pages/About"));
const NewsArticle = lazy(() => import("./pages/NewsArticle"));
const SuccessStories = lazy(() => import("./pages/SuccessStories"));
const Contact = lazy(() => import("./pages/Contact"));
const TechnicalSupport = lazy(() => import("./pages/TechnicalSupport"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const InstallationGuides = lazy(() => import("@/pages/InstallationGuides"));
const News = lazy(() => import("./pages/News"));
const Certifications = lazy(() => import("./pages/Certifications"));
const BlogPage = lazy(() => import("@/components/Home/BlogPage"));
const BlogPostPage = lazy(() => import("@/components/Home/BlogPostPage"));
const VideoSection = lazy(() => import("./components/Home/VideoSection"));
const VisitorTracker = lazy(() => import("./components/Analytics/VisitorTracker"));
const WhatsAppClickTracker = lazy(() => import("./components/Analytics/WhatsAppClickTracker"));
const ScrollToTop = lazy(() => import("@/components/common/ScrollToTop"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const IrrigationKits = lazy(() => import("@/pages/IrrigationKits"));
const Careers = lazy(() => import("./pages/Careers"));
const TechnicianServices = lazy(() => import("./pages/TechnicianServices"));
const SEOContentPage = lazy(() => import("./pages/SEOContentPage"));
const BlueDigitalSolutions = lazy(() => import("./pages/BlueDigitalSolutions"));
const IrrigationCostCalculator = lazy(() => import("./pages/IrrigationCostCalculator"));

const queryClient = new QueryClient();

const App = () => {
  // Monitor Web Vitals in production
  // Temporarily disabled due to React hook error
  // useWebVitals((metric) => {
  //   // Log to console in development
  //   if (import.meta.env.DEV) {
  //     console.log(`📊 ${metric.name}:`, metric);
  //   }
  //   // In production, you could send to analytics
  //   // analytics.send(metric);
  // });

  return (
    <HelmetProvider> {/* Add HelmetProvider here */}
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <VisitorTracker />
              <WhatsAppClickTracker />
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Main pages */}
                  <Route path="/blue-digital-solutions" element={<BlueDigitalSolutions />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/admin" element={<Admin />} />

                  {/* Product routes */}
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:category" element={<Products />} />
                  <Route path="/products/:category/:product" element={<Products />} />
                  <Route path="/catalog" element={<Products />} /> {/* Redirect to Products */}
                  <Route path="/irrigation-cost-calculator-kenya" element={<IrrigationCostCalculator />} />
                  <Route path="/drip-irrigation-kenya" element={<SEOContentPage />} />
                  <Route path="/drip-irrigation-kit-price-kenya" element={<SEOContentPage />} />
                  <Route path="/driplines-for-sale-kenya" element={<SEOContentPage />} />
                  <Route path="/sprinkler-systems-kenya" element={<SEOContentPage />} />
                  <Route path="/drip-irrigation-for-tomatoes-kenya" element={<SEOContentPage />} />
                  <Route path="/drip-irrigation-for-onions-kenya" element={<SEOContentPage />} />
                  <Route path="/irrigation-water-filters-kenya" element={<SEOContentPage />} />
                  <Route path="/drip-irrigation-for-potatoes-kenya" element={<SEOContentPage />} />
                  <Route path="/drip-irrigation-for-capsicum-kenya" element={<SEOContentPage />} />
                  <Route path="/drip-irrigation-for-cabbage-kenya" element={<SEOContentPage />} />
                  <Route path="/drip-irrigation-for-watermelon-kenya" element={<SEOContentPage />} />
                  <Route path="/drip-irrigation-for-avocado-kenya" element={<SEOContentPage />} />
                  <Route path="/drip-vs-sprinkler-irrigation-kenya" element={<SEOContentPage />} />
                  <Route path="/drip-irrigation-for-coffee-kenya" element={<SEOContentPage />} />
                  <Route path="/drip-irrigation-for-maize-kenya" element={<SEOContentPage />} />
                  <Route path="/greenhouse-irrigation-systems-kenya" element={<SEOContentPage />} />
                  <Route path="/irrigation-system-cost-kenya" element={<SEOContentPage />} />
                  <Route path="/one-acre-drip-irrigation-system-kenya" element={<SEOContentPage />} />
                  <Route path="/how-to-choose-dripline-spacing-kenya" element={<SEOContentPage />} />
                  <Route path="/irrigation-pump-sizing-kenya" element={<SEOContentPage />} />
                  <Route path="/irrigation-system-maintenance-kenya" element={<SEOContentPage />} />
                  <Route path="/irrigation-troubleshooting-kenya" element={<SEOContentPage />} />
                  <Route path="/blocked-drippers-uneven-watering-kenya" element={<SEOContentPage />} />
                  <Route path="/low-irrigation-pressure-sprinklers-kenya" element={<SEOContentPage />} />
                  <Route path="/irrigation-pipe-leaks-fittings-kenya" element={<SEOContentPage />} />
                  <Route path="/irrigation-filter-pump-problems-kenya" element={<SEOContentPage />} />
                  <Route path="/drip-tape-vs-dripline-kenya" element={<SEOContentPage />} />
                  <Route path="/solar-irrigation-pumps-kenya" element={<SEOContentPage />} />
                  <Route path="/borehole-water-pumps-kenya" element={<SEOContentPage />} />
                  <Route path="/water-storage-tanks-kenya" element={<SEOContentPage />} />
                  <Route path="/greenhouse-drip-irrigation-kenya" element={<SEOContentPage />} />
                  <Route path="/fertigation-systems-kenya" element={<SEOContentPage />} />
                  <Route path="/irrigation-companies-kenya" element={<SEOContentPage />} />
                  <Route path="/irrigation-design-consultation-kenya" element={<SEOContentPage />} />
                  <Route path="/irrigation-areas-kenya" element={<SEOContentPage />} />
                  <Route path="/irrigation-systems-nairobi" element={<SEOContentPage />} />
                  <Route path="/irrigation-systems-kisumu" element={<SEOContentPage />} />
                  <Route path="/irrigation-systems-nakuru" element={<SEOContentPage />} />
                  <Route path="/irrigation-systems-nanyuki-laikipia" element={<SEOContentPage />} />
                  <Route path="/irrigation-systems-eldoret-uasin-gishu" element={<SEOContentPage />} />
                  <Route path="/irrigation-systems-meru" element={<SEOContentPage />} />
                  <Route path="/irrigation-systems-nyeri" element={<SEOContentPage />} />
                  <Route path="/irrigation-systems-mwea-kirinyaga" element={<SEOContentPage />} />
                  <Route path="/irrigation-systems-machakos" element={<SEOContentPage />} />
                  <Route path="/irrigation-systems-kajiado" element={<SEOContentPage />} />
                  <Route path="/irrigation-systems-kilifi" element={<SEOContentPage />} />
                  <Route path="/irrigation-quotation-checklist-kenya" element={<SEOContentPage />} />

                  {/* Service routes */}
                  <Route path="/services" element={<Services />} />
                  <Route path="/services/:service" element={<Services />} />
                  <Route path="/technician-services" element={<TechnicianServices />} />
                  <Route path="/book-technician" element={<TechnicianServices />} />

                  {/* Support and info pages */}
                  <Route path="/installation-guides" element={<InstallationGuides />} />
                  <Route path="/case-studies" element={<CaseStudies />} />
                  <Route path="/technical-support" element={<TechnicalSupport />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/success-stories" element={<SuccessStories />} />

                  {/* Team and company */}
                  <Route path="/team" element={<Team />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/technicians" element={<Team />} /> {/* Consolidation: use Team for Technicians too if appropriate, or keep Technicians separate but I'll keep it for now but the user said "clean up on stuff not need" */}
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/careers" element={<Careers />} />

                  {/* News and certifications */}
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:slug" element={<NewsArticle />} />
                  <Route path="/certifications" element={<Certifications />} />

                  {/* Irrigation Kits */}
                  <Route path="/irrigation-kits" element={<IrrigationKits />} />

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

                  {/* Resolve any remaining single-segment authored SEO slug from the SEO manifest. Static routes above take precedence; unknown slugs render the SEO page 404 state. */}
                  <Route path="/:seoSlug" element={<SEOContentPage />} />

                  {/* Catch-all route for 404 */}
                  {/* Any authored SEO guide not listed above. SEOContentPage looks the slug up in the guide data and renders the real 404 when there is no match. */}
                  <Route path="/:slug" element={<SEOContentPage />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <ScrollToTop />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
