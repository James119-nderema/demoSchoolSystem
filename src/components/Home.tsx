import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ScrollReveal, CountUpNumber } from './ui/ScrollReveal';
import { 
  GraduationCap, 
  BookOpen, 
  CreditCard, 
  Calendar, 
  Bot, 
  BarChart3, 
  Users, 
  Shield,
  Star,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Image URLs for the carousel - can be replaced with local imports if images are added to assets/images
const timetableImg = '/images/timetable.jpg';
const reportsImg = '/images/reports.jpg';
const feesImg = '/images/fees.jpg';

// Fallback URLs in case local images are not available
const fallbackImages = {
  reports: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  timetable: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  fees: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
};

interface SlideData {
  image: string;
  fallbackImage: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});

  const slides: SlideData[] = [
    {
      image: reportsImg,
      fallbackImage: fallbackImages.reports,
      title: "Academic Results & Reports",
      subtitle: "Comprehensive Analytics",
      description: "Track student performance with detailed analytics, customizable report cards, and insightful progress tracking.",
      color: "from-blue-600 to-indigo-700"
    },
    {
      image: timetableImg,
      fallbackImage: fallbackImages.timetable,
      title: "Smart Timetable Generation",
      subtitle: "AI-Powered Scheduling",
      description: "Create conflict-free timetables automatically with our intelligent scheduling system that optimizes resources.",
      color: "from-purple-600 to-pink-600"
    },
    {
      image: feesImg,
      fallbackImage: fallbackImages.fees,
      title: "Fee Management",
      subtitle: "Seamless Payments",
      description: "Streamlined fee collection with M-Pesa integration, automated receipts, and comprehensive financial reporting.",
      color: "from-green-600 to-teal-600"
    }
  ];

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  const nextSlide = useCallback(() => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [isAnimating, slides.length]);

  const prevSlide = useCallback(() => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [isAnimating, slides.length]);

  const goToSlide = (index: number) => {
    if (!isAnimating && index !== currentSlide) {
      setIsAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [nextSlide]);

  const features = [
    {
      icon: <BarChart3 className="h-12 w-12 text-blue-600" />,
      title: "Result Management",
      description: "Comprehensive student performance tracking with detailed analytics, grade calculations, and progress reports."
    },
    {
      icon: <CreditCard className="h-12 w-12 text-green-600" />,
      title: "Fees Payment",
      description: "Streamlined fee collection system with online payment integration, receipts, and financial reporting."
    },
    {
      icon: <Calendar className="h-12 w-12 text-purple-600" />,
      title: "Timetable Generation",
      description: "Automated timetable creation with conflict resolution, resource optimization, and easy scheduling."
    },
    {
      icon: <Bot className="h-12 w-12 text-orange-600" />,
      title: "AI-Powered Library",
      description: "Intelligent library management with AI recommendations, digital catalog, and smart search capabilities."
    },
    {
      icon: <Users className="h-12 w-12 text-indigo-600" />,
      title: "Student Management",
      description: "Complete student information system with enrollment, attendance tracking, and profile management."
    },
    {
      icon: <Shield className="h-12 w-12 text-red-600" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with role-based access, data encryption, and reliable cloud infrastructure."
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Principal, Greenwood High School",
      content: "This system has revolutionized how we manage our school. The result management and analytics features are outstanding!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "IT Director, Valley Academy",
      content: "The AI-powered library and automated timetable generation have saved us countless hours. Highly recommended!",
      rating: 5
    },
    {
      name: "Emma Williams",
      role: "Administrator, Riverside School",
      content: "Fee management has never been easier. Parents love the online payment system and transparent reporting.",
      rating: 5
    }
  ];

  const kenyaCurriculumBlogs = [
    {
      title: 'CBC in Kenya: How Schools Can Track Competencies Without Manual Chaos',
      excerpt: 'A practical guide for Kenyan school leaders on mapping CBC learning areas, grading evidence, and parent-ready reporting inside one platform.',
      tag: 'Kenya CBC',
    },
    {
      title: 'Kenya School Finance Playbook: Fee Collection, Reconciliation, and Visibility',
      excerpt: 'How Kenyan schools can reduce fee leakage, improve cashflow predictability, and give parents trusted payment visibility.',
      tag: 'Kenya Finance',
    },
    {
      title: 'From Timetable Conflicts to Teaching Time: A Kenyan Operations Blueprint',
      excerpt: 'How to move from manual scheduling bottlenecks to stable, conflict-free timetables that protect instructional time.',
      tag: 'Kenya Operations',
    },
  ];

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero Section with Image Carousel */}
      <section className="relative bg-gray-900 overflow-hidden">
        {/* Background Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-r ${slides[currentSlide].color} opacity-80 z-10 transition-all duration-700`} />
        
        {/* Image Carousel */}
        <div className="relative h-[500px] sm:h-[600px] lg:h-[700px]">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
                index === currentSlide 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-105'
              }`}
            >
              <img
                src={imageErrors[index] ? slide.fallbackImage : slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
                onError={() => handleImageError(index)}
              />
            </div>
          ))}
          
          {/* Content Overlay */}
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              {/* Animated Text Content */}
              <div 
                key={currentSlide}
                className="animate-fadeInUp"
              >
                <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
                  {slides[currentSlide].subtitle}
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                  {slides[currentSlide].title}
                </h1>
                <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
                  {slides[currentSlide].description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/create-school"
                    className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/features"
                    className="border-2 border-white text-white hover:bg-white/20 px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 backdrop-blur-sm"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 group"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 group"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide 
                    ? 'w-10 h-3 bg-white' 
                    : 'w-3 h-3 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/20">
            <div 
              className="h-full bg-white transition-all duration-300 ease-linear"
              style={{ 
                width: `${((currentSlide + 1) / slides.length) * 100}%`,
                animation: 'progress 5s linear infinite'
              }}
            />
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <ScrollReveal className="text-center" delay={0}>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">
                <CountUpNumber end={500} suffix="+" duration={2000} />
              </div>
              <div className="text-gray-600 text-sm md:text-base">Schools Trust Us</div>
            </ScrollReveal>
            <ScrollReveal className="text-center" delay={100}>
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-1">
                <CountUpNumber end={100} suffix="K+" duration={2000} />
              </div>
              <div className="text-gray-600 text-sm md:text-base">Students Managed</div>
            </ScrollReveal>
            <ScrollReveal className="text-center" delay={200}>
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-1">
                <CountUpNumber end={99} suffix=".9%" duration={2000} />
              </div>
              <div className="text-gray-600 text-sm md:text-base">Uptime</div>
            </ScrollReveal>
            <ScrollReveal className="text-center" delay={300}>
              <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-1">24/7</div>
              <div className="text-gray-600 text-sm md:text-base">Support</div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Kenyan Schools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for school owners and administrators who need stronger performance, tighter operations, and predictable revenue.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div 
                  className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1 h-full"
                >
                  <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/features"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-lg group"
            >
              View All Features
              <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Kenyan Schools
            </h2>
            <p className="text-xl text-gray-600">
              See what school leaders in Kenya are saying
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={index} delay={index * 150}>
                <div 
                  className="bg-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 h-full"
                >
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Kenya-First School Management Platform
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Built for Kenyan schools, this platform combines academics, finance, library, and operations in one connected system. 
                It helps owners and administrators protect revenue, improve service delivery, and make faster, data-backed decisions.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Designed around Kenyan school workflows and reporting realities</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">One connected system for academics, finance, timetable, and library</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Improves fee visibility, parent trust, and school cashflow confidence</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Practical support for school teams across Kenya</span>
                </div>
              </div>
              <Link
                to="/about"
                className="inline-flex items-center mt-8 text-blue-600 hover:text-blue-700 font-medium group"
              >
                Learn more about us
                <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Kenyan Curriculum Blog</h3>
              <p className="text-gray-600 text-sm">Insights focused on CBC delivery, school finance discipline, and operational growth in Kenya.</p>
              <div className="space-y-3">
                {kenyaCurriculumBlogs.map((blog, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{blog.tag}</span>
                    <h4 className="mt-2 text-sm font-semibold text-gray-900">{blog.title}</h4>
                    <p className="mt-1 text-sm text-gray-600">{blog.excerpt}</p>
                    <Link to="/about" className="mt-3 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
                      Read article
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600">
              Ready to transform your school? Contact us today!
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollReveal delay={0}>
              <div className="text-center p-6 bg-gray-50 rounded-xl h-full">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
                <p className="text-gray-600">info@schoolmaster.co.ke</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <div className="text-center p-6 bg-gray-50 rounded-xl h-full">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
                <p className="text-gray-600">+254706394482</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="text-center p-6 bg-gray-50 rounded-xl h-full">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Demo</h3>
                <p className="text-gray-600">Book a free consultation</p>
              </div>
            </ScrollReveal>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/contact"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-300"
            >
              Contact Us
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <ScrollReveal>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of schools already using SchoolMaster Pro to streamline their operations.
            </p>
            <Link
              to="/create-school"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-medium transition duration-300 inline-flex items-center shadow-lg hover:shadow-xl"
            >
              Create Your School Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <GraduationCap className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">SchoolMaster Pro</span>
              </div>
              <p className="text-gray-400">
                Empowering education through innovative technology solutions.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white transition-colors">Result Management</Link></li>
                <li><Link to="/features" className="hover:text-white transition-colors">Fee Payment</Link></li>
                <li><Link to="/features" className="hover:text-white transition-colors">Timetable Generation</Link></li>
                <li><Link to="/features" className="hover:text-white transition-colors">AI Library</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SchoolMaster Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom Styles for Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
