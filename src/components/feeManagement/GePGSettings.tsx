// GePGSettings.tsx
// Admin/bursar page for configuring Tanzania GePG (Government Electronic Payment Gateway).
// Fetches from GET /api/gepg/config/ and saves via PUT/POST.
// Credentials (client_id, client_secret, private_key, certificate) are write-only
// and sent to POST /api/gepg/config/{id}/set_credentials/.

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/environment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GePGConfig {
  id: string;
  school: string;
  school_name: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  service_provider_id: string | null;
  biller_id: string | null;
  api_endpoint: string | null;
  gepg_code: string | null;
  currency_code: string;
  payment_option: 1 | 2 | 3;
  bill_expire_days: number;
  callback_url: string | null;
  is_active: boolean;
  has_client_id: boolean;
  has_client_secret: boolean;
  has_private_key: boolean;
  has_certificate: boolean;
  created_at: string;
  updated_at: string;
}

interface CredentialFields {
  client_id: string;
  client_secret: string;
  private_key: string;
  certificate: string;
}

function getStaffToken(): string | null {
  return (
    localStorage.getItem('staff_access_token') ||
    localStorage.getItem('school_access_token') ||
    localStorage.getItem('access_token')
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GePGSettings() {
  const [config, setConfig] = useState<GePGConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [credSuccess, setCredSuccess] = useState<string | null>(null);

  // Form state (mirrors GePGConfig fields)
  const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');
  const [serviceProviderId, setServiceProviderId] = useState('');
  const [billerId, setBillerId] = useState('');
  const [gepgCode, setGepgCode] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [currencyCode, setCurrencyCode] = useState('TZS');
  const [paymentOption, setPaymentOption] = useState<1 | 2 | 3>(1);
  const [billExpireDays, setBillExpireDays] = useState(30);
  const [callbackUrl, setCallbackUrl] = useState('');
  const [isActive, setIsActive] = useState(false);

  // Write-only credential fields
  const [credentials, setCredentials] = useState<CredentialFields>({
    client_id: '',
    client_secret: '',
    private_key: '',
    certificate: '',
  });

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getStaffToken();
    if (!token) {
      setError('Not authenticated.');
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/gepg/config/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list: GePGConfig[] = res.data.results || res.data || [];
      if (list.length > 0) {
        const cfg = list[0];
        setConfig(cfg);
        populateForm(cfg);
      }
    } catch (err) {
      console.error('Failed to fetch GePG config:', err);
      setError('Failed to load GePG configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  function populateForm(cfg: GePGConfig) {
    setEnvironment(cfg.environment);
    setServiceProviderId(cfg.service_provider_id || '');
    setBillerId(cfg.biller_id || '');
    setGepgCode(cfg.gepg_code || '');
    setApiEndpoint(cfg.api_endpoint || '');
    setCurrencyCode(cfg.currency_code || 'TZS');
    setPaymentOption(cfg.payment_option);
    setBillExpireDays(cfg.bill_expire_days);
    setCallbackUrl(cfg.callback_url || '');
    setIsActive(cfg.is_active);
  }

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(null);
    setError(null);
    const token = getStaffToken();
    if (!token) { setError('Not authenticated.'); setSaving(false); return; }

    const payload = {
      environment,
      service_provider_id: serviceProviderId || null,
      biller_id: billerId || null,
      gepg_code: gepgCode || null,
      api_endpoint: apiEndpoint || null,
      currency_code: currencyCode,
      payment_option: paymentOption,
      bill_expire_days: billExpireDays,
      callback_url: callbackUrl || null,
      is_active: isActive,
    };

    try {
      if (config) {
        const res = await axios.patch(
          `${API_BASE_URL}/api/gepg/config/${config.id}/`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setConfig(res.data);
        populateForm(res.data);
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/api/gepg/config/`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setConfig(res.data);
        populateForm(res.data);
      }
      setSuccess('GePG settings saved successfully.');
    } catch (err: unknown) {
      console.error('Failed to save GePG config:', err);
      const axiosErr = err as { response?: { data?: unknown } };
      const detail = axiosErr.response?.data;
      setError(`Failed to save: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!config) {
      setError('Save the main settings first before setting credentials.');
      return;
    }
    setSavingCredentials(true);
    setCredSuccess(null);
    setError(null);
    const token = getStaffToken();
    if (!token) { setError('Not authenticated.'); setSavingCredentials(false); return; }

    // Only send fields that have values
    const credPayload: Record<string, string> = {};
    if (credentials.client_id) credPayload.client_id = credentials.client_id;
    if (credentials.client_secret) credPayload.client_secret = credentials.client_secret;
    if (credentials.private_key) credPayload.private_key = credentials.private_key;
    if (credentials.certificate) credPayload.certificate = credentials.certificate;

    if (Object.keys(credPayload).length === 0) {
      setError('No credentials entered to save.');
      setSavingCredentials(false);
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/gepg/config/${config.id}/set_credentials/`,
        credPayload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCredSuccess(`Credentials saved: ${(res.data.updated as string[]).join(', ')}`);
      // Clear credential fields after saving
      setCredentials({ client_id: '', client_secret: '', private_key: '', certificate: '' });
      // Refresh to update has_* flags
      void fetchConfig();
    } catch (err: unknown) {
      console.error('Failed to save credentials:', err);
      const axiosErr = err as { response?: { data?: unknown } };
      setError(`Failed to save credentials: ${JSON.stringify(axiosErr.response?.data)}`);
    } finally {
      setSavingCredentials(false);
    }
  };

  // Status badge
  const statusBadge = () => {
    if (!config) return null;
    const configured = config.is_active && config.service_provider_id && config.gepg_code;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
        configured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {configured ? 'Configured' : 'Not Configured'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">GePG Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tanzania Government Electronic Payment Gateway configuration
          </p>
        </div>
        {statusBadge()}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">GePG Configuration</h2>
        </div>
        <div className="p-5 space-y-5">

          {/* Environment toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
            <div className="flex gap-3">
              {(['SANDBOX', 'PRODUCTION'] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setEnvironment(env)}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition ${
                    environment === env
                      ? env === 'PRODUCTION'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {env === 'SANDBOX' ? 'Sandbox (Testing)' : 'Production (Live)'}
                </button>
              ))}
            </div>
            {environment === 'PRODUCTION' && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                Warning: Production mode sends real GePG requests.
              </p>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable GePG</p>
              <p className="text-xs text-gray-500">When enabled, GePG bills are created automatically for new invoices.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Provider ID <span className="text-gray-400 font-normal">(SP_GRP_ID)</span>
              </label>
              <input
                type="text"
                value={serviceProviderId}
                onChange={(e) => setServiceProviderId(e.target.value)}
                placeholder="e.g. SP001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Biller ID</label>
              <input
                type="text"
                value={billerId}
                onChange={(e) => setBillerId(e.target.value)}
                placeholder="From GePG onboarding"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GePG Code <span className="text-gray-400 font-normal">(Bill Sub-code)</span>
              </label>
              <input
                type="text"
                value={gepgCode}
                onChange={(e) => setGepgCode(e.target.value)}
                placeholder="e.g. GePG sub-code"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="TZS"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Option</label>
              <select
                value={paymentOption}
                onChange={(e) => setPaymentOption(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 — Full Payment Only</option>
                <option value={2}>2 — Partial Payment Allowed</option>
                <option value={3}>3 — Overpayment Allowed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill Expiry (days)</label>
              <input
                type="number"
                value={billExpireDays}
                onChange={(e) => setBillExpireDays(Number(e.target.value))}
                min={1}
                max={365}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint URL</label>
            <input
              type="url"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://api.gepg.go.tz/..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Callback URL</label>
            <input
              type="url"
              value={callbackUrl}
              onChange={(e) => setCallbackUrl(e.target.value)}
              placeholder="https://your-server.com/api/gepg/callback/payment/"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              This URL will be registered with GePG to receive payment notifications.
              Use: /api/gepg/callback/payment/
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Credentials Card (write-only) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">API Credentials</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Credentials are encrypted at rest. Once saved, they cannot be retrieved — only overwritten.
          </p>
        </div>

        {credSuccess && (
          <div className="mx-5 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {credSuccess}
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Credential status indicators */}
          {config && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
              {[
                { label: 'Client ID', key: 'has_client_id' as keyof GePGConfig },
                { label: 'Client Secret', key: 'has_client_secret' as keyof GePGConfig },
                { label: 'Private Key', key: 'has_private_key' as keyof GePGConfig },
                { label: 'Certificate', key: 'has_certificate' as keyof GePGConfig },
              ].map(({ label, key }) => (
                <div key={key} className="text-center p-2 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <span className={`text-xs font-medium ${config[key] ? 'text-green-600' : 'text-gray-400'}`}>
                    {config[key] ? 'Set' : 'Not set'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type="password"
                value={credentials.client_id}
                onChange={(e) => setCredentials((prev) => ({ ...prev, client_id: e.target.value }))}
                placeholder={config?.has_client_id ? '(leave blank to keep existing)' : 'Enter Client ID'}
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
              <input
                type="password"
                value={credentials.client_secret}
                onChange={(e) => setCredentials((prev) => ({ ...prev, client_secret: e.target.value }))}
                placeholder={config?.has_client_secret ? '(leave blank to keep existing)' : 'Enter Client Secret'}
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Private Key</label>
            <textarea
              value={credentials.private_key}
              onChange={(e) => setCredentials((prev) => ({ ...prev, private_key: e.target.value }))}
              rows={5}
              placeholder={config?.has_private_key ? '(leave blank to keep existing private key)' : 'Paste PEM-encoded private key here'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate</label>
            <textarea
              value={credentials.certificate}
              onChange={(e) => setCredentials((prev) => ({ ...prev, certificate: e.target.value }))}
              rows={5}
              placeholder={config?.has_certificate ? '(leave blank to keep existing certificate)' : 'Paste PEM-encoded certificate here'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Security note:</strong> Credentials are encrypted using Fernet symmetric encryption
              before being stored. They are never returned in API responses.
              Ensure <code className="bg-amber-100 px-1 rounded">GEPG_ENCRYPTION_KEY</code> is set in production environment variables.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSaveCredentials()}
            disabled={savingCredentials || !config}
            className="px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm font-medium disabled:opacity-50"
          >
            {savingCredentials ? 'Saving...' : 'Save Credentials'}
          </button>
        </div>
      </div>
    </div>
  );
}
