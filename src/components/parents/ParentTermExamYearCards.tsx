import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentsAPI } from '../../services/baseUrl';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterOptionsData {
  academic_years?: FilterOption[];
  terms?: FilterOption[];
  exam_types?: FilterOption[];
}

interface AnalyticsResponse {
  subject_performance?: Array<unknown>;
  message?: string;
  filter_options?: FilterOptionsData;
}

interface PeriodCard {
  term: FilterOption;
  examType: FilterOption;
  year: FilterOption;
}

const normalizeKeyPart = (value: string | number) => String(value).trim().toLowerCase();
const buildPeriodKey = (term: string | number, examType: string | number, year: string | number) => (
  `${normalizeKeyPart(term)}|${normalizeKeyPart(examType)}|${normalizeKeyPart(year)}`
);

interface ParentTermExamYearCardsProps {
  title: string;
  subtitle: string;
  targetPath: string;
}

const ParentTermExamYearCards: React.FC<ParentTermExamYearCardsProps> = ({ title, subtitle, targetPath }) => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<PeriodCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExistingPeriods = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await ParentsAPI.getStudentAnalytics() as AnalyticsResponse;
        const options = data?.filter_options;

        const termsList = options?.terms || [];
        const examTypesList = options?.exam_types || [];
        const yearsList = options?.academic_years || [];

        const candidateComboMap = new Map<string, PeriodCard>();
        for (const year of yearsList) {
          for (const term of termsList) {
            for (const examType of examTypesList) {
              const key = buildPeriodKey(term.value, examType.value, year.value);
              if (!candidateComboMap.has(key)) {
                candidateComboMap.set(key, { term, examType, year });
              }
            }
          }
        }

        const candidateCombos = Array.from(candidateComboMap.values());

        const comboChecks = await Promise.all(
          candidateCombos.map(async (combo) => {
            try {
              const comboData = await ParentsAPI.getStudentAnalytics({
                term: combo.term.value,
                exam_type: combo.examType.value,
                academic_year: combo.year.value,
              }) as AnalyticsResponse;

              const hasData = Array.isArray(comboData?.subject_performance) && comboData.subject_performance.length > 0;
              return hasData ? combo : null;
            } catch {
              return null;
            }
          })
        );

        const uniqueValidMap = new Map<string, PeriodCard>();
        comboChecks.forEach((item) => {
          if (!item) return;
          const key = buildPeriodKey(item.term.value, item.examType.value, item.year.value);
          if (!uniqueValidMap.has(key)) {
            uniqueValidMap.set(key, item);
          }
        });

        const uniqueValidCards = Array.from(uniqueValidMap.values()).sort((a, b) => {
          if (String(a.year.value) !== String(b.year.value)) {
            return String(b.year.value).localeCompare(String(a.year.value));
          }
          if (String(a.term.value) !== String(b.term.value)) {
            return String(a.term.value).localeCompare(String(b.term.value), undefined, { numeric: true });
          }
          return String(a.examType.value).localeCompare(String(b.examType.value));
        });

        setCards(uniqueValidCards);
      } catch (err) {
        console.error('Error fetching parent filter cards:', err);
        setError('Unable to load available terms, exams, and years.');
      } finally {
        setLoading(false);
      }
    };

    fetchExistingPeriods();
  }, []);

  const handleCardClick = (term: string, examType: string, academicYear: string) => {
    const params = new URLSearchParams();
    params.set('term', term);
    params.set('exam_type', examType);
    params.set('academic_year', academicYear);

    navigate(`${targetPath}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-6 w-40 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">No academic periods are available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        <p className="text-xs text-gray-500 mt-2">
          Showing {cards.length} existing period{cards.length !== 1 ? 's' : ''} from saved results.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card, idx) => (
          <button
            key={`${card.year.value}-${card.term.value}-${card.examType.value}-${idx}`}
            onClick={() => handleCardClick(card.term.value, card.examType.value, card.year.value)}
            className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-400 hover:shadow-md transition-all"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Academic Period</p>
            <h3 className="text-lg font-bold text-gray-900 mt-1">{card.term.label}</h3>
            <p className="text-sm text-gray-600 mt-1">{card.examType.label}</p>
            <p className="text-sm text-gray-500 mt-2">Year: {card.year.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ParentTermExamYearCards;
