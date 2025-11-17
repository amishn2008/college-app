import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const isValidObjectId = (value?: string | null): value is string =>
  typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);

const providers = [];

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('[auth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set. Google sign-in will fail.');
} else {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

const hasEmailEnv = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD;

if (hasEmailEnv) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@example.com',
    })
  );
} else if (process.env.NODE_ENV !== 'production') {
  // Dev fallback: enable the email provider and log magic links instead of sending email
  providers.push(
    EmailProvider({
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      server: { host: 'localhost', port: 2525, auth: { user: '', pass: '' } },
      async sendVerificationRequest({ url }) {
        console.log('[auth] Email login link (dev fallback):', url);
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      await connectDB();
      if (user.email) {
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            email: user.email,
            name: user.name,
            image: user.image,
            intakeYear: new Date().getFullYear() + 1,
            regions: [],
            role: 'student',
          });
        }
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
