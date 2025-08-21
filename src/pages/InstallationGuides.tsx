import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Download, 
  FileText, 
  Video, 
  Clock,
  Droplets,
  Gauge,
  Filter,
  Settings,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Play,
  Archive,
  Image,
  Users,
  Calendar,
  Star,
  Eye,
  X,
  Maximize2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { useToast } from "@/hooks/use-toast";

const documentCategories = [
  "Product Brochures",
  "Technical Specifications",
  "Installation Guides",
  "Maintenance Manuals",
  "Case Studies",
  "White Papers",
  "Certifications",
  "Training Materials",
  "Marketing Materials",
  "User Manuals",
  "Safety Guidelines",
  "Warranty Information"
];

const InstallationGuides = () => {
  const [products, setProducts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [managedDocuments, setManagedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDocumentType, setSelectedDocumentType] = useState("all");
  const [videoModal, setVideoModal] = useState({ isOpen: false, url: "", title: "" });
  const [pdfModal, setPdfModal] = useState({ isOpen: false, url: "", title: "" });
  const [imageModal, setImageModal] = useState({ isOpen: false, url: "", title: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchInstallationResources();
  }, []);

  const fetchInstallationResources = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .not('installation_guide_url', 'is', null);

      if (productsError) throw productsError;

      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('category', 'installation')
        .eq('requires_login', false);

      if (documentsError) throw documentsError;

      const { data: managedDocsData, error: managedDocsError } = await supabase
        .from('documents')
        .select('*')
        .in('category', documentCategories)
        .order('created_at', { ascending: false });

      if (managedDocsError) throw managedDocsError;

      console.log('Products:', productsData);
      console.log('Documents:', documentsData);
      console.log('Managed Documents:', managedDocsData);

      setProducts(productsData || []);
      setDocuments(documentsData || []);
      setManagedDocuments(managedDocsData || []);
    } catch (error) {
      console.error('Error fetching installation resources:', error);
      toast({
        title: "Error",
        description: "Failed to fetch installation guides",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'drip_irrigation': return Droplets;
      case 'sprinkler_systems': return Gauge;
      case 'filtration_systems': return Filter;
      case 'control_systems': return Settings;
      case 'accessories': return Wrench;
      default: return FileText;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'drip_irrigation': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'sprinkler_systems': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'filtration_systems': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      case 'control_systems': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      case 'accessories': return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
      default: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
    }
  };

  const getDocumentIcon = (fileType) => {
    const type = fileType?.toLowerCase();
    switch (type) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return FileText;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return Image;
      case 'mp4':
      case 'avi':
      case 'mov':
        return Video;
      case 'zip':
      case 'rar':
        return Archive;
      default:
        return FileText;
    }
  };

  const getDocumentCategoryColor = (category) => {
    const colorMap = {
      'Installation Guides': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
      'Technical Specifications': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
      'User Manuals': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
      'Training Materials': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
      'Safety Guidelines': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
      'Maintenance Manuals': 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
      'Product Brochures': 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
      'Case Studies': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
      'White Papers': 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
      'Certifications': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
      'Marketing Materials': 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
      'Warranty Information': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
    };
    
    return colorMap[category] || 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
  };

  const isVideoFile = (fileType) => {
    const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    return videoTypes.includes(fileType?.toLowerCase());
  };

  const isImageFile = (fileType) => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    return imageTypes.includes(fileType?.toLowerCase());
  };

  const isPdfFile = (fileType) => {
    return fileType?.toLowerCase() === 'pdf';
  };

  const handleViewDocument = (url, title, fileType) => {
    if (isVideoFile(fileType)) {
      setVideoModal({ isOpen: true, url, title });
    } else if (isPdfFile(fileType)) {
      setPdfModal({ isOpen: true, url, title });
    } else if (isImageFile(fileType)) {
      setImageModal({ isOpen: true, url, title });
    } else {
      // For other file types that can't be viewed in modal, download them
      handleDownloadDocument(url, title, null);
    }
  };

  const handleDownloadDocument = async (url, filename, documentId) => {
    try {
      // Update download count if documentId is provided
      if (documentId) {
        const { data, error: fetchError } = await supabase
          .from('documents')
          .select('download_count')
          .eq('id', documentId)
          .single();

        if (!fetchError && data) {
          const currentCount = data.download_count || 0;
          const { error: updateError } = await supabase
            .from('documents')
            .update({ 
              download_count: currentCount + 1
            })
            .eq('id', documentId);

          if (updateError) console.error('Error updating download count:', updateError);
        }
      }

      // Try to download the file
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`File not found: ${response.status}`);
        }

        const downloadResponse = await fetch(url);
        if (!downloadResponse.ok) throw new Error('Network response was not ok');
        
        const blob = await downloadResponse.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(downloadUrl);
        
        toast({
          title: "Download Started",
          description: `${filename} is being downloaded`,
        });
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        
        if (fetchError.message.includes('404') || fetchError.message.includes('File not found')) {
          toast({
            title: "File Not Found",
            description: `The file "${filename}" could not be found. Please contact support.`,
            variant: "destructive"
          });
          return;
        }
        
        // Fallback to direct link
        try {
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Download Started",
            description: `${filename} download initiated`,
          });
        } catch (directError) {
          toast({
            title: "Download Failed",
            description: "Unable to download the file. Please try again or contact support.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error handling download:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download the file",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canViewInModal = (fileType) => {
    return isVideoFile(fileType) || isImageFile(fileType) || isPdfFile(fileType);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.model_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredManagedDocuments = managedDocuments.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    const matchesType = selectedDocumentType === "all" || doc.file_type === selectedDocumentType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  // Get available categories and file types for filtering
  const availableCategories = [...new Set(managedDocuments.map(doc => doc.category))].filter(Boolean);
  const availableFileTypes = [...new Set(managedDocuments.map(doc => doc.file_type))].filter(Boolean);

  const installationSteps = [
    {
      icon: CheckCircle,
      title: "Pre-Installation Planning",
      description: "Site assessment, system design, and material preparation"
    },
    {
      icon: Settings,
      title: "System Setup",
      description: "Component assembly and initial configuration"
    },
    {
      icon: AlertTriangle,
      title: "Safety Considerations",
      description: "Important safety guidelines and precautions"
    },
    {
      icon: Play,
      title: "Testing & Commissioning",
      description: "System testing, calibration, and final adjustments"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              🔧 Installation Support
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Installation <span className="text-primary">Guides</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Step-by-step installation guides, video tutorials, and technical documentation to help you set up your irrigation system correctly.
            </p>
          </div>

          {/* Installation Process Overview */}
          <div className="mb-12 bg-muted/30 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-center mb-8">Installation Process Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {installationSteps.map((step, index) => (
                <div key={index} className="text-center space-y-4">
                  <div className="inline-flex p-4 bg-primary/10 rounded-2xl">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search installation guides by product or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by file type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All File Types</SelectItem>
                  {availableFileTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-32 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Document Management System Documents */}
              {filteredManagedDocuments.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Installation Resources</h2>
                    <Badge variant="outline" className="text-sm">
                      {filteredManagedDocuments.length} Documents
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredManagedDocuments.map((doc) => {
                      const IconComponent = getDocumentIcon(doc.file_type);
                      const categoryColor = getDocumentCategoryColor(doc.category);
                      const canView = canViewInModal(doc.file_type);
                      
                      return (
                        <Card key={doc.id} className="hover:shadow-lg transition-shadow group">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <Badge className={`${categoryColor} border text-xs`}>
                                {doc.category}
                              </Badge>
                              <div className="flex gap-1">
                                {doc.requires_login && (
                                  <Badge variant="outline" className="text-xs">
                                    Login Required
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {doc.file_type?.toUpperCase() || 'FILE'}
                                </Badge>
                              </div>
                            </div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <IconComponent className="h-5 w-5 text-primary" />
                              {doc.title}
                            </CardTitle>
                            {doc.description && (
                              <CardDescription className="line-clamp-2">
                                {doc.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {/* Document Tags */}
                              {doc.tags && doc.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {doc.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {doc.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{doc.tags.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Document Stats */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{doc.download_count || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                {doc.file_size && doc.file_size > 0 && (
                                  <span className="font-medium">
                                    {formatFileSize(doc.file_size)}
                                  </span>
                                )}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                {canView && (
                                  <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleViewDocument(doc.file_url, doc.title, doc.file_type)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {isVideoFile(doc.file_type) ? 'Play' : 'View'}
                                  </Button>
                                )}
                                <Button
                                  className={canView ? "flex-1" : "w-full"}
                                  onClick={() => handleDownloadDocument(doc.file_url, doc.title, doc.id)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Installation Guides */}
              {filteredProducts.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Product-Specific Installation Guides</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => {
                      const IconComponent = getCategoryIcon(product.category);
                      const categoryColor = getCategoryColor(product.category);
                      const categoryName = product.category?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Product';
                      
                      return (
                        <Card key={product.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <Badge className={`${categoryColor} border`}>
                                <IconComponent className="h-3 w-3 mr-1" />
                                {categoryName}
                              </Badge>
                              {product.model_number && (
                                <Badge variant="outline" className="text-xs">
                                  {product.model_number}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            {product.description && (
                              <CardDescription className="line-clamp-2">
                                {product.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {product.installation_guide_url && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    className="flex-1 justify-start"
                                    onClick={() => handleViewDocument(product.installation_guide_url, `${product.name} Installation Guide`, 'pdf')}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Guide
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadDocument(product.installation_guide_url, `${product.name}-installation-guide.pdf`, null)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              
                              {product.video_url && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    className="flex-1 justify-start"
                                    onClick={() => handleViewDocument(product.video_url, `${product.name} Installation Video`, 'mp4')}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Play Video
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadDocument(product.video_url, `${product.name}-installation-video.mp4`, null)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}

                              {product.maintenance_manual_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-xs"
                                  onClick={() => handleViewDocument(product.maintenance_manual_url, `${product.name} Maintenance Manual`, 'pdf')}
                                >
                                  <Eye className="h-3 w-3 mr-2" />
                                  View Maintenance Manual
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Results */}
              {filteredProducts.length === 0 && filteredDocuments.length === 0 && filteredManagedDocuments.length === 0 && !loading && (
                <div className="text-center py-16">
                  <div className="mb-4">
                    <Search className="h-16 w-16 text-muted-foreground/50 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Installation Guides Found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search terms or filters, or contact our support team for assistance.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                      setSelectedDocumentType("all");
                    }}>
                      Clear All Filters
                    </Button>
                    <Button>
                      Contact Support
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* CTA Section */}
          <div className="mt-16 text-center bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Need Installation Support?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our certified technicians are available to provide installation support, on-site assistance, and training services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                Request Installation Service
              </Button>
              <Button variant="outline" size="lg">
                Contact Technical Support
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* PDF Modal */}
      {pdfModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl h-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-foreground truncate pr-4">{pdfModal.title}</h3>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(pdfModal.url, pdfModal.title, null)}
                  className="hidden sm:flex"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(pdfModal.url, pdfModal.title, null)}
                  className="sm:hidden"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPdfModal({ isOpen: false, url: "", title: "" })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <iframe
                src={`${pdfModal.url}#view=FitH&toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full border-0"
                title={pdfModal.title}
                loading="lazy"
              >
                <div className="p-4 text-center">
                  <p className="mb-4">Your browser does not support PDFs.</p>
                  <Button
                    onClick={() => handleDownloadDocument(pdfModal.url, pdfModal.title, null)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download the PDF
                  </Button>
                </div>
              </iframe>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {videoModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-foreground truncate pr-4">{videoModal.title}</h3>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(videoModal.url, videoModal.title, null)}
                  className="hidden sm:flex"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(videoModal.url, videoModal.title, null)}
                  className="sm:hidden"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVideoModal({ isOpen: false, url: "", title: "" })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3 sm:p-4 flex-1">
              <video
                className="w-full h-auto max-h-[75vh] rounded"
                controls
                preload="metadata"
                src={videoModal.url}
                controlsList="nodownload"
              >
                <p className="text-center p-4">
                  Your browser does not support the video tag.
                  <Button
                    className="ml-4"
                    onClick={() => handleDownloadDocument(videoModal.url, videoModal.title, null)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Video
                  </Button>
                </p>
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-foreground truncate pr-4">{imageModal.title}</h3>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(imageModal.url, imageModal.title, null)}
                  className="hidden sm:flex"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(imageModal.url, imageModal.title, null)}
                  className="sm:hidden"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageModal({ isOpen: false, url: "", title: "" })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3 sm:p-4 flex-1 flex items-center justify-center overflow-auto">
              <img
                src={imageModal.url}
                alt={imageModal.title}
                className="max-w-full max-h-full object-contain rounded"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="text-center p-4 hidden">
                <p className="mb-4">Unable to load image.</p>
                <Button
                  onClick={() => handleDownloadDocument(imageModal.url, imageModal.title, null)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Image
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationGuides;