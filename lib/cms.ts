export type LandingContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroBadge?: string;
  ctaPrimaryLabel?: string;
  ctaSecondaryLabel?: string;
  features?: { title: string; description: string }[];
  pricing?: {
    plans: { name: string; price: string; bullets: string[]; highlight?: boolean }[];
  };
};

export type FAQ = { question: string; answer: string };
export type Testimonial = { name: string; role: string; quote: string; avatar?: string };

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337";

export async function getLandingContent(): Promise<LandingContent | null> {
  if (!process.env.NEXT_PUBLIC_CMS_URL) return null; // Skip fetch when CMS is not configured
  try {
    const res = await fetch(`${CMS_URL}/api/landing-page?populate=deep`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data?.attributes;
    if (!data) return null;
    return {
      heroTitle: data.heroTitle,
      heroSubtitle: data.heroSubtitle,
      heroBadge: data.heroBadge,
      ctaPrimaryLabel: data.ctaPrimaryLabel,
      ctaSecondaryLabel: data.ctaSecondaryLabel,
      features: data.features,
      pricing: data.pricing,
    } as LandingContent;
  } catch (err) {
    console.warn("CMS fetch failed", err);
    return null;
  }
}

export async function getFaqs(): Promise<FAQ[] | null> {
  if (!process.env.NEXT_PUBLIC_CMS_URL) return null;
  try {
    const res = await fetch(`${CMS_URL}/api/faqs`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.map((item: any) => item.attributes) ?? null;
  } catch (err) {
    console.warn("FAQ fetch failed", err);
    return null;
  }
}

export async function getTestimonials(): Promise<Testimonial[] | null> {
  if (!process.env.NEXT_PUBLIC_CMS_URL) return null;
  try {
    const res = await fetch(`${CMS_URL}/api/testimonials`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.map((item: any) => item.attributes) ?? null;
  } catch (err) {
    console.warn("Testimonials fetch failed", err);
    return null;
  }
}
