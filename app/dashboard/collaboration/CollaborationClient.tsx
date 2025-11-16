'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { COLLABORATION_PERMISSION_LABELS, CollaboratorPermissionKey } from '@/types/collaboration';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';

interface PopulatedLink {
  _id: string;
  relationship: 'counselor' | 'parent';
  status: 'pending' | 'active' | 'revoked';
  permissions: Record<string, boolean>;
  collaboratorId: {
    _id: string;
    name?: string;
    email: string;
    role: string;
  };
  studentId: {
    _id: string;
    name?: string;
    email: string;
    intakeYear?: number;
  };
}

interface CollaborationClientProps {
  initialLinks: PopulatedLink[];
  viewerRole: 'student' | 'counselor' | 'parent';
}

export function CollaborationClient({ initialLinks, viewerRole }: CollaborationClientProps) {
  const [links, setLinks] = useState(initialLinks);
  const [inviteEmail, setInviteEmail] = useState('');
  const [relationship, setRelationship] = useState<'counselor' | 'parent'>('counselor');
  const [submitting, setSubmitting] = useState(false);
  const { refreshLinks, setStudentId } = useCollaborationContext();

  const collaborators = useMemo(
    () =>
      links.filter((link) => link.relationship === 'counselor')
        .map((link) => ({
          ...link,
          displayName: link.collaboratorId?.name || link.collaboratorId?.email,
        })),
    [links]
  );

  const parents = useMemo(
    () =>
      links.filter((link) => link.relationship === 'parent')
        .map((link) => ({
          ...link,
          displayName: link.collaboratorId?.name || link.collaboratorId?.email,
        })),
    [links]
  );

  const students = useMemo(
    () =>
      links
        .map((link) => ({
          id: link.studentId?._id,
          name: link.studentId?.name || link.studentId?.email,
          status: link.status,
          linkId: link._id,
        }))
        .filter((entry, index, arr) => entry.id && arr.findIndex((e) => e.id === entry.id) === index),
    [links]
  );

  const updateLink = (next: PopulatedLink) => {
    setLinks((prev) => prev.map((link) => (link._id === next._id ? next : link)));
  };

  const handlePermissionToggle = async (
    linkId: string,
    permission: CollaboratorPermissionKey,
    value: boolean
  ) => {
    try {
      const res = await fetch(`/api/collaboration/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: { [permission]: value } }),
      });
      if (!res.ok) throw new Error('Failed to update permission');
      const updated = await res.json();
      updateLink(updated);
      refreshLinks();
    } catch (error) {
      console.error(error);
      toast.error('Could not update permission');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Enter an email');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/collaboration/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaboratorEmail: inviteEmail.trim(),
          relationship,
        }),
      });
      const hasJson = res.headers.get('content-type')?.includes('application/json');
      const payload = hasJson ? await res.json() : null;
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to invite collaborator');
      }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Unexpected server response while inviting collaborator');
      }
      const created = payload as PopulatedLink;
      setLinks((prev) => [created, ...prev]);
      setInviteEmail('');
      toast.success('Collaborator added');
      refreshLinks();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unable to invite collaborator';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (linkId: string) => {
    try {
      const res = await fetch(`/api/collaboration/links/${linkId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove collaborator');
      setLinks((prev) => prev.filter((link) => link._id !== linkId));
      toast.success('Access revoked');
      refreshLinks();
    } catch (error) {
      console.error(error);
      toast.error('Could not revoke collaborator');
    }
  };

  const renderPermissionGrid = (link: PopulatedLink) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
      {Object.entries(COLLABORATION_PERMISSION_LABELS).map(([key, label]) => {
        const typedKey = key as CollaboratorPermissionKey;
        return (
          <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={Boolean(link.permissions?.[key])}
              onChange={(e) => handlePermissionToggle(link._id, typedKey, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            {label}
          </label>
        );
      })}
    </div>
  );

  if (viewerRole === 'counselor' || viewerRole === 'parent') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600">Switch between students and review access.</p>
        </div>
        <Card>
          {students.length === 0 ? (
            <p className="text-sm text-gray-500">No students have shared their workspace yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {students.map((student) => (
                <div key={student.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{student.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStudentId(student.id)}
                    >
                      Make Active
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Collaboration</h1>
        <p className="text-gray-600">
          Invite counselors or parents, set granular permissions, and track access.
        </p>
      </div>

      <Card className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Invite collaborator</h2>
          <p className="text-sm text-gray-500">
            Counselors get full access by default. Parents get view-only access unless enabled.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="email"
            placeholder="counselor@school.org"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value as 'counselor' | 'parent')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="counselor">Counselor</option>
            <option value="parent">Parent</option>
          </select>
          <Button onClick={handleInvite} disabled={submitting}>
            {submitting ? 'Inviting...' : 'Send Invite'}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Counselors</h2>
        {collaborators.length === 0 ? (
          <p className="text-sm text-gray-500">No counselors connected yet.</p>
        ) : (
          <div className="space-y-6">
            {collaborators.map((link) => (
              <div key={link._id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{link.displayName}</p>
                    <p className="text-xs text-gray-500 capitalize">{link.status}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRevoke(link._id)}>
                    Revoke
                  </Button>
                </div>
                {renderPermissionGrid(link)}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Parents / Guardians</h2>
        {parents.length === 0 ? (
          <p className="text-sm text-gray-500">No parent access configured.</p>
        ) : (
          <div className="space-y-6">
            {parents.map((link) => (
              <div key={link._id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{link.displayName}</p>
                    <p className="text-xs text-gray-500 capitalize">{link.status}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRevoke(link._id)}>
                    Revoke
                  </Button>
                </div>
                {renderPermissionGrid(link)}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
