import { useState, useEffect } from "react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Linkedin,
  Mail,
  Phone,
  Users,
  Star,
  Sparkles,
  Crown,
} from "lucide-react";

const Team = () => {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength).trim() + "...";
  };

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data, error } = await supabase
          .from("team")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTeam(data || []);
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative">
        {/* Hero Section */}
        <section className="relative py-32 bg-gradient-to-br from-primary/10 via-background to-accent/5 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-3 mb-8">
              <Badge
                variant="secondary"
                className="px-6 py-3 text-base font-semibold bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors"
              >
                <Users className="w-5 h-5 mr-2" />
                Our Team
              </Badge>
              <div className="flex gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
                <Star
                  className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <Star
                  className="w-3 h-3 text-yellow-400 fill-yellow-400 animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              Meet Our
              <br />
              <span className="relative inline-block">
                <span className="text-primary">Expert Team</span>
                <div className="absolute -bottom-3 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full"></div>
                <Sparkles
                  className="absolute -top-8 -right-8 w-8 h-8 text-primary animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
              Our experienced professionals are dedicated to delivering{" "}
              <span className="text-foreground font-semibold">
                innovative irrigation solutions
              </span>{" "}
              and exceptional service.
            </p>

            {/* Stats or Additional Info */}
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-2xl px-6 py-4 shadow-lg">
                <div className="text-2xl font-bold text-primary">
                  {team.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Team Members
                </div>
              </div>
              <div className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-2xl px-6 py-4 shadow-lg">
                <div className="text-2xl font-bold text-primary">
                  {team.filter((m) => m.featured).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Lead Experts
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Grid */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card
                    key={index}
                    className="border-0 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-8">
                      <div className="animate-pulse space-y-6">
                        {/* Profile Image Skeleton */}
                        <div className="relative mx-auto w-28 h-28">
                          <div className="w-full h-full bg-gradient-to-br from-muted via-muted/50 to-muted/30 rounded-full"></div>
                          <div className="absolute -top-2 -right-2 w-8 h-6 bg-muted/70 rounded-full"></div>
                        </div>

                        {/* Content Skeleton */}
                        <div className="space-y-3 text-center">
                          <div className="h-6 bg-muted rounded-lg w-3/4 mx-auto"></div>
                          <div className="h-4 bg-muted/70 rounded-md w-1/2 mx-auto"></div>
                          <div className="h-16 bg-muted/50 rounded-lg"></div>
                        </div>

                        {/* Buttons Skeleton */}
                        <div className="flex justify-center gap-3">
                          <div className="w-10 h-10 bg-muted/70 rounded-full"></div>
                          <div className="w-10 h-10 bg-muted/70 rounded-full"></div>
                          <div className="w-10 h-10 bg-muted/70 rounded-full"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : team.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {team.map((member, index) => (
                  <Card
                    key={member.id}
                    className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 border-0 shadow-lg overflow-hidden bg-card/90 backdrop-blur-sm relative"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <CardContent className="p-8 text-center relative">
                      {/* Enhanced Profile Image */}
                      <div className="relative mb-8">
                        <div className="relative mx-auto w-28 h-28">
                          {member.image_url ? (
                            <>
                              <img
                                src={member.image_url}
                                alt={member.name}
                                className="w-full h-full rounded-full object-cover border-4 border-background shadow-xl group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </>
                          ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center border-4 border-background shadow-xl group-hover:scale-110 transition-transform duration-500">
                              <Users className="h-12 w-12 text-primary/60 group-hover:text-primary transition-colors duration-300" />
                            </div>
                          )}

                          {/* Floating Ring Effect */}
                          <div className="absolute inset-0 rounded-full border-2 border-primary/20 scale-125 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-700"></div>
                        </div>

                        {/* Enhanced Featured Badge */}
                        {member.featured && (
                          <div className="absolute -top-3 -right-3 group-hover:scale-110 transition-transform duration-300">
                            <Badge
                              variant="secondary"
                              className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-lg flex items-center gap-1"
                            >
                              <Crown className="w-3 h-3" />
                              Lead
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Content */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                            {member.name}
                          </h3>
                          <div className="relative">
                            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-4">
                              {member.position}
                            </p>
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-20 transition-all duration-500"></div>
                          </div>
                        </div>

                        {member.bio && (
                          <div className="relative group/bio">
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                              <span className="group-hover/bio:hidden">
                                {truncateText(member.bio)}
                              </span>
                              <span className="hidden group-hover/bio:inline">
                                {member.bio}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Contact Links */}
                      <div className="flex justify-center gap-3 pt-6">
                        {member.linkedin_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-xl border border-border/30 hover:border-blue-200 dark:hover:border-blue-800 group/btn"
                            asChild
                          >
                            <a
                              href={member.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Linkedin className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-200" />
                            </a>
                          </Button>
                        )}
                        {member.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 rounded-full hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/50 dark:hover:text-green-400 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-xl border border-border/30 hover:border-green-200 dark:hover:border-green-800 group/btn"
                            asChild
                          >
                            <a href={`mailto:${member.email}`}>
                              <Mail className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-200" />
                            </a>
                          </Button>
                        )}
                        {member.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 rounded-full hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50 dark:hover:text-purple-400 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-xl border border-border/30 hover:border-purple-200 dark:hover:border-purple-800 group/btn"
                            asChild
                          >
                            <a href={`tel:${member.phone}`}>
                              <Phone className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-200" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <div className="max-w-md mx-auto">
                  <div className="relative mb-8">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center shadow-xl">
                      <Users className="w-16 h-16 text-muted-foreground" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-muted/20 scale-110 animate-pulse"></div>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    No Team Members Available
                  </h3>
                  <p className="text-lg text-muted-foreground mb-2">
                    Team members will be displayed here once they are added.
                  </p>
                  <p className="text-sm text-muted-foreground/80">
                    Use the admin dashboard to add and manage team members.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Team;
