// ChatBot Configuration - Production-ready settings

export const CHATBOT_CONFIG = {
  // General Settings
  botName: 'ExamShield Assistant',
  botAvatar: '🤖',
  welcomeMessage: 'Hello! I\'m your ExamShield assistant. How can I help you today?',
  
  // UI Settings
  position: {
    bottom: 20,
    right: 20
  },
  
  windowSize: {
    width: 380,
    height: 600,
    minWidth: 320,
    minHeight: 400
  },
  
  // Theme Settings
  theme: {
    primary: '#4f46e5',
    secondary: '#7c3aed',
    accent: '#10b981',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  
  // Behavior Settings
  autoOpen: false,
  autoOpenDelay: 5000, // 5 seconds
  autoOpenMessage: 'Need help? I\'m here to assist you!',
  showTypingIndicator: true,
  typingDelay: { min: 800, max: 2000 },
  
  // Message Settings
  maxMessageLength: 1000,
  messageHistoryLimit: 100,
  enableMarkdown: true,
  enableEmojis: true,
  
  // Quick Actions
  quickActions: [
    'What are your pricing plans?',
    'How does the AI monitoring work?',
    'Can I get a demo?',
    'What are the system requirements?'
  ],
  
  // Response Settings
  enableContextualResponses: true,
  enablePersonalization: true,
  enableAnalytics: true,
  enableFallback: true,
  
  // API Settings
  api: {
    endpoint: process.env.REACT_APP_CHATBOT_API || '/api/chatbot',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  // Storage Settings
  storage: {
    enabled: true,
    key: 'examshield_chatbot',
    persistHistory: true,
    persistUserProfile: true,
    maxStorageSize: 1024 * 1024 // 1MB
  },
  
  // Accessibility Settings
  accessibility: {
    enableKeyboardNavigation: true,
    enableScreenReader: true,
    enableHighContrast: true,
    enableReducedMotion: true,
    announceNewMessages: true
  },
  
  // Analytics Settings
  analytics: {
    enabled: true,
    trackUserActions: true,
    trackConversations: true,
    trackPerformance: true,
    anonymizeData: true,
    consentRequired: false
  },
  
  // Security Settings
  security: {
    enableRateLimit: true,
    maxMessagesPerMinute: 30,
    enableContentFilter: true,
    enableSanitization: true,
    enableEncryption: true
  },
  
  // Notification Settings
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
    desktop: true,
    badge: true
  },
  
  // Language Settings
  language: {
    default: 'en',
    autoDetect: true,
    supported: ['en', 'hi', 'es', 'fr', 'de', 'zh', 'ja']
  },
  
  // Debug Settings
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    enableConsole: true,
    enableNetworkLogs: false
  }
};

// Intent Definitions
export const CHATBOT_INTENTS = {
  GREETING: {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
    responses: [
      'Hello! Welcome to ExamShield. How can I assist you today?',
      'Hi there! I\'m here to help you with our exam monitoring platform.',
      'Greetings! What can I help you with today?'
    ]
  },
  
  PRICING: {
    keywords: ['price', 'cost', 'pricing', 'plan', 'subscription', 'fee', 'money', 'payment'],
    responses: [
      'I can help you with our pricing! We offer three flexible plans designed for different needs.',
      'Let me tell you about our pricing options.',
      'I\'d be happy to explain our pricing structure.'
    ]
  },
  
  FEATURES: {
    keywords: ['feature', 'capability', 'what can', 'functionality', 'option', 'ability'],
    responses: [
      'ExamShield offers comprehensive features for secure exam monitoring.',
      'Let me tell you about our powerful features.',
      'I can explain all the capabilities of our platform.'
    ]
  },
  
  DEMO: {
    keywords: ['demo', 'trial', 'test', 'preview', 'showcase', 'experience', 'try'],
    responses: [
      'Great choice! I can help you experience ExamShield.',
      'I\'d love to show you what ExamShield can do!',
      'Let me help you get started with a demo or trial.'
    ]
  },
  
  SUPPORT: {
    keywords: ['help', 'support', 'issue', 'problem', 'trouble', 'assist', 'guidance'],
    responses: [
      'I\'m here to help! What issue are you experiencing?',
      'I can definitely help you with that.',
      'Let me assist you with your concern.'
    ]
  },
  
  TECHNICAL: {
    keywords: ['technical', 'requirement', 'system', 'compatibility', 'browser', 'device'],
    responses: [
      'I can help you with technical requirements and setup.',
      'Let me explain the technical aspects.',
      'I can provide technical guidance for ExamShield.'
    ]
  },
  
  SECURITY: {
    keywords: ['security', 'privacy', 'safe', 'protect', 'encrypt', 'secure', 'confidential'],
    responses: [
      'Security is our top priority. Let me explain our security measures.',
      'I can tell you all about our security and privacy features.',
      'Your data security is important to us. Let me explain how we protect it.'
    ]
  },
  
  INTEGRATION: {
    keywords: ['integration', 'lms', 'connect', 'api', 'moodle', 'canvas', 'blackboard'],
    responses: [
      'ExamShield integrates seamlessly with popular LMS platforms.',
      'I can help you with integration options.',
      'Let me explain how ExamShield connects with your existing systems.'
    ]
  },
  
  CONTACT: {
    keywords: ['contact', 'phone', 'email', 'address', 'office', 'reach', 'call'],
    responses: [
      'I can help you get in touch with our team.',
      'Let me provide you with our contact information.',
      'I can connect you with the right person to help you.'
    ]
  },
  
  MOBILE: {
    keywords: ['mobile', 'app', 'phone', 'tablet', 'ios', 'android', 'smartphone'],
    responses: [
      'Yes! ExamShield works perfectly on mobile devices.',
      'I can tell you about our mobile capabilities.',
      'ExamShield is fully mobile-optimized.'
    ]
  },
  
  REPORT: {
    keywords: ['report', 'analytics', 'result', 'data', 'insight', 'statistics'],
    responses: [
      'Our reporting system provides comprehensive insights.',
      'I can explain our analytics and reporting features.',
      'Let me tell you about our powerful reporting capabilities.'
    ]
  },
  
  GOODBYE: {
    keywords: ['bye', 'goodbye', 'farewell', 'see you', 'exit', 'quit', 'leave'],
    responses: [
      'Thank you for chatting with me! Feel free to come back anytime.',
      'Goodbye! I hope I was helpful today.',
      'Have a great day! Don\'t hesitate to reach out if you need more help.'
    ]
  },
  
  THANKS: {
    keywords: ['thank', 'thanks', 'appreciate', 'grateful', 'helpful'],
    responses: [
      'You\'re welcome! I\'m glad I could help.',
      'My pleasure! Is there anything else I can assist you with?',
      'Happy to help! Let me know if you need anything else.'
    ]
  }
};

// Response Templates
export const RESPONSE_TEMPLATES = {
  PRICING_DETAILS: {
    STARTER: {
      name: 'Starter Plan',
      price: '₹4,999/month',
      features: ['Up to 100 students', 'Basic monitoring', 'Email support', 'Standard reports'],
      highlight: 'Perfect for small institutions'
    },
    PROFESSIONAL: {
      name: 'Professional Plan',
      price: '₹9,999/month',
      features: ['Up to 500 students', 'Advanced AI monitoring', 'Priority support', 'Advanced analytics'],
      highlight: 'Most popular choice'
    },
    ENTERPRISE: {
      name: 'Enterprise Plan',
      price: 'Custom pricing',
      features: ['Unlimited students', 'Custom features', 'Dedicated support', 'White-label options'],
      highlight: 'For large institutions'
    }
  },
  
  FEATURES_LIST: [
    {
      icon: '🔍',
      name: 'Live Proctoring',
      description: 'Real-time video monitoring with AI-powered alerts'
    },
    {
      icon: '🤖',
      name: 'Smart Detection',
      description: 'Automated violation detection for unfair practices'
    },
    {
      icon: '📊',
      name: 'Advanced Analytics',
      description: 'Detailed performance insights and comprehensive reports'
    },
    {
      icon: '🔒',
      name: 'Bank-level Security',
      description: '256-bit encryption and GDPR compliance'
    },
    {
      icon: '📱',
      name: 'Multi-platform Support',
      description: 'Works seamlessly on web, mobile, and desktop devices'
    },
    {
      icon: '🎯',
      name: 'Customizable Rules',
      description: 'Flexible monitoring rules tailored to your needs'
    }
  ],
  
  DEMO_OPTIONS: [
    {
      name: 'Interactive Demo',
      description: 'Schedule a personalized walkthrough with our team',
      action: 'Schedule Demo'
    },
    {
      name: 'Free Trial',
      description: '14-day trial with full access to all features',
      action: 'Start Trial'
    },
    {
      name: 'Video Tour',
      description: 'Watch our platform in action with guided tour',
      action: 'Watch Video'
    }
  ],
  
  SUPPORT_CHANNELS: [
    {
      icon: '📧',
      name: 'Email Support',
      value: 'support@exammonitoring.com',
      description: 'Response within 24 hours'
    },
    {
      icon: '📞',
      name: 'Phone Support',
      value: '+91 98765 43210',
      description: 'Mon-Fri, 9AM-6PM IST'
    },
    {
      icon: '💬',
      name: 'Live Chat',
      value: 'Available 24/7',
      description: 'Instant support with our team'
    }
  ],
  
  TECHNICAL_REQUIREMENTS: {
    BROWSER: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    MOBILE: ['iOS 12+', 'Android 8+'],
    HARDWARE: ['Web camera', 'Microphone', 'Stable internet (3Mbps+)'],
    NETWORK: ['Low latency connection preferred', 'Minimum 3Mbps upload speed']
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'I\'m having trouble connecting. Please check your internet connection.',
  TIMEOUT_ERROR: 'The response is taking longer than expected. Please try again.',
  RATE_LIMIT: 'You\'re sending messages too quickly. Please wait a moment.',
  CONTENT_FILTER: 'I cannot process that request. Please rephrase your message.',
  SERVER_ERROR: 'I\'m experiencing technical difficulties. Please try again later.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again or contact support.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  MESSAGE_SENT: 'Message sent successfully!',
  FEEDBACK_RECEIVED: 'Thank you for your feedback!',
  SESSION_INITIALIZED: 'Chat session initialized successfully!',
  CONCLUSION_EXPORTED: 'Conversation exported successfully!'
};

// Validation Rules
export const VALIDATION_RULES = {
  MESSAGE_LENGTH: {
    min: 1,
    max: 1000,
    message: 'Message must be between 1 and 1000 characters'
  },
  
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^[\+]?[1-9][\d]{0,15}$/,
  
  CONTENT_FILTER: {
    blockedWords: ['spam', 'abuse', 'inappropriate'],
    message: 'Message contains inappropriate content'
  }
};

// Animation Settings
export const ANIMATION_SETTINGS = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500
  },
  
  EASING: {
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  DELAYS: {
    TYPING: { min: 800, max: 2000 },
    MESSAGE_APPEAR: 100,
    QUICK_ACTION: 50
  }
};

export default CHATBOT_CONFIG;
