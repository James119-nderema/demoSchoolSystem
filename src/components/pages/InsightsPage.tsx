import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { blogPosts } from './blogPosts';

const InsightsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">School Growth Insights</h1>
          <p className="text-blue-100 text-lg max-w-3xl mx-auto">
            Detailed, practical guides for Kenyan school leaders focused on measurable academic, financial, and operational outcomes.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article key={post.slug} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{post.category}</span>
                <span className="inline-flex items-center text-xs text-gray-500"><Clock className="h-3.5 w-3.5 mr-1" />{post.readTime}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{post.title}</h2>
              <p className="text-gray-600 text-sm mb-5 flex-1">{post.summary}</p>
              <Link to={`/insights/${post.slug}`} className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm">
                Read full article
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default InsightsPage;
