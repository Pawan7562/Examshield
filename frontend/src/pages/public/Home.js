import React from 'react';
import SEOHead from '../../components/common/SEOHead';
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
  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://exam.nexifyforge.in/#organization',
        name: 'Nexify Examina',
        url: 'https://exam.nexifyforge.in/',
        logo: 'https://exam.nexifyforge.in/logo.png',
        founder: {
          '@type': 'Person',
          name: 'Pawan Kumar Yadav',
        },
        foundingLocation: {
          '@type': 'Place',
          name: 'Mohali, Punjab, India',
        },
        description: 'Enterprise AI exam-proctoring SaaS for universities, certification boards, and colleges.',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://exam.nexifyforge.in/#software',
        name: 'Nexify Examina Enterprise Proctoring Platform',
        applicationCategory: 'EducationalSoftware',
        operatingSystem: 'All modern browsers (Chrome, Edge, Safari, Firefox)',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
          description: 'Institutional trial & pilot available',
        },
      },
    ],
  };

  return (
    <ThemeProvider>
      <SEOHead
        title="Nexify Examina — Enterprise AI Exam Proctoring & Live Invigilation Platform"
        description="Nexify Examina is the enterprise AI exam-proctoring SaaS for universities, certification boards, and colleges. Zero software installation, neural biometric verification, browser kiosk lockdown, and court-admissible audit dossiers."
        keywords="Nexify Examina, AI exam proctoring, online exam monitoring, university proctoring software, browser lockdown kiosk, biometric facial verification, cheating prevention, exam integrity"
        canonical="https://exam.nexifyforge.in/"
        jsonLd={homeJsonLd}
      />
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
