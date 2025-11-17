'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const [intakeYear, setIntakeYear] = useState(new Date().getFullYear() + 1);
  const [regions, setRegions] = useState<string[]>([]);
  const [targetCollegeCount, setTargetCollegeCount] = useState<number>(5);
  const initialTimezone = useMemo(() => {
    if (typeof Intl !== 'undefined') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return 'America/New_York';
  }, []);
  const [role, setRole] = useState<'student' | 'counselor' | 'parent'>('student');
  const [timezone, setTimezone] = useState(initialTimezone);
  const [counselorEmail, setCounselorEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleRegion = (region: string) => {
    setRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const selectedRegions = regions.length > 0 ? regions : ['US'];
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeYear,
          regions: selectedRegions,
          targetCollegeCount,
          role,
          timezone,
        }),
      });

      if (res.ok) {
        if (role === 'student' && counselorEmail.trim()) {
          await fetch('/api/collaboration/links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              collaboratorEmail: counselorEmail.trim(),
              relationship: 'counselor',
            }),
          }).catch(() => {
            toast.error('Saved profile, but could not invite counselor yet.');
          });
        }

        toast.success('Welcome! Let’s add your first college.');
        router.push('/dashboard');
      } else {
        toast.error('Something went wrong');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h1>
          <p className="text-gray-600 mb-8">
            Let&rsquo;s set up your application timeline.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who are you?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'student', label: 'Student' },
                  { value: 'counselor', label: 'Counselor' },
                  { value: 'parent', label: 'Parent' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value as typeof role)}
                    className={`px-4 py-3 rounded-lg border text-left transition ${
                      role === option.value
                        ? 'border-primary-600 bg-primary-50 text-primary-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-semibold capitalize">{option.label}</span>
                    {option.value === 'student' && (
                      <span className="text-xs text-gray-500">
                        Manage your full application plan.
                      </span>
                    )}
                    {option.value === 'counselor' && (
                      <span className="text-xs text-gray-500">
                        Support multiple students in one place.
                      </span>
                    )}
                    {option.value === 'parent' && (
                      <span className="text-xs text-gray-500">
                        Follow along with read/write controls.
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

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
                Regions (select all that apply)
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
                How many colleges are you applying to?
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
              <p className="text-xs text-gray-500 mt-1">
                Used for reminders and counselor scheduling.
              </p>
            </div>

            {role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite your counselor (optional)
                </label>
                <input
                  type="email"
                  value={counselorEmail}
                  onChange={(e) => setCounselorEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="counselor@school.org"
                />
                <p className="text-xs text-gray-500 mt-1">
                  They&rsquo;ll get immediate read/write access with a full audit log.
                </p>
              </div>
            )}

            <Button onClick={handleSubmit} className="w-full" size="lg">
              {submitting ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
