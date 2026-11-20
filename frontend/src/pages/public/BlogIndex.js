import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/public/PublicLayout';
import SEOHead from '../../components/common/SEOHead';
import { blogArticles } from './blogData';
import { BookOpen, Clock, Calendar, ArrowRight, User, Search, Sparkles, ShieldCheck } from 'lucide-react';
import './Blog.css';

export default function BlogIndex() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Higher Education', 'Exam Security & AI', 'Coding Assessments', 'Scalability & Infrastructure', 'K-12 Schools'];

  const filteredArticles = blogArticles.filter(art => {
    const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featured = blogArticles[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Nexify Examina Knowledge Hub & Examination Guides',
    url: 'https://exam.nexifyforge.in/blog',
    description: 'Expert guides on online examinations, AI proctoring, coding test evaluation, and institutional scalability in India.',
    publisher: {
      '@type': 'Organization',
      name: 'Nexify Examina by Nexify Forge',
      logo: 'https://exam.nexifyforge.in/logo.png'
    }
  };

  return (
    <PublicLayout>
      <SEOHead
        title="Online Examination & AI Proctoring Blog | Nexify Examina"
        description="Expert insights, technical architecture guides, and institutional best practices for conducting online exams, coding assessments, and AI invigilation in India."
        keywords="online exam blog, AI proctoring guide India, college exam software articles, coding assessment guide, computer based test tips"
        canonical="https://exam.nexifyforge.in/blog"
        jsonLd={jsonLd}
      />

      <div className="blog-container">
        {/* Header */}
        <header className="blog-header">
          <div className="blog-eyebrow">
            <BookOpen size={14} />
            <span>Academic Examination Architecture & Best Practices</span>
          </div>
          <h1 className="blog-main-title">
            The Nexify Examina Knowledge Hub
          </h1>
          <p className="blog-main-subtitle">
            Authoritative research, technical architecture blueprints, and regulatory guides for Indian university deans, examination controllers, and educators.
          </p>

          {/* Search & Filter Bar */}
          <div className="blog-controls">
            <div className="blog-search-box">
              <Search size={18} color="#64748b" />
              <input
                type="text"
                placeholder="Search articles on AI proctoring, coding exams, scalability..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="blog-categories-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Featured Post (only when 'All' selected and no search) */}
        {selectedCategory === 'All' && !searchQuery && (
          <section className="featured-post-card">
            <div className="featured-badge">
              <Sparkles size={14} /> Featured Architecture Guide
            </div>
            <span className="featured-cat">{featured.category}</span>
            <h2>
              <Link to={`/blog/${featured.slug}`}>{featured.title}</Link>
            </h2>
            <p>{featured.summary}</p>
            <div className="article-meta">
              <span className="meta-item"><User size={14} /> {featured.author.name}</span>
              <span className="meta-item"><Calendar size={14} /> {featured.date}</span>
              <span className="meta-item"><Clock size={14} /> {featured.readTime}</span>
            </div>
            <Link to={`/blog/${featured.slug}`} className="read-more-btn">
              <span>Read Full Guide</span>
              <ArrowRight size={16} />
            </Link>
          </section>
        )}

        {/* Articles Grid */}
        <section className="articles-grid">
          {filteredArticles.map(art => (
            <article key={art.slug} className="article-card">
              <div className="card-top">
                <span className="card-category">{art.category}</span>
                <span className="card-read-time"><Clock size={12} /> {art.readTime}</span>
              </div>
              <h3 className="card-title">
                <Link to={`/blog/${art.slug}`}>{art.title}</Link>
              </h3>
              <p className="card-summary">{art.summary}</p>
              <div className="card-footer">
                <div className="card-author">
                  <User size={14} color="#10b981" />
                  <span>{art.author.name}</span>
                </div>
                <Link to={`/blog/${art.slug}`} className="card-arrow-link" aria-label={`Read ${art.title}`}>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </section>

        {filteredArticles.length === 0 && (
          <div className="no-articles-found">
            <p>No articles found matching "{searchQuery}". Try a different keyword or category.</p>
          </div>
        )}

        {/* Bottom Banner */}
        <section className="blog-cta-banner">
          <ShieldCheck size={36} color="#10b981" />
          <h3>Ready to upgrade your institution's examination security?</h3>
          <p>Schedule a live walkthrough with customized questions and start a 14-day faculty trial.</p>
          <Link to="/book-demo" className="btn-primary-action">
            <span>Book Institutional Demo & Proposal</span>
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </PublicLayout>
  );
}
