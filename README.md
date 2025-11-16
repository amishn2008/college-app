# Admissions Forge

A comprehensive web application for managing college applications. Built with Next.js, MongoDB, and TypeScript.

## Features

- **Dashboard**: Overview of all colleges, tasks, and deadlines
- **College Management**: Add colleges with deadlines and track progress
- **Task Management**: Create and manage tasks with due dates and priorities
- **Essay Workspace**: Write essays with AI-powered feedback and version control
- **Calendar View**: Visualize tasks and deadlines
- **Sharing**: Create read-only links to share progress with counselors/parents
- **AI Assistance**: Get critiques, rewrites, and coaching suggestions for essays

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js (Google OAuth + Email)
- **AI**: OpenAI GPT-4
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- OpenAI API key
- Google OAuth credentials (optional, for Google sign-in)
- SMTP credentials (optional, for email sign-in)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/college-command-center
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=your-openai-api-key
EMAIL_FROM=noreply@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── auth/              # Authentication pages
│   └── share/             # Public share pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── colleges/         # College-related components
│   ├── essays/           # Essay-related components
│   └── tasks/            # Task-related components
├── lib/                   # Utility functions
├── models/                # MongoDB models
└── types/                 # TypeScript type definitions
```

## Key Features Implementation

### Authentication
- Google OAuth integration
- Email magic link authentication
- Session management with NextAuth.js

### Database Models
- User: User profiles and preferences
- College: College applications with deadlines
- Task: Individual tasks with due dates
- Essay: Essays with version history
- ShareLink: Read-only sharing tokens

### AI Integration
- Essay critique with strengths, issues, and line edits
- Essay rewriting based on instructions
- Coaching suggestions for structure and approach

## Deployment

The application can be deployed to Vercel, Netlify, or any Node.js hosting platform.

1. Set up environment variables in your hosting platform
2. Deploy the application
3. Ensure MongoDB is accessible from your hosting environment

## License

MIT
