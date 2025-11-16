'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  email: string;
  name?: string;
  role: 'student' | 'counselor' | 'parent';
  intakeYear: number;
  regions: string[];
  targetCollegeCount?: number;
  timezone?: string;
}

export function SettingsClient({ user }: { user: User | null }) {
  const [intakeYear, setIntakeYear] = useState(user?.intakeYear || new Date().getFullYear() + 1);
  const [regions, setRegions] = useState<string[]>(user?.regions || []);
  const [targetCollegeCount, setTargetCollegeCount] = useState(user?.targetCollegeCount || 5);
  const [timezone, setTimezone] = useState(
    user?.timezone ||
      (typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'America/New_York')
  );
  const [loading, setLoading] = useState(false);

  const toggleRegion = (region: string) => {
    setRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeYear, regions, targetCollegeCount, timezone, role: user?.role }),
      });

      if (res.ok) {
        toast.success('Settings saved!');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Application Preferences</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Intake Year
            </label>
            <input
              type="number"
              value={intakeYear}
              onChange={(e) => setIntakeYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regions
            </label>
            <div className="flex flex-wrap gap-2">
              {['US', 'UK', 'Canada', 'Australia', 'Other'].map((region) => (
                <button
                  key={region}
                  onClick={() => toggleRegion(region)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    regions.includes(region)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target College Count
            </label>
            <input
              type="number"
              value={targetCollegeCount}
              onChange={(e) => setTargetCollegeCount(parseInt(e.target.value))}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., America/New_York"
            />
          </div>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>

      {user?.role && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Role</h2>
          <p className="text-sm text-gray-600 mb-2">
            You are currently set up as a <strong className="capitalize">{user.role}</strong>.
          </p>
          <p className="text-xs text-gray-500">
            Need to change this? Contact support so we can preserve your collaboration history.
          </p>
        </Card>
      )}
    </div>
  );
}
