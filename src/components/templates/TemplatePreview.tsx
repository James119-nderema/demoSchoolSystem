import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Check, Layout, Grid3X3, Award, BookOpen, Eye } from 'lucide-react';

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  icon: 'classic' | 'modern' | 'minimal' | 'detailed';
  features: string[];
  previewImage?: string;
}

export const REPORT_TEMPLATES: TemplateInfo[] = [
  {
    id: 'template1',
    name: 'Classic Report Card',
    description: 'Traditional school report format with detailed subject breakdown',
    icon: 'classic',
    features: [
      'School header with logo',
      'Student information section',
      'Detailed subject grades',
      'Teacher comments',
      'Parent signature area'
    ]
  },
  {
    id: 'template2',
    name: 'Grade Assessment Report',
    description: 'Modern assessment-focused report with competency levels',
    icon: 'modern',
    features: [
      'Competency-based grading',
      'Learning outcomes',
      'Skill assessment',
      'Performance trends',
      'Recommendations'
    ]
  }
];

interface TemplateCardProps {
  template: TemplateInfo;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
  onPreview: (templateId: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
  onPreview
}) => {
  const getIcon = () => {
    switch (template.icon) {
      case 'classic':
        return <FileText className="w-16 h-16 text-blue-600" />;
      case 'modern':
        return <Layout className="w-16 h-16 text-green-600" />;
      case 'minimal':
        return <Grid3X3 className="w-16 h-16 text-purple-600" />;
      case 'detailed':
        return <BookOpen className="w-16 h-16 text-orange-600" />;
      default:
        return <FileText className="w-16 h-16 text-gray-600" />;
    }
  };

  return (
    <div
      className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 min-h-[320px] ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-xl ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg bg-white'
      }`}
      onClick={() => onSelect(template.id)}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1.5">
          <Check className="w-5 h-5" />
        </div>
      )}

      {/* Icon and title */}
      <div className="flex flex-col items-center mb-6">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-4 shadow-sm">
          {getIcon()}
        </div>
        <h3 className="text-xl font-bold text-gray-900 text-center">{template.name}</h3>
        <p className="text-base text-gray-500 text-center mt-2 px-4">{template.description}</p>
      </div>

      {/* Features list */}
      <ul className="text-base text-gray-600 space-y-2 mb-6">
        {template.features.map((feature, idx) => (
          <li key={idx} className="flex items-center">
            <Award className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Preview button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPreview(template.id);
        }}
        className="w-full py-3 text-base font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border border-blue-200"
      >
        <Eye className="w-5 h-5" />
        Preview Template
      </button>
    </div>
  );
};

interface TemplateSelectionProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateSelection: React.FC<TemplateSelectionProps> = ({
  selectedTemplate,
  onSelectTemplate
}) => {
  const navigate = useNavigate();

  const handlePreview = (templateId: string) => {
    // Navigate to full-page template preview
    navigate(`/staff/report-card/pdf/${templateId}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {REPORT_TEMPLATES.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={selectedTemplate === template.id}
          onSelect={onSelectTemplate}
          onPreview={handlePreview}
        />
      ))}
    </div>
  );
};

export default TemplateSelection;
