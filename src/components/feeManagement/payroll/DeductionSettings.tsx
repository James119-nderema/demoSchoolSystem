import { useState, useEffect, useCallback } from 'react';
import {
  Save, AlertCircle, CheckCircle, Loader2, Plus, Trash2,
  Shield, Heart, Home, Landmark, PiggyBank,
  Calculator, RefreshCw, ChevronRight, Info,
} from 'lucide-react';
import { payrollService } from '../../../services/payrollService';
import type { DeductionConfig, PAYEBracket } from '../../../services/payrollService';
import { FinancePageSkeleton } from '../../ui/Skeleton';

/* ═══════════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function DeductionSettings() {
  const [config, setConfig] = useState<DeductionConfig | null>(null);
  const [brackets, setBrackets] = useState<PAYEBracket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBrackets, setSavingBrackets] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Preview state
  const [previewGross, setPreviewGross] = useState(50000);
  const [previewLoan, setPreviewLoan] = useState(0);
  const [preview, setPreview] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);

  /* ─── Fetch ────────────────────────────────────────────────────────────── */
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await payrollService.getDeductionConfig();
      setConfig(data);
      setBrackets(data.paye_brackets || []);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load deduction config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Save Config ──────────────────────────────────────────────────────── */
  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await payrollService.updateDeductionConfig(config);
      setConfig(updated);
      showToast('success', 'Deduction rates saved successfully');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Save PAYE Brackets ───────────────────────────────────────────────── */
  const handleSaveBrackets = async () => {
    if (brackets.length === 0) {
      showToast('error', 'At least one PAYE bracket is required');
      return;
    }
    setSavingBrackets(true);
    try {
      const saved = await payrollService.updatePAYEBrackets(
        brackets.map((b, i) => ({
          lower_limit: b.lower_limit,
          upper_limit: b.upper_limit,
          rate: b.rate,
          order: i + 1,
        }))
      );
      setBrackets(saved);
      showToast('success', 'PAYE brackets saved successfully');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save brackets');
    } finally {
      setSavingBrackets(false);
    }
  };

  /* ─── Recalculate All ──────────────────────────────────────────────────── */
  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const result = await payrollService.recalculateAllSalaries();
      showToast('success', result.message);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to recalculate');
    } finally {
      setRecalculating(false);
    }
  };

  /* ─── Preview ──────────────────────────────────────────────────────────── */
  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const result = await payrollService.previewDeductions(previewGross, previewLoan);
      setPreview(result);
    } catch (err: any) {
      showToast('error', err.message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  /* ─── Bracket helpers ──────────────────────────────────────────────────── */
  const addBracket = () => {
    const last = brackets[brackets.length - 1];
    const lower = last ? (last.upper_limit || 0) : 0;
    setBrackets([...brackets, { lower_limit: lower, upper_limit: null, rate: 30, order: brackets.length + 1 }]);
  };

  const removeBracket = (index: number) => {
    setBrackets(brackets.filter((_, i) => i !== index));
  };

  const updateBracket = (index: number, field: keyof PAYEBracket, value: number | null) => {
    setBrackets(brackets.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  /* ─── Config field helper ──────────────────────────────────────────────── */
  const setField = (field: string, value: any) => {
    setConfig((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════════ */

  if (loading) {
    return <FinancePageSkeleton title="Deduction Settings" subtitle="Loading deduction configuration..." />;
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Failed to load configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm
          ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deduction Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure statutory deduction rates, PAYE brackets, and other payroll deductions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {recalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Recalculate All Salaries
          </button>
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <strong>How it works:</strong> Set the deduction percentages and rates below. When you assign a salary to a staff member,
          all deductions (PAYE, SHA, NSSF, Housing Levy, etc.) will be automatically calculated from their gross salary.
          Only the <strong>net salary</strong> (after deductions) will be sent when processing payments.
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ─── Left Column: Deduction Rates ──────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">

          {/* PAYE Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold">PAYE (Pay As You Earn)</h2>
                <p className="text-red-100 text-xs">Progressive income tax brackets</p>
              </div>
              <div className="ml-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.paye_enabled}
                    onChange={(e) => setField('paye_enabled', e.target.checked)}
                    className="w-4 h-4 rounded border-white/50 text-white focus:ring-white/20"
                  />
                  <span className="text-white text-sm font-medium">Enabled</span>
                </label>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Personal Relief */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Monthly Personal Relief</label>
                  <p className="text-xs text-gray-400">Deducted from PAYE amount</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">KES</span>
                  <input
                    type="number"
                    min="0"
                    value={config.personal_relief}
                    onChange={(e) => setField('personal_relief', parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Insurance Relief Rate */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Insurance Relief Rate</label>
                  <p className="text-xs text-gray-400">Percentage of SHA applied as PAYE relief</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={config.insurance_relief_rate}
                    onChange={(e) => setField('insurance_relief_rate', parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>

              {/* PAYE Brackets */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700">Tax Brackets</h3>
                  <button
                    onClick={addBracket}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Bracket
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 px-1">
                    <div className="col-span-4">Lower Limit (KES)</div>
                    <div className="col-span-4">Upper Limit (KES)</div>
                    <div className="col-span-3">Rate (%)</div>
                    <div className="col-span-1"></div>
                  </div>

                  {brackets.map((b, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <input
                          type="number"
                          min="0"
                          value={b.lower_limit}
                          onChange={(e) => updateBracket(i, 'lower_limit', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          min="0"
                          placeholder="No limit"
                          value={b.upper_limit ?? ''}
                          onChange={(e) => updateBracket(i, 'upper_limit', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-gray-300"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={b.rate}
                          onChange={(e) => updateBracket(i, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => removeBracket(i)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSaveBrackets}
                  disabled={savingBrackets}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  {savingBrackets ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Brackets
                </button>
              </div>
            </div>
          </div>

          {/* SHA (Social Health Authority) */}
          <DeductionCard
            title="SHA (Social Health Authority)"
            subtitle="Formerly NHIF — Social health insurance contribution"
            icon={<Heart className="w-5 h-5 text-white" />}
            gradient="from-pink-600 to-rose-600"
            enabled={config.sha_enabled}
            onToggle={(v) => setField('sha_enabled', v)}
          >
            <RateRow
              label="SHA Rate"
              description="Percentage of gross salary"
              value={config.sha_rate}
              onChange={(v) => setField('sha_rate', v)}
              suffix="%"
            />
          </DeductionCard>

          {/* NSSF */}
          <DeductionCard
            title="NSSF (National Social Security Fund)"
            subtitle="Tiered employee contribution"
            icon={<PiggyBank className="w-5 h-5 text-white" />}
            gradient="from-blue-600 to-indigo-600"
            enabled={config.nssf_enabled}
            onToggle={(v) => setField('nssf_enabled', v)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Tier I Rate (%)</label>
                <input
                  type="number" min="0" max="100" step="0.01"
                  value={config.nssf_tier1_rate}
                  onChange={(e) => setField('nssf_tier1_rate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Tier I Limit (KES)</label>
                <input
                  type="number" min="0"
                  value={config.nssf_tier1_limit}
                  onChange={(e) => setField('nssf_tier1_limit', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Tier II Rate (%)</label>
                <input
                  type="number" min="0" max="100" step="0.01"
                  value={config.nssf_tier2_rate}
                  onChange={(e) => setField('nssf_tier2_rate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Tier II Limit (KES)</label>
                <input
                  type="number" min="0"
                  value={config.nssf_tier2_limit}
                  onChange={(e) => setField('nssf_tier2_limit', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </DeductionCard>

          {/* Housing Levy */}
          <DeductionCard
            title="Housing Levy"
            subtitle="Affordable Housing Levy contribution"
            icon={<Home className="w-5 h-5 text-white" />}
            gradient="from-amber-600 to-yellow-600"
            enabled={config.housing_levy_enabled}
            onToggle={(v) => setField('housing_levy_enabled', v)}
          >
            <RateRow
              label="Housing Levy Rate"
              description="Percentage of gross salary"
              value={config.housing_levy_rate}
              onChange={(v) => setField('housing_levy_rate', v)}
              suffix="%"
            />
          </DeductionCard>

          {/* Insurance */}
          <DeductionCard
            title="Insurance"
            subtitle="Additional insurance / group cover deduction"
            icon={<Shield className="w-5 h-5 text-white" />}
            gradient="from-violet-600 to-purple-600"
            enabled={config.insurance_enabled}
            onToggle={(v) => setField('insurance_enabled', v)}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Insurance Provider / Policy</label>
                </div>
                <input
                  type="text"
                  value={config.insurance_name}
                  onChange={(e) => setField('insurance_name', e.target.value)}
                  placeholder="e.g. Britam Group Cover"
                  className="w-60 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <RateRow
                label="Insurance Rate"
                description="Percentage of gross salary"
                value={config.insurance_rate}
                onChange={(v) => setField('insurance_rate', v)}
                suffix="%"
              />
            </div>
          </DeductionCard>
        </div>

        {/* ─── Right Column: Preview Calculator ──────────────────────────────── */}
        <div className="xl:col-span-1 space-y-6">
          {/* Preview Calculator */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">Deduction Preview</h3>
                <p className="text-emerald-100 text-xs">Test with a sample salary</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Gross Salary (KES)</label>
                <input
                  type="number"
                  min="0"
                  value={previewGross}
                  onChange={(e) => setPreviewGross(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Loan Deduction (KES)</label>
                <input
                  type="number"
                  min="0"
                  value={previewLoan}
                  onChange={(e) => setPreviewLoan(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <button
                onClick={handlePreview}
                disabled={previewing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                Calculate
              </button>

              {preview && (
                <div className="border-t border-gray-100 pt-4 space-y-2.5">
                  <PreviewRow label="Gross Salary" value={previewGross} color="text-gray-900" bold />
                  <div className="border-t border-gray-100 pt-2">
                    <p className="text-xs font-semibold text-gray-500 mb-2">DEDUCTIONS</p>
                    <div className="space-y-1.5">
                      <PreviewRow label="PAYE" value={preview.paye} color="text-red-600" />
                      <PreviewRow label="SHA" value={preview.sha} color="text-pink-600" />
                      <PreviewRow label="NSSF" value={preview.nssf} color="text-blue-600" />
                      <PreviewRow label="Housing Levy" value={preview.housing_levy} color="text-amber-600" />
                      {preview.insurance > 0 && (
                        <PreviewRow label="Insurance" value={preview.insurance} color="text-violet-600" />
                      )}
                      {preview.loan_deduction > 0 && (
                        <PreviewRow label="Loan" value={preview.loan_deduction} color="text-gray-600" />
                      )}
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <PreviewRow label="Total Deductions" value={preview.total_deductions} color="text-red-600" bold />
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">Net Salary</span>
                      <span className="text-lg font-bold text-emerald-600">
                        KES {preview.net_salary.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Reference */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" /> Kenya 2025 Defaults
            </h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <span><strong>SHA:</strong> 2.75% of gross salary</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <span><strong>NSSF:</strong> 6% Tier I (up to KES 7,000), 6% Tier II (KES 7,001 – 36,000)</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <span><strong>Housing Levy:</strong> 1.5% of gross salary</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <span><strong>Personal Relief:</strong> KES 2,400/month</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <span><strong>PAYE brackets:</strong> 10% → 25% → 30% → 32.5% → 35%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════════ */

function DeductionCard({
  title, subtitle, icon, gradient, enabled, onToggle, children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${!enabled ? 'opacity-60' : ''}`}>
      <div className={`bg-gradient-to-r ${gradient} px-6 py-4 flex items-center gap-3`}>
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="text-white font-bold">{title}</h2>
          <p className="text-white/70 text-xs">{subtitle}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-4 h-4 rounded border-white/50 text-white focus:ring-white/20"
          />
          <span className="text-white text-sm font-medium">{enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function RateRow({
  label, description, value, onChange, suffix,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        />
        <span className="text-xs text-gray-500">{suffix}</span>
      </div>
    </div>
  );
}

function PreviewRow({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={`${bold ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${color}`}>
        KES {value.toLocaleString()}
      </span>
    </div>
  );
}
