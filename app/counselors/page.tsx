import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  CalendarClock,
  MessageCircle,
  ShieldCheck,
  Star,
  Video,
  Sparkles,
} from 'lucide-react';

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
];

const packages = [
  {
    title: 'Launch your storefront',
    price: 'Free to list',
    description: 'Create packages, set your rates, and start taking bookings in minutes.',
    perks: ['Unlimited services', 'Weekly payouts', 'Safe student messaging'],
    audience: 'Counselors',
  },
  {
    title: 'Essay Sprint',
    price: '$180 / 2 live sessions',
    description: 'Outline to polished draft with inline edits and a rewrite plan.',
    perks: ['Live video + shared doc', 'Line-by-line edits', '48-hour turnaround'],
    audience: 'Students',
  },
  {
    title: 'Interview Coaching',
    price: '$90 / 1 live session',
    description: 'Mock interviews with recorded feedback and next-step drills.',
    perks: ['Recording + notes', 'School-specific prompts', 'Follow-up checklist'],
    audience: 'Students',
  },
];

const steps = [
  {
    title: 'List services',
    copy: 'Counselors build offers (hourly, bundles, or async reviews) and publish them for free.',
  },
  {
    title: 'Match instantly',
    copy: 'Students filter by specialty, language, and availability to find the right counselor.',
  },
  {
    title: 'Meet online',
    copy: 'Host video sessions, share docs, and send threaded messages without leaving Forge.',
  },
];

export default async function CounselorMarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-primary-700">
              Counselor Marketplace
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 leading-tight">
              Sell your counseling hours. Students can book you in a click.
            </h1>
            <p className="text-lg text-gray-700">
              Publish services for free, set your rates, and meet students online with built-in
              video, messaging, and payments.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="#counselors">
                <Button size="lg">Browse counselors</Button>
              </Link>
              <Link href="#list">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-200 text-primary-800 hover:bg-primary-50"
                >
                  List my services
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'No listing fees', value: 'Keep 100%' },
                { label: 'Built-in video', value: 'No extra tools' },
                { label: 'Safe payouts', value: 'Weekly deposits' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-primary-100 bg-white shadow-sm px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-wide text-primary-700 font-semibold">
                    {item.label}
                  </p>
                  <p className="text-sm text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-primary-100 shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">Live session</p>
                <p className="text-lg font-semibold text-gray-900">Student ↔ Counselor</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-700">
                <Video className="w-4 h-4" />
                Video + Notes
              </div>
            </div>
            <div className="rounded-2xl bg-primary-50 border border-primary-100 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-white text-primary-700 flex items-center justify-center font-semibold">
                  LC
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Lauren Chen</p>
                  <p className="text-xs text-gray-600">STEM essays · Stanford reader</p>
                </div>
                <div className="flex items-center gap-1 text-primary-700 text-sm">
                  <Star className="w-4 h-4 fill-primary-500 text-primary-500" />
                  4.9
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-primary-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Today&apos;s focus</p>
                  <p className="text-sm font-semibold text-gray-900">Supplement outline review</p>
                  <p className="text-xs text-gray-500">Shared doc + live markup</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-semibold text-gray-900">45 min</p>
                  <p className="text-xs text-gray-500">Blocked 4:30pm</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <ShieldCheck className="w-4 h-4 text-primary-600" />
                Protected payments and audit log for every session.
              </div>
              <div className="flex gap-3">
                <Button className="flex-1">Start session</Button>
                <Button variant="ghost" className="flex-1 text-gray-700 hover:bg-white">
                  Share agenda
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 p-4 space-y-3 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CalendarClock className="w-4 h-4 text-primary-600" />
                Next availability: Today, 4:30pm · 6:00pm · 7:30pm
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MessageCircle className="w-4 h-4 text-primary-600" />
                Threaded chat, shared docs, and voice notes included.
              </div>
            </div>
          </div>
        </section>

        <section id="counselors" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-primary-700">Featured</p>
              <h2 className="text-3xl font-semibold text-gray-900">Counselors ready to meet</h2>
              <p className="text-gray-600">Filter by focus area, language, and availability.</p>
            </div>
            <Link href="#list">
              <Button variant="outline" className="border-primary-200 text-primary-800 hover:bg-primary-50">
                List my services
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {counselors.map((counselor) => (
              <div
                key={counselor.name}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-gray-900">{counselor.name}</p>
                    <p className="text-sm text-gray-600">{counselor.headline}</p>
                    <p className="text-sm text-primary-700 mt-1">{counselor.focus}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Rate</p>
                    <p className="text-lg font-semibold text-gray-900">{counselor.rate}</p>
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
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary-600 fill-primary-500" />
                    {counselor.rating} rating ({counselor.students} students)
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-primary-600" />
                    {counselor.response}
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary-600" />
                    {counselor.formats.join(' · ')}
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary-600" />
                    {counselor.languages.join(' · ')}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button className="flex-1">Book consultation</Button>
                  <Button variant="ghost" className="flex-1 text-gray-700 hover:bg-gray-50">
                    Message counselor
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="list" className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
          <div className="bg-gray-900 text-white rounded-3xl p-8 space-y-5 shadow-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-primary-200">For Counselors</p>
            <h3 className="text-3xl font-semibold">List your services for free</h3>
            <p className="text-gray-200">
              Create your storefront, connect payment info, and start accepting student bookings. No
              platform fee to list—only pay when you get paid.
            </p>
            <div className="space-y-3">
              {[
                'Set hourly or package rates, with student-friendly bundles',
                'Offer live video sessions, office hours, or async essay reviews',
                'Keep conversations in one place with threaded chat and shared docs',
                'Export receipts and session notes for your own records',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-100">
                  <Sparkles className="w-4 h-4 text-primary-300 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href="/auth/signin">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                  List my services
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                  See counselor plans
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-primary-700">
              Ready-made packages
            </p>
            <div className="grid gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.title}
                  className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-primary-700 font-semibold">
                        {pkg.audience}
                      </p>
                      <h4 className="text-xl font-semibold text-gray-900">{pkg.title}</h4>
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
                    <Button className="flex-1">Use this template</Button>
                    <Button variant="ghost" className="flex-1 text-gray-700 hover:bg-gray-50">
                      Preview booking
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-3xl p-8 space-y-8 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-primary-700">How it works</p>
              <h3 className="text-3xl font-semibold text-gray-900">
                One platform for both counselors and students
              </h3>
              <p className="text-gray-600">
                Publish, book, and meet without juggling video links or payments elsewhere.
              </p>
            </div>
            <Link href="/auth/signin">
              <Button variant="outline" className="border-primary-200 text-primary-800 hover:bg-primary-50">
                Get started free
              </Button>
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-gray-200 p-6 bg-gray-50 space-y-3"
              >
                <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-700">{step.copy}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
