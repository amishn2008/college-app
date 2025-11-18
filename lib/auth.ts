import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const ensureStudentActiveId = async (user: typeof User.prototype | null) => {
  if (user && user.role === 'student' && !user.activeStudentId) {
    user.activeStudentId = user._id;
    await user.save();
  }
  return user;
};

const normalizeEnv = (value?: string | null) => value?.trim() || undefined;

const isValidObjectId = (value?: string | null): value is string =>
  typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);

const buildBaseUrl = () => {
  const envUrl = normalizeEnv(process.env.NEXTAUTH_URL);
  const fallbackLocal = 'http://localhost:3000';
  const resolved = envUrl || fallbackLocal;

  // Keep the runtime copy in sync so NextAuth uses the same origin for callbacks.
  process.env.NEXTAUTH_URL = resolved;
  return resolved;
};

const baseUrl = buildBaseUrl();

const googleClientId = normalizeEnv(process.env.GOOGLE_CLIENT_ID);
const googleClientSecret = normalizeEnv(process.env.GOOGLE_CLIENT_SECRET);
const nextAuthSecret = normalizeEnv(process.env.NEXTAUTH_SECRET);

if (!nextAuthSecret) {
  throw new Error('[auth] NEXTAUTH_SECRET is not set. Generate one and set it in your environment.');
}

const providers = [] as NextAuthOptions['providers'];

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
} else {
  console.warn('[auth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing. Google sign-in disabled (local only).');
}

// EmailProvider requires a database adapter. Disable until one is configured to avoid runtime errors.
if (process.env.SMTP_HOST || process.env.SMTP_USER || process.env.SMTP_PASSWORD) {
  console.warn('[auth] Email provider not enabled: missing NextAuth adapter configuration.');
}

// Dev-only credentials fallback so NextAuth always has at least one provider.
if (providers.length === 0 && process.env.NODE_ENV !== 'production') {
  providers.push(
    CredentialsProvider({
      name: 'Demo',
      credentials: {
        email: { label: 'Email', type: 'text', value: 'demo@example.com' },
        password: { label: 'Password', type: 'password', value: 'demo123' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (email === 'demo@example.com' && password === 'demo123') {
          return {
            id: 'dev-demo-user',
            email,
            name: 'Demo User',
          };
        }

        return null;
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: 'jwt',
  },
  secret: nextAuthSecret,
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async signIn({ user }) {
      await connectDB();
      if (user.email) {
        let existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          existingUser = await User.create({
            email: user.email,
            name: user.name,
            image: user.image,
            intakeYear: new Date().getFullYear() + 1,
            regions: [],
            role: 'student',
          });
        }
        await ensureStudentActiveId(existingUser);
      }
      return true;
    },
    async jwt({ token, user }) {
      await connectDB();

      const resolvedId = typeof user?.id === 'string' ? user.id : token.id;
      const resolvedEmail = user?.email || token.email;

      let dbUser = null;
      if (isValidObjectId(resolvedId)) {
        dbUser = await User.findById(resolvedId);
      } else if (resolvedEmail) {
        dbUser = await User.findOne({ email: resolvedEmail });
      }
      dbUser = await ensureStudentActiveId(dbUser);

      if (dbUser) {
        token.id = dbUser._id.toString();
        token.role = dbUser.role || 'student';
        token.activeStudentId = dbUser.activeStudentId?.toString();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || 'student';
        if (token.activeStudentId) {
          session.user.activeStudentId = token.activeStudentId as string;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        const target = new URL(url);
        if (target.origin === baseUrl) {
          return url;
        }
      } catch {
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
      }
      return `${baseUrl}/dashboard`;
    },
  },
};
