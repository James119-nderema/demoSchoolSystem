import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Shield, Landmark, Building2 } from 'lucide-react';
import { payrollService } from '../../../services/payrollService';
import type { PaymentIntegrationSettings } from '../../../services/payrollService';
import { usePermissions } from '../../../hooks/usePermissions';

const EMPTY_FORM: PaymentIntegrationSettings = {
  provider: 'daraja',
  account_name: '',
  account_number: '',
  bank_name: '',
  bank_branch: '',
  bank_swift_code: '',
  daraja_environment: 'sandbox',
  daraja_paybill: '',
  daraja_consumer_key: '',
  daraja_consumer_secret: '',
  daraja_access_token: '',
  daraja_initiator_name: '',
  daraja_initiator_password: '',
  daraja_b2c_queue_url: '',
  daraja_b2c_result_url: '',
  daraja_b2b_queue_url: '',
  daraja_b2b_result_url: '',
  jenga_api_key: '',
  jenga_api_secret: '',
  jenga_merchant_code: '',
  jenga_api_base_url: '',
};

export default function PaymentIntegrationSettingsPage() {
  const permissions = usePermissions();
  const [form, setForm] = useState<PaymentIntegrationSettings>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canAccess = permissions.isAdministrativeStaff() || permissions.isBursar();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await payrollService.getPaymentIntegrationSettings();
        setForm({ ...EMPTY_FORM, ...data });
      } catch (err: any) {
        setMessage({ type: 'error', text: err?.message || 'Failed to load payment settings' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const setField = (key: keyof PaymentIntegrationSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = { ...form };
      const data = await payrollService.updatePaymentIntegrationSettings(payload);
      setForm((prev) => ({ ...prev, ...data, daraja_consumer_secret: '', daraja_access_token: '', daraja_initiator_password: '', jenga_api_secret: '' }));
      setMessage({ type: 'success', text: 'Payment integration settings saved' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.error || err?.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading settings...</div>;
  }

  if (!canAccess) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Only Administrative Staff and Bursar can access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Integration Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Configure school account details and choose Daraja Paybill or Bank/Jenga integration.</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Save Settings
          </button>
        </div>

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5">
          <h2 className="font-semibold text-gray-800">Integration Provider</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setField('provider', 'daraja')}
              className={`text-left p-4 rounded-xl border transition ${form.provider === 'daraja' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-center gap-2 font-semibold text-gray-800"><Landmark className="w-4 h-4" /> Daraja (M-Pesa Paybill)</div>
              <p className="text-xs text-gray-500 mt-1">Used for B2C and B2B payroll payments.</p>
            </button>
            <button
              onClick={() => setField('provider', 'bank')}
              className={`text-left p-4 rounded-xl border transition ${form.provider === 'bank' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-center gap-2 font-semibold text-gray-800"><Building2 className="w-4 h-4" /> Bank Account (Jenga API)</div>
              <p className="text-xs text-gray-500 mt-1">Use individual school bank integration details.</p>
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <h2 className="font-semibold text-gray-800 md:col-span-2">School Account Details</h2>
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Account Name" value={form.account_name} onChange={(e) => setField('account_name', e.target.value)} />
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Account Number" value={form.account_number} onChange={(e) => setField('account_number', e.target.value)} />
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Bank Name" value={form.bank_name} onChange={(e) => setField('bank_name', e.target.value)} />
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Bank Branch" value={form.bank_branch} onChange={(e) => setField('bank_branch', e.target.value)} />
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder="SWIFT Code" value={form.bank_swift_code} onChange={(e) => setField('bank_swift_code', e.target.value)} />
        </div>

        {form.provider === 'daraja' ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="font-semibold text-gray-800 md:col-span-2">Daraja Configuration (for B2C/B2B)</h2>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.daraja_environment} onChange={(e) => setField('daraja_environment', e.target.value)}>
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Paybill / Shortcode" value={form.daraja_paybill} onChange={(e) => setField('daraja_paybill', e.target.value)} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Consumer Key" value={form.daraja_consumer_key} onChange={(e) => setField('daraja_consumer_key', e.target.value)} />
            <input type="password" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder={`Consumer Secret${form.has_daraja_consumer_secret ? ' (saved)' : ''}`} value={form.daraja_consumer_secret || ''} onChange={(e) => setField('daraja_consumer_secret', e.target.value)} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Initiator Name" value={form.daraja_initiator_name} onChange={(e) => setField('daraja_initiator_name', e.target.value)} />
            <input type="password" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder={`Initiator Password${form.has_daraja_initiator_password ? ' (saved)' : ''}`} value={form.daraja_initiator_password || ''} onChange={(e) => setField('daraja_initiator_password', e.target.value)} />
            <input type="password" className="border border-gray-200 rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder={`Access Token (optional)${form.has_daraja_access_token ? ' (saved)' : ''}`} value={form.daraja_access_token || ''} onChange={(e) => setField('daraja_access_token', e.target.value)} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="B2C Queue URL" value={form.daraja_b2c_queue_url} onChange={(e) => setField('daraja_b2c_queue_url', e.target.value)} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="B2C Result URL" value={form.daraja_b2c_result_url} onChange={(e) => setField('daraja_b2c_result_url', e.target.value)} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="B2B Queue URL" value={form.daraja_b2b_queue_url} onChange={(e) => setField('daraja_b2b_queue_url', e.target.value)} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="B2B Result URL" value={form.daraja_b2b_result_url} onChange={(e) => setField('daraja_b2b_result_url', e.target.value)} />
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="font-semibold text-gray-800 md:col-span-2">Bank/Jenga Configuration</h2>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Jenga API Key" value={form.jenga_api_key} onChange={(e) => setField('jenga_api_key', e.target.value)} />
            <input type="password" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder={`Jenga API Secret${form.has_jenga_api_secret ? ' (saved)' : ''}`} value={form.jenga_api_secret || ''} onChange={(e) => setField('jenga_api_secret', e.target.value)} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Jenga Merchant Code" value={form.jenga_merchant_code} onChange={(e) => setField('jenga_merchant_code', e.target.value)} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Jenga API Base URL" value={form.jenga_api_base_url} onChange={(e) => setField('jenga_api_base_url', e.target.value)} />
          </div>
        )}
      </div>
    </div>
  );
}
