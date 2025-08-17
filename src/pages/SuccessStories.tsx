import { useState, useEffect } from "react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Building, TrendingUp, Award, ArrowRight } from "lucide-react";

const SuccessStories = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from("success_stories")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setStories(data || []);
      } catch (error) {
        console.error("Error fetching success stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">🏆 Success Stories</Badge>
            <h1 className="text-5xl font-bold mb-4">
              Real Results from <span className="text-primary">Real Customers</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover how our irrigation solutions have transformed farms, boosted yields, and improved lives globally.
            </p>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-6 space-y-4">
                      <div className="h-48 bg-muted rounded-lg"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {stories.map((story) => (
                  <Card
                    key={story.id}
                    className="group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
                  >
                    {/* Image */}
                    {story.image_url ? (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={story.image_url}
                          alt={story.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video flex items-center justify-center bg-muted">
                        <Award className="h-10 w-10 text-primary" />
                      </div>
                    )}

                    {/* Content */}
                    <CardContent className="p-6 flex flex-col flex-grow">
                      {story.featured && (
                        <Badge variant="secondary" className="mb-3">⭐ Featured Story</Badge>
                      )}

                      <h3 className="text-xl font-semibold mb-2">{story.title}</h3>

                      <div className="flex items-center gap-2 text-muted-foreground mb-3">
                        <Building className="h-4 w-4" />
                        <span className="text-sm">
                          {story.client_name}
                          {story.client_company && ` - ${story.client_company}`}
                        </span>
                      </div>

                      {/* Description */}
                      {story.description && (
                        <div className="text-sm text-muted-foreground mb-4 max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                          {story.description}
                        </div>
                      )}

                      {/* Results Achieved */}
                      {story.results && (
                        <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/5 to-secondary/10 p-5 shadow-sm mb-4">
                          <div className="flex items-center gap-3 mb-3">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <h4 className="text-md font-semibold text-primary tracking-wide">
                              Results Achieved
                            </h4>
                          </div>

                          <div className="max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                              {story.results}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-auto">
                        <Button
                          variant="outline"
                          className="w-full transition-all group-hover:bg-primary group-hover:text-primary-foreground"
                        >
                          Read Full Story
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Success Stories Yet</h3>
                <p className="text-muted-foreground">
                  Stories will appear here once available from our community.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SuccessStories;
