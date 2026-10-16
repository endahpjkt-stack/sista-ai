export function pageHead(title: string, description: string) {
  return { meta: [
    { title: `${title} — SISTA AI` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — SISTA AI` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] };
}