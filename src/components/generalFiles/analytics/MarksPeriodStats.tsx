import React, { useEffect, useMemo, useState } from 'react';
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

interface SelectionPayload {
  term: string;
  academicYear: string;
  examType: string;
  classId?: string;
}

interface MarksPeriodStatsProps {
  selectedTerm?: string;
  selectedAcademicYear?: string;
  selectedExamType?: string;
  selectedClassId?: string;
  subjectId?: string;
  onSelectionChange: (payload: SelectionPayload) => void;
  title?: string;
}

const MarksPeriodStats: React.FC<MarksPeriodStatsProps> = ({
  selectedTerm = '',
  selectedAcademicYear = '',
  selectedExamType = '',
  selectedClassId = '',
  subjectId,
  onSelectionChange,
  title = 'Exam Session Stats',
}) => {
  const [periods, setPeriods] = useState<PeriodStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePeriodKey = useMemo(() => {
    if (!selectedTerm || !selectedAcademicYear || !selectedExamType) return '';
    return `${selectedAcademicYear}|${selectedTerm}|${selectedExamType}`;
  }, [selectedTerm, selectedAcademicYear, selectedExamType]);

  const activePeriod = useMemo(() => {
    if (!periods.length) return null;

    const exact = periods.find((p) => p.key === activePeriodKey);
    if (exact) return exact;

    return periods[0] ?? null;
  }, [periods, activePeriodKey]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (subjectId) params.set('subject_id', subjectId);

        const url = params.toString()
          ? `/api/input-marks/period-stats/?${params.toString()}`
          : '/api/input-marks/period-stats/';

        const response = await authFetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load period stats (HTTP ${response.status})`);
        }

        const data: PeriodStatsResponse = await response.json();
        const fetchedPeriods = data.period_stats || [];
        setPeriods(fetchedPeriods);

        if (!activePeriodKey && fetchedPeriods.length > 0) {
          const first = fetchedPeriods[0];
          onSelectionChange({
            term: first.term,
            academicYear: first.academic_year,
            examType: first.exam_type,
            classId: '',
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load period stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [subjectId]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>

      {loading && (
        <div className="text-sm text-gray-500 py-2">Loading exam session stats...</div>
      )}

      {error && !loading && (
        <div className="text-sm text-red-600 py-2">{error}</div>
      )}

      {!loading && !error && periods.length === 0 && (
        <div className="text-sm text-gray-500 py-2">No marks statistics available yet.</div>
      )}

      {!loading && !error && periods.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
            {periods.map((period) => {
              const isActive = period.key === (activePeriod?.key || activePeriodKey);

              return (
                <button
                  key={period.key}
                  type="button"
                  onClick={() =>
                    onSelectionChange({
                      term: period.term,
                      academicYear: period.academic_year,
                      examType: period.exam_type,
                      classId: '',
                    })
                  }
                  className={`text-left border rounded-lg p-3 transition ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {period.term_label} • {period.exam_type_label}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">{period.academic_year}</p>
                  <div className="flex gap-3 text-xs">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">
                      {period.students_sat} sat
                    </span>
                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                      {period.classes_count} classes
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {activePeriod && (
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">
                Class stats for {activePeriod.term_label} • {activePeriod.exam_type_label} • {activePeriod.academic_year}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onSelectionChange({
                      term: activePeriod.term,
                      academicYear: activePeriod.academic_year,
                      examType: activePeriod.exam_type,
                      classId: '',
                    })
                  }
                  className={`px-3 py-1.5 text-xs rounded-full border transition ${
                    !selectedClassId
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  All Classes
                </button>

                {activePeriod.classes.map((cls) => (
                  <button
                    type="button"
                    key={cls.class_id}
                    onClick={() =>
                      onSelectionChange({
                        term: activePeriod.term,
                        academicYear: activePeriod.academic_year,
                        examType: activePeriod.exam_type,
                        classId: cls.class_id,
                      })
                    }
                    className={`px-3 py-1.5 text-xs rounded-full border transition ${
                      selectedClassId === cls.class_id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                    }`}
                    title={`${cls.students_sat} students sat, ${cls.assessments} assessments`}
                  >
                    {cls.class_name} ({cls.students_sat})
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MarksPeriodStats;
