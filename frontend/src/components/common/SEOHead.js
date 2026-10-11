import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Lightweight dynamic SEO Head manager for React SPA
 * Updates document.title, meta descriptions, canonical URLs, and robots directives per route
 */
export default function SEOHead({
  title,
  description,
  canonical,
  noIndex = false,
  jsonLd = null,
}) {
  const location = useLocation();

  useEffect(() => {
    // 1. Update Title
    const siteBrand = 'Nexify Examina | Nexify Forge';
    if (title) {
      document.title = title.includes('Nexify Examina') || title.includes('Nexify Forge') || title.includes('ExamShield')
        ? title
        : `${title} | ${siteBrand}`;
    }

    // 2. Update Meta Description
    if (description) {
      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.setAttribute('name', 'description');
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute('content', description);
    }

    // 3. Update Robots (Allow indexing on public pages, block indexing on private admin/student pages)
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }

    const isPrivate = noIndex ||
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/student') ||
      location.pathname.startsWith('/super-admin') ||
      location.pathname.startsWith('/login') ||
      location.pathname.startsWith('/register') ||
      location.pathname.includes('/exam/') ||
      location.pathname.includes('reset-password') ||
      location.pathname.includes('password-reset');

    if (isPrivate) {
      robotsMeta.setAttribute('content', 'noindex, nofollow, noarchive');
    } else {
      robotsMeta.setAttribute('content', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }

    // 4. Update Canonical Link
    const targetCanonical = canonical || `https://exam.nexifyforge.in${location.pathname === '/' ? '' : location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', targetCanonical);

    // 5. Inject Structured Data JSON-LD if provided
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
  }, [title, description, canonical, noIndex, jsonLd, location.pathname]);

  return null;
}
