import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import { getProfile, updateProfile, updateSettings, triggerSync } from '../api/analytics';
import toast from 'react-hot-toast';

const Settings = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const profile = data?.profile;

  const [profileForm, setProfileForm] = useState({});
  const [settingsForm, setSettingsForm] = useState({});

  React.useEffect(() => {
    if (profile) {
      setProfileForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        company: profile.company || '',
      });
      setSettingsForm({
        weekly_digest_enabled: profile.weekly_digest_enabled,
        alert_threshold: profile.alert_threshold || 40,
        alert_email: profile.alert_email || profile.email || '',
        is_public_profile: profile.is_public_profile,
        slack_webhook_url: profile.slack_webhook_url || '',
      });
    }
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      toast.success('Profile updated!');
    },
  });

  const settingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      toast.success('Settings saved!');
    },
  });

  return (
    <div className="flex min-h-screen bg-surface-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-11 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800 px-6 py-4">
          <h1 className="text-xl font-bold">Settings</h1>
        </header>

        <div className="p-6 max-w-2xl space-y-8 animate-fade-in">
          {/* Profile Section */}
          <section className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-surface-400 block mb-1">Display Name</label>
                <input type="text" className="input-field w-full" value={profileForm.display_name || ''} onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-surface-400 block mb-1">Bio</label>
                <textarea className="input-field w-full resize-none" rows={3} value={profileForm.bio || ''} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-surface-400 block mb-1">Location</label>
                  <input type="text" className="input-field w-full" value={profileForm.location || ''} onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-surface-400 block mb-1">Company</label>
                  <input type="text" className="input-field w-full" value={profileForm.company || ''} onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })} />
                </div>
              </div>
              <button onClick={() => profileMutation.mutate(profileForm)} className="btn-primary text-sm" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </section>

          {/* Notifications */}
          <section className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Notifications</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Weekly digest email</span>
                <button
                  onClick={() => setSettingsForm({ ...settingsForm, weekly_digest_enabled: !settingsForm.weekly_digest_enabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${settingsForm.weekly_digest_enabled ? 'bg-primary-500' : 'bg-surface-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-black shadow transition-transform ${settingsForm.weekly_digest_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </label>
              <div>
                <label className="text-xs text-surface-400 block mb-1">Alert threshold (score below this triggers alert)</label>
                <input type="range" min="0" max="100" value={settingsForm.alert_threshold || 40}
                  onChange={(e) => setSettingsForm({ ...settingsForm, alert_threshold: parseInt(e.target.value) })}
                  className="w-full" />
                <span className="text-sm text-surface-300">{settingsForm.alert_threshold}</span>
              </div>
              <div>
                <label className="text-xs text-surface-400 block mb-1">Alert email</label>
                <input type="email" className="input-field w-full" value={settingsForm.alert_email || ''} onChange={(e) => setSettingsForm({ ...settingsForm, alert_email: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-surface-400 block mb-1">Slack webhook URL</label>
                <input type="url" className="input-field w-full" placeholder="https://hooks.slack.com/..." value={settingsForm.slack_webhook_url || ''} onChange={(e) => setSettingsForm({ ...settingsForm, slack_webhook_url: e.target.value })} />
              </div>
              <button onClick={() => settingsMutation.mutate(settingsForm)} className="btn-primary text-sm" disabled={settingsMutation.isPending}>
                {settingsMutation.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </section>

          {/* Privacy */}
          <section className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Privacy</h2>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm">Public profile</span>
                <p className="text-xs text-surface-500 mt-0.5">Allow others to see your profile at /profile/{profile?.username}</p>
              </div>
              <button
                onClick={() => {
                  const newVal = !settingsForm.is_public_profile;
                  setSettingsForm({ ...settingsForm, is_public_profile: newVal });
                  settingsMutation.mutate({ ...settingsForm, is_public_profile: newVal });
                }}
                className={`w-12 h-6 rounded-full transition-colors ${settingsForm.is_public_profile ? 'bg-primary-500' : 'bg-surface-700'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-black shadow transition-transform ${settingsForm.is_public_profile ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </section>

          {/* Connected Accounts */}
          <section className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>
            <div className="flex items-center justify-between p-3 bg-surface-800 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">🐙</span>
                <div>
                  <p className="text-sm font-medium">GitHub</p>
                  <p className="text-xs text-surface-500">@{profile?.username}</p>
                </div>
              </div>
              <span className="badge badge-success">Connected</span>
            </div>
          </section>

          {/* Data */}
          <section className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Data</h2>
            <div className="space-y-3">
              <button className="btn-secondary w-full text-sm text-left" onClick={() => { triggerSync(); toast.success('Re-sync started!'); }}>
                🔄 Re-sync all data
              </button>
              <button className="btn-secondary w-full text-sm text-left" onClick={async () => {
                try {
                  const client = (await import('../api/client')).default;
                  const res = await client.get('/api/user/export');
                  const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `devpulse-export-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success('Data exported successfully!');
                } catch (e) {
                  toast.error('Failed to export data');
                }
              }}>
                📦 Export my data as JSON
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="glass-card p-6 border-red-500/20">
            <h2 className="text-lg font-semibold text-red-400 mb-4">⚠️ Danger Zone</h2>
            <p className="text-sm text-surface-400 mb-4">Permanently delete your account and all associated data.</p>
            <button className="btn-danger text-sm" onClick={() => toast.error('Account deletion requires confirmation via email')}>
              Delete My Account
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
