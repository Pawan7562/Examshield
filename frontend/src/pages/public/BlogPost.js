import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import PublicLayout from '../../components/public/PublicLayout';
import SEOHead from '../../components/common/SEOHead';
import { blogArticles } from './blogData';
import { Clock, Calendar, ArrowLeft, ArrowRight, User, Share2, ShieldCheck, ChevronRight } from 'lucide-react';
import './Blog.css';

export default function BlogPost() {
  const { slug } = useParams();
  const article = blogArticles.find(a => a.slug === slug);

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const canonicalUrl = `https://exam.nexifyforge.in/blog/${article.slug}`;

  // Schema.org BlogPosting
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    headline: article.title,
    description: article.metaDesc,
    keywords: article.keywords,
    articleSection: article.category,
    datePublished: '2026-11-15T09:00:00+05:30',
    dateModified: '2026-11-20T10:00:00+05:30',
    author: {
      '@type': 'Person',
      name: article.author.name,
      jobTitle: article.author.role,
      url: 'https://exam.nexifyforge.in/about'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Nexify Examina',
      logo: {
        '@type': 'ImageObject',
        url: 'https://exam.nexifyforge.in/logo.png'
      }
    }
  };

  const related = blogArticles.filter(a => a.slug !== article.slug).slice(0, 3);

  return (
    <PublicLayout>
      <SEOHead
        title={`${article.metaTitle} | Nexify Examina`}
        description={article.metaDesc}
        keywords={article.keywords}
        canonical={canonicalUrl}
        jsonLd={jsonLd}
      />

      <div className="blog-post-container">
        {/* Breadcrumb Navigation */}
        <nav className="inst-breadcrumbs" aria-label="Breadcrumbs">
          <Link to="/">Home</Link>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <Link to="/blog">Blog</Link>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="current-crumb">{article.category}</span>
        </nav>

        <header className="post-header">
          <div className="post-cat-badge">{article.category}</div>
          <h1 className="post-title">{article.title}</h1>
          <p className="post-lead">{article.summary}</p>

          <div className="post-author-bar">
            <div className="author-info-left">
              <div className="author-avatar-fallback">
                <User size={20} color="#10b981" />
              </div>
              <div>
                <div className="author-name">{article.author.name}</div>
                <div className="author-role">{article.author.role}</div>
              </div>
            </div>

            <div className="post-meta-right">
              <span className="meta-item"><Calendar size={14} /> {article.date}</span>
              <span className="meta-item"><Clock size={14} /> {article.readTime}</span>
            </div>
          </div>
        </header>

        {/* Article Body */}
        <div className="post-content-wrap">
          <div 
            className="post-body-typography"
            dangerouslySetInnerHTML={{ __html: article.content }} 
          />
        </div>

        {/* Author Bio Box */}
        <div className="author-bio-card">
          <div className="bio-avatar">
            <User size={32} color="#10b981" />
          </div>
          <div>
            <h4>About the Author: {article.author.name}</h4>
            <p>
              {article.author.name} is the Chief Systems Architect at Nexify Forge in Mohali, Punjab. He specializes in distributed high-concurrency systems, educational assessment integrity, and cloud infrastructure optimization for Indian educational institutions.
            </p>
          </div>
        </div>

        {/* Conversion CTA Block */}
        <div className="post-cta-block">
          <ShieldCheck size={40} color="#10b981" />
          <h3>Ready to upgrade your college or school examination system?</h3>
          <p>
            Experience our 16-node high-concurrency cluster with browser lockdown, AI invigilation, and in-browser coding compiler.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/book-demo" className="btn-primary-action">
              <span>Book Institutional Demo & Proposal</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" className="btn-secondary-action">
              <span>View Pricing Plans</span>
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        <section className="related-articles-section">
          <h3>Related Examination Architecture Guides</h3>
          <div className="articles-grid">
            {related.map(r => (
              <article key={r.slug} className="article-card">
                <div className="card-top">
                  <span className="card-category">{r.category}</span>
                  <span className="card-read-time"><Clock size={12} /> {r.readTime}</span>
                </div>
                <h4 className="card-title">
                  <Link to={`/blog/${r.slug}`}>{r.title}</Link>
                </h4>
                <p className="card-summary">{r.summary}</p>
                <div className="card-footer">
                  <Link to={`/blog/${r.slug}`} className="read-more-link">
                    <span>Read Article</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="back-to-blog">
          <Link to="/blog">
            <ArrowLeft size={16} />
            <span>Back to All Articles</span>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
