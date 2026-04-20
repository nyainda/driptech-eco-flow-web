import { useNavigate } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Briefcase, Mail, Clock, Rocket } from "lucide-react";

const Careers = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <div className="container mx-auto px-4 text-center">
                        <Button
                            variant="outline"
                            className="mb-8"
                            onClick={() => navigate(-1)}
                            aria-label="Go back to previous page"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go Back
                        </Button>

                        <div className="max-w-4xl mx-auto">
                            <Badge variant="secondary" className="mb-6">
                                <Briefcase className="w-4 h-4 mr-2" />
                                Join Our Team
                            </Badge>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                                <span className="text-accent">Coming Soon</span>
                            </h1>

                            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
                                We're building something amazing! Our careers page will be
                                launching soon with exciting opportunities to join the DripTech
                                EcoFlow team.
                            </p>

                            {/* Feature Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                    <CardContent className="p-6 text-center">
                                        <div className="p-3 bg-primary/10 rounded-xl inline-block mb-4">
                                            <Rocket className="h-8 w-8 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">
                                            Innovation
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Work on cutting-edge irrigation technology
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                    <CardContent className="p-6 text-center">
                                        <div className="p-3 bg-primary/10 rounded-xl inline-block mb-4">
                                            <Clock className="h-8 w-8 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">
                                            Growth
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Develop your skills with industry leaders
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                    <CardContent className="p-6 text-center">
                                        <div className="p-3 bg-primary/10 rounded-xl inline-block mb-4">
                                            <Mail className="h-8 w-8 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">
                                            Impact
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Make a difference in sustainable agriculture
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Contact CTA */}
                            <Card className="mt-16 max-w-2xl mx-auto">
                                <CardContent className="p-8 text-center">
                                    <h2 className="text-2xl font-bold mb-4">
                                        Interested in joining us?
                                    </h2>
                                    <p className="text-muted-foreground mb-6">
                                        coming soon
                                    </p>
                                    <Button
                                        size="lg"
                                        onClick={() =>
                                            (window.location.href = "mailto:info@dripstech.co.ke")
                                        }
                                    >
                                        <Mail className="mr-2 h-5 w-5" />
                                        info@dripstech.co.ke
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>
            <IrrigationKeywords />

            <Footer />
        </div>
    );
};

export default Careers;