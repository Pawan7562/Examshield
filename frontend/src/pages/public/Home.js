import React, { useEffect } from 'react';
import TopTicker from '../../components/public/landing/TopTicker';
import Navbar from '../../components/public/landing/Navbar';
import HeroSection from '../../components/public/landing/HeroSection';
import StatsProofBand from '../../components/public/landing/StatsProofBand';
import DepartmentRadar from '../../components/public/landing/DepartmentRadar';
import IntegrityFeatures from '../../components/public/landing/IntegrityFeatures';
import WorkflowTimeline from '../../components/public/landing/WorkflowTimeline';
import CommandCenter from '../../components/public/landing/CommandCenter';
import SolutionsMatrix from '../../components/public/landing/SolutionsMatrix';
import RoiCalculator from '../../components/public/landing/RoiCalculator';
import SecurityCompliance from '../../components/public/landing/SecurityCompliance';
import ResultsSection from '../../components/public/landing/ResultsSection';
import FaqAccordion from '../../components/public/landing/FaqAccordion';
import FinalCta from '../../components/public/landing/FinalCta';
import Footer from '../../components/public/landing/Footer';
import ChatBot from '../../components/common/ChatBot';
import { ThemeProvider } from '../../context/ThemeContext';
import './Home.css';

export default function Home() {
  useEffect(() => {
    // Ensure document title and canonical meta tags on mount
    document.title = 'Nexify Examina — Enterprise AI Exam Proctoring & Live Invigilation Platform';
  }, []);

  return (
    <ThemeProvider>
      <div className="es-landing-wrapper">
        {/* 1. Live ticker bar */}
        <TopTicker />

        {/* 2. Navbar */}
        <Navbar />

        {/* Main Content Landmarks */}
        <main id="main-content" tabIndex="-1">
          {/* 3. Hero */}
          <HeroSection />

          {/* 4. Stats band + trusted-by */}
          <StatsProofBand />

          {/* 5. Institutional Command Suite (department radar) */}
          <DepartmentRadar />

          {/* 6. Six layers of integrity (features) */}
          <IntegrityFeatures />

          {/* 7. 4-step workflow */}
          <WorkflowTimeline />

          {/* 8. Live invigilation command center (3 tabs) */}
          <CommandCenter />

          {/* 9. Stakeholder solutions (4 tabs) + CTA banner */}
          <SolutionsMatrix />

          {/* 10. Institutional ROI & Scale Simulator */}
          <RoiCalculator />

          {/* 11. Security & compliance (4 cards) */}
          <SecurityCompliance />

          {/* 11. Results: KPIs + filterable testimonials + accreditation strip */}
          <ResultsSection />

          {/* 12. FAQ accordion */}
          <FaqAccordion />

          {/* 13. Final CTA */}
          <FinalCta />
        </main>

        {/* 14. Footer */}
        <Footer />

        {/* 15. Floating chatbot button */}
        <ChatBot />
      </div>
    </ThemeProvider>
  );
}
