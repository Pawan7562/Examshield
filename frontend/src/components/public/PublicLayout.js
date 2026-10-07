import React from 'react';
import TopTicker from './landing/TopTicker';
import Navbar from './landing/Navbar';
import Footer from './landing/Footer';
import ChatBot from '../common/ChatBot';
import { ThemeProvider } from '../../context/ThemeContext';
import './PublicLayout.css';
import '../../pages/public/Home.css';

export default function PublicLayout({ children, className = '' }) {
  return (
    <ThemeProvider>
      <div className={`es-landing-wrapper public-theme exam-landing-theme ${className}`.trim()}>
        {/* Unified Top Ticker */}
        <TopTicker />

        {/* Enhanced Navbar across all pages */}
        <Navbar />

        {/* Main Content Area */}
        <main className="public-page-main" role="main" tabIndex="-1">
          {children}
        </main>

        {/* Unified 5-Column Footer */}
        <Footer />

        {/* Brand Restyled ChatBot */}
        <ChatBot />
      </div>
    </ThemeProvider>
  );
}
