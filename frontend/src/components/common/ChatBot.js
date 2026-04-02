import React, { useState } from 'react';
import { Send, Minimize2, Maximize2, X, Bot, User, Clock, Check, CheckCheck } from 'lucide-react';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your ExamShield assistant. How can I help you today?',
      timestamp: new Date(),
      status: 'delivered'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Thanks for your message! I\'m here to help you with ExamShield. What would you like to know about our exam monitoring platform?',
        timestamp: new Date(),
        status: 'delivered'
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestedQuestions = [
    'What are your pricing plans?',
    'How does the AI monitoring work?',
    'Can I get a demo?',
    'What are the system requirements?'
  ];

  return (
    <>
      {/* Chat Button */}
      <div className={`chatbot-widget ${isOpen ? 'open' : ''}`}>
        <button
          className="chatbot-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open chat"
        >
          <Bot size={24} />
          <span className="chatbot-button-text">Chat with us</span>
          {messages.length > 1 && (
            <span className="chatbot-badge">{messages.length - 1}</span>
          )}
        </button>

        {/* Chat Window */}
        {isOpen && (
          <div className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}>
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-header-content">
                <div className="chatbot-avatar">
                  <Bot size={20} />
                </div>
                <div className="chatbot-info">
                  <h3>ExamShield Assistant</h3>
                  <span className="chatbot-status">
                    <span className="status-dot online"></span>
                    Online - Typically responds instantly
                  </span>
                </div>
              </div>
              <div className="chatbot-header-actions">
                <button
                  className="header-action-btn"
                  onClick={() => setIsMinimized(!isMinimized)}
                  aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  className="header-action-btn close"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <div className="chatbot-messages">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.type}`}
                    >
                      <div className="message-avatar">
                        {message.type === 'bot' ? <Bot size={16} /> : <User size={16} />}
                      </div>
                      <div className="message-content">
                        <div className="message-bubble">
                          <div className="message-text">{message.content}</div>
                        </div>
                        <div className="message-meta">
                          <span className="message-time">
                            <Clock size={12} />
                            {formatTimestamp(message.timestamp)}
                          </span>
                          {message.type === 'user' && (
                            <span className="message-status">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="message bot">
                      <div className="message-avatar">
                        <Bot size={16} />
                      </div>
                      <div className="message-content">
                        <div className="message-bubble typing">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                {messages.length <= 2 && (
                  <div className="chatbot-quick-actions">
                    <div className="quick-actions-title">Quick Questions:</div>
                    <div className="quick-actions-grid">
                      {suggestedQuestions.map((question, index) => (
                        <button
                          key={index}
                          className="quick-action-btn"
                          onClick={() => setInputValue(question)}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="chatbot-input">
                  <div className="input-container">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className="chat-input"
                      disabled={isTyping}
                    />
                    <button
                      className="send-button"
                      onClick={sendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      aria-label="Send message"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  <div className="input-actions">
                    <button
                      className="input-action-btn"
                      onClick={() => setMessages([messages[0]])}
                      aria-label="Clear chat"
                    >
                      Clear chat
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ChatBot;
