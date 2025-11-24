import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,81,219,0.35),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.08),_transparent_35%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 space-y-24">
          <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.5em] text-primary-200">Admissions Forge</p>
              <h1 className="text-5xl md:text-6xl font-semibold leading-tight">
                The operating system for applying to college
              </h1>
              <p className="text-lg text-gray-200">
                Combine every deadline, essay draft, counselor comment, and reminder into one workflow.
                Built for ambitious students, trusted by professional counselors.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/signin">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                    Start my dashboard
                  </Button>
                </Link>
                <Link href="/counselors">
                  <Button size="lg">Meet counselors</Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    See plans
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-300">
                <div>
                  <p className="font-semibold text-white">2,400+</p>
                  <p>application tasks completed</p>
                </div>
                <div>
                  <p className="font-semibold text-white">18 days</p>
                  <p>average faster submission</p>
                </div>
                <div>
                  <p className="font-semibold text-white">98%</p>
                  <p>counselor retention</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
              <p className="text-xs uppercase text-gray-400 tracking-[0.3em] mb-4">Live preview</p>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-sm text-gray-300">Next deadline</p>
                  <h3 className="text-lg font-semibold text-white">Stanford — Jan 5</h3>
                  <p className="text-sm text-gray-400">Supplement essay due in 9 days</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Essay progress</span>
                    <span>3 / 7 drafts</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-primary-300 w-1/2 rounded-full" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Counselors comment inline and students ship every draft on time.
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 space-y-3">
                  <p className="text-sm text-gray-300">Today’s focus</p>
                  <div className="bg-black/40 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold text-sm">Finalize Common App activities</p>
                      <p className="text-xs text-gray-400">Shared with Ms. Patel (counselor)</p>
                    </div>
                    <div className="text-xs text-green-300">Due 6pm</div>
                  </div>
                  <div className="bg-black/40 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold text-sm">Upload Stanford supplement</p>
                      <p className="text-xs text-gray-400">Essay review scheduled</p>
                    </div>
                    <div className="text-xs text-amber-300">Due tomorrow</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Command your process',
                copy: 'Every requirement, recommender, score, and due date in one place. No more duct-taped spreadsheets.',
              },
              {
                title: 'Delight counselors',
                copy: 'Secure collaboration links with inline comments, permissions, and student context that travel everywhere.',
              },
              {
                title: 'AI that feels like a co-founder',
                copy: 'Use Admissions Forge AI to critique drafts, coach rewrites, and spin up polished outlines instantly.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg space-y-3"
              >
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-300">{item.copy}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
