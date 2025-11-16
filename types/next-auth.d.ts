import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: import('@/models/User').UserRole;
      activeStudentId?: string;
    };
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: import('@/models/User').UserRole;
    activeStudentId?: string;
  }
}
