import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = import.meta.env.VITE_SITE_URL || "";

interface SEOConfig {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
  twitterCard?: "summary" | "summary_large_image";
  jsonLd?: Record<string, unknown>;
}

function setMetaTag(property: string, content: string, attr: "name" | "property" = "property") {
  let element = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function setJsonLd(data: Record<string, unknown>) {
  const existing = document.querySelector('script[data-seo-jsonld]');
  if (existing) existing.remove();

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-seo-jsonld", "true");
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function useSEO(config: SEOConfig) {
  const location = useLocation();

  useEffect(() => {
    const fullUrl = SITE_URL ? `${SITE_URL}${location.pathname}` : location.pathname;
    const ogImageUrl = config.ogImage || `${SITE_URL}/og-image.svg`;

    document.title = config.title;

    if (config.description) {
      setMetaTag("description", config.description, "name");
    }

    // Open Graph
    setMetaTag("og:title", config.ogTitle || config.title);
    setMetaTag("og:url", config.ogUrl || fullUrl);
    setMetaTag("og:image", ogImageUrl);
    if (config.description || config.ogDescription) {
      setMetaTag("og:description", config.ogDescription || config.description || "");
    }

    // Twitter Card
    setMetaTag("twitter:card", config.twitterCard || "summary_large_image", "name");
    setMetaTag("twitter:title", config.ogTitle || config.title, "name");
    setMetaTag("twitter:image", ogImageUrl, "name");
    if (config.description || config.ogDescription) {
      setMetaTag("twitter:description", config.ogDescription || config.description || "", "name");
    }

    // Canonical URL
    setCanonical(config.canonical || fullUrl);

    // JSON-LD
    if (config.jsonLd) {
      setJsonLd(config.jsonLd);
    }

    return () => {
      const existing = document.querySelector('script[data-seo-jsonld]');
      if (existing) existing.remove();
    };
  }, [
    config.title, config.description, config.ogTitle, config.ogDescription,
    config.ogImage, config.ogUrl, config.canonical, config.twitterCard,
    config.jsonLd, location.pathname,
  ]);
}
