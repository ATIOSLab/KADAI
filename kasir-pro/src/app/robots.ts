import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register", "/icon.svg", "/manifest.json", "/llms.txt"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/pos/",
          "/inventory/",
          "/kds/",
          "/finance/",
          "/products/",
          "/tables/",
          "/customers/",
          "/suppliers/",
          "/reports/",
          "/settings/",
          "/profile/",
          "/activity-log/",
          "/order/",
        ],
      },
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "Applebot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
        ],
        allow: ["/", "/login", "/register", "/sitemap.xml", "/llms.txt"],
      },
    ],
    sitemap: "https://kadai.asia/sitemap.xml",
  };
}
