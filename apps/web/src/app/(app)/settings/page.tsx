'use client';

import { useEffect, useState } from 'react';
import { Save, User, Globe, Twitter, Linkedin, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setWebsiteUrl(user.websiteUrl || '');
      setTwitterHandle(user.twitterHandle || '');
      setLinkedinUrl(user.linkedinUrl || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch<typeof user>('/users/me', {
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        twitterHandle: twitterHandle.trim() || null,
        linkedinUrl: linkedinUrl.trim() || null,
      });
      if (user) {
        setUser({ ...user, ...res.data });
      }
      toast('Settings saved', 'success');
    } catch {
      toast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-muted-foreground text-sm mb-8">Manage your profile and preferences</p>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </h2>
          <div className="card space-y-5">
            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <Avatar
                src={user?.avatarUrl ?? undefined}
                fallback={displayName || user?.username || '?'}
                size="lg"
                className="!w-16 !h-16"
              />
              <div>
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Display Name
              </label>
              <input
                className="input-field"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Bio</label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="Tell the world about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted mt-1">{bio.length}/500</p>
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Social Links
          </h2>
          <div className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Website
              </label>
              <input
                className="input-field"
                type="url"
                placeholder="https://yoursite.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5" />
                Twitter Handle
              </label>
              <input
                className="input-field"
                placeholder="username (without @)"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn URL
              </label>
              <input
                className="input-field"
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Account */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Account
          </h2>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Plan</p>
                <p className="text-xs text-muted-foreground">You&apos;re on the Free plan</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary-400">
                Free
              </span>
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <>
                <Spinner size="sm" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
