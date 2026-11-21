import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Breadcrumbs from "@/components/Layout/Breadcrumbs";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import SEOHead from "@/components/common/SEOHead";
import { VideoCard } from "@/components/Video/VideoCard";
import { VideoPlayerModal } from "@/components/Video/VideoPlayerModal";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { dataService } from "@/services/dataService";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import { buildOrganizationSchema, SITE_COMPANY } from "@/config/company";
import { isValidHttpUrl, VideoItem } from "@/lib/videoUtils";
import {
  ArrowRight,
  Compass,
  Crown,
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
  Play,
  Users,
  Wrench,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio?: string | null;
  image_url?: string | null;
  linkedin_url?: string | null;
  email?: string | null;
  phone?: string | null;
  featured?: boolean | null;
}

const OPERATIONAL_DESKS = [
  {
    icon: Phone,
    badge: "Sales & Dispatch",
    title: "Irrigation Supply Specialists",
    description:
      "Helps you pick matched drip kits, 15/20/30cm driplines, sprinklers, and pumps, and arranges county courier delivery nationwide.",
    contactLabel: SITE_COMPANY.phonePrimaryDisplay,
    href: `tel:${SITE_COMPANY.phonePrimary}`,
    ctaLabel: "Call Sales Desk",
    secondaryTo: "/products",
    secondaryLabel: "Browse Equipment",
  },
  {
    icon: Compass,
    badge: "Hydraulic Design",
    title: "Engineering & BOQ Desk",
    description:
      "Prepares zoned block layouts, pipe diameter calculations, Total Dynamic Head pump specs, and itemized bank/NGO Bills of Quantities.",
    contactLabel: SITE_COMPANY.phoneSecondaryDisplay,
    href: `tel:${SITE_COMPANY.phoneSecondary}`,
    ctaLabel: "Call Engineering",
    secondaryTo: "/contact?topic=design-boq",
    secondaryLabel: "Request Official BOQ",
  },
  {
    icon: Wrench,
    badge: "Field Execution",
    title: "Certified Field Technicians",
    description:
      "Handles on-farm mainline trenching, filtration headworks, greenhouse drip installs, hot-wedge HDPE dam liner welding, and servicing.",
    contactLabel: "All 47 Kenyan Counties",
    to: "/technician-services",
    ctaLabel: "Book a Field Technician",
    secondaryTo: "/projects",
    secondaryLabel: "See Completed Work",
  },
] as const;

const Team = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchTeamAndVideos = async () => {
      try {
        setLoading(true);
        const [teamData, videoData] = await Promise.all([
          dataService.getTeamMembers().catch(() => []),
          dataService.getVideos({ sortBy: "featured", limit: 3 }).catch(() => []),
        ]);

        if (!cancelled) {
          setTeam(Array.isArray(teamData) ? (teamData as TeamMember[]) : []);
          setVideos(Array.isArray(videoData) ? (videoData as VideoItem[]) : []);
        }
      } catch (error) {
        console.error("Error fetching team page data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchTeamAndVideos();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleWatchVideo = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);

    void supabase
      .from("videos")
      .update({ views: (video.views || 0) + 1 })
      .eq("id", video.id);
  };

  const isSingleLeadershipProfile = team.length === 1;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead
        title={`Our Irrigation Team & Field Specialists Kenya | ${SITE_COMPANY.name}`}
        description={`Meet the leadership, irrigation sales specialists, hydraulic engineers, and field technicians behind ${SITE_COMPANY.name} in Kenya.`}
        url={`${SITE_COMPANY.url}/team`}
        schema={[buildOrganizationSchema()]}
      />
      <Header />

      <div className="dt-container">
        <Breadcrumbs />
      </div>

      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* Editorial Hero */}
        <section className="pb-10 pt-2 sm:pb-14">
          <div className="dt-container">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
                    <Users className="h-3.5 w-3.5" />
                    <span>Our Team &amp; Specialists</span>
                  </div>

                  <h1 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                    Meet the Specialists{" "}
                    <span className="text-primary">Behind DripTech</span>
                  </h1>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Combining agricultural engineering leadership, sales &amp; parcel
                    dispatch, and field installation crews to deliver irrigation systems
                    built for Kenyan farms.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/contact"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Talk to Our Team
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/technician-services"
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <Wrench className="h-4 w-4 text-primary" />
                    Book Field Technician
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Leadership & Team Members */}
        <section className="border-t border-border bg-muted/20 py-10 sm:py-14">
          <div className="dt-container">
            <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="dt-section-label mb-1">Leadership &amp; Staff</p>
                <h2 className="dt-section-title">Leadership &amp; Specialists</h2>
              </div>
              {!loading && team.length > 0 && (
                <p className="text-xs font-medium text-muted-foreground">
                  {team.length} {team.length === 1 ? "profile" : "team members"} listed
                </p>
              )}
            </div>

            {loading ? (
              <Card className="animate-pulse border-border bg-card">
                <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-12">
                  <div className="aspect-[4/3] rounded-xl bg-muted md:col-span-4" />
                  <div className="space-y-4 md:col-span-8">
                    <div className="h-7 w-56 rounded bg-muted" />
                    <div className="h-4 w-36 rounded bg-muted" />
                    <div className="h-20 w-full rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            ) : isSingleLeadershipProfile ? (
              /* Balanced Horizontal Spotlight Card when 1 leadership profile is listed */
              (() => {
                const member = team[0];
                const cleanLinkedIn = isValidHttpUrl(member.linkedin_url)
                  ? member.linkedin_url.trim()
                  : null;

                return (
                  <Card className="overflow-hidden border-border bg-card shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-12">
                      <div className="relative aspect-[4/3] max-h-[380px] overflow-hidden bg-muted md:col-span-5 md:aspect-auto md:max-h-none lg:col-span-4">
                        {isValidHttpUrl(member.image_url) ? (
                          <img
                            src={member.image_url.trim()}
                            alt={member.name.trim()}
                            className="h-full w-full object-cover object-[50%_45%]"
                          />
                        ) : (
                          <div className="flex h-full min-h-[260px] w-full items-center justify-center bg-primary/5">
                            <Users className="h-16 w-16 text-primary/40" />
                          </div>
                        )}
                        {member.featured && (
                          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-accent-foreground shadow-sm">
                            <Crown className="h-3 w-3" />
                            Leadership
                          </span>
                        )}
                      </div>

                      <CardContent className="flex flex-col justify-between p-6 sm:p-8 md:col-span-7 lg:col-span-8">
                        <div>
                          <span className="dt-badge-primary">
                            {member.position.trim()}
                          </span>
                          <h3 className="mt-2.5 font-heading text-2xl font-bold text-foreground sm:text-3xl">
                            {member.name.trim()}
                          </h3>
                          {member.bio?.trim() && (
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                              {member.bio.trim()}
                            </p>
                          )}
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-border pt-5">
                          {member.phone?.trim() && (
                            <a
                              href={`tel:${member.phone.trim()}`}
                              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 sm:text-sm"
                            >
                              <Phone className="h-4 w-4" />
                              {member.phone.trim()}
                            </a>
                          )}

                          {member.email?.trim() && (
                            <a
                              href={`mailto:${member.email.trim()}`}
                              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-xs font-semibold text-foreground transition-colors hover:bg-muted sm:text-sm"
                            >
                              <Mail className="h-4 w-4 text-primary" />
                              {member.email.trim()}
                            </a>
                          )}

                          {cleanLinkedIn && (
                            <a
                              href={cleanLinkedIn}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-xs font-semibold text-foreground transition-colors hover:bg-muted sm:text-sm"
                            >
                              <Linkedin className="h-4 w-4 text-primary" />
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })()
            ) : team.length > 1 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {team.map((member) => {
                  const cleanLinkedIn = isValidHttpUrl(member.linkedin_url)
                    ? member.linkedin_url.trim()
                    : null;

                  return (
                    <Card
                      key={member.id}
                      className="flex flex-col overflow-hidden border-border bg-card transition-colors hover:border-primary/40"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        {isValidHttpUrl(member.image_url) ? (
                          <img
                            src={member.image_url.trim()}
                            alt={member.name.trim()}
                            className="h-full w-full object-cover object-center"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/5">
                            <Users className="h-14 w-14 text-primary/40" />
                          </div>
                        )}
                        {member.featured && (
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-foreground">
                            <Crown className="h-3 w-3" />
                            Lead
                          </span>
                        )}
                      </div>

                      <CardContent className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                        <div>
                          <span className="dt-badge-primary">
                            {member.position.trim()}
                          </span>
                          <h3 className="mt-2 font-heading text-xl font-bold text-foreground">
                            {member.name.trim()}
                          </h3>
                          {member.bio?.trim() && (
                            <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                              {member.bio.trim()}
                            </p>
                          )}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                          {member.phone?.trim() && (
                            <a
                              href={`tel:${member.phone.trim()}`}
                              aria-label={`Call ${member.name.trim()}`}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
                            >
                              <Phone className="h-3.5 w-3.5 text-primary" />
                              Call
                            </a>
                          )}
                          {member.email?.trim() && (
                            <a
                              href={`mailto:${member.email.trim()}`}
                              aria-label={`Email ${member.name.trim()}`}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
                            >
                              <Mail className="h-3.5 w-3.5 text-primary" />
                              Email
                            </a>
                          )}
                          {cleanLinkedIn && (
                            <a
                              href={cleanLinkedIn}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${member.name.trim()} LinkedIn`}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
                            >
                              <Linkedin className="h-3.5 w-3.5 text-primary" />
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : null}

            {/* Operational Desks Supporting Customers Across Kenya */}
            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {OPERATIONAL_DESKS.map((desk) => {
                const Icon = desk.icon;
                return (
                  <Card key={desk.title} className="flex flex-col justify-between border-border bg-card">
                    <CardContent className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="dt-badge-primary">{desk.badge}</span>
                        </div>
                        <h3 className="mt-4 font-heading text-lg font-bold text-foreground">
                          {desk.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          {desk.description}
                        </p>
                      </div>

                      <div className="mt-5 space-y-2 border-t border-border pt-4">
                        {"href" in desk ? (
                          <a
                            href={desk.href}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {desk.ctaLabel} ({desk.contactLabel})
                          </a>
                        ) : (
                          <Link
                            to={desk.to}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                            {desk.ctaLabel}
                          </Link>
                        )}
                        <Link
                          to={desk.secondaryTo}
                          className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                        >
                          {desk.secondaryLabel}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Video Showcase: See Our Team's Installations in Action */}
        {videos.length > 0 && (
          <section className="border-t border-border bg-background py-12 sm:py-16">
            <div className="dt-container">
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="dt-section-label mb-1 flex items-center gap-1.5">
                    <Play className="h-3.5 w-3.5" />
                    Field Demonstrations
                  </p>
                  <h2 className="dt-section-title">
                    See Our Team&apos;s Work in Action
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Real installation clips of our driplines, dam liners, and rainhose systems.
                  </p>
                </div>

                <Link
                  to="/videos"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                >
                  Open Full Video Library
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    compact
                    onWatch={handleWatchVideo}
                    whatsappSource="team page video card"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bottom Direct Contact Bar */}
        <section className="border-t border-border bg-muted/25 py-10 sm:py-12">
          <div className="dt-container">
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                    Ready to Speak With Our Team?
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Reach us Mon–Fri 8:00 AM–6:00 PM or Sat 9:00 AM–12:00 PM EAT on phone or WhatsApp.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      openTrackedWhatsApp(
                        `https://wa.me/${SITE_COMPANY.phonePrimary.replace(/\D/g, "")}?text=${encodeURIComponent(
                          "Hi DripTech Eco Flow! I would like to speak with your irrigation team.",
                        )}`,
                        "team page footer WhatsApp",
                      )
                    }
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-[hsl(var(--dt-whatsapp))] px-5 text-sm font-bold text-white transition-colors hover:bg-[hsl(var(--dt-whatsapp)/0.9)]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Team
                  </button>
                  <Link
                    to="/contact"
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    Send Inquiry Form
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <IrrigationKeywords />
      <Footer />

      <VideoPlayerModal
        video={selectedVideo}
        open={isVideoModalOpen}
        onOpenChange={(open) => {
          setIsVideoModalOpen(open);
          if (!open) setSelectedVideo(null);
        }}
        relatedVideos={
          selectedVideo
            ? videos.filter((v) => v.id !== selectedVideo.id)
            : []
        }
        onSelectVideo={handleWatchVideo}
        whatsappSource="team page video modal"
      />
    </div>
  );
};

export default Team;
