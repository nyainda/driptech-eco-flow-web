import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar,
  Clock,
  ArrowRight,
  Newspaper,
  Search,
  Filter,
  Eye,
  Heart,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

// Types
interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  tags: string[];
  reading_time?: number;
  views: number;
  likes: number;
  comments_count: number;
  published: boolean;
  author: string;
  created_at: string;
  updated_at: string;
}

interface NewsData {
  articles: NewsArticle[];
  total: number;
}

// Constants
const ARTICLES_PER_PAGE = 9;
const MAX_PAGES_TO_SHOW = 5;
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'title', label: 'Alphabetical' },
] as const;

// Utility Functions
const getArticleExcerpt = (article: NewsArticle): string =>
  article.excerpt || article.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...';

// Components
interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  totalArticles: number;
  totalViews: number;
  totalLikes: number;
}

const HeroSection = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  totalArticles,
  totalViews,
  totalLikes,
}: HeroSectionProps) => (
  <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
    <div className="container mx-auto px-4 relative">
      <div className="max-w-4xl mx-auto text-center">
        <Badge variant="secondary" className="mb-6 text-sm font-semibold">
          <Newspaper className="w-4 h-4 mr-2" />
          Latest News & Insights
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 tracking-tight text-foreground">
          Stay <span className="text-primary">Informed</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Discover the latest in irrigation technology, sustainable farming practices, and industry innovations.
        </p>
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-background border-2 border-border/20 shadow-md hover:border-primary/20 transition-all duration-300"
                aria-label="Search articles by title, excerpt, or content"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 h-14 bg-background border-2 border-border/20 shadow-md hover:border-primary/20 transition-all duration-300">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-center items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            <span>{totalArticles} Articles</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>{totalViews.toLocaleString()} Views</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span>{totalLikes.toLocaleString()} Likes</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

interface FeaturedArticleProps {
  article: NewsArticle;
}

const FeaturedArticle = ({ article }: FeaturedArticleProps) => (
  <article className="group">
    <Card className="overflow-hidden border-2 border-border/20 shadow-md hover:shadow-2xl hover:border-primary/20 hover:scale-[1.02] transition-all duration-500">
      <div className="relative aspect-[21/9] overflow-hidden">
        {article.featured_image_url ? (
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <Newspaper className="h-16 w-16 text-primary" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
        <div className="absolute top-6 left-6">
          <Badge className="bg-red-500/20 text-red-700 border-red-500/50 text-sm font-semibold px-4 py-2">
            <Star className="h-4 w-4 mr-2" />
            FEATURED
          </Badge>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-foreground">
            <div className="flex items-center gap-2 bg-primary/20 rounded-full px-3 py-1">
              <Calendar className="h-4 w-4" />
              {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
            </div>
            {article.reading_time && (
              <div className="flex items-center gap-2 bg-primary/20 rounded-full px-3 py-1">
                <Clock className="h-4 w-4" />
                {article.reading_time} min read
              </div>
            )}
            <div className="flex items-center gap-2 bg-primary/20 rounded-full px-3 py-1">
              <Eye className="h-4 w-4" />
              {article.views.toLocaleString()} views
            </div>
            <div className="flex items-center gap-2 bg-primary/20 rounded-full px-3 py-1">
              <Heart className="h-4 w-4" />
              {article.likes} likes
            </div>
          </div>
          <div className="text-sm text-muted-foreground mb-2">By {article.author}</div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 leading-tight text-foreground group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl leading-relaxed">
            {getArticleExcerpt(article)}
          </p>
          <Link to={`/news/${article.slug}`}>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 px-6 py-3 text-base font-medium"
              aria-label={`Read full article: ${article.title}`}
            >
              Read Full Article
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  </article>
);

interface SecondaryArticleProps {
  article: NewsArticle;
  index: number;
}

const SecondaryArticle = ({ article, index }: SecondaryArticleProps) => (
  <article className="group">
    <Card className="overflow-hidden border-2 border-border/20 shadow-md hover:shadow-2xl hover:border-primary/20 hover:scale-[1.02] transition-all duration-500">
      <div className="relative aspect-[4/3] overflow-hidden">
        {article.featured_image_url ? (
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <Newspaper className="h-12 w-12 text-primary" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="text-sm font-semibold">
            {index === 0 ? 'TRENDING' : 'LATEST'}
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.views}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {article.likes}
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="text-sm text-muted-foreground mb-2">By {article.author}</div>
        <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
          {getArticleExcerpt(article)}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {article.tags.slice(0, 2).map((tag, tagIndex) => (
              <Badge key={`${tag}-${tagIndex}`} variant="secondary" className="text-xs font-semibold">
                {tag}
              </Badge>
            ))}
          </div>
          <Link to={`/news/${article.slug}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-xl p-0 h-auto font-medium"
              aria-label={`Read more: ${article.title}`}
            >
              Read More
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  </article>
);

interface RegularArticleProps {
  article: NewsArticle;
}

const RegularArticle = ({ article }: RegularArticleProps) => (
  <article className="group">
    <Card className="overflow-hidden border-2 border-border/20 shadow-md hover:shadow-2xl hover:border-primary/20 hover:scale-[1.02] transition-all duration-500 h-full flex flex-col">
      <div className="relative aspect-video overflow-hidden">
        {article.featured_image_url ? (
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="text-xs font-semibold">
            NEWS
          </Badge>
        </div>
      </div>
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
          </div>
          {article.reading_time && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.reading_time}m
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold mb-3 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-muted-foreground mb-4 line-clamp-3 flex-1 leading-relaxed">
          {getArticleExcerpt(article)}
        </p>
        <div className="text-sm text-muted-foreground mb-3">By {article.author}</div>
        <div className="flex items-center justify-between pt-4 border-t border-border/20">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{article.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{article.likes}</span>
            </div>
          </div>
          <Link to={`/news/${article.slug}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-xl p-0 h-auto font-medium"
              aria-label={`Read article: ${article.title}`}
            >
              Read Article
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  </article>
);

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, setCurrentPage }: PaginationProps) => {
  const getPageNumbers = useCallback(() => {
    const pages: (number | 'ellipsis')[] = [];
    const startPage = Math.max(1, currentPage - Math.floor(MAX_PAGES_TO_SHOW / 2));
    const endPage = Math.min(totalPages, startPage + MAX_PAGES_TO_SHOW - 1);

    if (startPage > 1) pages.push('ellipsis');
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < totalPages) pages.push('ellipsis');
    return pages;
  }, [currentPage, totalPages]);

  return totalPages > 1 ? (
    <div className="flex justify-center items-center gap-2 pt-8">
      <Button
        variant="outline"
        className="rounded-xl hover:bg-primary/10 hover:shadow-lg hover:scale-105 transition-all duration-300"
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        Previous
      </Button>
      <div className="flex gap-1">
        {getPageNumbers().map((page, index) =>
          page === 'ellipsis' ? (
            <Button
              key={`ellipsis-${index}`}
              variant="outline"
              disabled
              className="w-10 h-10 rounded-xl"
            >
              ...
            </Button>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:shadow-lg hover:scale-105 transition-all duration-300"
              aria-label={`Go to page ${page}`}
            >
              {page}
            </Button>
          )
        )}
      </div>
      <Button
        variant="outline"
        className="rounded-xl hover:bg-primary/10 hover:shadow-lg hover:scale-105 transition-all duration-300"
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        Next
      </Button>
    </div>
  ) : null;
};

// Main Component
const News: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: newsData = { articles: [], total: 0 }, isLoading } = useQuery<NewsData>({
    queryKey: ['news-articles', searchQuery, sortBy, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('news_articles')
        .select('*', { count: 'exact' })
        .eq('published', true);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'popular':
          query = query.order('views', { ascending: false });
          break;
        case 'title':
          query = query.order('title', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const from = (currentPage - 1) * ARTICLES_PER_PAGE;
      const to = from + ARTICLES_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return {
        articles: (data as NewsArticle[]) || [],
        total: count || 0,
      };
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
  });

  const totalPages = Math.ceil(newsData.total / ARTICLES_PER_PAGE);
  const totalViews = useMemo(
    () => newsData.articles.reduce((sum, article) => sum + article.views, 0),
    [newsData.articles]
  );
  const totalLikes = useMemo(
    () => newsData.articles.reduce((sum, article) => sum + article.likes, 0),
    [newsData.articles]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 sm:pt-20 pb-8">
        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          totalArticles={newsData.total}
          totalViews={totalViews}
          totalLikes={totalLikes}
        />
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="space-y-8">
              <Card className="overflow-hidden border-2 border-border/20 shadow-md">
                <div className="aspect-[21/9] bg-muted animate-pulse" />
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="h-8 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden border-2 border-border/20 shadow-md">
                    <div className="aspect-video bg-muted animate-pulse" />
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-6 bg-muted rounded animate-pulse" />
                        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : newsData.articles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Newspaper className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-foreground">No Articles Found</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                {searchQuery
                  ? 'Try adjusting your search terms or explore our latest content.'
                  : "We're working on bringing you the latest news. Check back soon!"}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={clearSearch}
                  className="rounded-xl hover:bg-primary/10 hover:shadow-lg hover:scale-105 transition-all duration-300"
                  aria-label="Clear search"
                >
                  Clear Search
                </Button>
              )}
              <div className="mt-8 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border-2 border-border/20 max-w-md mx-auto text-left">
                <p className="text-sm font-medium mb-2 text-foreground">Debug Information:</p>
                <p className="text-xs text-muted-foreground">Total articles: {newsData.total}</p>
                <p className="text-xs text-muted-foreground">Search query: {searchQuery || 'None'}</p>
                <p className="text-xs text-muted-foreground">Sort by: {sortBy}</p>
                <p className="text-xs text-muted-foreground">Current page: {currentPage}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-12 lg:space-y-16">
              {newsData.articles[0] && <FeaturedArticle article={newsData.articles[0]} />}
              {newsData.articles.length > 1 && (
                <section>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {newsData.articles.slice(1, 3).map((article, index) => (
                      <SecondaryArticle key={article.id} article={article} index={index} />
                    ))}
                  </div>
                </section>
              )}
              {newsData.articles.length > 3 && (
                <section>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-foreground">More Stories</h2>
                    <div className="h-px bg-border flex-1 ml-6" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {newsData.articles.slice(3).map((article) => (
                      <RegularArticle key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              )}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default News;