'use client';

import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';

const resolveStudentOption = (link: any) => {
  const student = link.studentId;
  if (!student) return null;
  if (typeof student === 'string') {
    return { id: student, label: student };
  }
  return {
    id: student._id?.toString(),
    label: student.name || student.email,
  };
};

export function ActiveStudentSelector() {
  const { data: session } = useSession();
  const { links, studentId, setStudentId, loading } = useCollaborationContext();

  if (!session?.user?.role || session.user.role === 'student') {
    return null;
  }

  const options = links
    .map(resolveStudentOption)
    .filter((option): option is { id: string; label: string } => Boolean(option?.id));

  if (options.length === 0) {
    return (
      <div className="text-xs text-gray-500">
        {loading ? (
          <span className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading students…
          </span>
        ) : (
          'No students linked yet'
        )}
      </div>
    );
  }

  return (
    <label className="flex items-center gap-2 text-xs text-gray-500">
      Student
      <select
        value={studentId || ''}
        onChange={(e) => setStudentId(e.target.value || null)}
        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
