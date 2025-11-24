import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import {
  Search,
  Filter,
  Star,
  ShieldCheck,
  Video,
  MessageCircle,
  Clock,
  Sparkles,
  Globe2,
  CalendarClock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { authOptions } from '@/lib/auth';

const counselors = [
  {
    name: 'Lauren Chen',
    headline: 'Former Stanford admissions reader',
    rate: '$145/hr',
    focus: 'STEM + Ivy/UC',
    response: 'Replies in under 2 hours',
    students: 126,
    rating: 4.9,
    languages: ['English', 'Mandarin'],
    availability: '3 live slots this week',
    formats: ['Video', 'Async edits'],
    tags: ['Essay coaching', 'Strategy', 'Scholarships'],
  },
  {
    name: 'Marcus Rivera',
    headline: 'Lead counselor, charter network',
    rate: '$95/hr',
    focus: 'First-gen + merit aid',
    response: 'Replies same day',
    students: 214,
    rating: 4.8,
    languages: ['English', 'Spanish'],
    availability: '5 live slots this week',
    formats: ['Video', 'Office hours'],
    tags: ['Activity list', 'Interview prep', 'Financial aid'],
  },
  {
    name: 'Priya Desai',
    headline: 'Oxbridge alum + essay specialist',
    rate: '$110/hr',
    focus: 'UK + US hybrid',
    response: 'Replies within a day',
    students: 97,
    rating: 5.0,
    languages: ['English', 'Hindi'],
    availability: '2 live slots this week',
    formats: ['Video', 'Async edits'],
    tags: ['Personal statements', 'Supplemental strategy', 'Recommendations'],
  },
  {
    name: 'Jordan Blake',
    headline: 'Ex-Common App reader · Tulane',
    rate: '$85/hr',
    focus: 'Merit aid + narrative strength',
    response: 'Replies within a day',
    students: 161,
    rating: 4.7,
    languages: ['English', 'French'],
    availability: '4 async returns in 72h',
    formats: ['Async edits', 'Office hours'],
    tags: ['Main essay polish', 'Scholarships', 'Activity list'],
  },
];

const packages = [
  {
    title: 'Essay Sprint',
    price: '$180 / 2 live sessions',
    description: 'Outline to polished draft with inline edits and a rewrite plan.',
    perks: ['Live video + shared doc', 'Line-by-line edits', '48-hour turnaround'],
  },
  {
    title: 'Application Power Hour',
    price: '$120 / 1:1',
    description: 'Triage deadlines, pick prompts, and leave with a 7-day action plan.',
    perks: ['Timeline mapping', 'Prompt pairing', 'Risk/strengths review'],
  },
  {
    title: 'Scholarship Pack',
    price: '$250 / 3 async reviews',
    description: 'Target local + national awards with tailored edits.',
    perks: ['Budget guardrails', 'Reviewer comments', 'FAFSA/CSS checklist'],
  },
];

const filters = ['STEM', 'First-gen', 'Essay coaching', 'Financial aid', 'Interview prep', 'Bilingual'];

const steps = [
  { title: 'Browse fit', copy: 'Filter by expertise, language, rates, and turnaround time.' },
  { title: 'Book safely', copy: 'Use verified payouts and session receipts inside Forge.' },
  { title: 'Meet here', copy: 'Video, async edits, and notes stay tied to your dashboard.' },
];

export default async function DashboardCounselorsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  if (session.user.role && session.user.role !== 'student') {
    redirect('/dashboard/counselor/connect');
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="rounded-3xl border border-primary-100 bg-gradient-to-r from-primary-600 via-primary-500 to-blue-400 text-white shadow-2xl overflow-hidden">
        <div className="relative p-8 sm:p-10">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,#ffffff45,transparent_40%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/80">
                <Sparkles className="w-4 h-4" />
                Counselor Network
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
                Meet counselors without leaving your dashboard
              </h1>
              <p className="text-white/85">
                Compare expertise, book live sessions, and keep every message, edit, and receipt tied to your workspace.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                  <input
                    type="text"
                    placeholder="Search by name, focus, language…"
                    className="w-full rounded-xl border border-white/30 bg-white/15 px-10 py-2.5 text-sm placeholder:text-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 transition"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {filters.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold text-white"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full lg:max-w-md">
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/80">Live availability</p>
                <p className="text-3xl font-semibold">14</p>
                <p className="text-xs text-white/80 mt-1">Slots this week</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/80">Avg. response</p>
                <p className="text-3xl font-semibold">2h</p>
                <p className="text-xs text-white/80 mt-1">Across featured counselors</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/80">Rating</p>
                <p className="text-3xl font-semibold">4.9</p>
                <p className="text-xs text-white/80 mt-1">Student-reported</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/80">Protected</p>
                <p className="text-lg font-semibold">Payments + receipts</p>
                <p className="text-xs text-white/80 mt-1">No off-platform links</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="border border-gray-200 bg-white shadow-lg p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">
              Featured
            </p>
            <h2 className="text-2xl font-semibold text-gray-900">Counselors ready to meet</h2>
            <p className="text-sm text-gray-600">Select by specialty, language, and time to respond.</p>
          </div>
          <Link href="/dashboard/collaboration">
            <Button variant="outline" className="border-primary-200 text-primary-800 hover:bg-primary-50">
              <MessageCircle className="w-4 h-4 mr-2" />
              Invite your counselor
            </Button>
          </Link>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {counselors.map((counselor) => (
            <div
              key={counselor.name}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{counselor.name}</p>
                  <p className="text-sm text-gray-600">{counselor.headline}</p>
                  <p className="text-sm text-primary-700 mt-1">{counselor.focus}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                      <Star className="w-4 h-4 text-primary-600 fill-primary-500" />
                      {counselor.rating} ({counselor.students} students)
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-primary-800">
                      <MessageCircle className="w-4 h-4" />
                      {counselor.response}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Rate</p>
                  <p className="text-xl font-semibold text-gray-900">{counselor.rate}</p>
                  <p className="text-xs text-gray-500">{counselor.availability}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {counselor.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-primary-50 text-primary-800 text-xs font-semibold border border-primary-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                  <Video className="w-4 h-4 text-gray-500" />
                  {counselor.formats.join(' · ')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                  <Globe2 className="w-4 h-4 text-gray-500" />
                  {counselor.languages.join(' · ')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  Protected payouts
                </span>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1">Book intro</Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Message
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.title} className="p-5 border border-gray-200 bg-white">
            <p className="text-sm font-semibold text-gray-900">{step.title}</p>
            <p className="text-sm text-gray-600 mt-1">{step.copy}</p>
          </Card>
        ))}
      </div>

      <Card className="border border-gray-200 bg-gradient-to-br from-white to-slate-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">
              Ready-made packages
            </p>
            <h3 className="text-2xl font-semibold text-gray-900">Book faster with set offers</h3>
            <p className="text-sm text-gray-600">
              Each package includes receipts, notes, and follow-up tasks linked to your dashboard.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            Secure payment + refunds
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.title} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-primary-700 font-semibold">
                    Student favorite
                  </p>
                  <h4 className="text-lg font-semibold text-gray-900">{pkg.title}</h4>
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{pkg.price}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {pkg.perks.map((perk) => (
                  <span
                    key={perk}
                    className="px-3 py-1 rounded-full bg-primary-50 text-primary-800 text-xs font-semibold border border-primary-100"
                  >
                    {perk}
                  </span>
                ))}
              </div>
              <div className="flex gap-3">
                <Button className="flex-1">Book package</Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Preview
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">
              Safeguards
            </p>
            <h3 className="text-2xl font-semibold text-gray-900">Built for on-platform sessions</h3>
            <p className="text-sm text-gray-600">
              Every booking includes payments, audit trails, and shared docs in one place.
            </p>
          </div>
          <Button variant="outline" className="border-gray-200 text-gray-700">
            View receipts example
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              Protected payments
            </div>
            <p className="text-sm text-gray-600">
              Bookings stay in Forge—no Venmo or external links. Refunds flow through the same rail.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Video className="w-4 h-4 text-primary-600" />
              Built-in live + async
            </div>
            <p className="text-sm text-gray-600">
              Host video or share async edits with tracked comments and turnaround timers.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <CalendarClock className="w-4 h-4 text-primary-600" />
              Follow-up tasks
            </div>
            <p className="text-sm text-gray-600">
              Auto-create tasks and notes from each booking so you never lose the next step.
            </p>
          </div>
        </div>
      </Card>

      <Card className="border border-gray-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Already working with someone?
            </p>
            <h3 className="text-2xl font-semibold">Share your dashboard with your counselor</h3>
            <p className="text-sm text-white/80">
              Grant access with permissions, keep messages and edits in one place, and revoke anytime.
            </p>
          </div>
          <Link href="/dashboard/collaboration">
            <Button variant="secondary" className="bg-white text-slate-900 hover:bg-gray-100">
              Share workspace
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
