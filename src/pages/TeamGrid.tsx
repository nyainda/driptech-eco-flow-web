import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Linkedin, Mail, Phone, Users } from "lucide-react";

const TeamGrid = () => {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (team.length === 0) {
    return (
      <div className="text-center py-20">
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">
          No Team Members Available
        </h3>
        <p className="text-muted-foreground">
          Team members will be displayed here once they are added in the admin
          dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {team.map((member) => (
        <Card
          key={member.id}
          className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20"
        >
          <CardContent className="p-8 text-center">
            {/* Profile Image */}
            <div className="relative mb-6">
              {member.image_url ? (
                <img
                  src={member.image_url}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-primary/10 group-hover:border-primary/30 transition-colors"
                />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-primary/10 group-hover:border-primary/30 transition-colors">
                  <Users className="h-10 w-10 text-primary" />
                </div>
              )}
              {member.featured && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 text-xs font-semibold"
                >
                  Lead
                </Badge>
              )}
            </div>

            <h3 className="text-xl font-bold mb-2">{member.name}</h3>
            <p className="text-primary font-semibold mb-3">{member.position}</p>

            {member.bio && (
              <p className="text-sm text-muted-foreground mb-6 line-clamp-4 leading-relaxed">
                {member.bio}
              </p>
            )}

            {/* Contact Links */}
            <div className="flex justify-center gap-2">
              {member.linkedin_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/10 hover:text-primary"
                  asChild
                >
                  <a
                    href={member.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="LinkedIn Profile"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {member.email && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/10 hover:text-primary"
                  asChild
                >
                  <a href={`mailto:${member.email}`} title="Send Email">
                    <Mail className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {member.phone && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/10 hover:text-primary"
                  asChild
                >
                  <a href={`tel:${member.phone}`} title="Call">
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TeamGrid;
