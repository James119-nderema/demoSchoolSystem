import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle,
  CircleDollarSign,
  CreditCard,
  Shield,
  Users,
} from 'lucide-react';
import { featureModuleBySlug } from './featureModules';

const iconMap = {
  results: <BarChart3 className="h-10 w-10 text-blue-600" />,
  fees: <CreditCard className="h-10 w-10 text-green-600" />,
  timetable: <Calendar className="h-10 w-10 text-purple-600" />,
  library: <BookOpen className="h-10 w-10 text-orange-600" />,
  students: <Users className="h-10 w-10 text-indigo-600" />,
  payroll: <CircleDollarSign className="h-10 w-10 text-emerald-600" />,
  security: <Shield className="h-10 w-10 text-red-600" />,
} as const;

const SectionCard: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start text-gray-700 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const FeatureModuleDetailsPage: React.FC = () => {
  const { moduleSlug } = useParams();
  const module = moduleSlug ? featureModuleBySlug[moduleSlug] : undefined;

  if (!module) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Module not found</h1>
          <p className="text-gray-600 mb-8">
            The module link may be incorrect, or the module has not been published yet.
          </p>
          <Link
            to="/features"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Features
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/features"
            className="inline-flex items-center text-blue-100 hover:text-white text-sm mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to all modules
          </Link>

          <div className="bg-white/95 rounded-2xl p-8 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-xl">{iconMap[module.iconKey]}</div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{module.title}</h1>
                <p className="text-gray-600 mt-2">{module.shortDescription}</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">{module.overview}</p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionCard title="Business Value" items={module.businessValue} />
            <SectionCard title="Core Capabilities" items={module.coreCapabilities} />
            <SectionCard title="Typical Workflows" items={module.workflows} />
            <SectionCard title="Integrations" items={module.integrations} />
            <SectionCard title="Best Fit" items={module.idealFor} />
            <SectionCard title="Key Benefits" items={module.benefits} />
          </div>

          <div className="mt-10 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Need help implementing this module?</h2>
              <p className="text-gray-600 text-sm mt-1">
                We can help your team map workflows, permissions, and rollout priorities.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/contact"
                className="px-5 py-3 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition"
              >
                Contact Team
              </Link>
              <Link
                to="/create-school"
                className="inline-flex items-center px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Start Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeatureModuleDetailsPage;
