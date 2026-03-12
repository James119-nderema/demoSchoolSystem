import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Shimmer } from '../ui/Skeleton';

const TemplateFullPreview: React.FC = () => {
  const { templateName } = useParams<{ templateName: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const templatePath = `/templates/${templateName}.html`;

  useEffect(() => {
    // Check if template exists
    fetch(templatePath)
      .then(response => {
        if (!response.ok) {
          throw new Error('Template not found');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Template not found');
        setLoading(false);
      });
  }, [templatePath]);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleBack = () => {
    navigate('/report-card/pdf');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="animate-pulse bg-gray-200 rounded h-8 w-20" />
            <div className="animate-pulse bg-gray-200 rounded h-6 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <div className="animate-pulse bg-gray-200 rounded h-9 w-24" />
            <div className="animate-pulse bg-gray-200 rounded h-9 w-24" />
          </div>
        </div>
        <div className="p-6">
          <Shimmer className="w-full h-[80vh] rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Templates
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-xl font-semibold text-gray-800">
            {templateName?.replace(/template/i, 'Template ')} Preview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Use Template
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-6">
        <div
          className="mx-auto bg-white shadow-2xl"
          style={{ width: '210mm', minHeight: '297mm' }}
        >
          <iframe
            ref={iframeRef}
            src={templatePath}
            className="w-full"
            style={{ minHeight: '297mm' }}
            title="Template Preview"
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateFullPreview;
