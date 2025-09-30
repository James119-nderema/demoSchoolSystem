import React from 'react';
import { Link } from 'react-router-dom';
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
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

const Home: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = React.useState(false);
  const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = React.useState(false);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setIsLoginDropdownOpen(false);
        setIsRegisterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">SchoolMaster Pro</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Home</a>
              <a href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Features</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">About Us</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Contact</a>
              
              {/* Login Dropdown */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => {
                    setIsLoginDropdownOpen(!isLoginDropdownOpen);
                    setIsRegisterDropdownOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition duration-300 flex items-center"
                >
                  Login
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {isLoginDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link
                      to="/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsLoginDropdownOpen(false)}
                    >
                      School Login
                    </Link>
                    <Link
                      to="/staff/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsLoginDropdownOpen(false)}
                    >
                      Staff Login
                    </Link>
                    <Link
                      to="/parent/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsLoginDropdownOpen(false)}
                    >
                      Parent Login
                    </Link>
                  </div>
                )}
              </div>

              {/* Register Dropdown */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => {
                    setIsRegisterDropdownOpen(!isRegisterDropdownOpen);
                    setIsLoginDropdownOpen(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium transition duration-300 flex items-center"
                >
                  Register
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {isRegisterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link
                      to="/create-school"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsRegisterDropdownOpen(false)}
                    >
                      School Register
                    </Link>
                    <Link
                      to="/staff/register"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsRegisterDropdownOpen(false)}
                    >
                      Staff Register
                    </Link>
                    <Link
                      to="/parent/register"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsRegisterDropdownOpen(false)}
                    >
                      Parent Register
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-blue-600"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                <a href="#home" className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">Home</a>
                <a href="#features" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">Features</a>
                <a href="#about" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">About Us</a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">Contact</a>
                
                {/* Mobile Login Links */}
                <div className="pt-2 border-t border-gray-200">
                  <p className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">Login</p>
                  <Link to="/login" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">School Login</Link>
                  <Link to="/staff/login" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">Staff Login</Link>
                  <Link to="/parent/login" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">Parent Login</Link>
                </div>
                
                {/* Mobile Register Links */}
                <div className="pt-2 border-t border-gray-200">
                  <p className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">Register</p>
                  <Link to="/create-school" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">School Register</Link>
                  <Link to="/staff/register" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">Staff Register</Link>
                  <Link to="/parent/register" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">Parent Register</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your School with
              <span className="text-blue-600 block">SchoolMaster Pro</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The ultimate school management system featuring AI-powered tools, comprehensive result management, 
              seamless fee collection, and intelligent timetable generation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/create-school"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition duration-300 flex items-center justify-center"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-lg text-lg font-medium transition duration-300"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Schools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your educational institution efficiently and effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-gray-100">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Schools Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what educators are saying about SchoolMaster Pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                About SchoolMaster Pro
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                We are dedicated to transforming education through innovative technology solutions. 
                Our comprehensive school management system empowers educators, administrators, and 
                students to achieve their full potential.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">10+ years of education technology experience</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">500+ schools trust our platform</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">24/7 customer support</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Regular updates and new features</span>
                </div>
              </div>
            </div>
            <div className="lg:text-center">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="School Management"
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600">
              Ready to transform your school? Contact us today!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600">james.nderema@awsemobilis.org</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600">+254706394482</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Demo</h3>
              <p className="text-gray-600">Book a free consultation</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of schools already using SchoolMaster Pro to streamline their operations.
          </p>
          <Link
            to="/create-school"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-medium transition duration-300 inline-flex items-center"
          >
            Create Your School Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
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
                <li>Result Management</li>
                <li>Fee Payment</li>
                <li>Timetable Generation</li>
                <li>AI Library</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white">About Us</a></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API Reference</a></li>
                <li><a href="#" className="hover:text-white">System Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SchoolMaster Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
