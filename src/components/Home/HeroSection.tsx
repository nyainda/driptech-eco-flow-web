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
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-100 via-blue-100 to-emerald-100 dark:from-slate-900 dark:via-blue-950 dark:to-emerald-950">
      {/* Enhanced Background with Professional Irrigation Photo */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 dark:opacity-25"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)` }}
        />
        {/* Professional overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/75 via-slate-800/70 to-emerald-900/75 dark:from-slate-900/90 dark:via-slate-800/85 dark:to-emerald-950/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
        
        {/* Animated gradient mesh */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 0.1}% ${mousePosition.y * 0.1}%, rgba(34, 197, 94, 0.3) 0%, transparent 70%)`
          }}
        />
        
        {/* Enhanced floating particles with water droplet effect */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full animate-pulse ${
              i % 3 === 0 ? 'w-2 h-2 bg-blue-400/60' : 
              i % 3 === 1 ? 'w-1.5 h-1.5 bg-emerald-400/70' : 
              'w-1 h-1 bg-cyan-400/80'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}

        {/* Professional irrigation pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }} />
        
        {/* Additional water pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.3) 2px, transparent 2px)`,
          backgroundSize: '100px 100px'
        }} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[calc(100vh-8rem)]">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-7 space-y-10 text-white pt-8 lg:pt-0">
            
            {/* Enhanced Company Badge with Better Spacing */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
              <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-blue-500 text-white border-0 px-8 py-4 text-sm font-bold rounded-full shadow-2xl backdrop-blur-sm border border-white/20 hover:scale-105 transition-all duration-300">
                <span className="text-lg mr-3">💧</span>
                <span>Kenya's #1 Smart Irrigation Specialists</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-5 py-3 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-yellow-100 font-semibold">4.9/5</span>
                <span className="text-xs text-gray-300">(47 reviews)</span>
              </div>
            </div>

            {/* Revolutionary Main Headline */}
            <div className="space-y-8">
              <div className="relative">
                <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.85] tracking-tight">
                  <span className="block text-white mb-4 drop-shadow-2xl">
                    Transform Your
                  </span>
                  <span className="block bg-gradient-to-r from-emerald-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent mb-4 filter drop-shadow-lg">
                    Agriculture
                  </span>
                  <span className="block text-emerald-100 text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-xl">
                    With Smart Irrigation
                  </span>
                </h1>
                
                {/* Enhanced decorative elements */}
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-emerald-400/30 to-blue-400/30 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-400/25 to-cyan-400/25 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 -right-12 w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }}></div>
              </div>
              
              <p className="text-lg md:text-xl lg:text-2xl text-gray-100 leading-relaxed max-w-3xl font-medium drop-shadow-lg">
                Revolutionary drip irrigation technology that increases yields by 
                <span className="text-emerald-300 font-bold bg-emerald-900/30 px-2 py-1 rounded-lg"> 40-60%</span> while reducing water usage by 
                <span className="text-blue-300 font-bold bg-blue-900/30 px-2 py-1 rounded-lg"> up to 50%</span>. 
                Professional installation and nationwide support across Kenya.
              </p>
            </div>

            {/* Enhanced Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="group bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 hover:border-emerald-400/60 transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-2xl">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-400/30 to-blue-500/30 rounded-xl border border-emerald-400/40 shadow-lg">
                      <feature.icon className="h-6 w-6 text-emerald-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base mb-2 drop-shadow-sm">{feature.text}</h3>
                      <p className="text-gray-200 text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Revolutionary CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <button 
                onClick={() => makePhoneCall(whatsappNumbers.primary)}
                className="group relative bg-gradient-to-r from-emerald-500 via-green-500 to-blue-500 hover:from-emerald-600 hover:via-green-600 hover:to-blue-600 text-white font-bold px-12 py-6 rounded-3xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-2 text-xl flex items-center justify-center cursor-pointer overflow-hidden border border-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Phone className="mr-4 h-6 w-6 relative z-10" />
                <span className="relative z-10 font-black">Call: 0111 409 454</span>
                <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-2 transition-transform relative z-10" />
              </button>
              
              <button 
                onClick={() => openWhatsApp(whatsappNumbers.primary)}
                className="group relative bg-white/15 backdrop-blur-md border-2 border-emerald-400/40 text-white hover:bg-white/20 hover:border-emerald-400/70 px-12 py-6 rounded-3xl font-bold text-xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 cursor-pointer shadow-2xl"
              >
                <span className="mr-4 text-3xl">💬</span>
                <span className="font-black">WhatsApp Us</span>
              </button>
            </div>

            {/* Enhanced Contact Info */}
            <div className="flex flex-col sm:flex-row gap-6 pt-6 text-base text-gray-100">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Mail className="h-5 w-5 text-emerald-400" />
                <a href="mailto:driptech2025@gmail.com" className="hover:text-emerald-300 transition-colors font-medium">
                  driptech2025@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Phone className="h-5 w-5 text-emerald-400" />
                <button 
                  onClick={() => makePhoneCall(whatsappNumbers.secondary)}
                  className="hover:text-emerald-300 transition-colors cursor-pointer font-medium"
                >
                  0114 575 401
                </button>
              </div>
              <div className="flex items-center gap-3 bg-emerald-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-400/30">
                <CheckCircle className="h-5 w-5 text-emerald-300" />
                <span className="font-semibold text-emerald-100">Free Site Visit</span>
              </div>
            </div>

            {/* Enhanced Company Strengths */}
            <div className="pt-8 border-t border-white/20">
              <p className="text-emerald-300 text-base mb-4 font-semibold">Why Choose DripTech:</p>
              <div className="grid grid-cols-2 gap-3">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                    <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-100 font-medium">{cert}</span>
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