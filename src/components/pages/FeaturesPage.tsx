import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  CreditCard, 
  Calendar, 
  Bot, 
  Users, 
  Shield,
  CheckCircle,
  ArrowRight,
  Zap,
  Clock,
  Globe,
  Database
} from 'lucide-react';

const FeaturesPage: React.FC = () => {
  const mainFeatures = [
    {
      icon: <BarChart3 className="h-12 w-12 text-blue-600" />,
      title: "Result Management",
      description: "Improve academic decision quality with centralized performance data, fast reporting cycles, and board-ready analytics.",
      benefits: [
        "Automated grade calculations",
        "Progress tracking over time",
        "Customizable report cards",
        "Department and class-level analytics"
      ]
    },
    {
      icon: <CreditCard className="h-12 w-12 text-green-600" />,
      title: "Fees Payment",
      description: "Strengthen school cashflow with transparent billing, faster collections, and cleaner reconciliation workflows.",
      benefits: [
        "M-Pesa integration",
        "Automated receipts",
        "Payment reminders",
        "Finance performance reports"
      ]
    },
    {
      icon: <Calendar className="h-12 w-12 text-purple-600" />,
      title: "Timetable Generation",
      description: "Reduce scheduling delays and protect teaching time with conflict-aware timetable automation.",
      benefits: [
        "AI-powered scheduling",
        "Conflict detection",
        "Teacher availability",
        "Resource-aware allocation"
      ]
    },
    {
      icon: <Bot className="h-12 w-12 text-orange-600" />,
      title: "AI-Powered Library",
      description: "Control stock movement, improve borrowing accountability, and connect lost-book recovery to finance workflows.",
      benefits: [
        "Smart book recommendations",
        "Digital cataloging",
        "Borrowing management",
        "Lost-book and payment tracking"
      ]
    },
    {
      icon: <Users className="h-12 w-12 text-indigo-600" />,
      title: "Student Management",
      description: "Build one trusted student record for administration, academic coordination, and parent communication.",
      benefits: [
        "Easy enrollment",
        "Attendance tracking",
        "Profile management",
        "Parent-ready visibility"
      ]
    },
    {
      icon: <Shield className="h-12 w-12 text-red-600" />,
      title: "Secure & Reliable",
      description: "Operate with confidence using role-based controls, resilient uptime, and secure data handling.",
      benefits: [
        "Data encryption",
        "Role-based access",
        "Daily backups",
        "99.9% service uptime"
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: "Fast Performance",
      description: "Quick user workflows for busy school offices"
    },
    {
      icon: <Clock className="h-8 w-8 text-blue-500" />,
      title: "Real-time Updates",
      description: "Immediate updates for administrators and staff"
    },
    {
      icon: <Globe className="h-8 w-8 text-green-500" />,
      title: "Cloud-Based",
      description: "School operations access from anywhere in Kenya"
    },
    {
      icon: <Database className="h-8 w-8 text-purple-500" />,
      title: "Data Export",
      description: "Export management-ready reports (PDF, Excel, CSV)"
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Business-Ready Features for Kenyan Schools
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            The complete operating system for school growth: stronger academics, disciplined finance, and efficient administration.
          </p>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1"
              >
                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            And Much More...
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your School?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join Kenyan schools already improving performance and operational control with SchoolMaster Pro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/create-school"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-medium transition duration-300 inline-flex items-center justify-center"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/pricing"
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg text-lg font-medium transition duration-300"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;
