import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { MessageCircle, CalendarClock, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { authOptions } from '@/lib/auth';

type StudentLead = {
  name: string;
  grade: string;
  focus: string;
  budget: string;
  availability: string;
  response: string;
  tags: string[];
  timeline: string;
  readiness: string;
};

const studentLeads: StudentLead[] = [
  {
    name: 'Amina Patel',
    grade: '12th grade · Bay Area',
    focus: 'Essay sprint + Stanford/UC strategy',
    budget: '$110/hr budget',
    availability: 'Evenings PST · wants intro this week',
    response: 'Ready for live consult',
    tags: ['STEM', 'First-gen', 'UC + Stanford', 'Essay reviews'],
    timeline: 'EA + UC 11/30',
    readiness: 'Essay drafts started, needs structure',
  },
  {
    name: 'Liam Chen',
    grade: '11th grade · New York',
    focus: 'Activity list + summer planning',
    budget: '$85/hr budget',
    availability: 'Weekends ET · flexible',
    response: 'Replies within a day',
    tags: ['Pre-med', 'Research', 'Scholarships'],
    timeline: 'Building list for Fall visits',
    readiness: 'No essays yet, wants roadmap',
  },
  {
    name: 'Sofia Alvarez',
    grade: '12th grade · Texas',
    focus: 'Common App personal statement polish',
    budget: '$95/hr budget',
    availability: 'Afternoons CT · prefers async',
    response: 'Looking for line edits',
    tags: ['Bilingual', 'FAFSA guidance', 'Essay polish'],
    timeline: 'Regular decision + merit aid',
    readiness: 'Draft complete, needs feedback',
  },
];

const steps = [
  {
    title: 'Share your storefront',
    copy: 'List packages or hourly consults that students can book directly from your dashboard.',
  },
  {
    title: 'Filter the right fit',
    copy: 'See student goals, budget, and preferred meeting style before you accept.',
  },
  {
    title: 'Meet inside Forge',
    copy: 'Host video, share docs, and keep messages in one place with audit trails.',
  },
];

const storefrontChecklist = [
  { title: 'Set your headline', detail: 'What you specialize in and who you serve', done: true },
  { title: 'Add 2–3 packages', detail: 'Mix live consults + async edits with clear outcomes', done: false },
  { title: 'Turn on availability', detail: 'Sync calendar or set manual live slots', done: false },
  { title: 'Enable payouts', detail: 'Stripe-powered payouts deposited weekly', done: true },
];

const templates = [
  {
    title: 'Essay Sprint',
    price: '$180 / 2 live + async',
    notes: 'Outline to polished draft with line edits and a rewrite plan.',
  },
  {
    title: 'Application Power Hour',
    price: '$120 / 60m',
    notes: 'Triage deadlines, pick prompts, and leave with a 7-day action plan.',
  },
  {
    title: 'Scholarship Review Pack',
    price: '$250 / 3 async returns',
    notes: 'Target local + national awards with tailored edits and budgets.',
  },
];

const operations = [
  { title: 'Booking rules', copy: 'Approval required or auto-accept, with buffer windows and caps.' },
  { title: 'Session modes', copy: 'Live video, office hours, or async marked-up docs with timers.' },
  { title: 'Messaging', copy: 'Threaded chat per student with audit trails and file controls.' },
  { title: 'Receipts + notes', copy: 'Auto-generate receipts and post-session summaries for every booking.' },
];

export default async function CounselorConnectPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const role = session.user.role || 'student';
  if (!['counselor', 'parent'].includes(role)) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="rounded-3xl border border-primary-100 bg-gradient-to-r from-slate-900 via-primary-700 to-primary-500 text-white shadow-2xl overflow-hidden">
        <div className="relative p-8 sm:p-10">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,#ffffff30,transparent_42%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
                <Sparkles className="w-4 h-4" />
                New student requests
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold">Connect with students inside the dashboard</h1>
              <p className="text-white/80">
                Review who&apos;s looking for help, compare fit, and start messaging without leaving Forge.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/collaboration">
                  <Button variant="secondary" className="bg-white text-primary-700 hover:bg-white shadow-sm">
                    Share booking link
                  </Button>
                </Link>
                <Button variant="ghost" className="text-white border border-white/30 hover:bg-white/10">
                  Set availability
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full lg:max-w-md">
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/70">Active requests</p>
                <p className="text-3xl font-semibold">3</p>
                <p className="text-xs text-white/70">Ready for intros</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/70">Avg. budget</p>
                <p className="text-3xl font-semibold">$97/hr</p>
                <p className="text-xs text-white/70">Across these leads</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/70">Preferred mode</p>
                <p className="text-lg font-semibold">Live + async</p>
                <p className="text-xs text-white/70">Blend of sessions</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/70">Response time</p>
                <p className="text-lg font-semibold">Same-day expected</p>
                <p className="text-xs text-white/70">Keep accepts high</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">
              Student pipeline
            </p>
            <h2 className="text-2xl font-semibold text-gray-900">Students looking to connect</h2>
            <p className="text-sm text-gray-600">Skim goals, budgets, and timelines before you accept.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarClock className="w-4 h-4 text-primary-600" />
            Updated just now
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {studentLeads.map((lead) => (
            <Card key={lead.name} className="p-5 space-y-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{lead.name}</p>
                  <p className="text-sm text-gray-600">{lead.grade}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-primary-800">
                      <Sparkles className="w-4 h-4" />
                      {lead.focus}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      {lead.timeline}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-lg font-semibold text-gray-900">{lead.budget}</p>
                  <p className="text-xs text-gray-500">{lead.availability}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">{lead.readiness}</p>
              <div className="flex flex-wrap gap-2">
                {lead.tags.map((tag) => (
                  <span
                    key={`${lead.name}-${tag}`}
                    className="px-3 py-1 rounded-full bg-primary-50 text-primary-800 text-xs font-semibold border border-primary-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  <MessageCircle className="w-4 h-4" />
                  {lead.response}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                  <CalendarClock className="w-4 h-4 text-gray-500" />
                  Prefers {lead.availability.split('·')[0]?.trim()}
                </span>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1">Send intro</Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  View request
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border border-gray-200 bg-white shadow-md">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">
              Your storefront
            </p>
            <h3 className="text-xl font-semibold text-gray-900">Make it easy for students to pick you</h3>
            <p className="text-sm text-gray-600">
              Finish the setup checklist so students can see your headline, packages, and available time before they request you.
            </p>
            <div className="space-y-3">
              {storefrontChecklist.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-2"
                >
                  <div
                    className={`mt-1 h-3 w-3 rounded-full ${
                      item.done ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-primary-50 to-white p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Fast setup templates</p>
            <p className="text-sm text-gray-600">
              Import a structure, tweak pricing, and publish with one click.
            </p>
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.title}
                  className="rounded-xl border border-gray-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{template.title}</p>
                      <p className="text-sm text-gray-600">{template.notes}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{template.price}</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full border-gray-200">
                    Use this template
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="border border-gray-200 bg-gradient-to-br from-white to-slate-50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">
              Operate inside Forge
            </p>
            <h3 className="text-xl font-semibold text-gray-900">Control how students book and meet you</h3>
            <p className="text-sm text-gray-600">
              Configure booking rules, session types, and follow-ups without extra tools.
            </p>
          </div>
          <Button variant="outline" className="border-gray-200 text-gray-700">
            Open settings
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {operations.map((item) => (
            <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-600">{item.copy}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border border-gray-200 bg-gradient-to-br from-white to-slate-50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">
              How it works
            </p>
            <h3 className="text-xl font-semibold text-gray-900">Keep discovery and delivery together</h3>
            <p className="text-sm text-gray-600">
              Accept requests, meet live, and send follow-ups without switching tools.
            </p>
          </div>
          <Link href="/dashboard/collaboration" className="inline-flex items-center gap-2 text-primary-700 text-sm font-semibold hover:text-primary-800">
            Manage sharing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900">{step.title}</p>
              <p className="text-sm text-gray-600">{step.copy}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
