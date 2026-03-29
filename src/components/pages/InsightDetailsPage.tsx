import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { blogPostBySlug } from './blogPosts';

const InsightDetailsPage: React.FC = () => {
  const { insightSlug } = useParams();
  const post = insightSlug ? blogPostBySlug[insightSlug] : undefined;

  if (!post) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Insight not found</h1>
          <Link to="/insights" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to insights
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-14">
      <section className="bg-gradient-to-r from-indigo-700 to-blue-700 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/insights" className="inline-flex items-center text-blue-100 hover:text-white text-sm mb-5">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to insights
          </Link>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{post.category}</span>
              <span className="inline-flex items-center text-xs text-gray-500"><Clock className="h-3.5 w-3.5 mr-1" />{post.readTime}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
            <p className="text-gray-700 leading-relaxed">{post.summary}</p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">The Problem</h2>
          <p className="text-gray-700 text-sm leading-relaxed">{post.problem}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">The System Approach</h2>
          <p className="text-gray-700 text-sm leading-relaxed">{post.solution}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Expected Outcomes</h2>
          <ul className="space-y-2">
            {post.outcomes.map((item, index) => (
              <li key={index} className="flex items-start text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Implementation Plan</h2>
          <ol className="space-y-2 list-decimal list-inside text-sm text-gray-700">
            {post.implementationPlan.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Why this matters for buyers</h3>
          <p className="text-gray-700 text-sm mb-5">{post.cta}</p>
          <div className="flex gap-3">
            <Link to="/create-school" className="inline-flex items-center px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
              Start Free Trial
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            <Link to="/contact" className="px-5 py-3 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition">
              Request Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InsightDetailsPage;
