import React from 'react';
import { Link } from 'react-router-dom';
import { ScrollReveal, CountUpNumber } from '../ui/ScrollReveal';
import { 
  GraduationCap,
  Target,
  Eye,
  Heart,
  Users,
  Award,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const AboutPage: React.FC = () => {
  const kenyaCurriculumBlog = [
    {
      title: 'CBC Reporting in Kenya: From Teacher Notes to Board-Ready Insights',
      summary: 'How Kenyan schools can convert daily classroom data into reliable parent communication and strategic decision support.',
      category: 'Kenya CBC'
    },
    {
      title: 'School Growth in Kenya: Why Operational Discipline Beats Manual Workarounds',
      summary: 'A practical roadmap for principals and proprietors who want stable growth, fewer leaks, and stronger accountability.',
      category: 'Kenya Leadership'
    },
    {
      title: 'Fee Confidence for Kenyan Parents: The Visibility Model That Improves Collections',
      summary: 'How transparent invoices, payment history, and timely reminders build trust and improve collection performance.',
      category: 'Kenya Finance'
    }
  ];

  const values = [
    {
      icon: <Target className="h-10 w-10 text-blue-600" />,
      title: "Innovation",
      description: "We continuously innovate to bring cutting-edge solutions to education."
    },
    {
      icon: <Heart className="h-10 w-10 text-red-500" />,
      title: "Passion",
      description: "We are passionate about transforming education through technology."
    },
    {
      icon: <Users className="h-10 w-10 text-green-600" />,
      title: "Collaboration",
      description: "We work closely with educators to understand and meet their needs."
    },
    {
      icon: <Award className="h-10 w-10 text-purple-600" />,
      title: "Excellence",
      description: "We strive for excellence in everything we do."
    }
  ];



  const team = [
    {
      name: "John Mwangi",
      role: "CEO & Founder",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face"
    },
    {
      name: "Sarah Ochieng",
      role: "CTO",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face"
    },
    {
      name: "David Kimani",
      role: "Head of Product",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face"
    },
    {
      name: "Grace Wanjiku",
      role: "Customer Success",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face"
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              About SchoolMaster Pro
            </h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              A Kenya-first school operations platform built to help schools strengthen performance, improve parent confidence, and scale sustainably.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Mission */}
            <ScrollReveal delay={0}>
            <div className="bg-blue-50 p-8 rounded-2xl h-full">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 ml-4">Our Mission</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                To help Kenyan schools run with clarity and control by connecting academics, finance, library, and operations in one dependable system.
              </p>
            </div>
            </ScrollReveal>

            {/* Vision */}
            <ScrollReveal delay={200}>
            <div className="bg-purple-50 p-8 rounded-2xl h-full">
              <div className="flex items-center mb-4">
                <div className="bg-purple-600 p-3 rounded-lg">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 ml-4">Our Vision</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                To become Kenya’s most trusted school management growth platform for owners, principals, and administrators who want measurable outcomes.
              </p>
            </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <ScrollReveal className="text-center" delay={0}>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                <CountUpNumber end={500} suffix="+" duration={2000} />
              </div>
              <div className="text-gray-400 text-sm md:text-base">Schools Trust Us</div>
            </ScrollReveal>
            <ScrollReveal className="text-center" delay={100}>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                <CountUpNumber end={100} suffix="K+" duration={2000} />
              </div>
              <div className="text-gray-400 text-sm md:text-base">Students Managed</div>
            </ScrollReveal>
            <ScrollReveal className="text-center" delay={200}>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                <CountUpNumber end={10} suffix="+" duration={1500} />
              </div>
              <div className="text-gray-400 text-sm md:text-base">Years Experience</div>
            </ScrollReveal>
            <ScrollReveal className="text-center" delay={300}>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                <CountUpNumber end={99} suffix=".9%" duration={2000} />
              </div>
              <div className="text-gray-400 text-sm md:text-base">Uptime</div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <ScrollReveal key={index} delay={index * 100}>
              <div 
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group hover:-translate-y-1 h-full"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-lg text-gray-600 mb-6">
                Founded in 2015, SchoolMaster Pro began with a simple mission: to make school 
                management easier and more efficient. What started as a small project to help 
                local schools has grown into a comprehensive platform trusted by hundreds of 
                educational institutions across Kenya.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Our team of dedicated educators and technologists work tirelessly to understand 
                the unique challenges faced by schools and develop solutions that truly make a difference.
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Started with 5 pilot schools in Nairobi</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Now serving 500+ schools across Kenya</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Continuously improving CBC, finance, and operations workflows</span>
                </div>
              </div>
            </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
            <div>
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Team collaboration"
                className="rounded-2xl shadow-lg"
              />
            </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Kenyan Curriculum Blog */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Kenyan Curriculum Blog</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Practical insights for Kenyan school leaders who want stronger results, smoother operations, and business-ready visibility.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kenyaCurriculumBlog.map((post, index) => (
              <ScrollReveal key={index} delay={index * 120}>
                <article className="rounded-2xl border border-gray-200 bg-gray-50 p-6 h-full hover:shadow-md transition-shadow">
                  <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{post.category}</span>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">{post.title}</h3>
                  <p className="mt-3 text-gray-600">{post.summary}</p>
                  <Link to="/contact" className="inline-flex items-center mt-5 text-blue-600 font-medium hover:text-blue-700">
                    Learn how this works in your school
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">The passionate people behind SchoolMaster Pro</p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <ScrollReveal key={index} delay={index * 100}>
              <div 
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group h-full"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <ScrollReveal>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GraduationCap className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join Our Growing Family
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Be part of the education revolution with SchoolMaster Pro
          </p>
          <Link
            to="/create-school"
            className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-medium transition duration-300 inline-flex items-center"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
        </ScrollReveal>
      </section>
    </div>
  );
};

export default AboutPage;
