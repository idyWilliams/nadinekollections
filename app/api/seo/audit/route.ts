import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import * as cheerio from "cheerio";

interface SEOCheck {
  task: string;
  done: boolean;
  details?: string;
}

interface SEOAuditResult {
  score: number;
  checks: SEOCheck[];
  stats: {
    totalPages: number;
    pagesWithIssues: number;
    missingMetaTags: number;
    missingAltTexts: number;
  };
}

export async function GET() {
  try {
    const baseUrl = config.site.url;
    const checks: SEOCheck[] = [];
    let score = 100;

    // 1. Check Sitemap
    try {
      const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
      checks.push({
        task: "Sitemap.xml generated",
        done: sitemapRes.ok,
        details: sitemapRes.ok ? "Sitemap found" : "Sitemap not found",
      });
      if (!sitemapRes.ok) score -= 20;
    } catch {
      checks.push({ task: "Sitemap.xml generated", done: false, details: "Error checking sitemap" });
      score -= 20;
    }

    // 2. Check Robots.txt
    try {
      const robotsRes = await fetch(`${baseUrl}/robots.txt`);
      checks.push({
        task: "Robots.txt configured",
        done: robotsRes.ok,
        details: robotsRes.ok ? "Robots.txt found" : "Robots.txt not found",
      });
      if (!robotsRes.ok) score -= 15;
    } catch {
      checks.push({ task: "Robots.txt configured", done: false, details: "Error checking robots.txt" });
      score -= 15;
    }

    // 3. Check Meta Tags on Homepage
    try {
      const homeRes = await fetch(baseUrl);
      const html = await homeRes.text();
      const $ = cheerio.load(html);

      const hasTitle = $("title").length > 0;
      const hasDescription = $('meta[name="description"]').length > 0;
      const hasOgTags = $('meta[property^="og:"]').length > 0;

      const metaOptimized = hasTitle && hasDescription && hasOgTags;
      checks.push({
        task: "Meta tags optimized",
        done: metaOptimized,
        details: `Title: ${hasTitle}, Description: ${hasDescription}, OG Tags: ${hasOgTags}`,
      });
      if (!metaOptimized) score -= 20;

      // 4. Check Alt Text on Images
      const images = $("img");
      const imagesWithoutAlt = images.filter((_: any, el: any) => !$(el).attr("alt")).length;
      const altTextOptimized = imagesWithoutAlt === 0;
      checks.push({
        task: "Alt text on images",
        done: altTextOptimized,
        details: `${imagesWithoutAlt} images missing alt text out of ${images.length}`,
      });
      if (!altTextOptimized) score -= 15;
    } catch {
      checks.push({ task: "Meta tags optimized", done: false, details: "Error checking meta tags" });
      checks.push({ task: "Alt text on images", done: false, details: "Error checking images" });
      score -= 35;
    }

    // 5. Check for Broken Links (sample check on homepage)
    try {
      const homeRes = await fetch(baseUrl);
      const html = await homeRes.text();
      const $ = cheerio.load(html);
      const links = $("a[href]");

      // Check first 10 internal links
      let brokenLinks = 0;
      const linksToCheck = links.slice(0, 10);

      for (let i = 0; i < linksToCheck.length; i++) {
        const href = $(linksToCheck[i]).attr("href");
        if (href && href.startsWith("/")) {
          try {
            const linkRes = await fetch(`${baseUrl}${href}`, { method: "HEAD" });
            if (!linkRes.ok) brokenLinks++;
          } catch {
            brokenLinks++;
          }
        }
      }

      const noBrokenLinks = brokenLinks === 0;
      checks.push({
        task: "Broken links check",
        done: noBrokenLinks,
        details: `${brokenLinks} broken links found (sample of 10 checked)`,
      });
      if (!noBrokenLinks) score -= 30;
    } catch {
      checks.push({ task: "Broken links check", done: false, details: "Error checking links" });
      score -= 30;
    }

    const result: SEOAuditResult = {
      score: Math.max(0, score),
      checks,
      stats: {
        totalPages: 1,
        pagesWithIssues: checks.filter((c) => !c.done).length,
        missingMetaTags: checks.find((c) => c.task === "Meta tags optimized")?.done ? 0 : 1,
        missingAltTexts: parseInt(
          checks.find((c) => c.task === "Alt text on images")?.details?.split(" ")[0] || "0"
        ),
      },
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error running SEO audit:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
