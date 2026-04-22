import React, { useEffect, useMemo, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { teacherIndexService, type TeacherIndexRow } from '../../../services/teacherIndexService';

const TeacherIndexManager: React.FC = () => {
  const [rows, setRows] = useState<TeacherIndexRow[]>([]);
  const [originalRows, setOriginalRows] = useState<TeacherIndexRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async (searchValue = search) => {
    setLoading(true);
    setError(null);
    try {
      const response = await teacherIndexService.getTeacherIndexes(searchValue);
      setRows(response.results);
      setOriginalRows(response.results);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load teacher indexes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const hasChanges = useMemo(() => {
    if (rows.length !== originalRows.length) return true;
    const originalMap = new Map(originalRows.map(r => [r.teacher_id, r.index]));
    return rows.some(r => originalMap.get(r.teacher_id) !== r.index);
  }, [rows, originalRows]);

  const duplicateIndexes = useMemo(() => {
    const map = new Map<number, number>();
    rows.forEach(r => map.set(r.index, (map.get(r.index) || 0) + 1));
    return new Set(Array.from(map.entries()).filter(([, count]) => count > 1).map(([index]) => index));
  }, [rows]);

  const hasInvalidIndexes = useMemo(() => {
    return rows.some(r => !Number.isInteger(r.index) || r.index <= 0);
  }, [rows]);

  const onChangeIndex = (teacherId: string, value: string) => {
    const parsed = Number(value);
    setRows(prev => prev.map(row => (
      row.teacher_id === teacherId
        ? { ...row, index: Number.isFinite(parsed) ? Math.trunc(parsed) : 0 }
        : row
    )));
    setSuccess(null);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (hasInvalidIndexes) {
      setError('All indexes must be positive whole numbers.');
      return;
    }

    if (duplicateIndexes.size > 0) {
      setError('Duplicate indexes are not allowed. Resolve duplicates before saving.');
      return;
    }

    setSaving(true);
    try {
      await teacherIndexService.bulkUpdateTeacherIndexes(
        rows.map(r => ({ teacher_id: r.teacher_id, index: r.index }))
      );
      setSuccess('Teacher indexes updated successfully.');
      await load(search);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to save teacher indexes');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setRows(originalRows);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Teacher Index Manager</h1>
          <p className="text-gray-600 text-sm md:text-base">Edit all teacher indexes in one place to avoid conflicts in timetable references.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving || hasInvalidIndexes || duplicateIndexes.size > 0}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Save All
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teacher by name, email, phone"
            className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={() => load(search)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700"
          >
            Search
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">{success}</div>}

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading teacher indexes...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Teacher</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left w-36">Index</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isDuplicate = duplicateIndexes.has(row.index);
                  const isInvalid = !Number.isInteger(row.index) || row.index <= 0;
                  return (
                    <tr key={row.teacher_id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.full_name}</td>
                      <td className="px-4 py-3 text-gray-700">{row.email}</td>
                      <td className="px-4 py-3 text-gray-700">{row.phone_number}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          value={row.index}
                          onChange={(e) => onChangeIndex(row.teacher_id, e.target.value)}
                          className={`w-28 px-3 py-1.5 border rounded-lg ${isDuplicate || isInvalid ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        />
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No teachers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherIndexManager;
