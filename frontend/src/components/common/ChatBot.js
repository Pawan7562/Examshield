// frontend/src/components/common/ChatBot.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  X,
  Bot,
  User,
  Clock,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Copy,
  ChevronRight
} from 'lucide-react';
import chatBotService from '../../services/chatBotService';
import logoImg from '../../assets/logo-mark.png';
import './ChatBot.css';

// Markdown renderer for rich messages
const FormattedMessage = ({ text }) => {
  if (!text) return null;

  // Split lines
  const lines = text.split('\n');

  return (
    <div className="formatted-message-body">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} className="msg-h4">{renderInline(trimmed.substring(4))}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={idx} className="msg-h3">{renderInline(trimmed.substring(3))}</h3>;
        }

        // Bullet points
        if (trimmed.startsWith('* ') || trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="msg-bullet">
              <span className="msg-bullet-dot">•</span>
              <span className="msg-bullet-text">{renderInline(trimmed.substring(2))}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="msg-bullet">
              <span className="msg-bullet-num">{numMatch[1]}.</span>
              <span className="msg-bullet-text">{renderInline(numMatch[2])}</span>
            </div>
          );
        }

        // Empty lines
        if (!trimmed) {
          return <div key={idx} className="msg-spacer" />;
        }

        // Normal paragraph
        return <p key={idx} className="msg-p">{renderInline(line)}</p>;
      })}
    </div>
  );
};

// Render inline markdown: bold, code, links
const renderInline = (str) => {
  if (!str) return '';
  const parts = [];
  let remaining = str;

  // Pattern for **bold**, `code`, or [text](url)
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="msg-inline-code">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a key={match.index} href={linkMatch[2]} className="msg-inline-link">
            {linkMatch[1]}
          </a>
        );
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return parts.length > 0 ? parts : str;
};

const INITIAL_MESSAGE = {
  id: 'welcome',
  type: 'bot',
  content: `Hello! 👋 Welcome to **Nexify Examina**. I am your dedicated AI Academic & Technical Assistant.\n\nI can assist you with:\n* **AI Proctoring & Anti-Cheat Controls** (Face mesh, audio analytics, kiosk lockdown)\n* **Student Exam Room & Login Assistance** (Camera check, timers, question navigation)\n* **College Admin Console** (Scheduling exams, student management, live cockpit)\n* **Online Coding Assessments** (Languages, test cases, sandboxed execution)\n* **Campus Governance & Security Architecture**\n\nHow can I help you today?`,
  timestamp: new Date(),
  suggestions: [
    'How does AI proctoring work?',
    'How does browser kiosk lockdown work?',
    'How do students log in for an exam?',
    'Can instructors monitor exams live?'
  ],
  actions: [
    { label: 'Register College', url: '/admin/register' },
    { label: 'Student Login', url: '/student/login' }
  ]
};

export default function ChatBot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
      setHasUnread(false);
    }
  }, [isOpen, isMinimized]);

  // Keyboard shortcut Ctrl+K to toggle chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    const userMessage = {
      id: `usr_${Date.now()}`,
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const result = await chatBotService.sendMessage(text);
      if (result) {
        const botMessage = {
          id: `bot_${Date.now()}`,
          type: 'bot',
          content: result.response,
          timestamp: new Date(),
          suggestions: result.suggestions || [],
          actions: result.actions || [],
          confidence: result.confidence
        };

        setMessages((prev) => [...prev, botMessage]);

        if (!isOpen || isMinimized) {
          setHasUnread(true);
        }
      }
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        type: 'bot',
        content: `I ran into a temporary issue connecting. Please try asking again or explore our [How It Works](/how-it-works) guide.`,
        timestamp: new Date(),
        suggestions: ['How does AI proctoring work?', 'How does browser kiosk lockdown work?']
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action) => {
    if (!action?.url) return;
    if (action.url.startsWith('http')) {
      window.open(action.url, '_blank');
    } else {
      navigate(action.url);
      // On mobile screen, close chat upon navigation
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    }
  };

  const handleCopy = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    chatBotService.clearHistory();
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <div className={`cb-container ${isOpen ? 'cb-open' : ''}`}>
      {/* Floating Chat Launcher Button */}
      {!isOpen && (
        <button
          className="cb-launcher"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setHasUnread(false);
          }}
          aria-label="Open Nexify Examina Support Chat"
          title="Ask Nexify Examina AI"
        >
          <div className="cb-launcher-icon">
            <img src={logoImg} alt="Nexify Examina" className="cb-launcher-logo-img" />
          </div>
          <span className="cb-launcher-text">Ask AI</span>
          <Sparkles size={13} className="cb-launcher-sparkle" aria-hidden="true" />
          <span className="cb-launcher-pulse" />
          {hasUnread && <span className="cb-launcher-badge">1</span>}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`cb-window ${isMinimized ? 'cb-minimized' : ''}`}>
          {/* Header */}
          <div className="cb-header">
            <div className="cb-header-brand">
              <div className="cb-header-avatar">
                <img src={logoImg} alt="Nexify Examina" className="cb-avatar-logo-img" />
                <span className="cb-status-beacon" />
              </div>
              <div className="cb-header-titles">
                <div className="cb-header-title-row">
                  <h3 className="cb-title">Nexify Examina AI</h3>
                  <span className="cb-pro-badge">PRO</span>
                </div>
                <div className="cb-subtitle">
                  <span className="cb-live-dot" />
                  <span>Academic &amp; Proctoring AI</span>
                </div>
              </div>
            </div>

            <div className="cb-header-controls">
              <button
                className="cb-ctrl-btn"
                onClick={handleClearChat}
                title="Reset Conversation"
                aria-label="Clear chat"
              >
                <RefreshCw size={13} />
              </button>

              <button
                className="cb-ctrl-btn close-btn"
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                aria-label="Close Chat Window"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Main Body */}
          {!isMinimized && (
            <>
              <div className="cb-messages-stream">
                {messages.map((msg) => (
                  <div key={msg.id} className={`cb-msg-row ${msg.type}`}>
                    <div className="cb-msg-avatar">
                      {msg.type === 'bot' ? <img src={logoImg} alt="Nexify Examina AI" className="cb-msg-avatar-img" /> : <User size={14} />}
                    </div>

                    <div className="cb-msg-bubble-wrap">
                      <div className="cb-msg-bubble">
                        <FormattedMessage text={msg.content} />

                        {/* Interactive Action Buttons */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="cb-msg-actions">
                            {msg.actions.map((act, aIdx) => (
                              <button
                                key={aIdx}
                                className="cb-action-btn"
                                onClick={() => handleActionClick(act)}
                              >
                                {act.label}
                                <ChevronRight size={13} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Message Footer Meta & Copy */}
                      <div className="cb-msg-meta">
                        <span className="cb-msg-time">
                          <Clock size={11} />
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {msg.type === 'bot' && (
                          <button
                            className="cb-copy-btn"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            title="Copy text"
                          >
                            {copiedId === msg.id ? (
                              <span className="cb-copied-label"><Check size={11} /> Copied</span>
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Dynamic Follow-up Suggestions Chips */}
                      {msg.suggestions && msg.suggestions.length > 0 && msg.type === 'bot' && (
                        <div className="cb-chips-group">
                          <span className="cb-chips-label">
                            <Sparkles size={11} /> Suggested Follow-ups:
                          </span>
                          <div className="cb-chips-list">
                            {msg.suggestions.map((sug, sIdx) => (
                              <button
                                key={sIdx}
                                className="cb-chip-btn"
                                onClick={() => handleSend(sug)}
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="cb-msg-row bot">
                    <div className="cb-msg-avatar">
                      <Bot size={16} />
                    </div>
                    <div className="cb-msg-bubble-wrap">
                      <div className="cb-msg-bubble cb-typing-bubble">
                        <div className="cb-typing-dots">
                          <span />
                          <span />
                          <span />
                        </div>
                        <span className="cb-typing-status">Nexify Examina AI is writing...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="cb-footer">
                <form
                  className="cb-input-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    className="cb-input"
                    placeholder="Ask about proctoring, coding, pricing, or exams..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    className="cb-send-btn"
                    disabled={!inputValue.trim() || isTyping}
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </form>

                <div className="cb-footer-hint">
                  <span>Nexify Examina Neural AI</span>
                  <span className="cb-footer-dot">•</span>
                  <span>Press Enter ↵ to send</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
