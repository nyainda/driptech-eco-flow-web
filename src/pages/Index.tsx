
import { ThemeProvider } from "@/components/Layout/ThemeProvider";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Home from "./Home";

const Index = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main>
          <Home />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default Index;
