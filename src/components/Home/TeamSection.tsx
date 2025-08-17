import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Linkedin, Mail, Phone, Users, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const TeamSection = () => {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data, error } = await supabase
          .from('team')
          .select('*')
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) throw error;
        setTeam(data || []);
      } catch (error) {
        console.error('Error fetching team:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  return (
    <section className="relative py-24 bg-gradient-to-br from-background via-muted/30 to-background overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,_theme(colors.primary)_0%,_transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_75%_75%,_theme(colors.accent)_0%,_transparent_50%)]"></div>
      </div>
      
      <div className="container mx-auto px-4 relative">
        {/* Enhanced Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors">
              <Users className="w-4 h-4 mr-2" />
              Our Team
            </Badge>
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight">
            Meet the{" "}
            <span className="relative inline-block">
              <span className="text-primary">Experts</span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full"></div>
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Our experienced team of irrigation specialists, engineers, and consultants are here to help you achieve{" "}
            <span className="text-foreground font-medium">optimal results</span>.
          </p>
        </div>

        {/* Enhanced Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {loading ? (
            // Enhanced Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="animate-pulse">
                    <div className="aspect-square bg-gradient-to-br from-muted via-muted/50 to-muted/30 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-muted/80 to-transparent"></div>
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="space-y-3">
                        <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                        <div className="h-4 bg-muted/70 rounded-md w-1/2"></div>
                      </div>
                      <div className="h-20 bg-muted/50 rounded-lg"></div>
                      <div className="flex gap-2 pt-2">
                        <div className="w-8 h-8 bg-muted/70 rounded-md"></div>
                        <div className="w-8 h-8 bg-muted/70 rounded-md"></div>
                        <div className="w-8 h-8 bg-muted/70 rounded-md"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : team.length > 0 ? (
            team.map((member, index) => (
              <Card 
                key={member.id} 
                className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 shadow-lg overflow-hidden bg-card/90 backdrop-blur-sm relative"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardContent className="p-0 relative">
                  {/* Enhanced Photo Section */}
                  <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5">
                    {member.image_url ? (
                      <>
                        <img 
                          src={member.image_url} 
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
                        <div className="relative">
                          <Users className="w-20 h-20 text-muted-foreground/60 group-hover:text-primary/60 transition-colors duration-300" />
                          <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Floating Badge */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <div className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-full p-2 shadow-lg">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Content */}
                  <div className="p-8 space-y-5">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                        {member.name}
                      </h3>
                      <div className="relative">
                        <p className="text-primary font-semibold text-sm uppercase tracking-wide">
                          {member.position}
                        </p>
                        <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-500"></div>
                      </div>
                    </div>

                    {member.bio && (
                      <div className="relative">
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 group-hover:text-foreground/80 transition-colors duration-300">
                          {member.bio}
                        </p>
                      </div>
                    )}

                    {/* Enhanced Contact Links */}
                    <div className="flex gap-3 pt-4">
                      {member.linkedin_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg border border-border/30 hover:border-blue-200 dark:hover:border-blue-800"
                          asChild
                        >
                          <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {member.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 rounded-full hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/50 dark:hover:text-green-400 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg border border-border/30 hover:border-green-200 dark:hover:border-green-800"
                          asChild
                        >
                          <a href={`mailto:${member.email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {member.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 rounded-full hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50 dark:hover:text-purple-400 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg border border-border/30 hover:border-purple-200 dark:hover:border-purple-800"
                          asChild
                        >
                          <a href={`tel:${member.phone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">No Team Members Yet</h3>
                <p className="text-muted-foreground mb-2">No featured team members available at the moment.</p>
                <p className="text-sm text-muted-foreground/80">Team members can be marked as featured in the admin dashboard.</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced CTA */}
        <div className="text-center">
          <Link to="/team">
            <Button 
              variant="outline" 
              size="lg" 
              className="group relative px-8 py-4 text-base font-semibold bg-background/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <span className="relative z-10 flex items-center">
                Meet Our Full Team
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
              
              {/* Button Glow Effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;