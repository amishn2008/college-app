'use client';

import { SessionProvider } from 'next-auth/react';
import { CollaborationProvider } from '@/components/providers/CollaborationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CollaborationProvider>{children}</CollaborationProvider>
    </SessionProvider>
  );
}
