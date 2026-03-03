/**
 * ParentMessageType — Choose between Custom Message, Exam Results, Term Summary
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ParentMessageType: React.FC = () => {
  const navigate = useNavigate();

  const options = [
    {
      key: 'custom',
      path: '/messaging/parent/custom',
      title: 'Custom Message',
      description: 'Write a custom message and select which students\' parents should receive it.',
      icon: (
        <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      color: 'purple',
      bgColor: 'bg-purple-100',
      hoverBorder: 'hover:border-purple-400',
    },
    {
      key: 'exam',
      path: '/messaging/parent/exam-results',
      title: 'Exam Results',
      description: 'Send individual exam results to parents. Filter by class, term, and exam type.',
      icon: (
        <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'orange',
      bgColor: 'bg-orange-100',
      hoverBorder: 'hover:border-orange-400',
    },
    {
      key: 'summary',
      path: '/messaging/parent/term-summary',
      title: 'Term Summary',
      description: 'Send a comprehensive term summary combining all exam results for the term.',
      icon: (
        <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'teal',
      bgColor: 'bg-teal-100',
      hoverBorder: 'hover:border-teal-400',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3">
            <button onClick={() => navigate('/messaging')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Message Parents</h1>
              <p className="text-xs text-slate-400">Choose a message type</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">What type of message?</h2>
        <p className="text-sm text-slate-400 mb-6">Select how you'd like to communicate with parents</p>

        <div className="space-y-4">
          {options.map(opt => (
            <button
              key={opt.key}
              onClick={() => navigate(opt.path)}
              className={`group w-full relative bg-white rounded-2xl border-2 border-slate-200 p-6 text-left ${opt.hoverBorder} hover:shadow-lg transition-all`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${opt.bgColor} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-800">{opt.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{opt.description}</p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParentMessageType;
