import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://dsafara.com";
  const routes = [
    { path: "", priority: 1 },
    { path: "courses", priority: 0.9 },
    { path: "paths", priority: 0.9 },
    { path: "mentors", priority: 0.8 },
    { path: "services", priority: 0.8 },
    { path: "blog", priority: 0.8 },
    { path: "resources", priority: 0.7 },
    { path: "testimonials", priority: 0.6 },
    { path: "faq", priority: 0.6 },
    { path: "about", priority: 0.6 },
    { path: "contact", priority: 0.6 },
    { path: "privacy", priority: 0.3 },
    { path: "terms", priority: 0.3 },
  ];
  return routes.map((r) => ({
    url: `${base}/${r.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: r.priority,
  }));
}
