
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, Newspaper, TrendingUp, Users, Lightbulb } from "lucide-react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const News = () => {
  const newsArticles = [
    {
      id: 1,
      title: "Kenya's Water Conservation Initiative Boosts Smart Irrigation Adoption",
      summary: "Government incentives drive farmers towards efficient irrigation systems, reducing water usage by 40%.",
      date: "2024-02-15",
      readTime: "5 min read",
      category: "Industry News",
      image: "/api/placeholder/400/250",
      featured: true
    },
    {
      id: 2,
      title: "DripTech Expands Operations to Western Kenya",
      summary: "New service centers in Kakamega and Bungoma to serve growing demand for irrigation solutions.",
      date: "2024-02-10",
      readTime: "3 min read",
      category: "Company Updates",
      image: "/api/placeholder/400/250"
    },
    {
      id: 3,
      title: "Solar-Powered Irrigation Systems: The Future is Now",
      summary: "How renewable energy is revolutionizing farming practices across East Africa.",
      date: "2024-02-08",
      readTime: "7 min read",
      category: "Technology",
      image: "/api/placeholder/400/250"
    },
    {
      id: 4,
      title: "Success Story: Nakuru Greenhouse Farmer Triples Yield",
      summary: "John Kamau's journey from traditional farming to smart irrigation excellence.",
      date: "2024-02-05",
      readTime: "4 min read",
      category: "Success Stories",
      image: "/api/placeholder/400/250"
    },
    {
      id: 5,
      title: "Training Program: Advanced Irrigation Techniques Workshop",
      summary: "Free technical training sessions for farmers across Central Kenya starting March 2024.",
      date: "2024-02-01",
      readTime: "2 min read",
      category: "Education",
      image: "/api/placeholder/400/250"
    },
    {
      id: 6,
      title: "Climate-Smart Agriculture Gains Momentum",
      summary: "How precision irrigation is helping farmers adapt to changing weather patterns.",
      date: "2024-01-28",
      readTime: "6 min read",
      category: "Climate",
      image: "/api/placeholder/400/250"
    }
  ];

  const categories = [
    { name: "All", icon: Newspaper, count: newsArticles.length },
    { name: "Industry News", icon: TrendingUp, count: 2 },
    { name: "Company Updates", icon: Users, count: 1 },
    { name: "Technology", icon: Lightbulb, count: 2 },
    { name: "Success Stories", icon: Users, count: 1 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              📰 Latest Updates
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              News & <span className="text-primary">Updates</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stay informed about the latest developments in irrigation technology, industry trends, and DripTech company updates.
            </p>
          </div>

          {/* Categories Filter */}
          <div className="flex flex-wrap gap-2 mb-12 justify-center">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant="outline"
                className="flex items-center gap-2"
              >
                <category.icon className="h-4 w-4" />
                {category.name}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Featured Article */}
          {newsArticles.filter(article => article.featured).map((article) => (
            <Card key={article.id} className="mb-12 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="aspect-video lg:aspect-auto bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Newspaper className="h-16 w-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Featured Article Image</p>
                  </div>
                </div>
                <CardContent className="p-8 flex flex-col justify-center">
                  <Badge className="w-fit mb-4">{article.category}</Badge>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">{article.title}</h2>
                  <p className="text-muted-foreground mb-6 text-lg">{article.summary}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(article.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {article.readTime}
                    </div>
                  </div>
                  <Button className="w-fit">
                    Read Full Article
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </div>
            </Card>
          ))}

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsArticles.filter(article => !article.featured).map((article) => (
              <Card key={article.id} className="group hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <Newspaper className="h-12 w-12 text-primary/50" />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{article.category}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {article.readTime}
                    </div>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription>{article.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(article.date).toLocaleDateString()}
                    </div>
                    <Button variant="ghost" size="sm">
                      Read More
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Newsletter Signup */}
          <Card className="mt-16">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Subscribe to our newsletter for the latest irrigation technology updates, farming tips, and exclusive offers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border border-input rounded-lg"
                />
                <Button>Subscribe</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;
