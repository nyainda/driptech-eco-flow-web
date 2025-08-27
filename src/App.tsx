
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/Layout/ThemeProvider";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import VisitorTracker from "@/components/Analytics/VisitorTracker";
import Index from "./pages/Index";
import Home from "./pages/Home";
import About from "./pages/About";
import Products from "./pages/Products";
import Services from "./pages/Services";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";
import Team from "./pages/Team";
import Admin from "./pages/Admin";
import ProductCatalog from "./pages/ProductCatalog";
import CaseStudies from "./pages/CaseStudies";
import SuccessStories from "./pages/SuccessStories";
import TechnicalSupport from "./pages/TechnicalSupport";
import InstallationGuides from "./pages/InstallationGuides";
import Technicians from "./pages/Technicians";
import TeamGrid from "./pages/TeamGrid";
import VideosPage from "./pages/VideosPage";
import NotFound from "./pages/NotFound";
import BlogPage from "./components/Home/BlogPage";
import BlogPostPage from "./components/Home/BlogPostPage";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <VisitorTracker />
              <div className="min-h-screen flex flex-col bg-background">
                <Routes>
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={
                    <>
                      <Header />
                      <main className="flex-1">
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/home" element={<Home />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/products/:category" element={<ProductCatalog />} />
                          <Route path="/services" element={<Services />} />
                          <Route path="/projects" element={<Projects />} />
                          <Route path="/case-studies" element={<CaseStudies />} />
                          <Route path="/success-stories" element={<SuccessStories />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/team" element={<Team />} />
                          <Route path="/team-grid" element={<TeamGrid />} />
                          <Route path="/technical-support" element={<TechnicalSupport />} />
                          <Route path="/installation-guides" element={<InstallationGuides />} />
                          <Route path="/technicians" element={<Technicians />} />
                          <Route path="/videos" element={<VideosPage />} />
                          <Route path="/blog" element={<BlogPage />} />
                          <Route path="/blog/:slug" element={<BlogPostPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                      <Footer />
                    </>
                  } />
                </Routes>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
