import Link from "next/link";
import { getLandingContent, getFaqs, getTestimonials } from "../lib/cms";

export default async function LandingPage() {
  const [cms, faqs, testimonials] = await Promise.all([getLandingContent(), getFaqs(), getTestimonials()]);
  const heroTitle = cms?.heroTitle || "Accelerate Your Research with AI";
  const heroSubtitle = cms?.heroSubtitle || "Transform crawled webpages into concise academic PDFs powered by our FastAPI backend and Firecrawl.";
  const heroBadge = cms?.heroBadge || "v2.0 Living Manuscript";
  const ctaPrimary = cms?.ctaPrimaryLabel || "Start Your Thesis";
  const ctaSecondary = cms?.ctaSecondaryLabel || "Watch Demo";
  const features =
    cms?.features || [
      {
        title: "AI Summarization",
        desc: "Extract arguments and methodologies from crawled pages into academic-grade PDFs.",
      },
      {
        title: "Smart Bibliographies",
        desc: "One-click citation metadata stored alongside your documents for later export.",
      },
      {
        title: "Research Linking",
        desc: "Keep source URL lineage with every PDF so your AI chat stays grounded.",
      },
    ];
  const faqList =
    faqs || [
      { question: "How does crawling work?", answer: "We use Firecrawl to fetch the page, summarize with your LLM, and store the PDF." },
      { question: "Can I export citations?", answer: "Summaries retain source URLs so you can cite confidently." },
    ];
  const testimonialList =
    testimonials || [
      { name: "Dr. Kim", role: "Research Lead", quote: "The Living Manuscript metaphor keeps my team aligned on every paper." },
      { name: "A. Santos", role: "Graduate Researcher", quote: "Crawling + instant PDF summaries saves hours weekly." },
    ];
  const plans =
    cms?.pricing?.plans || [
      {
        name: "Individual",
        price: "$12/mo",
        bullets: ["Unlimited PDF storage", "AI Assistant (2,000 queries/mo)", "Smart Citation Manager"],
      },
      {
        name: "Research Lab",
        price: "$45/mo",
        bullets: ["Up to 10 collaborators", "Shared Living Manuscripts", "Priority AI synthesis"],
        highlight: true,
      },
    ];

  return (
    <main className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 md:px-12 py-5 shadow-sm bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-2xl bg-primary/10 grid place-items-center text-primary font-bold">SA</span>
          <div>
            <p className="text-lg font-heading font-extrabold leading-none">Scholarly Aether</p>
            <p className="text-sm text-slate">Living Manuscript</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate">
          <Link href="#features">Features</Link>
          <Link href="#pricing">Pricing</Link>
          <Link href="#cases">Case Studies</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link className="btn-secondary" href="/auth/login">Sign in</Link>
          <Link className="btn-primary" href="/auth/signup">Create Free Account</Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 md:px-12 pt-14 pb-16 bg-gradient-to-br from-white via-white to-primary/5">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,#E8F1FF,transparent_25%),radial-gradient(circle_at_80%_0%,#F0F4FF,transparent_30%)]" />
        <div className="relative grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{heroBadge}</span>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-ink leading-tight">{heroTitle}</h1>
            <p className="text-lg text-slate max-w-2xl">{heroSubtitle}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link className="btn-primary" href="/dashboard">{ctaPrimary}</Link>
              <Link className="btn-secondary" href="#demo">{ctaSecondary}</Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate">
              <div className="rounded-2xl bg-primary text-white px-4 py-3 shadow-soft-card">
                <p className="text-xs uppercase tracking-wide">Current Citations</p>
                <p className="text-2xl font-heading font-bold">128</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-soft-card border border-slate/10">
                <p className="text-xs uppercase tracking-wide text-slate">AI Agent</p>
                <p className="text-lg font-heading font-bold text-ink">Live</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[24px] bg-white shadow-soft-card border border-slate/10 p-4">
              <div className="aspect-[4/3] rounded-[20px] bg-gradient-to-br from-primary/10 via-white to-primary/5 grid place-items-center">
                <p className="text-center text-slate max-w-sm">Plug in your FastAPI endpoint, drop a URL, and receive a Strapi-ready PDF summary with citations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-6 md:px-12 py-16 bg-white">
        <div className="max-w-5xl mx-auto space-y-10">
          <div>
            <p className="text-sm font-semibold text-primary">The Future of Scholarly Intuition</p>
            <h2 className="text-3xl font-heading font-extrabold text-ink mt-2">Built for AI-first research teams.</h2>
            <p className="text-slate mt-3 max-w-3xl">Web crawl → summarize → PDF → ask. Backed by Firecrawl, LLM summarization, and Redis/RQ jobs so your dashboard stays responsive.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature: any) => (
              <div key={feature.title} className="rounded-2xl bg-white shadow-soft-card border border-slate/10 p-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary font-bold">•</div>
                <h3 className="text-xl font-heading font-bold text-ink">{feature.title}</h3>
                <p className="text-slate text-sm leading-relaxed">{feature.desc || feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-6 md:px-12 py-16 bg-surface">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-primary">Academic Plans</p>
            <h2 className="text-3xl font-heading font-extrabold text-ink">Designed for individuals and labs.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl shadow-soft-card p-8 space-y-4 border border-slate/10 ${plan.highlight ? "bg-ink text-white" : "bg-white"}`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${plan.highlight ? "text-white/80" : "text-slate"}`}>{plan.name}</p>
                  {plan.highlight && <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full">Popular</span>}
                </div>
                <p className="text-4xl font-heading font-bold">{plan.price}</p>
                <ul className={`space-y-2 text-sm ${plan.highlight ? "text-white/80" : "text-slate"}`}>
                  {plan.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <Link className={plan.highlight ? "btn-primary" : "btn-secondary"} href="/auth/signup">
                  {plan.highlight ? "Start Lab Trial" : "Get Started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-16 bg-white" id="cases">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-primary">What teams say</p>
            <h2 className="text-3xl font-heading font-extrabold text-ink">Testimonials</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonialList.map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate/10 shadow-soft-card p-6 bg-surface">
                <p className="text-lg text-ink font-semibold">“{t.quote}”</p>
                <p className="mt-3 text-sm text-slate">{t.name} · {t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-16 bg-surface" id="faq">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary">FAQs</p>
            <h2 className="text-3xl font-heading font-extrabold text-ink">Questions from researchers</h2>
          </div>
          <div className="space-y-3">
            {faqList.map((f) => (
              <details key={f.question} className="rounded-2xl bg-white border border-slate/10 shadow-soft-card p-4">
                <summary className="cursor-pointer text-ink font-semibold">{f.question}</summary>
                <p className="mt-2 text-slate text-sm leading-relaxed">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
