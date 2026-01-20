import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  GraduationCap, 
  Menu, 
  X, 
  ChevronDown 
} from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/features', label: 'Features' },
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact' },
    { path: '/pricing', label: 'Pricing' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg' 
          : 'bg-white shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <GraduationCap className="h-8 w-8 text-blue-600 transition-transform group-hover:scale-110" />
              <span className="ml-2 text-xl font-bold text-gray-900">SchoolMaster Pro</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActiveRoute(link.path)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Login Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setIsLoginDropdownOpen(!isLoginDropdownOpen);
                  setIsRegisterDropdownOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
              >
                Login
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${isLoginDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Login Dropdown Menu */}
              <div 
                className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-10 transform transition-all duration-200 origin-top ${
                  isLoginDropdownOpen 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
              >
                <Link
                  to="/login"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setIsLoginDropdownOpen(false)}
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  School Login
                </Link>
                <Link
                  to="/staff/login"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setIsLoginDropdownOpen(false)}
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Staff Login
                </Link>
                <Link
                  to="/parent/login"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setIsLoginDropdownOpen(false)}
                >
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Parent Login
                </Link>
              </div>
            </div>

            {/* Register Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setIsRegisterDropdownOpen(!isRegisterDropdownOpen);
                  setIsLoginDropdownOpen(false);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
              >
                Register
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${isRegisterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Register Dropdown Menu */}
              <div 
                className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-10 transform transition-all duration-200 origin-top ${
                  isRegisterDropdownOpen 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
              >
                <Link
                  to="/create-school"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                  onClick={() => setIsRegisterDropdownOpen(false)}
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  School Register
                </Link>
                <Link
                  to="/staff/register"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                  onClick={() => setIsRegisterDropdownOpen(false)}
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Staff Register
                </Link>
                <Link
                  to="/parent/register"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                  onClick={() => setIsRegisterDropdownOpen(false)}
                >
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Parent Register
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-2 pt-2 pb-4 space-y-1 bg-white border-t">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActiveRoute(link.path)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile Login Links */}
            <div className="pt-3 mt-3 border-t border-gray-200">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Login</p>
              <Link to="/login" className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                School Login
              </Link>
              <Link to="/staff/login" className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                Staff Login
              </Link>
              <Link to="/parent/login" className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                Parent Login
              </Link>
            </div>
            
            {/* Mobile Register Links */}
            <div className="pt-3 mt-3 border-t border-gray-200">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Register</p>
              <Link to="/create-school" className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50">
                School Register
              </Link>
              <Link to="/staff/register" className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50">
                Staff Register
              </Link>
              <Link to="/parent/register" className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50">
                Parent Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
