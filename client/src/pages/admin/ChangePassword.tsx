import { API_BASE } from '../../utils/api';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '../../components/Button';
import { AdminSidebar } from '../../components/AdminSidebar';

export default function ChangePassword() {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate, token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const oldPassword = formData.oldPassword;
    const newPassword = formData.newPassword;
    const confirmNewPassword = formData.confirmNewPassword;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setError('All password fields are required.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from the current password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Unable to change password right now.');
        return;
      }

      setSuccess(data?.message || 'Password updated successfully.');
      setFormData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field: 'oldPassword' | 'newPassword' | 'confirmNewPassword') => {
    setShowPasswords((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />

      <main className="flex-1 p-10">
        <div className="mx-auto max-w-2xl">
          <Link to="/admin/dashboard" className="mb-6 inline-flex items-center text-sm text-zinc-500 transition-colors hover:text-black">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="rounded-3xl border border-zinc-100 bg-white p-10 shadow-xl">
            <div className="mb-8 flex items-start gap-4">
              <div className="rounded-2xl bg-zinc-100 p-3 text-zinc-900">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-zinc-900">Change Password</h1>
                <p className="mt-2 text-sm text-zinc-500">
                  Update the admin password securely. The current password is required before saving a new one.
                </p>
              </div>
            </div>

            {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            {success && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Old Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.oldPassword ? 'text' : 'password'}
                    value={formData.oldPassword}
                    onChange={(event) => setFormData((current) => ({ ...current, oldPassword: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 p-4 pr-14 outline-none transition-colors focus:border-black"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('oldPassword')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-700"
                    aria-label={showPasswords.oldPassword ? 'Hide old password' : 'Show old password'}
                  >
                    {showPasswords.oldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.newPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(event) => setFormData((current) => ({ ...current, newPassword: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 p-4 pr-14 outline-none transition-colors focus:border-black"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-700"
                    aria-label={showPasswords.newPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showPasswords.newPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-500">Use at least 8 characters and avoid reusing the current password.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirmNewPassword ? 'text' : 'password'}
                    value={formData.confirmNewPassword}
                    onChange={(event) => setFormData((current) => ({ ...current, confirmNewPassword: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 p-4 pr-14 outline-none transition-colors focus:border-black"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmNewPassword')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-700"
                    aria-label={showPasswords.confirmNewPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showPasswords.confirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Updating Password...' : 'Update Password'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/dashboard')}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}