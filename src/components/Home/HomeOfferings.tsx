import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsShowcase from "@/components/Home/ProductsShowcase";
import ServicesSection from "@/components/Home/ServicesSection";
import ProjectsSection from "@/components/Home/ProjectsSection";
import { Package, Droplets, TrendingUp, Sprout } from "lucide-react";

const HomeOfferings = () => {
    return (
        <section className="py-12 sm:py-20 bg-background border-t border-border relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-5xl mx-auto mb-8 sm:mb-14">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 sm:mb-5 leading-tight tracking-tight">
                        <span className="block">Everything You Need</span>
                        <span className="block text-primary">To Grow</span>
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                        Premium irrigation products, expert installation, and ongoing support.
                    </p>
                </div>

                <Tabs defaultValue="products" className="w-full">
                    <div className="flex justify-center mb-6 sm:mb-10">
                        <TabsList className="grid w-full max-w-sm sm:max-w-lg grid-cols-4 h-auto p-1 bg-muted/50 rounded-2xl border border-border">
                            <TabsTrigger
                                value="products"
                                className="rounded-xl py-2.5 sm:py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300"
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                                    <Package className="w-4 h-4" />
                                    <span className="font-semibold text-[10px] sm:text-sm">Products</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="kits"
                                className="rounded-xl py-2.5 sm:py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300"
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                                    <Sprout className="w-4 h-4" />
                                    <span className="font-semibold text-[10px] sm:text-sm">Kits</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="services"
                                className="rounded-xl py-2.5 sm:py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300"
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                                    <Droplets className="w-4 h-4" />
                                    <span className="font-semibold text-[10px] sm:text-sm">Services</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="projects"
                                className="rounded-xl py-2.5 sm:py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300"
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="font-semibold text-[10px] sm:text-sm">Projects</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="products" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                        <div className="bg-background/50 rounded-3xl border border-border/50 overflow-hidden shadow-sm">
                            <ProductsShowcase hideHeader hideStats hideBenefits compact />
                        </div>
                    </TabsContent>

                    <TabsContent value="kits" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                        <div className="bg-background/50 rounded-3xl border border-border/50 overflow-hidden shadow-sm">
                            <ServicesSection hideHero hideMarquee hideProcess hideCTA compact />
                        </div>
                    </TabsContent>

                    <TabsContent value="services" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                        <div className="bg-background/50 rounded-3xl border border-border/50 overflow-hidden shadow-sm">
                            <ServicesSection hideHero hideMarquee hideKits compact />
                        </div>
                    </TabsContent>

                    <TabsContent value="projects" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                        <div className="bg-background/50 rounded-3xl border border-border/50 overflow-hidden shadow-sm">
                            <ProjectsSection hideHeader compact />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
};

export default HomeOfferings;
