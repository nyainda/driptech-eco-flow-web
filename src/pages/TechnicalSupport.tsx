import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Phone, 
  Mail, 
  MessageSquare, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  FileText,
  Video,
  Headphones,
  Calendar,
  Wrench,
  Settings,
  Zap,
  Play,
  Eye,
  Star
} from "lucide-react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TechnicalSupport = () => {
  const [activeTab, setActiveTab] = useState("faq");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [videoSearchTerm, setVideoSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [videosLoading, setVideosLoading] = useState(true);
  const { toast } = useToast();

  const [supportForm, setSupportForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    issue_type: "",
    priority: "",
    product_model: "",
    issue_description: "",
    error_message: "",
    steps_taken: ""
  });

  // Fetch videos from Supabase
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setVideosLoading(true);
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setVideos(data || []);
      } catch (error) {
        console.error('Error fetching videos:', error);
        toast({
          title: "Error",
          description: "Failed to load videos. Please try again.",
          variant: "destructive"
        });
      } finally {
        setVideosLoading(false);
      }
    };

    fetchVideos();
  }, [toast]);

  // Get unique categories for filtering
  const categories = [...new Set(videos.map(video => video.category).filter(Boolean))];

  // Filter videos based on search and category
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(videoSearchTerm.toLowerCase()) ||
                         video.description?.toLowerCase().includes(videoSearchTerm.toLowerCase()) ||
                         video.tags?.some(tag => tag.toLowerCase().includes(videoSearchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || video.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Format duration in minutes:seconds
  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle video view increment
  const handleVideoView = async (videoId) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ views: videos.find(v => v.id === videoId)?.views + 1 || 1 })
        .eq('id', videoId);

      if (error) throw error;
      
      // Update local state
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, views: (video.views || 0) + 1 }
          : video
      ));
    } catch (error) {
      console.error('Error updating video views:', error);
    }
  };

  const supportChannels = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Immediate assistance for urgent issues",
      contact: "+254-111-409454 / +254-114-575401",
      hours: "Mon-Fri: 8AM-6PM EAT",
      response: "Immediate",
      badge: "Fastest"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Detailed technical assistance",
      contact: "driptechs.info@gmail.com / driptech2025@gmail.com",
      hours: "24/7 submission",
      response: "Within 4 hours",
      badge: "Detailed"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Support",
      description: "Real-time messaging with experts",
      contact: "+254-111-409454 / +254-114-575401",
      hours: "Mon-Fri: 8AM-8PM EAT",
      response: "Within minutes",
      badge: "Popular"
    },
    {
      icon: Calendar,
      title: "Remote Support",
      description: "Screen sharing for complex issues",
      contact: "Schedule appointment",
      hours: "By appointment",
      response: "Scheduled",
      badge: "Comprehensive"
    }
  ];

  const faqCategories = [
    {
      title: "System Installation",
      icon: Settings,
      faqs: [
        {
          question: "What tools are required for drip irrigation installation?",
          answer: "Basic tools include: pipe cutters, hole punch, measuring tape, shovel for trenching, and adjustable wrenches. Specific tool lists are provided with each system."
        },
        {
          question: "How deep should I bury the main water lines?",
          answer: "Main lines should be buried 18-24 inches deep to prevent freezing and damage from cultivation. In rocky areas, minimum 12 inches with protective covering."
        },
        {
          question: "Can I install the system myself or do I need a professional?",
          answer: "Small residential systems (under 1 acre) can often be self-installed with our guides. Commercial systems require professional installation for warranty coverage."
        }
      ]
    },
    {
      title: "System Operation",
      icon: Zap,
      faqs: [
        {
          question: "How often should I run my irrigation system?",
          answer: "Frequency depends on crop type, soil, and weather. Generally, 2-3 times per week for 1-2 hours each. Our smart controllers can automate this based on soil moisture."
        },
        {
          question: "What water pressure is optimal for drip systems?",
          answer: "Most drip systems operate best at 15-30 PSI. Higher pressure can damage emitters, while lower pressure reduces efficiency. Pressure regulators are recommended."
        },
        {
          question: "How do I know if my system is working properly?",
          answer: "Check for: uniform water distribution, proper pressure readings, no leaks, and healthy plant growth. Monthly system inspections are recommended."
        }
      ]
    },
    {
      title: "Troubleshooting",
      icon: Wrench,
      faqs: [
        {
          question: "Some emitters are not working. What should I check?",
          answer: "Common causes: clogged emitters (clean or replace), low pressure (check filters and pressure regulator), or damaged tubing (inspect for leaks or kinks)."
        },
        {
          question: "My system has low water pressure. How do I fix it?",
          answer: "Check: dirty filters (clean/replace), partially closed valves, pipe blockages, or undersized main lines. Start from the source and work downstream."
        },
        {
          question: "Water is not reaching the end of my irrigation lines.",
          answer: "This indicates pressure loss. Check for: leaks in main lines, undersized tubing, too many emitters on one line, or elevation changes requiring pressure compensation."
        }
      ]
    },
    {
      title: "Maintenance",
      icon: Settings,
      faqs: [
        {
          question: "How often should I clean the system filters?",
          answer: "Screen filters: monthly during growing season. Disk filters: every 2-3 months. Media filters: backwash weekly or when pressure differential exceeds manufacturer specs."
        },
        {
          question: "When should I replace drip emitters?",
          answer: "Quality emitters last 5-7 years with proper maintenance. Replace when: flow rates are inconsistent, physical damage is visible, or clogging becomes frequent despite cleaning."
        },
        {
          question: "How do I winterize my irrigation system?",
          answer: "Drain all water from lines, remove and store timers/controllers indoors, insulate exposed pipes, and consider using compressed air to blow out remaining water."
        }
      ]
    }
  ];

  const issueTypes = [
    "System Not Working",
    "Low Water Pressure", 
    "Clogged Emitters",
    "Controller/Timer Issues",
    "Leaks and Damage",
    "Poor Water Distribution",
    "Filtration Problems",
    "Electrical Issues",
    "Installation Questions",
    "Maintenance Guidance",
    "Other"
  ];

  const priorityLevels = [
    { value: "low", label: "Low - General inquiry", color: "text-green-600" },
    { value: "medium", label: "Medium - Affecting efficiency", color: "text-yellow-600" },
    { value: "high", label: "High - System not working", color: "text-orange-600" },
    { value: "urgent", label: "Urgent - Crop damage risk", color: "text-red-600" }
  ];

  const handleSupportSubmit = async () => {
    setLoading(true);

    try {
      const supportData = {
        name: supportForm.name,
        email: supportForm.email,
        phone: supportForm.phone,
        company: supportForm.company,
        project_type: 'technical_support',
        message: `Technical Support Request:
        
Issue Type: ${supportForm.issue_type}
Priority: ${supportForm.priority}
Product Model: ${supportForm.product_model}

Issue Description:
${supportForm.issue_description}

Error Message:
${supportForm.error_message}

Steps Already Taken:
${supportForm.steps_taken}`,
        status: 'new'
      };

      const { error } = await supabase
        .from('contact_submissions')
        .insert([supportData]);

      if (error) throw error;

      toast({
        title: "Support Request Submitted",
        description: "Our technical team will contact you within 4 hours.",
      });

      setSupportForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        issue_type: "",
        priority: "",
        product_model: "",
        issue_description: "",
        error_message: "",
        steps_taken: ""
      });

    } catch (error) {
      console.error('Error submitting support request:', error);
      toast({
        title: "Error",
        description: "Failed to submit support request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              🛠️ Expert Support
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Technical <span className="text-primary">Support</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get expert help with installation, troubleshooting, and maintenance. Our certified technicians are here to ensure your irrigation system operates at peak efficiency.
            </p>
          </div>

          {/* Support Channels */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {supportChannels.map((channel, index) => (
              <Card key={index} className="relative hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  {channel.badge && (
                    <Badge className="absolute top-4 right-4 text-xs">
                      {channel.badge}
                    </Badge>
                  )}
                  <div className="inline-flex p-3 bg-primary/10 rounded-xl mb-3">
                    <channel.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{channel.title}</CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <p className="font-medium text-primary">{channel.contact}</p>
                  <p className="text-sm text-muted-foreground">{channel.hours}</p>
                  <p className="text-sm font-medium text-foreground">Response: {channel.response}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Support Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="faq">FAQ & Troubleshooting</TabsTrigger>
              <TabsTrigger value="submit">Submit Support Request</TabsTrigger>
              <TabsTrigger value="resources">Resources & Guides</TabsTrigger>
            </TabsList>

            <TabsContent value="faq" className="space-y-6">
              {/* FAQ Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search frequently asked questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* FAQ Categories */}
              <div className="space-y-6">
                {filteredFaqs.map((category, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <category.icon className="h-5 w-5 text-primary" />
                        {category.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="space-y-2">
                        {category.faqs.map((faq, faqIndex) => (
                          <AccordionItem key={faqIndex} value={`${index}-${faqIndex}`}>
                            <AccordionTrigger className="text-left">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {searchTerm && filteredFaqs.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No FAQ Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Can't find what you're looking for? Submit a support request below.
                  </p>
                  <Button onClick={() => setActiveTab("submit")}>
                    Submit Support Request
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="submit">
              <Card>
                <CardHeader>
                  <CardTitle>Submit Technical Support Request</CardTitle>
                  <CardDescription>
                    Provide detailed information about your issue for faster resolution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={supportForm.name}
                          onChange={(e) => setSupportForm({...supportForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={supportForm.email}
                          onChange={(e) => setSupportForm({...supportForm, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={supportForm.phone}
                          onChange={(e) => setSupportForm({...supportForm, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">Company/Organization</Label>
                        <Input
                          id="company"
                          value={supportForm.company}
                          onChange={(e) => setSupportForm({...supportForm, company: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Issue Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="issue_type">Issue Type *</Label>
                        <Select value={supportForm.issue_type} onValueChange={(value) => setSupportForm({...supportForm, issue_type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select issue type" />
                          </SelectTrigger>
                          <SelectContent>
                            {issueTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority Level *</Label>
                        <Select value={supportForm.priority} onValueChange={(value) => setSupportForm({...supportForm, priority: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {priorityLevels.map(level => (
                              <SelectItem key={level.value} value={level.value}>
                                <span className={level.color}>{level.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="product_model">Product Model/System Type</Label>
                      <Input
                        id="product_model"
                        value={supportForm.product_model}
                        onChange={(e) => setSupportForm({...supportForm, product_model: e.target.value})}
                        placeholder="e.g., DT-2000 Drip System, Model XYZ Controller"
                      />
                    </div>

                    <div>
                      <Label htmlFor="issue_description">Issue Description *</Label>
                      <Textarea
                        id="issue_description"
                        value={supportForm.issue_description}
                        onChange={(e) => setSupportForm({...supportForm, issue_description: e.target.value})}
                        placeholder="Describe the problem you're experiencing in detail..."
                        className="min-h-[100px]"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="error_message">Error Messages (if any)</Label>
                      <Textarea
                        id="error_message"
                        value={supportForm.error_message}
                        onChange={(e) => setSupportForm({...supportForm, error_message: e.target.value})}
                        placeholder="Copy any error messages or codes you see..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="steps_taken">Troubleshooting Steps Already Taken</Label>
                      <Textarea
                        id="steps_taken"
                        value={supportForm.steps_taken}
                        onChange={(e) => setSupportForm({...supportForm, steps_taken: e.target.value})}
                        placeholder="What have you already tried to fix the issue?"
                      />
                    </div>

                    <Button type="button" onClick={handleSupportSubmit} disabled={loading} className="w-full">
                      {loading ? "Submitting..." : "Submit Support Request"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources">
              <div className="space-y-8">
                {/* Video Tutorials Section */}
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                      Video <span className="text-primary">Tutorials</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                      Learn from our experts with comprehensive video guides covering installation, maintenance, and troubleshooting.
                    </p>
                  </div>

                  {/* Video Filters */}
                  <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search video tutorials..."
                        value={videoSearchTerm}
                        onChange={(e) => setVideoSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Videos Grid */}
                  {videosLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} className="animate-pulse">
                          <div className="aspect-video bg-muted rounded-t-lg"></div>
                          <CardContent className="p-4">
                            <div className="h-4 bg-muted rounded mb-2"></div>
                            <div className="h-3 bg-muted rounded w-3/4"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredVideos.length === 0 ? (
                    <div className="text-center py-12">
                      <Video className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Videos Found</h3>
                      <p className="text-muted-foreground">
                        {videoSearchTerm || selectedCategory !== "all" 
                          ? "Try adjusting your search criteria or filters."
                          : "No video tutorials are available at the moment."
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredVideos.map((video) => (
                        <Card key={video.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                          <div className="relative aspect-video bg-muted">
                            {video.thumbnail_url ? (
                              <div className="w-full h-full relative group">
                                <img 
                                  src={video.thumbnail_url} 
                                  alt={video.title}
                                  className="w-full h-full object-cover absolute inset-0 transition-opacity duration-300 group-hover:opacity-0"
                                />
                                <video
                                  className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                  src={video.video_url}
                                  muted
                                  autoPlay
                                  loop
                                  playsInline
                                  onMouseEnter={(e) => e.currentTarget.play()}
                                  onMouseLeave={(e) => e.currentTarget.pause()}
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                                <Video className="h-12 w-12 text-primary" />
                              </div>
                            )}
                            
                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                              <Button
                                size="sm"
                                className="rounded-full w-12 h-12 p-0"
                                onClick={() => {
                                  handleVideoView(video.id);
                                  window.open(video.video_url, '_blank');
                                }}
                              >
                                <Play className="h-5 w-5 ml-0.5" />
                              </Button>
                            </div>

                            {/* Duration Badge */}
                            {video.duration && (
                              <Badge variant="secondary" className="absolute bottom-2 right-2 text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(video.duration)}
                              </Badge>
                            )}

                            {/* Featured Badge */}
                            {video.featured && (
                              <Badge className="absolute top-2 left-2 text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>

                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-foreground line-clamp-2">
                                  {video.title}
                                </h3>
                              </div>
                              
                              {video.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {video.description}
                                </p>
                              )}

                              {/* Video Meta */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                                <div className="flex items-center gap-3">
                                  {video.views && (
                                    <span className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      {video.views.toLocaleString()}
                                    </span>
                                  )}
                                  {video.category && (
                                    <Badge variant="outline" className="text-xs">
                                      {video.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Tags */}
                              {video.tags && video.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-2">
                                  {video.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {video.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-xs px-2 py-0">
                                      +{video.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Other Resources */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Installation Guides
                      </CardTitle>
                      <CardDescription>
                        Step-by-step installation manuals for all products
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        View Installation Guides
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Headphones className="h-5 w-5 text-primary" />
                        Webinar Training
                      </CardTitle>
                      <CardDescription>
                        Live and recorded training sessions with experts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        Join Training
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Maintenance Schedule
                      </CardTitle>
                      <CardDescription>
                        Preventive maintenance checklists and schedules
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        Download Schedule
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TechnicalSupport;