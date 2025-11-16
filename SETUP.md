# Setup Guide for Admissions Forge

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18 or higher
- MongoDB (local installation or MongoDB Atlas account)
- An OpenAI API key
- Google OAuth credentials (optional, for Google sign-in)
- SMTP credentials (optional, for email sign-in)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up MongoDB

### Option A: Local MongoDB

1. Install MongoDB locally or use Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

2. Your connection string will be: `mongodb://localhost:27017/college-command-center`

### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string from the "Connect" button

## Step 3: Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/college-command-center
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college-command-center

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here
# Generate a secret: openssl rand -base64 32

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI API Key (Required for AI features)
OPENAI_API_KEY=sk-your-openai-api-key

# Email Configuration (Optional, for email sign-in)
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env.local` file

### Getting OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new secret key
5. Copy it to your `.env.local` file

### Setting Up Email (Optional)

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Use your email and the app password in `.env.local`

For other providers, use their SMTP settings.

## Step 4: Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Step 5: First Use

1. Visit the homepage
2. Click "Start my dashboard"
3. Sign in with Google or Email
4. Complete the onboarding process
5. Add your first college!

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel's dashboard
4. Deploy!

### Environment Variables for Production

Make sure to update:
- `NEXTAUTH_URL` to your production URL
- `MONGODB_URI` to your production database
- Add your production domain to Google OAuth authorized redirect URIs

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running (if local)
- Check your connection string is correct
- Verify network access (for Atlas)
- Check firewall settings

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure OAuth redirect URIs are correct

### OpenAI API Issues

- Verify your API key is correct
- Check your OpenAI account has credits
- Ensure the API key has access to GPT-4

## Support

For issues or questions, please check the README.md or open an issue in the repository.
