import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const plans = [
  {
    name: 'Starter',
    price: '$19',
    cadence: 'per month',
    highlight: 'Best for solo applicants',
    features: [
      'Up to 5 colleges',
      'AI essay coaching',
      'Task + timeline tracking',
      'Counselor sharing (view only)',
    ],
  },
  {
    name: 'Pro Counselor',
    price: '$79',
    cadence: 'per counselor / month',
    highlight: 'Manage up to 50 students',
    features: [
      'Unlimited student workspaces',
      'Real-time annotations & comments',
      'Bulk task + reminder automation',
      'White-label reports & exports',
    ],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Let’s talk',
    cadence: '',
    highlight: 'For schools & bootcamps',
    features: [
      'Custom onboarding',
      'Dedicated success manager',
      'SSO + data exports',
      'Priority roadmap access',
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="bg-gradient-to-br from-primary-50 to-white min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-primary-500">Pricing</p>
          <h1 className="text-4xl font-bold text-gray-900">
            Invest in every acceptance letter
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Admissions Forge keeps your entire application business in one place. Pick the plan
            that fits your caseload, then scale without switching tools.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border shadow-sm bg-white p-6 flex flex-col ${
                plan.featured ? 'border-primary-300 shadow-primary-100' : 'border-gray-200'
              }`}
            >
              {plan.featured && (
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-white bg-primary-600 rounded-full w-max mb-4">
                  Most popular
                </span>
              )}
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">{plan.name}</h2>
                <p className="text-sm text-gray-500">{plan.highlight}</p>
              </div>
              <div className="mt-6 flex items-baseline gap-1 text-gray-900">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.cadence && <span className="text-sm text-gray-500">{plan.cadence}</span>}
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-700 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {plan.price === 'Let’s talk' ? (
                  <Link href="/dashboard/collaboration">
                    <Button variant="outline" className="w-full">
                      Book founder chat
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signin">
                    <Button className="w-full" variant={plan.featured ? 'default' : 'outline'}>
                      {plan.featured ? 'Start free trial' : 'Get started'}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-[0.3em]">
            Investors & YC partners
          </p>
          <h3 className="text-2xl font-bold text-gray-900">Need the data room?</h3>
          <p className="text-gray-600">
            We can walk you through cohort churn, counselor retention, and revenue expansion within
            24 hours. Drop us a note and we’ll send the deck.
          </p>
          <Link href="mailto:founders@admissionsforge.com">
            <Button size="lg">Request investor updates</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
