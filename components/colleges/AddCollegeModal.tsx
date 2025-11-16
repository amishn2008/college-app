'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import { X } from 'lucide-react';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';

type RequirementToggles = {
  supplements: boolean;
  recommendations: boolean;
  testing: boolean;
  transcript: boolean;
  fees: boolean;
};

interface AddCollegeModalProps {
  onClose: () => void;
  onSuccess: (college: any) => void;
  defaults?: {
    name?: string;
    plan?: 'ED' | 'EA' | 'RD' | 'ED2' | 'EA2' | 'Rolling';
    deadline?: string;
    portalUrl?: string;
    notes?: string;
    requirements?: Partial<RequirementToggles>;
  };
}

const DEFAULT_REQUIREMENTS: RequirementToggles = {
  supplements: true,
  recommendations: true,
  testing: false,
  transcript: true,
  fees: true,
};

export function AddCollegeModal({ onClose, onSuccess, defaults }: AddCollegeModalProps) {
  const { appendStudentQuery } = useCollaborationContext();
  const [name, setName] = useState(defaults?.name || '');
  const [plan, setPlan] = useState<'ED' | 'EA' | 'RD' | 'ED2' | 'EA2' | 'Rolling'>(defaults?.plan || 'RD');
  const [deadline, setDeadline] = useState(defaults?.deadline || '');
  const [portalUrl, setPortalUrl] = useState(defaults?.portalUrl || '');
  const [notes, setNotes] = useState(defaults?.notes || '');
  const [requirementToggles, setRequirementToggles] = useState<RequirementToggles>({
    ...DEFAULT_REQUIREMENTS,
    ...(defaults?.requirements || {}),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(defaults?.name || '');
    setPlan(defaults?.plan || 'RD');
    setDeadline(defaults?.deadline || '');
    setPortalUrl(defaults?.portalUrl || '');
    setNotes(defaults?.notes || '');
    setRequirementToggles({
      ...DEFAULT_REQUIREMENTS,
      ...(defaults?.requirements || {}),
    });
  }, [defaults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const requirementStatus = {
        supplements: requirementToggles.supplements ? 'in_progress' : 'not_needed',
        recommendations: requirementToggles.recommendations ? 'in_progress' : 'not_needed',
        testing: requirementToggles.testing ? 'in_progress' : 'not_needed',
        transcript: requirementToggles.transcript ? 'in_progress' : 'not_needed',
        fees: requirementToggles.fees ? 'in_progress' : 'not_needed',
      };
      const requirements = {
        mainEssay: true,
        supplements: requirementToggles.supplements,
        recommendations: requirementToggles.recommendations,
        testing: requirementToggles.testing,
        transcript: requirementToggles.transcript,
        fees: requirementToggles.fees,
      };

      const res = await fetch(appendStudentQuery('/api/colleges'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          plan,
          deadline,
          intake: 'Fall',
          region: 'US',
          portalUrl: portalUrl || undefined,
          notes: notes || undefined,
          requirementStatus,
          requirements,
        }),
      });

      if (res.ok) {
        const college = await res.json();
        onSuccess(college);
      } else {
        throw new Error('Failed to add college');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRequirement = (key: keyof typeof requirementToggles) => {
    setRequirementToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Add College</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              College Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Harvard University"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decision Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ED">Early Decision (ED)</option>
              <option value="EA">Early Action (EA)</option>
              <option value="ED2">Early Decision II (ED2)</option>
              <option value="EA2">Early Action II (EA2)</option>
              <option value="RD">Regular Decision (RD)</option>
              <option value="Rolling">Rolling</option>
            </select>
          </div>

          <DateField
            label="Deadline"
            value={deadline}
            onChange={setDeadline}
            required
            placeholder="Pick a due date"
          />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Requirements to track
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Uncheck anything this school does not need. You can edit later.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { key: 'supplements', label: 'Supplements' },
                  { key: 'recommendations', label: 'Recommendations' },
                  { key: 'testing', label: 'Testing' },
                  { key: 'transcript', label: 'Transcript' },
                  { key: 'fees', label: 'Application fee' },
                ] as const
              ).map((option) => (
                <label
                  key={option.key}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={requirementToggles[option.key]}
                    onChange={() => toggleRequirement(option.key)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application portal / research link
            </label>
            <input
              type="url"
              value={portalUrl}
              onChange={(e) => setPortalUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://apply.university.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes & focus areas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Why this school, important requirements, portal login hints..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Adding...' : 'Add College'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
