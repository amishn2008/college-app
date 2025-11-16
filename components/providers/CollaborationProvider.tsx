/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSession } from 'next-auth/react';

interface CollaborationLink {
  _id: string;
  studentId: any;
  collaboratorId: any;
  permissions: Record<string, boolean>;
  relationship: 'counselor' | 'parent';
  status: 'pending' | 'active' | 'revoked';
}

interface CollaborationContextValue {
  studentId: string | null;
  links: CollaborationLink[];
  loading: boolean;
  refreshLinks: () => Promise<void>;
  setStudentId: (nextId: string | null) => Promise<void>;
  appendStudentQuery: (url: string) => string;
}

const CollaborationContext = createContext<CollaborationContextValue>({
  studentId: null,
  links: [],
  loading: false,
  refreshLinks: async () => {},
  setStudentId: async () => {},
  appendStudentQuery: (url: string) => url,
});

const STORAGE_KEY = 'ccc:selected-student';

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [studentId, setStudentIdState] = useState<string | null>(null);
  const [links, setLinks] = useState<CollaborationLink[]>([]);
  const [loading, setLoading] = useState(false);

  const viewerId = session?.user?.id;
  const viewerRole = session?.user?.role ?? 'student';

  const loadStoredStudent = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(STORAGE_KEY);
  }, []);

  const persistStudent = useCallback((value: string | null) => {
    if (typeof window === 'undefined') return;
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, value);
  }, []);

  useEffect(() => {
    if (!viewerId) return;
    if (viewerRole === 'student') {
      setStudentIdState(viewerId);
      return;
    }

    const stored = loadStoredStudent();
    if (stored) {
      setStudentIdState(stored);
      return;
    }

    if (session?.user?.activeStudentId) {
      setStudentIdState(session.user.activeStudentId);
    }
  }, [viewerId, viewerRole, session?.user?.activeStudentId]);

  const setStudentId = useCallback(
    async (nextId: string | null) => {
      if (!viewerId) return;
      setStudentIdState(nextId);
      persistStudent(nextId);

      if (viewerRole === 'student') return;

      try {
        await fetch('/api/collaboration/context', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: nextId }),
        });
      } catch (error) {
        console.error('Failed to persist student context', error);
      }
    },
    [viewerId, viewerRole, persistStudent]
  );

  const refreshLinks = useCallback(async () => {
    if (!viewerId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/collaboration/students');
      if (res.ok) {
        const data: CollaborationLink[] = await res.json();
        setLinks(data);

        if (
          (viewerRole === 'counselor' || viewerRole === 'parent') &&
          !studentId &&
          data.length > 0
        ) {
          const firstStudentId =
            (data[0]?.studentId?._id as string | undefined) ||
            (typeof data[0]?.studentId === 'string'
              ? (data[0]?.studentId as string)
              : null);
          if (firstStudentId) {
            await setStudentId(firstStudentId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load collaboration links', error);
    } finally {
      setLoading(false);
    }
  }, [viewerId, viewerRole, studentId, setStudentId]);

  useEffect(() => {
    refreshLinks();
  }, [refreshLinks]);

  const appendStudentQuery = useCallback(
    (url: string) => {
      if (!viewerId || !studentId || studentId === viewerId) {
        return url;
      }
      const delimiter = url.includes('?') ? '&' : '?';
      return `${url}${delimiter}studentId=${studentId}`;
    },
    [studentId, viewerId]
  );

  const value = useMemo(
    () => ({
      studentId,
      links,
      loading,
      refreshLinks,
      setStudentId,
      appendStudentQuery,
    }),
    [studentId, links, loading, refreshLinks, setStudentId, appendStudentQuery]
  );

  return <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>;
}

export const useCollaborationContext = () => useContext(CollaborationContext);
