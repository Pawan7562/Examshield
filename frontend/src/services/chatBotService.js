// ChatBot Service - Production-ready chatbot backend integration

class ChatBotService {
  constructor() {
    this.apiEndpoint = process.env.REACT_APP_CHATBOT_API || '/api/chatbot';
    this.sessionId = this.generateSessionId();
    this.conversationHistory = [];
    this.userProfile = {};
    this.isOnline = true;
  }

  // Generate unique session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Initialize user session
  async initializeSession(userInfo = {}) {
    try {
      this.userProfile = {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ...userInfo
      };

      const response = await fetch(`${this.apiEndpoint}/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.userProfile)
      });

      if (!response.ok) {
        throw new Error('Failed to initialize chat session');
      }

      const data = await response.json();
      this.conversationHistory = data.history || [];
      return data;
    } catch (error) {
      console.error('Chat session initialization failed:', error);
      return this.getFallbackResponse();
    }
  }

  // Send message to chatbot
  async sendMessage(message, context = {}) {
    try {
      const messageData = {
        sessionId: this.sessionId,
        message: message,
        timestamp: new Date().toISOString(),
        context: {
          ...context,
          conversationHistory: this.conversationHistory.slice(-10), // Last 10 messages
          userProfile: this.userProfile
        }
      };

      const response = await fetch(`${this.apiEndpoint}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Update conversation history
      this.conversationHistory.push({
        type: 'user',
        message: message,
        timestamp: new Date().toISOString()
      });
      
      this.conversationHistory.push({
        type: 'bot',
        message: data.response,
        timestamp: new Date().toISOString(),
        confidence: data.confidence || 0.8,
        intent: data.intent || null
      });

      return {
        response: data.response,
        confidence: data.confidence || 0.8,
        intent: data.intent || null,
        suggestions: data.suggestions || [],
        isTyping: false
      };
    } catch (error) {
      console.error('Chat message failed:', error);
      return this.getFallbackResponse(message);
    }
  }

  // Get fallback response when API fails
  getFallbackResponse(message = '') {
    const fallbackResponses = [
      "I'm experiencing some technical difficulties. Please try again in a moment.",
      "I'm unable to connect right now. Please contact our support team for immediate assistance.",
      "Something went wrong on my end. Let me try to help you differently."
    ];

    const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return {
      response: response,
      confidence: 0.3,
      intent: 'error',
      suggestions: [
        'Contact Support',
        'Try Again',
        'View FAQ'
      ],
      isTyping: false
    };
  }

  // Advanced AI response generation
  async generateIntelligentResponse(userMessage, context = {}) {
    try {
      // Analyze user intent
      const intent = await this.analyzeIntent(userMessage);
      
      // Get personalized response based on user history
      const personalizedContext = this.getPersonalizedContext(context);
      
      // Generate response
      const response = await this.generateContextualResponse(userMessage, intent, personalizedContext);
      
      return response;
    } catch (error) {
      console.error('Intelligent response generation failed:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  // Analyze user intent
  async analyzeIntent(message) {
    const messageLower = message.toLowerCase();
    
    // Intent patterns
    const intents = {
      pricing: ['price', 'cost', 'pricing', 'plan', 'subscription', 'fee'],
      features: ['feature', 'capability', 'what can', 'functionality', 'option'],
      demo: ['demo', 'trial', 'test', 'preview', 'showcase'],
      support: ['help', 'support', 'issue', 'problem', 'trouble'],
      technical: ['technical', 'requirement', 'system', 'compatibility', 'browser'],
      security: ['security', 'privacy', 'safe', 'protect', 'encrypt'],
      integration: ['integration', 'lms', 'connect', 'api', 'moodle'],
      contact: ['contact', 'phone', 'email', 'address', 'office'],
      mobile: ['mobile', 'app', 'phone', 'tablet', 'ios', 'android'],
      report: ['report', 'analytics', 'result', 'data', 'insight']
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }

  // Get personalized context
  getPersonalizedContext(context) {
    const recentHistory = this.conversationHistory.slice(-5);
    const userIntents = recentHistory
      .filter(msg => msg.intent)
      .map(msg => msg.intent);
    
    return {
      recentTopics: userIntents,
      messageCount: this.conversationHistory.length,
      sessionDuration: Date.now() - (this.userProfile.timestamp ? new Date(this.userProfile.timestamp).getTime() : Date.now()),
      ...context
    };
  }

  // Generate contextual response
  async generateContextualResponse(message, intent, context) {
    const responses = {
      pricing: {
        main: "I can help you with our pricing! We offer three flexible plans designed for different needs:\n\n🎯 **Starter Plan** - ₹4,999/month\n• Up to 100 students\n• Basic monitoring features\n• Email support\n\n🚀 **Professional Plan** - ₹9,999/month\n• Up to 500 students\n• Advanced AI monitoring\n• Priority support\n\n💎 **Enterprise Plan** - Custom pricing\n• Unlimited students\n• Custom features\n• Dedicated support\n\nWhich plan interests you most?",
        followups: ['Tell me more about Starter', 'Professional features?', 'Enterprise pricing?']
      },
      
      features: {
        main: "ExamShield offers comprehensive exam monitoring features:\n\n🔍 **Live Proctoring**\nReal-time video monitoring with AI-powered alerts\n\n🤖 **Smart Detection**\nAutomated violation detection for unfair practices\n\n📊 **Advanced Analytics**\nDetailed performance insights and reports\n\n🔒 **Bank-level Security**\n256-bit encryption and GDPR compliance\n\n📱 **Multi-platform Support**\nWorks on web, mobile, and desktop\n\nWhich feature would you like to explore?",
        followups: ['How does AI detection work?', 'Security details?', 'Mobile app features?']
      },
      
      demo: {
        main: "Great choice! I can help you experience ExamShield:\n\n🎮 **Interactive Demo**\nSchedule a personalized walkthrough with our team\n\n📅 **14-Day Free Trial**\nFull access to all features\n\n📹 **Video Tour**\nWatch our platform in action\n\n🎯 **Quick Start**\nBegin monitoring exams in minutes\n\nWhich option works best for you?",
        followups: ['Schedule demo', 'Start free trial', 'Watch video tour']
      },
      
      support: {
        main: "I'm here to help! Here's how you can reach us:\n\n📧 **Email Support**\nsupport@exammonitoring.com\nResponse within 24 hours\n\n📞 **Phone Support**\n+91 98765 43210\nMon-Fri, 9AM-6PM IST\n\n💬 **Live Chat**\nAvailable 24/7 for immediate help\n\n🏢 **Office Visit**\nBangalore, Karnataka\nWhat specific issue can I help you with?",
        followups: ['Technical issue', 'Billing question', 'Account help']
      },
      
      technical: {
        main: "Here are our technical requirements:\n\n💻 **Browser Support**\nChrome, Firefox, Safari, Edge (latest versions)\n\n📱 **Mobile Requirements**\niOS 12+, Android 8+\nStable internet connection (3Mbps+)\n\n📹 **Hardware Requirements**\nWeb camera (built-in or external)\nMicrophone for audio monitoring\n\n🌐 **Network**\nMinimum 3Mbps upload speed\nLow latency connection preferred\n\nNeed help with setup?",
        followups: ['Browser setup help', 'Mobile app download', 'Connection test']
      },
      
      security: {
        main: "Security is our highest priority:\n\n🔐 **Encryption**\n256-bit SSL encryption for all data\nEnd-to-end encryption for video streams\n\n🛡️ **Compliance**\nGDPR compliant data handling\nFERPA compliant for educational data\n\n👥 **Privacy Controls**\nStudent data anonymization\nRole-based access control\n\n🔒 **Data Protection**\nRegular security audits\nPenetration testing\n24/7 security monitoring\n\nYour data is completely safe with us!",
        followups: ['Privacy policy details', 'Data storage locations', 'Compliance certificates']
      },
      
      integration: {
        main: "ExamShield integrates seamlessly with popular LMS platforms:\n\n🎓 **Moodle**\nOne-click integration\nSingle sign-on support\nGrade book sync\n\n📚 **Canvas**\nNative integration\nReal-time sync\nMobile app support\n\n🏫 **Blackboard**\nEnterprise integration\nCustom workflows\nAPI access\n\n🔧 **Custom Integration**\nRESTful API\nWebhook support\nDeveloper documentation\n\nWhich LMS are you using?",
        followups: ['Moodle setup guide', 'Canvas integration', 'Custom API docs']
      },
      
      contact: {
        main: "Get in touch with our team:\n\n📧 **Email**\nsupport@exammonitoring.com\nGeneral inquiries and support\n\n📞 **Phone**\n+91 98765 43210\nSales and urgent support\n\n🏢 **Office**\n123 Tech Park, Bangalore\nKarnataka 560001, India\n\n🕐 **Business Hours**\nMon-Fri: 9AM-6PM IST\nSaturday: 10AM-2PM\n\nHow can we help you today?",
        followups: ['Sales inquiry', 'Technical support', 'Partnership opportunity']
      },
      
      mobile: {
        main: "Yes! ExamShield works perfectly on mobile:\n\n📱 **Mobile Apps**\nAvailable on iOS App Store & Google Play\nNative performance and features\n\n💻 **Responsive Web**\nWorks on any mobile browser\nTouch-optimized interface\n\n📟 **Tablet Support**\niPad and Android tablet optimized\nSplit-screen multitasking\n\n🔔 **Push Notifications**\nExam reminders and alerts\nReal-time status updates\n\nDownload our apps and monitor on the go!",
        followups: ['iOS app features', 'Android download', 'Web mobile guide']
      },
      
      report: {
        main: "Our comprehensive reporting system provides:\n\n📊 **Real-time Analytics**\nLive exam monitoring dashboard\nStudent participation tracking\n\n📈 **Performance Insights**\nIndividual and class performance\nTrend analysis over time\n\n📋 **Detailed Reports**\nExam completion rates\nTime analysis\nViolation incidents\n\n🎯 **Custom Reports**\nTailored metrics for your needs\nExport to PDF/Excel\nScheduled reports\n\nWhich type of report interests you?",
        followups: ['Sample report demo', 'Custom report setup', 'Data export options']
      },
      
      general: {
        main: "Welcome to ExamShield! I'm your AI assistant and I'm here to help you with:\n\n💰 **Pricing Plans**\n⚡ **Platform Features**\n🎮 **Demo & Trial**\n🛡️ **Security & Privacy**\n📱 **Mobile Apps**\n🔧 **Technical Support**\n📞 **Contact Information**\n\nWhat would you like to know about our exam monitoring platform?",
        followups: ['Show me pricing', 'Platform features', 'Start free trial']
      }
    };

    const responseSet = responses[intent] || responses.general;
    
    return {
      response: responseSet.main,
      confidence: 0.85,
      intent: intent,
      suggestions: responseSet.followups,
      isTyping: false
    };
  }

  // Track user analytics
  async trackUserAction(action, data = {}) {
    try {
      await fetch(`${this.apiEndpoint}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          action: action,
          timestamp: new Date().toISOString(),
          data: data
        })
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  // Get conversation summary
  getConversationSummary() {
    const totalMessages = this.conversationHistory.length;
    const userMessages = this.conversationHistory.filter(msg => msg.type === 'user').length;
    const botMessages = this.conversationHistory.filter(msg => msg.type === 'bot').length;
    const sessionDuration = Date.now() - (this.userProfile.timestamp ? new Date(this.userProfile.timestamp).getTime() : Date.now());
    
    const intents = this.conversationHistory
      .filter(msg => msg.intent)
      .reduce((acc, msg) => {
        acc[msg.intent] = (acc[msg.intent] || 0) + 1;
        return acc;
      }, {});

    return {
      sessionId: this.sessionId,
      totalMessages,
      userMessages,
      botMessages,
      sessionDuration,
      intents,
      timestamp: new Date().toISOString()
    };
  }

  // Export conversation
  exportConversation() {
    const summary = this.getConversationSummary();
    const exportData = {
      summary: summary,
      conversation: this.conversationHistory,
      userProfile: this.userProfile,
      exportTimestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${this.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Clear conversation
  clearConversation() {
    this.conversationHistory = [];
    this.sessionId = this.generateSessionId();
  }

  // Check service status
  async checkServiceStatus() {
    try {
      const response = await fetch(`${this.apiEndpoint}/status`);
      const status = await response.json();
      this.isOnline = status.online;
      return status;
    } catch (error) {
      this.isOnline = false;
      return { online: false, message: 'Service unavailable' };
    }
  }
}

// Create singleton instance
const chatBotService = new ChatBotService();

export default chatBotService;
