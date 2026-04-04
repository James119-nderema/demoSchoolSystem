import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from './contexts/StaffAuthContext';
import { useParentAuth } from './contexts/ParentAuthContext';

type DemoRole = {
  id: string;
  label: string;
  roleValue: string;
  email: string;
};

const DEMO_PASSWORD = 'Demo@2026';
const DEMO_PARENT_EMAIL = 'james.muthoni395@example.com';

const demoStaffRoles: DemoRole[] = [
  {
    id: 'administrative-admin',
    label: 'Administrative Admin',
    roleValue: 'ADMINISTRATIVE_STAFF',
    email: 'principal@schoolmaster.co.ke',
  },
  {
    id: 'director-of-studies',
    label: 'Director of Studies',
    roleValue: 'DIRECTOR_OF_STUDIES',
    email: 'james.o.nderema@gmail.com',
  },
  {
    id: 'bursar',
    label: 'Bursar',
    roleValue: 'BURSAR',
    email: 'raphaelmaloba@gmail.com',
  },
  {
    id: 'librarian',
    label: 'Librarian',
    roleValue: 'LIBRARIAN',
    email: 'james.nderema@techaipath.com',
  },
  {
    id: 'class-teacher',
    label: 'Class Teacher',
    roleValue: 'CLASS_TEACHER',
    email: 'johnnderema@gmail.com',
  },
];

const getRoleRedirect = (role: string | undefined): string => {
  if (role === 'BURSAR' || role === 'ACCOUNTANT') {
    return '/finance/dashboard';
  }

  if (role === 'LIBRARIAN') {
    return '/library/dashboard';
  }

  return '/dashboard';
};

export default function RoleQuickAccessLanding() {
  const [showStaffRoles, setShowStaffRoles] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const navigate = useNavigate();
  const { login } = useStaffAuth();
  const { login: parentLogin } = useParentAuth();

  const roleCards = useMemo(() => demoStaffRoles, []);

  const handleStaffCardClick = () => {
    setErrorMessage('');
    setShowStaffRoles(true);
  };

  const handleParentCardClick = async () => {
    setErrorMessage('');
    setIsLoggingIn(true);
    setSelectedRoleId('parent');

    try {
      const success = await parentLogin(DEMO_PARENT_EMAIL, DEMO_PASSWORD);
      if (!success) {
        setErrorMessage('Unable to auto-login parent. Please confirm the parent account exists and try again.');
        return;
      }
      navigate('/parent/dashboard');
    } catch (error) {
      setErrorMessage('Network error while logging in parent. Please try again.');
    } finally {
      setIsLoggingIn(false);
      setSelectedRoleId(null);
    }
  };

  const handleRoleLogin = async (role: DemoRole) => {
    setErrorMessage('');
    setIsLoggingIn(true);
    setSelectedRoleId(role.id);

    try {
      const result = await login(role.email, DEMO_PASSWORD);

      if (!result.success) {
        setErrorMessage('Unable to auto-login this role. Please run the backend demo account setup script and try again.');
        return;
      }

      navigate(getRoleRedirect(result.role || role.roleValue));
    } catch (error) {
      setErrorMessage('Network error while logging in. Please try again.');
    } finally {
      setIsLoggingIn(false);
      setSelectedRoleId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Choose Portal</h1>
          <p className="mt-2 text-slate-600">Start by selecting Staff or Parent.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={handleStaffCardClick}
            className="text-left bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
          >
            <p className="text-sm text-blue-600 font-semibold">Staff</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">Staff Access</h2>
            <p className="text-slate-600 mt-2">Click to view demo staff roles and auto-login.</p>
          </button>

          <button
            type="button"
            onClick={handleParentCardClick}
            className="text-left bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
          >
            <p className="text-sm text-emerald-600 font-semibold">Parent</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">Parent Access</h2>
            <p className="text-slate-600 mt-2">Auto-login as parent demo account.</p>
            {selectedRoleId === 'parent' && isLoggingIn && (
              <p className="text-xs text-emerald-600 mt-2">Signing in...</p>
            )}
          </button>
        </div>

        {showStaffRoles && (
          <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-xl font-semibold text-slate-900">Staff Roles</h3>
              <button
                type="button"
                onClick={() => setShowStaffRoles(false)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Hide
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roleCards.map((role) => {
                const isCurrent = selectedRoleId === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    disabled={isLoggingIn}
                    onClick={() => handleRoleLogin(role)}
                    className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-3 text-left disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-slate-900">{role.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{role.email}</p>
                    {isCurrent && isLoggingIn && (
                      <p className="text-xs text-blue-600 mt-2">Signing in...</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
