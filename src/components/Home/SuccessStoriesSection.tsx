import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Award, Building } from "lucide-react";
import { Link } from "react-router-dom";

const SuccessStoriesSection = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from("success_stories")
          .select("*")
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(3);

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
    <section className="py-20 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 bg-muted text-foreground border-border">
            <Award className="w-4 h-4 mr-2" />
            Success Stories
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Proven
            <span className="text-primary">Results</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            See how our irrigation solutions have transformed agricultural
            operations and delivered exceptional results for our clients.
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={index}
                className="bg-background border-border shadow-lg"
              >
                <CardContent className="p-0">
                  <div className="animate-pulse">
                    <div className="aspect-[16/10] bg-muted rounded-t-lg"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-20 bg-muted rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : stories.length > 0 ? (
            stories.map((story) => (
              <Card
                key={story.id}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-background border-border shadow-lg overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    {story.image_url || story.after_image ? (
                      <img
                        src={story.image_url || story.after_image}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Award className="w-16 h-16 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {story.title}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Building className="w-4 h-4 text-primary" />
                        <span>{story.client_name}</span>
                        {story.client_company && (
                          <>
                            <span>•</span>
                            <span>{story.client_company}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {story.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {story.description}
                      </p>
                    )}

                    {story.results && (
                      <div className="bg-muted/30 rounded-lg p-3 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            Results
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {story.results}
                        </p>
                      </div>
                    )}

                    {/* CTA */}
                    <Link to="/success-stories">
                      <Button
                        variant="ghost"
                        className="w-full hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                      >
                        Read Full Story
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-background">
              <p className="text-foreground mb-4 text-lg">
                No featured success stories available at the moment.
              </p>
              <p className="text-sm text-muted-foreground">
                Success stories can be marked as featured in the admin
                dashboard.
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mb-12">
          <Link to="/success-stories">
            <Button
              size="lg"
              className="px-10 py-4 text-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 rounded-xl shadow-md group"
            >
              <Award className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              View All Success Stories
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Divider */}
        <hr className="border-border w-full max-w-3xl mx-auto mt-12" />
      </div>
    </section>
  );
};

export default SuccessStoriesSection;
