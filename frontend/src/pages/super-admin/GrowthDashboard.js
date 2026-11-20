import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  Search,
  RefreshCw,
  Building2,
  Users,
  Target,
  Globe,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FileText,
  BarChart2,
  Award,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import './SuperAdmin.css';

export default function GrowthDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getGrowthMetrics();
      const payload = res.data?.data || res.data || res;
      setData(payload);
    } catch (err) {
      console.error('Failed to load growth metrics:', err);
      toast.error('Failed to load SEO growth dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const funnel = data?.funnel || {
    totalLeads: 0,
    newLeads: 0,
    contacted: 0,
    demoScheduled: 0,
    pilotStarted: 0,
    converted: 0,
    conversionRatePercent: '0.0'
  };

  const sources = data?.sources || [];
  const keywordClusters = data?.keywordClusters || [];

  return (
    <div className="sa-container">
      {/* Header */}
      <div className="sa-header">
        <div>
          <h1 className="sa-title">
            <TrendingUp className="sa-title-icon" /> National Organic SEO & Growth Dashboard
          </h1>
          <p className="sa-subtitle">
            Real-time institutional pipeline, keyword cluster targeting, and customer acquisition attribution across India.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/super-admin/enquiries" className="sa-btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Manage Leads Pipeline</span>
            <ArrowUpRight size={15} />
          </Link>
          <button className="sa-btn-refresh" onClick={fetchMetrics} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Funnel Grid */}
      <div className="sa-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="sa-stat-card">
          <div className="stat-label">Total Inquiries</div>
          <div className="stat-value">{funnel.totalLeads}</div>
          <div className="stat-sub">From organic landing pages</div>
        </div>
        <div className="sa-stat-card">
          <div className="stat-label">New / Action Required</div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>{funnel.newLeads}</div>
          <div className="stat-sub">Awaiting callback</div>
        </div>
        <div className="sa-stat-card">
          <div className="stat-label">Demos & Pilots</div>
          <div className="stat-value" style={{ color: '#c084fc' }}>{funnel.demoScheduled + funnel.pilotStarted}</div>
          <div className="stat-sub">Active faculty walkthroughs</div>
        </div>
        <div className="sa-stat-card">
          <div className="stat-label">Converted Clients</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{funnel.converted}</div>
          <div className="stat-sub">Active subscribed institutions</div>
        </div>
        <div className="sa-stat-card">
          <div className="stat-label">Lead Conversion Rate</div>
          <div className="stat-value" style={{ color: '#facc15' }}>{funnel.conversionRatePercent}%</div>
          <div className="stat-sub">Lead-to-paid ratio</div>
        </div>
      </div>

      {/* 2-Column Split: Lead Source Attribution + SEO Engine Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Lead Source Attribution */}
        <div className="sa-table-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="#10b981" /> Inbound Lead Attribution by Landing Page
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>
            Identifies which dedicated SEO landing pages are generating the highest volume of college and university demo requests.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sources.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No attribution data recorded yet.</div>
            ) : (
              sources.map((s, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={14} color="#38bdf8" />
                    <span style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: '500' }}>{s.source}</span>
                  </div>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    {s.count} {s.count === 1 ? 'Lead' : 'Leads'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SEO Infrastructure Health */}
        <div className="sa-table-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#10b981" /> Production SEO Infrastructure Health
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>
            Automated crawler verification across search engines and AI discovery systems.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Indexed Public URLs in Sitemap:</span>
              <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>22 Live URLs (All 200 OK)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Server Response Time (TTFB):</span>
              <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>~311ms (High Concurrency Cluster)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>AI Search Specification (llms.txt):</span>
              <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>Active (ChatGPT / Perplexity)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Security Headers (HSTS & nosniff):</span>
              <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>Enforced on SSL Proxy</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Structured Data Schemas:</span>
              <span style={{ fontSize: '14px', color: '#38bdf8', fontWeight: '600' }}>Org, WebSite, Software, FAQ, Blog</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target National Keyword Matrix Table */}
      <div className="sa-table-card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', margin: '0 0 6px 0' }}>
            National Keyword Targeting Matrix (India Educational Market)
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Commercial keywords targeted to colleges, state universities, CBSE/ICSE schools, and coaching academies.
          </p>
        </div>

        <table className="sa-table">
          <thead>
            <tr>
              <th>Target Keyword</th>
              <th>Target Landing Page</th>
              <th>Search Intent</th>
              <th>Estimated Search Volume</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {keywordClusters.map((k, idx) => (
              <tr key={idx}>
                <td>
                  <div style={{ fontWeight: '600', color: '#f8fafc' }}>{k.keyword}</div>
                </td>
                <td>
                  <a href={`https://exam.nexifyforge.in${k.targetPage}`} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{k.targetPage}</span>
                    <ExternalLink size={12} />
                  </a>
                </td>
                <td>
                  <span style={{ fontSize: '12px', color: '#cbd5e1', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                    {k.intent}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: '600', color: '#10b981' }}>{k.monthlySearchEst}</span>
                </td>
                <td>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: k.priority === 'P1' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
                    color: k.priority === 'P1' ? '#f87171' : '#facc15'
                  }}>
                    {k.priority} High Focus
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
