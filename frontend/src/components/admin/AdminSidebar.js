// src/components/admin/AdminSidebar.js — Nexify Examina · College Admin Sidebar
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NexifyIcon } from './NexifyIcons';
import logoImg from '../../assets/logo-mark.png';
import './NexifyDashboardTheme.css';

export default function AdminSidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navGroups = [
    {
      title: 'Command center',
      items: [
        { id: 'dashboard', label: 'Dashboard overview', icon: 'grid', path: '/admin/dashboard' },
        { id: 'monitoring', label: 'Live monitoring', icon: 'radio', path: '/admin/monitoring', badge: 'live' }
      ]
    },
    {
      title: 'Academic & candidates',
      items: [
        { id: 'students', label: 'Candidate registry', icon: 'users', path: '/admin/students' },
        { id: 'exams', label: 'Examinations center', icon: 'file', path: '/admin/exams' },
        { id: 'results', label: 'Gradebook & audits', icon: 'trophy', path: '/admin/results' }
      ]
    },
    {
      title: 'AI intelligence',
      items: [
        { id: 'ai-questions', label: 'AI question studio', icon: 'brain', path: '/admin/ai-questions', badge: 'ai' }
      ]
    },
    {
      title: 'Institutional control',
      items: [
        { id: 'subscription', label: 'License & quotas', icon: 'card', path: '/admin/subscription' },
        { id: 'settings', label: 'Proctoring rules & college', icon: 'cog', path: '/admin/settings' },
        { id: 'support', label: 'Support & helpdesk', icon: 'help', path: '/admin/support' }
      ]
    }
  ];

  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleNav = (path) => {
    navigate(path);
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const collegeName = user?.collegeName || user?.college_name || user?.name || 'Pk university';
  const tierName = (user?.subscriptionPlan || 'Standard').charAt(0).toUpperCase() + (user?.subscriptionPlan || 'standard').slice(1);
  const initials = collegeName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PK';

  return (
    <>
      <div
        className="scrim"
        id="scrim"
        onClick={() => setMobileOpen && setMobileOpen(false)}
        style={{ pointerEvents: mobileOpen ? 'auto' : 'none', opacity: mobileOpen ? 1 : 0 }}
      />
      <aside className={`side ${mobileOpen ? 'open' : ''}`} id="side" aria-label="Main navigation">
        {/* Brand */}
        <div className="brand" onClick={() => handleNav('/admin/dashboard')}>
          <img src={logoImg} alt="Nexify Examina" className="admin-brand-logo-img" />
          <div>
            <b>Nexify Examina</b>
            <small>College admin</small>
          </div>
        </div>

        {/* Institution Card */}
        <div className="org">
          <i>{initials}</i>
          <div>
            <b>{collegeName}</b>
            <small>Partner institution · {tierName} tier</small>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav id="nav">
          {navGroups.map((group, gIdx) => (
            <React.Fragment key={gIdx}>
              <div className="grp">{group.title}</div>
              {group.items.map((item) => {
                const on = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    className={`nav ${on ? 'on' : ''}`}
                    onClick={() => handleNav(item.path)}
                  >
                    <NexifyIcon name={item.icon} />
                    <span>{item.label}</span>
                    {item.badge === 'live' && <span className="bdg live">Live</span>}
                    {item.badge === 'ai' && <span className="bdg ai">AI v2</span>}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* Live AI proctor status */}
        <div className="ai-st">
          <span className="dot"></span>
          AI proctor core active
        </div>

        {/* Quick Sign Out */}
        <button className="so" onClick={handleLogout}>
          <NexifyIcon name="out" />
          <span>Sign out administrator</span>
        </button>
      </aside>
    </>
  );
}
