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
    <section className="py-12 sm:py-16 md:py-20 bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
          <Badge className="mb-3 sm:mb-4 bg-muted text-foreground border-border text-xs sm:text-sm">
            <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Success Stories
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 px-2">
            Proven{" "}
            <span className="text-primary">Results</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed px-4">
            See how our irrigation solutions have transformed agricultural
            operations and delivered exceptional results for our clients.
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={index}
                className="bg-background border-border shadow-md sm:shadow-lg"
              >
                <CardContent className="p-0">
                  <div className="animate-pulse">
                    <div className="aspect-[16/10] bg-muted rounded-t-lg"></div>
                    <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                      <div className="h-5 sm:h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-3 sm:h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-16 sm:h-20 bg-muted rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : stories.length > 0 ? (
            stories.map((story) => (
              <Card
                key={story.id}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 bg-background border-border shadow-md sm:shadow-lg overflow-hidden"
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
                        <Award className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {story.title}
                      </h3>

                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 flex-wrap">
                        <Building className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <span className="line-clamp-1">{story.client_name}</span>
                        {story.client_company && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="line-clamp-1 hidden sm:inline">{story.client_company}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {story.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {story.description}
                      </p>
                    )}

                    {story.results && (
                      <div className="bg-muted/30 rounded-lg p-2.5 sm:p-3 border border-border">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium text-foreground">
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
                        className="w-full hover:bg-accent hover:text-accent-foreground transition-all duration-300 text-xs sm:text-sm h-9 sm:h-10"
                      >
                        Read Full Story
                        <ArrowRight className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8 sm:py-10 md:py-12 bg-background px-4">
              <p className="text-foreground mb-3 sm:mb-4 text-base sm:text-lg">
                No featured success stories available at the moment.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Success stories can be marked as featured in the admin
                dashboard.
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12 px-4">
          <Link to="/success-stories">
            <Button
              size="lg"
              className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 text-sm sm:text-base md:text-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 rounded-xl shadow-md group w-full sm:w-auto"
            >
              <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 group-hover:scale-110 transition-transform" />
              View All Success Stories
              <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Divider */}
        <hr className="border-border w-full max-w-3xl mx-auto mt-8 sm:mt-10 md:mt-12" />
      </div>
    </section>
  );
};

export default SuccessStoriesSection;