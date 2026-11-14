import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Enterprise dynamic SEO Head manager for React SPA
 * Dynamically synchronizes document.title, meta descriptions, canonical URLs,
 * Open Graph, Twitter Cards, robots directives, and JSON-LD structured data.
 */
export default function SEOHead({
  title,
  description,
  keywords,
  canonical,
  noIndex = false,
  jsonLd = null,
  ogImage = 'https://exam.nexifyforge.in/logo.png',
  ogType = 'website',
}) {
  const location = useLocation();

  useEffect(() => {
    const siteBrand = 'Nexify Examina';
    const baseDomain = 'https://exam.nexifyforge.in';

    // 1. Update Title
    let fullTitle = title;
    if (title) {
      fullTitle = title.includes(siteBrand)
        ? title
        : `${title} | ${siteBrand}`;
      document.title = fullTitle;
    }

    // Helper to safely set meta tag content
    const setMetaTag = (attributeName, attributeValue, contentValue) => {
      if (!contentValue) return;
      let el = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attributeName, attributeValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentValue);
    };

    // 2. Meta Description & Keywords
    if (description) {
      setMetaTag('name', 'description', description);
    }
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // 3. Robots Directives
    const isPrivate = noIndex ||
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/student') ||
      location.pathname.startsWith('/super-admin') ||
      location.pathname.startsWith('/login') ||
      location.pathname.startsWith('/register') ||
      location.pathname.includes('/exam/') ||
      location.pathname.includes('reset-password') ||
      location.pathname.includes('password-reset');

    setMetaTag(
      'name',
      'robots',
      isPrivate
        ? 'noindex, nofollow, noarchive'
        : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    );

    // 4. Canonical URL
    const targetCanonical = canonical || `${baseDomain}${location.pathname === '/' ? '' : location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', targetCanonical);

    // 5. Open Graph Meta Tags
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', targetCanonical);
    setMetaTag('property', 'og:title', fullTitle || 'Nexify Examina — Enterprise AI Exam Proctoring Platform');
    setMetaTag('property', 'og:description', description || 'Secure every assessment with continuous biometric verification and live invigilation.');
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:site_name', siteBrand);

    // 6. Twitter Card Meta Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:url', targetCanonical);
    setMetaTag('name', 'twitter:title', fullTitle || 'Nexify Examina — Enterprise AI Exam Proctoring Platform');
    setMetaTag('name', 'twitter:description', description || 'Secure every assessment with continuous biometric verification and live invigilation.');
    setMetaTag('name', 'twitter:image', ogImage);

    // 7. Inject Structured Data JSON-LD
    let scriptTag = document.getElementById('dynamic-jsonld');
    if (jsonLd) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'dynamic-jsonld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.text = JSON.stringify(jsonLd);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, keywords, canonical, noIndex, jsonLd, ogImage, ogType, location.pathname]);

  return null;
}
