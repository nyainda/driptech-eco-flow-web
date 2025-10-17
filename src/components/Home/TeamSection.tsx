import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Linkedin, Mail, Phone, Users, ArrowRight } from "lucide-react";

// Define types for team member
interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio?: string;
  image_url?: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
}

// Skeleton component for loading state
const TeamMemberSkeleton = () => (
  <Card className="bg-background border-border shadow-lg overflow-hidden">
    <CardContent className="p-0">
      <div className="animate-pulse">
        <div className="aspect-square bg-muted rounded-t-lg" />
        <div className="p-8 space-y-4">
          <div className="space-y-3">
            <div className="h-6 bg-muted rounded-lg w-3/4" />
            <div className="h-4 bg-muted rounded-md w-1/2" />
          </div>
          <div className="h-20 bg-muted rounded-lg" />
          <div className="flex gap-2 pt-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="w-8 h-8 bg-muted rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Team member card component
const TeamMemberCard = ({
  member,
  index,
}: {
  member: TeamMember;
  index: number;
}) => (
  <Card
    className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-background border-border shadow-lg overflow-hidden"
    style={{ animationDelay: `${index * 150}ms` }}
  >
    <CardContent className="p-0">
      <div className="aspect-square overflow-hidden bg-muted relative">
        {member.image_url ? (
          <img
            src={member.image_url}
            alt={member.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-20 h-20 text-primary" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-8 space-y-5">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
            {member.name}
          </h3>
          <p className="text-primary font-semibold text-sm uppercase tracking-wide">
            {member.position}
          </p>
        </div>

        {member.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
            {member.bio}
          </p>
        )}

        <div className="flex gap-3 pt-4">
          {member.linkedin_url && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full bg-muted/30 border border-border hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-105 shadow-md"
              asChild
            >
              <a
                href={member.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-4 w-4 text-primary" />
              </a>
            </Button>
          )}
          {member.email && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full bg-muted/30 border border-border hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-105 shadow-md"
              asChild
            >
              <a href={`mailto:${member.email}`}>
                <Mail className="h-4 w-4 text-primary" />
              </a>
            </Button>
          )}
          {member.phone && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full bg-muted/30 border border-border hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-105 shadow-md"
              asChild
            >
              <a href={`tel:${member.phone}`}>
                <Phone className="h-4 w-4 text-primary" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Empty state component
const EmptyTeamState = () => (
  <div className="col-span-full text-center py-16 bg-background">
    <div className="max-w-md mx-auto">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
        <Users className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">
        No Team Members Yet
      </h3>
      <p className="text-muted-foreground mb-2 text-lg">
        No featured team members available at the moment.
      </p>
      <p className="text-sm text-muted-foreground">
        Team members can be marked as featured in the admin dashboard.
      </p>
    </div>
  </div>
);

const TeamSection = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data, error } = await supabase
          .from("team")
          .select("*")
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(4);

        if (error) throw error;
        setTeam(data ?? []);
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  return (
    <section className="py-24 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <Badge className="mb-4 bg-muted text-foreground border-border">
            <Users className="w-4 h-4 mr-2" />
            Our Team
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight">
            Meet the <span className="text-primary">Experts</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Our experienced team of irrigation specialists, engineers, and
            consultants are here to help you achieve{" "}
            <span className="text-foreground font-medium">optimal results</span>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <TeamMemberSkeleton key={index} />
            ))
          ) : team.length > 0 ? (
            team.map((member, index) => (
              <TeamMemberCard key={member.id} member={member} index={index} />
            ))
          ) : (
            <EmptyTeamState />
          )}
        </div>

        <div className="text-center mb-12">
          <Button
            asChild
            size="lg"
            className="px-10 py-4 text-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 rounded-xl shadow-md group"
          >
            <Link to="/team">
              <Users className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Meet Our Full Team
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <hr className="border-border w-full max-w-3xl mx-auto mt-12" />
      </div>
    </section>
  );
};

export default TeamSection;
