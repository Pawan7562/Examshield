# ExamShield Landing Page Documentation & Design System

## 1. Overview
The ExamShield public landing page (`/` route) is engineered as an enterprise-grade, high-conversion SaaS interface matching modern B2B standards (Linear, Vercel, Stripe). It uses clean semantic HTML5, CSS custom properties, responsive clamp scales, and Framer/CSS hardware-accelerated animations.

---

## 2. Directory & Architecture Structure
```
frontend/
├── public/
│   ├── index.html                 # Updated document title, meta tags, OG/Twitter, Google Fonts, JSON-LD
│   └── favicon.ico
├── src/
│   ├── content/
│   │   ├── landingContent.js      # SINGLE SOURCE OF TRUTH for all copy, stats, links, and claims
│   │   └── README.md              # Documentation guide
│   ├── mocks/
│   │   └── radarMockData.js       # Client-side simulation telemetry (streams, timeline, dossiers)
│   ├── context/
│   │   └── ThemeContext.js        # Light/Dark mode state with localStorage persistence
│   ├── components/
│   │   ├── ui/
│   │   │   └── ThemeToggle.js     # Sun/Moon toggle switch
│   │   ├── common/
│   │   │   ├── ChatBot.js         # Restyled on-brand AI Chatbot widget
│   │   │   └── ChatBot.css        # Deep Forest Green + Lime palette
│   │   └── public/
│   │       └── landing/
│   │           ├── TopTicker.js          # Section 1: Slim marquee with fade masks
│   │           ├── Navbar.js             # Section 2: Sticky glass with CTA hierarchy
│   │           ├── HeroSection.js        # Section 3: Fluid headline + 3D proctoring card
│   │           ├── StatsProofBand.js     # Section 4: KPI metrics + trusted marquee
│   │           ├── DepartmentRadar.js    # Section 5: Institutional Command Suite
│   │           ├── IntegrityFeatures.js  # Section 6: Six layers bento grid
│   │           ├── WorkflowTimeline.js   # Section 7: 4-step horizontal timeline
│   │           ├── CommandCenter.js      # Section 8: Live invigilation cockpit (3 tabs)
│   │           ├── SolutionsMatrix.js    # Section 9: 4 stakeholder solution tabs
│   │           ├── SecurityCompliance.js # Section 10: 4 compliance pillars + badges
│   │           ├── ResultsSection.js     # Section 11: Impact KPIs + filterable case studies
│   │           ├── FaqAccordion.js       # Section 12: Accessible FAQ accordion
│   │           ├── FinalCta.js           # Section 13: High-impact conversion CTA
│   │           └── Footer.js             # Section 14: 5-column footer + back-to-top
│   └── pages/
│       └── public/
│           ├── Home.js                   # Assembles 15 sections in exact order
│           └── Home.css                  # Design system tokens, layouts, and animations
```

---

## 3. How to Edit Content & Statistics
All text, metrics, links, and claims are centralized in:
`frontend/src/content/landingContent.js`

- **Changing Company Info / Location / Founder**: Edit `BRAND_INFO` in `landingContent.js`.
- **Updating Metrics & Proof Numbers**: Edit `PROOF_METRICS` in `landingContent.js`.
- **Modifying Marquee Ticker Messages**: Edit `TICKER_ITEMS` in `landingContent.js`.
- **Modifying Department Radar Data**: Edit `COLLEGE_DEPARTMENTS` in `landingContent.js`.
- **Adding/Editing Testimonials**: Edit `INSTITUTIONAL_TESTIMONIALS` in `landingContent.js`.
- **Adding/Editing FAQs**: Edit `INSTITUTIONAL_FAQS` in `landingContent.js`.

---

## 4. How to Change Design Tokens, Colors & Fonts
Tokens are defined in `frontend/src/pages/public/Home.css`:

### Brand Palette:
- **Dark Surface**: `--es-forest-900: #071511`
- **Elevated Surface**: `--es-forest-850: #0a1f1a`
- **Accent Lime**: `--es-lime: #b8f26b`
- **Accent Dark Text**: `--es-lime-dark-text: #071511` (passes WCAG AA contrast with > 11:1 ratio)

### Typography:
- **Headings**: `'Space Grotesk', sans-serif`
- **Body**: `'Inter', sans-serif`
Loaded via `<link>` in `frontend/public/index.html`.

---

## 5. Portal & Route Preservation
All outbound links are verified and active:
- **Student Exam Portal**: `/student/login` or `/student/dashboard`
- **College Admin Console**: `/login`
- **Register Institution**: `/admin/register`
- **Super Admin Console**: `/super-admin/login`
- **Book Enterprise Demo / Request Pilot**: `/contact`
