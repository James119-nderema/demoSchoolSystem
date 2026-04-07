import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch } from '../../../utils/apiInterceptors';

interface PeriodClassStat {
  class_id: string;
  class_name: string;
  stream: string;
  students_sat: number;
  assessments: number;
}

interface PeriodStat {
  key: string;
  term: string;
  term_label: string;
  academic_year: string;
  exam_type: string;
  exam_type_label: string;
  students_sat: number;
  assessments: number;
  classes_count: number;
  classes: PeriodClassStat[];
}

interface PeriodStatsResponse {
  period_stats?: PeriodStat[];
}

interface UsePeriodStatsOptions {
  term?: string;
  academicYear?: string;
  examType?: string;
  includeClasses?: boolean;
  includeMetrics?: boolean;
}

const usePeriodStats = (options: UsePeriodStatsOptions = {}) => {
  const [periods, setPeriods] = useState<PeriodStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const {
    term = '',
    academicYear = '',
    examType = '',
    includeClasses = false,
    includeMetrics = true,
  } = options;

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams();
        params.set('include_classes', includeClasses ? '1' : '0');
        params.set('include_metrics', includeMetrics ? '1' : '0');
        if (term) params.set('term', term);
        if (academicYear) params.set('academic_year', academicYear);
        if (examType) params.set('exam_type', examType);

        const response = await authFetch(`/api/input-marks/period-stats/?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to load period stats (HTTP ${response.status})`);
        }

        const data: PeriodStatsResponse = await response.json();
        setPeriods(data.period_stats || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load period stats');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [term, academicYear, examType, includeClasses, includeMetrics]);

  return { periods, loading, error };
};

const PeriodStepPage: React.FC<{ title: string; step2Path: string }> = ({ title, step2Path }) => {
  const navigate = useNavigate();
  const { periods, loading, error } = usePeriodStats({ includeClasses: false, includeMetrics: false });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">Step 1 of 3: Select term, academic year, and exam type.</p>

        {loading && <div className="text-sm text-gray-500">Loading exam sessions...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && !error && periods.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-600">No exam sessions available yet.</div>
        )}

        {!loading && !error && periods.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
            {periods.map((period) => (
              <button
                key={period.key}
                type="button"
                onClick={() => {
                  const params = new URLSearchParams({
                    term: period.term,
                    academic_year: period.academic_year,
                    exam_type: period.exam_type,
                  });
                  navigate(`${step2Path}?${params.toString()}`);
                }}
                className="text-left border rounded-lg p-4 transition border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40"
              >
                <p className="text-sm font-semibold text-gray-900">
                  {period.term_label} • {period.exam_type_label}
                </p>
                <p className="text-xs text-gray-500 mb-2">{period.academic_year}</p>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">{period.students_sat} sat</span>
                  <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">{period.classes_count} classes</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ClassStepPage: React.FC<{ title: string; resultsPath: string; periodStepPath: string }> = ({
  title,
  resultsPath,
  periodStepPath,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const term = searchParams.get('term') || '';
  const academicYear = searchParams.get('academic_year') || '';
  const examType = searchParams.get('exam_type') || '';

  const { periods, loading, error } = usePeriodStats({
    term,
    academicYear,
    examType,
    includeClasses: true,
    includeMetrics: true,
  });

  const selectedPeriod = useMemo(() => {
    if (!term || !academicYear || !examType) return null;
    return periods.find((p) => p.term === term && p.academic_year === academicYear && p.exam_type === examType) || null;
  }, [periods, term, academicYear, examType]);

  const buildResultsUrl = (classId?: string) => {
    const params = new URLSearchParams({
      term,
      academic_year: academicYear,
      exam_type: examType,
    });
    if (classId) params.set('class_id', classId);
    return `${resultsPath}?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">Step 2 of 3: Select class.</p>

        {(!term || !academicYear || !examType) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-sm text-yellow-700">
            Missing exam session. Go back and choose term/exam first.
          </div>
        )}

        {loading && <div className="text-sm text-gray-500">Loading classes for selected session...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && !error && term && academicYear && examType && selectedPeriod && (
          <>
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <p className="text-sm text-gray-700">
                Selected session: <span className="font-semibold">{selectedPeriod.term_label}</span>,{' '}
                <span className="font-semibold">{selectedPeriod.academic_year}</span>,{' '}
                <span className="font-semibold">{selectedPeriod.exam_type_label}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {selectedPeriod.classes.map((cls) => (
                <button
                  key={cls.class_id}
                  type="button"
                  onClick={() => navigate(buildResultsUrl(cls.class_id))}
                  className="text-left border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-lg p-4 transition"
                >
                  <p className="text-sm font-semibold text-gray-900">{cls.class_name}</p>
                  <p className="text-xs text-gray-500 mb-2">Stream: {cls.stream || '-'}</p>
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs">{cls.students_sat} sat</span>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <button
                type="button"
                onClick={() => navigate(buildResultsUrl())}
                className="text-left border border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-lg p-4 transition w-full sm:w-auto"
              >
                <p className="text-sm font-semibold text-gray-900">All Classes</p>
                <p className="text-xs text-gray-500">Skip class filtering and open results for all classes in this session.</p>
              </button>
            </div>
          </>
        )}

        <div className="mt-4">
          <button
            type="button"
            onClick={() => navigate(periodStepPath)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            ← Back to Exam Session Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export const ViewResultsPeriodStep: React.FC = () => (
  <PeriodStepPage title="View Results" step2Path="/staff/view-results/step-2" />
);

export const ViewResultsClassStep: React.FC = () => (
  <ClassStepPage
    title="View Results"
    resultsPath="/staff/view-results/results"
    periodStepPath="/staff/view-results/step-1"
  />
);

export const FullResultsPeriodStep: React.FC = () => (
  <PeriodStepPage title="Full Results" step2Path="/staff/full-results/step-2" />
);

export const FullResultsClassStep: React.FC = () => (
  <ClassStepPage
    title="Full Results"
    resultsPath="/staff/full-results/results"
    periodStepPath="/staff/full-results/step-1"
  />
);

export const ReportsPeriodStep: React.FC = () => (
  <PeriodStepPage title="Reports" step2Path="/staff/reports/step-2" />
);

export const ReportsClassStep: React.FC = () => (
  <ClassStepPage
    title="Reports"
    resultsPath="/staff/reports/results"
    periodStepPath="/staff/reports/step-1"
  />
);

export const StudentStatisticsPeriodStep: React.FC = () => (
  <PeriodStepPage title="Student Statistics" step2Path="/staff/statistics/students/step-2" />
);

export const StudentStatisticsClassStep: React.FC = () => (
  <ClassStepPage
    title="Student Statistics"
    resultsPath="/staff/statistics/students/results"
    periodStepPath="/staff/statistics/students/step-1"
  />
);

export const ClassStatisticsPeriodStep: React.FC = () => (
  <PeriodStepPage title="Class Statistics" step2Path="/staff/statistics/classes/step-2" />
);

export const ClassStatisticsClassStep: React.FC = () => (
  <ClassStepPage
    title="Class Statistics"
    resultsPath="/staff/statistics/classes/results"
    periodStepPath="/staff/statistics/classes/step-1"
  />
);
