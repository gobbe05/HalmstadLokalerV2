import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://halmstadlokaler.se";

  // 1. Static routes
  const staticRoutes = [
    "",
    "/lokaler",
    "/hitta-lokal",
    "/lagg-in-annons",
    "/om-oss",
    "/lokalexperten",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  // 2. Dynamic properties
  const properties = await fetch(`${baseUrl}/api/properties`).then((res) =>
    res.json()
  );

  const propertyRoutes = properties.map((p: any) => ({
    url: `${baseUrl}/lokal/${p.slug}`,
    lastModified: new Date(p.updatedAt || p.createdAt),
  }));

  // 3. Dynamic cities
  const cities = await fetch(`${baseUrl}/api/cities`).then((res) =>
    res.json()
  );

  const cityRoutes = cities.map((c: any) => ({
    url: `${baseUrl}/stad/${c.slug}`,
    lastModified: new Date(c.updatedAt || c.createdAt),
  }));

  return [...staticRoutes, ...propertyRoutes, ...cityRoutes];
}
