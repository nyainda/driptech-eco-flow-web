import { useState } from "react";
import {
  MapPin,
  CheckCircle2,
  Clock,
  Users,
  Phone,
  User,
  CalendarDays,
  ArrowRight,
  Leaf,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const KENYAN_COUNTIES = [
  "Nairobi","Kiambu","Muranga","Nyeri","Kirinyaga","Nyandarua",
  "Laikipia","Nakuru","Meru","Embu","Machakos","Makueni","Kajiado",
  "Narok","Kericho","Bomet","Kisumu","Homa Bay","Migori","Kisii",
  "Nyamira","Mombasa","Kilifi","Kwale","Taita Taveta","Lamu",
  "Uasin Gishu","Trans Nzoia","Nandi","Kakamega","Bungoma","Busia",
  "Siaya","Vihiga","Isiolo","Marsabit","Garissa","Wajir","Mandera",
  "Samburu","Turkana","West Pokot","Elgeyo Marakwet","Baringo",
  "Tharaka Nithi","Kitui","Murang'a",
];

const FARM_SIZES = [
  "Less than ¼ acre",
  "¼ – 1 acre",
  "1 – 5 acres",
  "5 – 20 acres",
  "20 – 100 acres",
  "Over 100 acres",
];

const VISIT_TYPES = [
  "New Irrigation System Design",
  "Upgrade Existing System",
  "Greenhouse Setup",
  "Drip Irrigation Installation",
  "Sprinkler System",
  "Solar Irrigation",
  "Borehole & Water Supply",
  "General Farm Consultation",
];

const BENEFITS = [
  {
    icon: CheckCircle2,
    title: "100% Free — No Obligation",
    desc: "Our engineers visit your farm at no charge.",
    color: "#10b981",
  },
  {
    icon: Leaf,
    title: "Tailored System Design",
    desc: "We design a solution that fits your land and budget.",
    color: "#06b6d4",
  },
  {
    icon: Zap,
    title: "Same-Week Scheduling",
    desc: "Most site visits happen within 3–5 business days.",
    color: "#f59e0b",
  },
  {
    icon: ShieldCheck,
    title: "Expert Kenyan Engineers",
    desc: "Certified team with 500+ successful installations.",
    color: "#8b5cf6",
  },
];

const WHAT_TO_EXPECT = [
  "Soil and water source assessment",
  "Crop and acreage measurements",
  "Irrigation system recommendation",
  "Budget estimate with payment options",
  "Installation timeline planning",
];

const BookSiteVisit = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    county: "",
    farm_size: "",
    visit_type: "",
    preferred_date: "",
  });

  const set = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.county) {
      toast({
        title: "Missing details",
        description: "Please fill in your name, phone number, and county.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert([
        {
          name: formData.name,
          phone: formData.phone,
          message: `SITE VISIT REQUEST\n\nCounty: ${formData.county}\nFarm Size: ${formData.farm_size || "Not specified"}\nVisit Type: ${formData.visit_type || "General Consultation"}\nPreferred Date: ${formData.preferred_date || "Flexible"}`,
          project_type: formData.visit_type || "Site Visit",
          area_size: formData.farm_size,
          status: "pending",
          read: false,
        },
      ]);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Site visit booked!",
        description: "Our team will call you within 24 hours to confirm the date.",
      });
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: "Please try again or call us on 0794 494 515.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const whatsappBook = () => {
    const msg = encodeURIComponent(
      `Hello DripTech! I'd like to book a FREE site visit.\n\nName: ${formData.name || "—"}\nPhone: ${formData.phone || "—"}\nCounty: ${formData.county || "—"}\nFarm Size: ${formData.farm_size || "—"}\nVisit Type: ${formData.visit_type || "General"}\nPreferred Date: ${formData.preferred_date || "Flexible"}`
    );
    window.open(`https://wa.me/254794494515?text=${msg}`, "_blank");
  };

  return (
    <section
      id="book-site-visit"
      className="py-16 sm:py-24 bg-gradient-to-br from-background via-primary/3 to-background border-t border-border relative overflow-hidden"
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/4 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
            <CalendarDays className="w-3.5 h-3.5" />
            Free Service
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Book a{" "}
            <span className="text-primary">Free Site Visit</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Our irrigation engineers come to your farm, assess your land, and
            design the perfect system — completely free with no obligation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 max-w-6xl mx-auto">

          {/* ── LEFT PANEL ── */}
          <div className="space-y-8">
            {/* Benefits */}
            <div className="grid sm:grid-cols-2 gap-4">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="flex gap-3 p-4 rounded-2xl border border-border bg-background/70 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${b.color}18` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: b.color }} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground mb-0.5">{b.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* What to expect */}
            <div className="rounded-2xl border border-border bg-background/70 p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wider text-primary mb-4">
                What Happens During the Visit
              </p>
              <ul className="space-y-3">
                {WHAT_TO_EXPECT.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Users, value: "500+", label: "Farms Served" },
                { icon: Clock, value: "3–5", label: "Days to Visit" },
                { icon: MapPin, value: "47", label: "Counties" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-border bg-background/70 p-4 text-center shadow-sm"
                  >
                    <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-xl font-black text-foreground leading-none">{s.value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-1">
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT PANEL: FORM ── */}
          <div>
            <div className="rounded-3xl border border-border bg-background shadow-xl p-6 sm:p-8">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">You're booked!</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                    Our team will call you within 24 hours to confirm your free site visit.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => { setSubmitted(false); setFormData({ name:"",phone:"",county:"",farm_size:"",visit_type:"",preferred_date:"" }); }}
                  >
                    Book Another Visit
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">Request Your Free Visit</h3>
                    <p className="text-sm text-muted-foreground">
                      Fill in your details and we'll reach out to schedule.
                    </p>
                  </div>

                  {/* Name + Phone row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="sv-name" className="text-sm font-medium">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="sv-name"
                          placeholder="John Kamau"
                          value={formData.name}
                          onChange={(e) => set("name", e.target.value)}
                          className="pl-9 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sv-phone" className="text-sm font-medium">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="sv-phone"
                          placeholder="0712 345 678"
                          value={formData.phone}
                          onChange={(e) => set("phone", e.target.value)}
                          className="pl-9 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* County */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      County / Location <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                      <Select onValueChange={(v) => set("county", v)}>
                        <SelectTrigger className="pl-9 rounded-xl">
                          <SelectValue placeholder="Select your county" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {KENYAN_COUNTIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Farm size + visit type row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Farm Size</Label>
                      <Select onValueChange={(v) => set("farm_size", v)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {FARM_SIZES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Visit Purpose</Label>
                      <Select onValueChange={(v) => set("visit_type", v)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          {VISIT_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Preferred date */}
                  <div className="space-y-1.5">
                    <Label htmlFor="sv-date" className="text-sm font-medium">
                      Preferred Visit Date
                    </Label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="sv-date"
                        type="date"
                        value={formData.preferred_date}
                        onChange={(e) => set("preferred_date", e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all"
                  >
                    {loading ? "Booking..." : (
                      <>
                        Book Free Site Visit
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* WhatsApp fallback */}
                  <button
                    type="button"
                    onClick={whatsappBook}
                    className="w-full py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Or book via WhatsApp instead
                  </button>

                  <p className="text-[11px] text-muted-foreground text-center">
                    By submitting, you agree we may contact you to schedule the visit.
                    No spam, ever.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookSiteVisit;
