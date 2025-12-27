import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, FileText, Layout, Printer } from 'lucide-react';
import { REPORT_TEMPLATES } from './TemplatePreview';

/**
 * Full-page template preview that opens at /staff/report-card/pdf/:templateName
 * Shows the template HTML in full width for better visibility
 */
const TemplateFullPreview: React.FC = () => {
  const { templateName } = useParams<{ templateName: string }>();
  const navigate = useNavigate();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);

  const templateId = templateName || 'template1';
  const template = REPORT_TEMPLATES.find(t => t.id === templateId);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        const templateFile = `/templates/${templateId}.html`;
        const response = await fetch(templateFile);
        if (response.ok) {
          const html = await response.text();
          setHtmlContent(html);
        } else {
          setHtmlContent('<div style="padding: 40px; text-align: center;"><h2>Template not found</h2><p>The requested template could not be loaded.</p></div>');
        }
      } catch (error) {
        console.error('Error loading template:', error);
        setHtmlContent('<div style="padding: 40px; text-align: center;"><h2>Error</h2><p>Failed to load template preview.</p></div>');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  const handleBack = () => {
    navigate('/staff/report-card/pdf');
  };

  const handleUseTemplate = () => {
    // Navigate back to reports page with this template selected
    navigate(`/staff/report-card/pdf?template=${templateId}`);
  };

  const handlePrint = () => {
    const iframe = document.getElementById('template-iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Fixed Header */}
      <header className="bg-white shadow-md border-b sticky top-0 z-20">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Back button and title */}
            <div className="flex items-center space-x-6">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Report Cards
              </button>
              
              <div className="h-8 border-l border-gray-300" />
              
              <div className="flex items-center space-x-3">
                {template?.icon === 'classic' ? (
                  <FileText className="w-6 h-6 text-blue-600" />
                ) : (
                  <Layout className="w-6 h-6 text-green-600" />
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {template?.name || 'Template Preview'}
                  </h1>
                  <p className="text-sm text-gray-500">{template?.description}</p>
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-4">
              {/* Zoom controls */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1.5">
                <button
                  onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                  className="text-gray-600 hover:text-gray-900 font-bold px-2"
                >
                  −
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[50px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale(Math.min(1.5, scale + 0.1))}
                  className="text-gray-600 hover:text-gray-900 font-bold px-2"
                >
                  +
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>

              <button
                onClick={handleUseTemplate}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Check className="w-4 h-4 mr-2" />
                Use This Template
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Template Preview Area - Full Width */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-full mx-auto">
          {/* Features bar */}
          {template && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Template Features:</h3>
                <div className="flex flex-wrap gap-2">
                  {template.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview Container */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Preview header bar */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {templateId}.html
                </span>
              </div>
              <span className="text-sm text-gray-500">
                A4 Format • 210mm × 297mm
              </span>
            </div>

            {/* Preview content */}
            <div className="bg-gray-300 p-8 flex justify-center min-h-[calc(100vh-300px)]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading template...</p>
                </div>
              ) : (
                <div 
                  className="bg-white shadow-2xl transition-transform duration-300"
                  style={{ 
                    width: '210mm',
                    minHeight: '297mm',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center'
                  }}
                >
                  <iframe
                    id="template-iframe"
                    srcDoc={htmlContent}
                    className="w-full border-0"
                    style={{ 
                      height: '297mm', 
                      width: '210mm',
                      display: 'block'
                    }}
                    title="Template Preview"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Help text */}
          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>Use the zoom controls above to adjust the preview size. Click "Use This Template" to select this template for generating reports.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TemplateFullPreview;
