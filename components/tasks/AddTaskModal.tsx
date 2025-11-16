'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import { DateField } from '@/components/ui/DateField';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';

interface College {
  _id: string;
  name: string;
}

interface AddTaskModalProps {
  colleges: College[];
  onClose: () => void;
  onSuccess: (task: any) => void;
}

export function AddTaskModal({ colleges, onClose, onSuccess }: AddTaskModalProps) {
  const { appendStudentQuery } = useCollaborationContext();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [label, setLabel] = useState<'Essay' | 'Rec' | 'Testing' | 'Transcript' | 'Fees' | 'Supplement' | 'Other'>('Other');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [collegeId, setCollegeId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState<'none' | 'daily' | 'weekly'>('none');
  const [reminderChannels, setReminderChannels] = useState({
    email: true,
    sms: false,
    push: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(appendStudentQuery('/api/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          notes: notes || undefined,
          label,
          dueDate: dueDate || undefined,
          priority,
          collegeId: collegeId || undefined,
          reminderFrequency,
          reminderChannels: Object.entries(reminderChannels)
            .filter(([, enabled]) => enabled)
            .map(([channel]) => channel),
        }),
      });

      if (res.ok) {
        const task = await res.json();
        onSuccess(task);
      } else {
        throw new Error('Failed to add task');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Add Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Draft intro paragraph"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label
              </label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="Essay">Essay</option>
                <option value="Rec">Rec</option>
                <option value="Testing">Testing</option>
                <option value="Transcript">Transcript</option>
                <option value="Fees">Fees</option>
                <option value="Supplement">Supplement</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              College (optional)
            </label>
            <select
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">None</option>
              {colleges.map((college) => (
                <option key={college._id} value={college._id}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>

          <DateField
            label="Due Date (optional)"
            value={dueDate}
            onChange={setDueDate}
            placeholder="Choose a date"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder frequency
            </label>
            <select
              value={reminderFrequency}
              onChange={(e) => setReminderFrequency(e.target.value as 'none' | 'daily' | 'weekly')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="none">No reminders</option>
              <option value="daily">Daily until complete</option>
              <option value="weekly">Weekly nudges</option>
            </select>
          </div>

          {reminderFrequency !== 'none' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Channels</p>
              <div className="flex gap-3">
                {(['email', 'sms', 'push'] as const).map((channel) => (
                  <label key={channel} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={reminderChannels[channel]}
                      onChange={(e) =>
                        setReminderChannels((prev) => ({ ...prev, [channel]: e.target.checked }))
                      }
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    {channel.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
