export const featureItems = [
  {
    title: 'Live Monitoring',
    description: 'Track student sessions in real time with continuous invigilator visibility.',
    shortDescription: 'Real-time exam monitoring',
    icon: 'eye',
  },
  {
    title: 'AI Cheating Detection',
    description: 'Detect suspicious behavior such as tab switching, multiple faces, and focus loss.',
    shortDescription: 'Prevent suspicious exam behavior',
    icon: 'shield',
  },
  {
    title: 'Screen Tracking',
    description: 'Monitor screen behavior to identify restricted actions and unusual exam activity.',
    shortDescription: 'Track student screen activity',
    icon: 'monitor',
  },
  {
    title: 'Audio Monitoring',
    description: 'Flag unusual ambient noise and conversation patterns during active exams.',
    shortDescription: 'Identify unusual sound patterns',
    icon: 'mic',
  },
];

export const workflowSteps = [
  {
    number: '1',
    title: 'Student Authentication',
    body: 'Students verify identity and exam credentials before entering the secure room.',
    imageClass: 'landing-step-image-auth',
  },
  {
    number: '2',
    title: 'Live Exam Monitoring',
    body: 'Invigilators and automated checks monitor sessions while students complete the exam.',
    imageClass: 'landing-step-image-monitor',
  },
  {
    number: '3',
    title: 'Automated Alerts & Reports',
    body: 'All violations and session events are compiled into actionable admin reports.',
    imageClass: 'landing-step-image-alerts',
  },
];

export const pricingPlans = [
  {
    name: 'Basic',
    price: '999',
    label: 'For small institutions',
    features: ['50 Students', '10 Exams / month', 'MCQ Exams', 'Basic Reports', 'Email Support'],
    highlight: false,
  },
  {
    name: 'Standard',
    price: '2999',
    label: 'Most popular',
    features: ['200 Students', '50 Exams / month', 'All Exam Types', 'Live Monitoring', 'Advanced Reports'],
    highlight: true,
  },
  {
    name: 'Premium',
    price: '7999',
    label: 'For large campuses',
    features: ['Unlimited Students', 'Unlimited Exams', 'AI Proctoring', 'Custom Branding', '24/7 Support'],
    highlight: false,
  },
];
