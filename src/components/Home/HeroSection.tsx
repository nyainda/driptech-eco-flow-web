import { useState, useEffect } from 'react';
import { ArrowRight, Play, Award, Users, Droplets, Zap, ShieldCheck, Star, CheckCircle, Phone, Mail } from "lucide-react";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // WhatsApp numbers and message
  const whatsappNumbers = {
    primary: "254111409454", // 0111 409 454 in international format
    secondary: "254114575401" // 0114 575 401 in international format
  };

  const whatsappMessage = encodeURIComponent(
    "Hi DripTech! I'm interested in your modern drip irrigation systems. Could you please provide me with more information about your services and pricing? Thank you!"
  );

  // Function to open WhatsApp
  const openWhatsApp = (number) => {
    const whatsappUrl = `https://wa.me/${number}?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Function to make phone call
  const makePhoneCall = (number) => {
    window.open(`tel:+${number}`, '_self');
  };

  const stats = [
    { icon: Users, value: "85+", label: "Happy Customers", color: "from-blue-400 to-blue-600" },
    { icon: Droplets, value: "2M+", label: "Liters Saved Monthly", color: "from-green-400 to-green-600" },
    { icon: Award, value: "6+", label: "Months Growing", color: "from-amber-400 to-amber-600" },
  ];

  const features = [
    { icon: Zap, text: "Smart IoT Systems", desc: "Automated precision control" },
    { icon: Droplets, text: "Water Conservation", desc: "Up to 40% water savings" },
    { icon: ShieldCheck, text: "5-Year Warranty", desc: "Complete peace of mind" },
  ];

  const testimonials = [
    { text: "Quick installation and great results on my greenhouse", author: "John Kamau", company: "Kamau Vegetables" },
    { text: "Young team but very professional and knowledgeable", author: "Mary Wanjiku", company: "Wanjiku Flowers" },
    { text: "Affordable prices and excellent customer service", author: "Peter Otieno", company: "Otieno Farm" }
  ];

  const certifications = [
    "Quality Guaranteed",
    "Professional Installation",
    "Local Kenyan Business",
    "Growing Fast & Trusted"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)` }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
        
        {/* Animated gradient mesh */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 0.1}% ${mousePosition.y * 0.1}%, rgba(34, 197, 94, 0.3) 0%, transparent 70%)`
          }}
        />
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-7 space-y-8 text-white">
            
            {/* Company Badge */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-4 py-2 text-sm font-semibold rounded-full">
                🌱 Kenya's Fastest Growing Irrigation Specialists
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-gray-300 ml-2">4.8/5 (32 reviews)</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-tight">
                <span className="bg-gradient-to-r from-white via-green-200 to-green-400 bg-clip-text text-transparent">
                  Transform
                </span>
                <br />
                <span className="text-white">Your Farm</span>
                <br />
                <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                  Today
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-2xl font-light">
                Modern drip irrigation systems that boost your yields while cutting water costs. 
                <span className="text-green-400 font-bold"> Fast installation</span>, 
                <span className="text-blue-400 font-bold"> affordable prices</span>, and reliable service across Kenya.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="group bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/10 hover:border-green-400/50 transition-all duration-300 hover:scale-105">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl border border-green-400/30">
                      <feature.icon className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm mb-1">{feature.text}</h3>
                      <p className="text-gray-400 text-xs">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => makePhoneCall(whatsappNumbers.primary)}
                className="group bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-8 py-6 rounded-2xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105 text-lg flex items-center justify-center cursor-pointer"
              >
                <Phone className="mr-3 h-5 w-5" />
                Call: 0111 409 454
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => openWhatsApp(whatsappNumbers.primary)}
                className="bg-gradient-to-r from-green-600 to-green-700 border-green-500 text-white hover:bg-green-500 hover:text-white backdrop-blur-sm px-8 py-6 rounded-2xl font-semibold text-lg border hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                💬 WhatsApp Us
              </button>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col sm:flex-row gap-6 pt-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-400" />
                <a href="mailto:driptech2025@gmail.com" className="hover:text-green-400 transition-colors">
                  driptech2025@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-400" />
                <button 
                  onClick={() => makePhoneCall(whatsappNumbers.secondary)}
                  className="hover:text-green-400 transition-colors cursor-pointer"
                >
                  0114 575 401
                </button>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Free Site Visit</span>
              </div>
            </div>

            {/* Company Strengths */}
            <div className="pt-6 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-3">Why Choose DripTech:</p>
              <div className="grid grid-cols-2 gap-2">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Testimonials */}
          <div className="lg:col-span-5 lg:justify-self-end">
            <div className="space-y-6 max-w-md">
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4">
                {stats.map((stat, index) => (
                  <div 
                    key={index}
                    className="group bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-green-400/50 transition-all duration-300 hover:scale-105"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-4 bg-gradient-to-br ${stat.color} rounded-2xl shadow-lg`}>
                        <stat.icon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <div className="text-4xl font-black text-white mb-1">
                          {stat.value}
                        </div>
                        <div className="text-gray-300 font-medium text-sm">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Testimonial Carousel */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-300">Client Reviews</span>
                </div>
                
                <div className="min-h-[100px] flex items-center">
                  <div key={currentSlide} className="animate-fade-in">
                    <p className="text-white font-medium mb-3 text-sm leading-relaxed">
                      "{testimonials[currentSlide].text}"
                    </p>
                    <div>
                      <p className="text-green-400 font-semibold text-sm">
                        {testimonials[currentSlide].author}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {testimonials[currentSlide].company}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {testimonials.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentSlide ? 'bg-green-400' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* WhatsApp Contact */}
              <button
                onClick={() => openWhatsApp(whatsappNumbers.primary)}
                className="w-full bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-md rounded-2xl p-4 border border-green-400/30 hover:from-green-500/30 hover:to-green-600/30 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/30 rounded-lg">
                    <Phone className="h-4 w-4 text-green-300" />
                  </div>
                  <div>
                    <p className="text-green-200 font-semibold text-sm">WhatsApp Direct</p>
                    <p className="text-green-100 text-xs">0111 409 454</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-8 right-8 z-20">
        <button 
          onClick={() => openWhatsApp(whatsappNumbers.secondary)}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 shadow-2xl hover:scale-110 transition-all duration-300 relative cursor-pointer flex items-center justify-center"
        >
          <span className="text-2xl">💬</span>
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            !
          </div>
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse hidden lg:block" />
      <div className="absolute bottom-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400/5 to-green-400/5 rounded-full blur-2xl animate-pulse hidden lg:block" />
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;