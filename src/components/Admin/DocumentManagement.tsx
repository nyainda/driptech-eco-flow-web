import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download,
  FileText,
  Image,
  Video,
  Archive,
  Eye,
  Upload,
  ExternalLink,
  Filter,
  SortAsc,
  SortDesc,
  X,
  Calendar,
  HardDrive,
  Users,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  tags: string[];
  download_count: number;
  requires_login: boolean;
  created_at: string;
}

type SortField = 'title' | 'created_at' | 'download_count' | 'file_size';
type SortDirection = 'asc' | 'desc';

const DocumentManagement = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file_url: "",
    file_type: "",
    category: "",
    tags: "",
    requires_login: false
  });

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

  const fileTypeIcons = {
    'pdf': FileText,
    'doc': FileText,
    'docx': FileText,
    'xls': FileText,
    'xlsx': FileText,
    'jpg': Image,
    'jpeg': Image,
    'png': Image,
    'gif': Image,
    'mp4': Video,
    'avi': Video,
    'mov': Video,
    'zip': Archive,
    'rar': Archive
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Get unique tags for filtering
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    documents.forEach(doc => {
      doc.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [documents]);

  // Enhanced filtering and sorting
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        doc.category?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => doc.tags?.includes(tag));
      
      return matchesSearch && matchesCategory && matchesTags;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'download_count':
          aValue = a.download_count;
          bValue = b.download_count;
          break;
        case 'file_size':
          aValue = a.file_size;
          bValue = b.file_size;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [documents, debouncedSearchTerm, selectedCategory, selectedTags, sortField, sortDirection]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (!formData.file_url.trim()) {
      newErrors.file_url = "File URL is required";
    }
    
    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return null;

    // File validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mov', 'zip', 'rar'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive"
      });
      return null;
    }

    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      toast({
        title: "Error",
        description: "File type not supported",
        variant: "destructive"
      });
      return null;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `documents/${fileName}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      const fileType = file.name.split('.').pop()?.toLowerCase() || '';
      
      setFormData(prev => ({
        ...prev,
        file_url: publicUrl,
        file_type: fileType,
        title: prev.title || file.name.split('.')[0]
      }));

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      return {
        url: publicUrl,
        type: fileType,
        size: file.size
      };

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const documentData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        file_size: 0,
        download_count: 0
      };

      if (editingDocument) {
        const { error } = await supabase
          .from('documents')
          .update(documentData)
          .eq('id', editingDocument.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Document updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('documents')
          .insert([documentData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Document added successfully"
        });
      }

      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedDocuments.size} document(s)?`)) return;

    try {
      for (const docId of selectedDocuments) {
        await supabase.from('documents').delete().eq('id', docId);
      }
      
      toast({
        title: "Success",
        description: `${selectedDocuments.size} document(s) deleted successfully`
      });
      
      setSelectedDocuments(new Set());
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting documents:', error);
      toast({
        title: "Error",
        description: "Failed to delete documents",
        variant: "destructive"
      });
    }
  };

  const handleDownload = useCallback(async (document: Document) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ download_count: document.download_count + 1 })
        .eq('id', document.id);

      if (error) throw error;

      window.open(document.file_url, '_blank');
      
      setDocuments(docs => 
        docs.map(doc => 
          doc.id === document.id 
            ? { ...doc, download_count: doc.download_count + 1 }
            : doc
        )
      );

      toast({
        title: "Download Started",
        description: `Downloading ${document.title}`,
      });

    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document deleted successfully"
      });
      
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  }, [toast, fetchDocuments]);

  const handleEdit = useCallback((document: Document) => {
    setEditingDocument(document);
    setFormData({
      title: document.title,
      description: document.description || "",
      file_url: document.file_url,
      file_type: document.file_type || "",
      category: document.category || "",
      tags: document.tags?.join(', ') || "",
      requires_login: document.requires_login
    });
    setShowAddForm(true);
    setErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      file_url: "",
      file_type: "",
      category: "",
      tags: "",
      requires_login: false
    });
    setEditingDocument(null);
    setShowAddForm(false);
    setErrors({});
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getFileIcon = useCallback((fileType: string) => {
    const type = fileType?.toLowerCase();
    const IconComponent = fileTypeIcons[type as keyof typeof fileTypeIcons] || FileText;
    return IconComponent;
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocuments(newSelected);
  };

  const selectAllDocuments = () => {
    if (selectedDocuments.size === filteredAndSortedDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredAndSortedDocuments.map(doc => doc.id)));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Document Management</h2>
          <p className="text-muted-foreground">
            Manage your document download center and resources
          </p>
        </div>
        <div className="flex gap-2">
          {selectedDocuments.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedDocuments.size})
            </Button>
          )}
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingDocument ? "Edit Document" : "Add New Document"}
            </CardTitle>
            <CardDescription>
              {editingDocument ? "Update document information" : "Upload and manage downloadable resources"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingDocument && (
                <div>
                  <Label htmlFor="file-upload">Upload File</Label>
                  <div 
                    className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Drag and drop files here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports: PDF, DOC, XLS, images, videos, archives (max 10MB)
                      </p>
                      <input
                        id="file-upload"
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file);
                          }
                        }}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.zip,.rar"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Browse Files
                      </Button>
                    </div>
                    {uploading && (
                      <div className="mt-4">
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Document Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter document title"
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.title}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.category}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the document"
                  rows={3}
                />
              </div>

              {editingDocument && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="file_url">File URL *</Label>
                    <Input
                      id="file_url"
                      value={formData.file_url}
                      onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                      placeholder="https://example.com/document.pdf"
                      className={errors.file_url ? "border-red-500" : ""}
                    />
                    {errors.file_url && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.file_url}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="file_type">File Type</Label>
                    <Input
                      id="file_type"
                      value={formData.file_type}
                      onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                      placeholder="pdf, doc, jpg, etc."
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="irrigation, installation, manual, guide"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_login"
                  checked={formData.requires_login}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_login: checked })}
                />
                <Label htmlFor="requires_login">Require login to download</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {editingDocument ? "Update Document" : "Add Document"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {documentCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showAdvancedFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Filter by Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTags([...selectedTags, tag]);
                          } else {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          }
                        }}
                      />
                      <Label htmlFor={`tag-${tag}`} className="text-sm">
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTags([])}
                    className="mt-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear Tags
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedDocuments.size === filteredAndSortedDocuments.length && filteredAndSortedDocuments.length > 0}
                onCheckedChange={selectAllDocuments}
              />
              <Label className="text-sm">
                Select All ({filteredAndSortedDocuments.length})
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {filteredAndSortedDocuments.length} of {documents.length} documents
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('title')}
              className="flex items-center gap-1"
            >
              Title
              {sortField === 'title' && (
                sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('created_at')}
              className="flex items-center gap-1"
            >
              <Calendar className="h-3 w-3" />
              Date
              {sortField === 'created_at' && (
                sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('download_count')}
              className="flex items-center gap-1"
            >
              <Users className="h-3 w-3" />
              Downloads
              {sortField === 'download_count' && (
                sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('file_size')}
              className="flex items-center gap-1"
            >
              <HardDrive className="h-3 w-3" />
              Size
              {sortField === 'file_size' && (
                sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedDocuments.map((document) => {
          const FileIcon = getFileIcon(document.file_type);
          const isSelected = selectedDocuments.has(document.id);
          
          return (
            <Card key={document.id} className={`hover:shadow-md transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleDocumentSelection(document.id)}
                    />
                    <div className="p-2 bg-muted rounded-lg">
                      <FileIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{document.title}</CardTitle>
                      {document.category && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {document.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {document.requires_login && (
                    <Badge variant="outline" className="text-xs">
                      Login Required
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {document.description || "No description available"}
                </p>
                
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>File Type:</span>
                    <span className="uppercase font-medium">{document.file_type || "Unknown"}</span>
                  </div>
                  {document.file_size > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Size:</span>
                      <span className="font-medium">{formatFileSize(document.file_size)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Downloads:</span>
                    <span className="font-medium">{document.download_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Added:</span>
                    <span className="font-medium">
                      {new Date(document.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {document.tags && document.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {document.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {document.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{document.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                      onClick={() => handleDownload(document)}
                      title="Download document"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => window.open(document.file_url, '_blank')}
                      title="View in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0 hover:bg-amber-50 hover:text-amber-600"
                      onClick={() => handleEdit(document)}
                      title="Edit document"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50"
                      onClick={() => handleDelete(document.id)}
                      title="Delete document"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAndSortedDocuments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Download className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedCategory !== "all" || selectedTags.length > 0
                ? "Try adjusting your search or filter criteria" 
                : "Get started by adding your first document"}
            </p>
            {!searchTerm && selectedCategory === "all" && selectedTags.length === 0 && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Document
              </Button>
            )}
            {(searchTerm || selectedCategory !== "all" || selectedTags.length > 0) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedTags([]);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics Summary */}
      {documents.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {documents.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Documents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {documents.reduce((sum, doc) => sum + doc.download_count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Downloads</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {documentCategories.filter(cat => 
                    documents.some(doc => doc.category === cat)
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground">Categories Used</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatFileSize(documents.reduce((sum, doc) => sum + doc.file_size, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Storage</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentManagement;