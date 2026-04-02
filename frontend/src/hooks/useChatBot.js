import { useState, useEffect, useRef, useCallback } from 'react';
import chatBotService from '../services/chatBotService';
import { CHATBOT_CONFIG } from '../config/chatBotConfig';

export const useChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize chat session
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const sessionData = await chatBotService.initializeSession();
        setSessionId(sessionData.sessionId);
        
        // Set welcome message
        setMessages([{
          id: Date.now(),
          type: 'bot',
          content: CHATBOT_CONFIG.welcomeMessage,
          timestamp: new Date(),
          status: 'delivered'
        }]);
        
        // Check service status
        const status = await chatBotService.checkServiceStatus();
        setIsOnline(status.online);
        
      } catch (error) {
        console.error('Chat initialization failed:', error);
        setIsOnline(false);
      }
    };

    initializeChat();
  }, []);

  // Auto-open functionality
  useEffect(() => {
    if (CHATBOT_CONFIG.autoOpen && !isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        // Show auto-open message
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'bot',
          content: CHATBOT_CONFIG.autoOpenMessage,
          timestamp: new Date(),
          status: 'delivered'
        }]);
      }, CHATBOT_CONFIG.autoOpenDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens and is not minimized
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Track unread messages when minimized
  useEffect(() => {
    if (isMinimized && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'bot') {
        setUnreadCount(prev => prev + 1);
      }
    } else if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [messages, isMinimized]);

  // Send message function
  const sendMessage = useCallback(async (message) => {
    if (!message.trim() || !isOnline) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Track user action
      await chatBotService.trackUserAction('message_sent', {
        messageLength: message.length,
        timestamp: new Date().toISOString()
      });

      // Get bot response
      const response = await chatBotService.sendMessage(message, {
        conversationHistory: conversationHistory.slice(-5)
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.response,
        timestamp: new Date(),
        status: 'delivered',
        confidence: response.confidence,
        intent: response.intent,
        suggestions: response.suggestions
      };

      // Add typing delay for realism
      typingTimeoutRef.current = setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setConversationHistory(prev => [...prev, {
          type: 'bot',
          message: response.response,
          intent: response.intent,
          timestamp: new Date().toISOString()
        }]);
        setIsTyping(false);
      }, CHATBOT_CONFIG.typingDelay.min + Math.random() * 
        (CHATBOT_CONFIG.typingDelay.max - CHATBOT_CONFIG.typingDelay.min));

    } catch (error) {
      console.error('Message sending failed:', error);
      setIsTyping(false);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again or contact our support team.',
        timestamp: new Date(),
        status: 'delivered'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [isOnline, conversationHistory]);

  // Handle input submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
    }
  }, [inputValue, sendMessage]);

  // Handle quick action clicks
  const handleQuickAction = useCallback((question) => {
    setInputValue(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Clear chat
  const clearChat = useCallback(() => {
    chatBotService.clearConversation();
    setMessages([{
      id: Date.now(),
      type: 'bot',
      content: CHATBOT_CONFIG.welcomeMessage,
      timestamp: new Date(),
      status: 'delivered'
    }]);
    setConversationHistory([]);
    setUnreadCount(0);
  }, []);

  // Export conversation
  const exportConversation = useCallback(() => {
    chatBotService.exportConversation();
  }, []);

  // Toggle chat window
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Minimize chat
  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  // Maximize chat
  const maximizeChat = useCallback(() => {
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  // Close chat
  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K to toggle chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleChat();
      }
      
      // Escape to close chat
      if (e.key === 'Escape' && isOpen) {
        closeChat();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, toggleChat, closeChat]);

  // Format message content (markdown, emojis, etc.)
  const formatMessage = useCallback((content) => {
    if (!CHATBOT_CONFIG.enableMarkdown) return content;

    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />')
      .replace(/(\d+\.\s)/g, '<br />$1')
      .replace(/🎯|🚀|💎|🔍|🤖|📊|📱|🔒|📧|📞|💬|🏢|🔐|🛡️|👥|🎓|📚|🏫|🔧|📈|📋|🎯|💻|🌐|📹|🎤|📝|🎮|📅|📹/g, '<span class="emoji">$&</span>');
  }, []);

  // Get conversation summary
  const getConversationSummary = useCallback(() => {
    return chatBotService.getConversationSummary();
  }, []);

  // Check service status
  const checkServiceStatus = useCallback(async () => {
    const status = await chatBotService.checkServiceStatus();
    setIsOnline(status.online);
    return status;
  }, []);

  // Rate limiting
  const lastMessageTime = useRef(Date.now());
  const messageCount = useRef(0);

  const canSendMessage = useCallback(() => {
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTime.current;
    
    // Reset counter after 1 minute
    if (timeSinceLastMessage > 60000) {
      messageCount.current = 0;
    }
    
    // Check rate limit
    if (messageCount.current >= CHATBOT_CONFIG.security.maxMessagesPerMinute) {
      return false;
    }
    
    lastMessageTime.current = now;
    messageCount.current++;
    return true;
  }, []);

  // Content filtering
  const filterContent = useCallback((content) => {
    if (!CHATBOT_CONFIG.security.enableContentFilter) {
      return content;
    }

    const filteredContent = content.toLowerCase();
    const hasBlockedContent = CHATBOT_CONFIG.security.blockedWords.some(word => 
      filteredContent.includes(word)
    );

    if (hasBlockedContent) {
      return null; // Block the message
    }

    return content;
  }, []);

  // Enhanced send message with validation
  const sendMessageWithValidation = useCallback((message) => {
    // Validate message length
    if (message.length < CHATBOT_CONFIG.validation.MESSAGE_LENGTH.min || 
        message.length > CHATBOT_CONFIG.validation.MESSAGE_LENGTH.max) {
      return false;
    }

    // Check rate limit
    if (!canSendMessage()) {
      return false;
    }

    // Filter content
    const filteredMessage = filterContent(message);
    if (!filteredMessage) {
      return false;
    }

    sendMessage(filteredMessage);
    return true;
  }, [sendMessage, canSendMessage, filterContent]);

  // Get suggested responses based on context
  const getSuggestedResponses = useCallback(() => {
    const lastBotMessage = messages.slice().reverse().find(msg => msg.type === 'bot' && msg.suggestions);
    return lastBotMessage?.suggestions || CHATBOT_CONFIG.quickActions;
  }, [messages]);

  return {
    // State
    isOpen,
    isMinimized,
    messages,
    inputValue,
    isTyping,
    isOnline,
    sessionId,
    unreadCount,
    
    // Refs
    messagesEndRef,
    inputRef,
    
    // Actions
    toggleChat,
    minimizeChat,
    maximizeChat,
    closeChat,
    sendMessage: sendMessageWithValidation,
    handleSubmit,
    handleQuickAction,
    clearChat,
    exportConversation,
    checkServiceStatus,
    formatMessage,
    getConversationSummary,
    getSuggestedResponses,
    
    // Setters
    setInputValue,
    setIsOpen,
    setIsMinimized
  };
};
