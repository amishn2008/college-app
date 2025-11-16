# Environment Variables Setup Guide

## Step 1: Create .env.local File

Create a file named `.env.local` in the root directory of your project (same level as `package.json`).

## Step 2: Get Your MongoDB Connection String

### Option A: Local MongoDB

If you have MongoDB installed locally:
```env
MONGODB_URI=mongodb://localhost:27017/college-command-center
```

**To install MongoDB locally:**
- **macOS**: `brew install mongodb-community`
- **Windows**: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
- **Linux**: Follow [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

### Option B: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new cluster (choose the FREE tier)
4. Wait for cluster to be created (2-3 minutes)
5. Click "Connect" → "Connect your application"
6. Copy the connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
7. Replace `<username>` and `<password>` with your database user credentials
8. Add a database name at the end: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/college-command-center?retryWrites=true&w=majority`

**To create database user:**
- In Atlas, go to "Database Access" → "Add New Database User"
- Create username and password (save these!)
- Set privileges to "Atlas Admin" or "Read and write to any database"

**To whitelist IP:**
- Go to "Network Access" → "Add IP Address"
- Click "Allow Access from Anywhere" for development (0.0.0.0/0)
- For production, add specific IPs

## Step 3: Generate NextAuth Secret

Generate a random secret string. You can use one of these methods:

### Method 1: Using OpenSSL (Terminal)
```bash
openssl rand -base64 32
```

### Method 2: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Method 3: Online Generator
Visit [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

Copy the generated string and use it as your `NEXTAUTH_SECRET`.

## Step 4: Set NextAuth URL

For local development:
```env
NEXTAUTH_URL=http://localhost:3000
```

For production (after deployment):
```env
NEXTAUTH_URL=https://yourdomain.com
```

## Step 5: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Click on your profile → "View API keys"
4. Click "Create new secret key"
5. Give it a name (e.g., "College App")
6. **Copy the key immediately** (you won't see it again!)
7. It will look like: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Important:**
- The free tier has limited credits
- You'll need to add a payment method for production use
- Keep your API key secret - never commit it to Git

## Step 6: Get Google OAuth Credentials (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
   - Click project dropdown → "New Project"
   - Name it (e.g., "Admissions Forge")
   - Click "Create"
3. Enable Google+ API
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth Credentials
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure consent screen first:
     - Choose "External" → "Create"
     - Fill in app name, user support email
     - Add your email to test users
     - Save and continue through steps
   - Back to credentials: Select "Web application"
   - Name it (e.g., "College App Web Client")
   - Add Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Click "Create"
   - Copy the Client ID and Client Secret

## Step 7: Set Up Email (Optional - for Email Sign-in)

### Gmail Setup:
1. Enable 2-Factor Authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use your Gmail address and the generated app password

### Other Email Providers:
Use their SMTP settings:
- **SendGrid**: Use API key
- **Mailgun**: Use SMTP credentials
- **AWS SES**: Use SMTP credentials

## Complete .env.local File Template

Copy this template and fill in your values:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/college-command-center
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/college-command-center?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=paste-your-generated-secret-here

# Google OAuth (Optional - leave empty if not using)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# OpenAI API Key (Required for AI features)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Email Configuration (Optional - leave empty if not using email sign-in)
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
```

## Minimal Setup (Required Only)

If you want to get started quickly with just the essentials:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/college-command-center
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret
OPENAI_API_KEY=your-openai-key

# Optional (can add later)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

## Verification

After creating your `.env.local` file:

1. Make sure the file is named exactly `.env.local` (with the dot at the beginning)
2. Make sure it's in the root directory (same folder as `package.json`)
3. Restart your development server if it's running
4. The app should now connect to MongoDB and use your API keys

## Troubleshooting

### MongoDB Connection Failed
- Check if MongoDB is running: `mongosh` or `mongo`
- Verify the connection string is correct
- For Atlas: Check IP whitelist and credentials

### NextAuth Errors
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your current URL
- Clear browser cookies and try again

### OpenAI API Errors
- Verify API key is correct (starts with `sk-`)
- Check your OpenAI account has credits
- Ensure you have access to GPT-4 models

### Google OAuth Errors
- Verify redirect URI matches exactly
- Check consent screen is configured
- Ensure API is enabled

## Security Notes

- **Never commit `.env.local` to Git** (it's in `.gitignore`)
- Keep your API keys secret
- Use different keys for development and production
- Rotate keys if they're exposed
