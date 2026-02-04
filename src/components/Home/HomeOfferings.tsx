import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsShowcase from "@/components/Home/ProductsShowcase";
import ServicesSection from "@/components/Home/ServicesSection";
import ProjectsSection from "@/components/Home/ProjectsSection";
import { Package, Droplets, TrendingUp, Sprout } from "lucide-react";

const HomeOfferings = () => {
    return (
        <section className="py-24 bg-background border-t border-border relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-5xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-[0.9] tracking-tight">
                        <span className="block mb-2">Everything You Need</span>
                        <span className="block text-primary">To Grow</span>
                    </h2>
                    <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                        From premium irrigation products to expert installation and support.
                    </p>
                </div>

                <Tabs defaultValue="products" className="w-full">
                    <div className="flex justify-center mb-12">
                        <TabsList className="grid w-full max-w-lg grid-cols-4 h-auto p-1 bg-muted/50 rounded-full border border-border">
                            <TabsTrigger
                                value="products"
                                className="rounded-full py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300"
                            >
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    <span className="font-semibold hidden sm:inline">Products</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="kits"
                                className="rounded-full py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300"
                            >
                                <div className="flex items-center gap-2">
                                    <Sprout className="w-4 h-4" />
                                    <span className="font-semibold hidden sm:inline">Kits</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="services"
                                className="rounded-full py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300"
                            >
                                <div className="flex items-center gap-2">
                                    <Droplets className="w-4 h-4" />
                                    <span className="font-semibold hidden sm:inline">Services</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="projects"
                                className="rounded-full py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300"
                            >
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="font-semibold hidden sm:inline">Projects</span>
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
