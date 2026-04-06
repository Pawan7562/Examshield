// Professional Full-Screen Exam Manager
export class FullScreenExamManager {
  constructor() {
    this.isFullScreen = false;
    this.isLocked = false;
    this.callbacks = {
      onEnter: null,
      onExit: null,
      onViolation: null
    };
    this.violationCount = 0;
    this.maxViolations = 3;
    this.warningTimeout = null;
    this.escapeListener = null;
    this.visibilityListener = null;
    this.contextMenuListener = null;
    this.keyListener = null;
  }

  // Initialize full-screen mode with callbacks
  init(callbacks = {}) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    this.setupEventListeners();
    console.log('🖥️ Full-screen exam manager initialized');
  }

  // Request full-screen mode with professional handling
  async requestFullScreen() {
    try {
      console.log('🖥️ Requesting professional full-screen mode...');
      
      // Show professional full-screen request modal
      this.showFullScreenRequest();
      
      // Request full-screen after user acknowledges
      const result = await this.requestFullScreenWithPermissions();
      
      if (result) {
        this.enterFullScreen();
        return true;
      } else {
        this.handleFullScreenDenied();
        return false;
      }
    } catch (error) {
      console.error('❌ Full-screen request failed:', error);
      this.handleFullScreenError(error);
      return false;
    }
  }

  // Show professional full-screen request modal
  showFullScreenRequest() {
    const modal = document.createElement('div');
    modal.id = 'fullscreen-request-modal';
    modal.innerHTML = `
      <div class="fullscreen-modal-overlay">
        <div class="fullscreen-modal-content">
          <div class="fullscreen-modal-header">
            <h2>🖥️ Full-Screen Exam Mode</h2>
          </div>
          <div class="fullscreen-modal-body">
            <div class="fullscreen-icon">📝</div>
            <h3>Professional Exam Environment</h3>
            <p>This exam requires full-screen mode to ensure:</p>
            <ul class="fullscreen-requirements">
              <li>✅ Secure and distraction-free environment</li>
              <li>✅ Academic integrity and fairness</li>
              <li>✅ Professional exam conditions</li>
              <li>✅ No unauthorized access to other applications</li>
            </ul>
            <div class="fullscreen-warning">
              <p><strong>⚠️ Important:</strong></p>
              <p>• Leaving full-screen mode will be recorded as a violation</p>
              <p>• Multiple violations may result in exam termination</p>
              <p>• Press ESC to exit full-screen (will be recorded)</p>
            </div>
          </div>
          <div class="fullscreen-modal-footer">
            <button class="fullscreen-accept-btn" onclick="this.closest('.fullscreen-modal-overlay').remove(); window.fullScreenManager.proceedWithFullScreen();">
              Enter Full-Screen Mode
            </button>
            <button class="fullscreen-cancel-btn" onclick="this.closest('.fullscreen-modal-overlay').remove(); window.fullScreenManager.cancelFullScreen();">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .fullscreen-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .fullscreen-modal-content {
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
      }
      
      .fullscreen-modal-header h2 {
        margin: 0 0 24px 0;
        color: #1e293b;
        font-size: 24px;
        font-weight: 700;
      }
      
      .fullscreen-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .fullscreen-modal-body h3 {
        margin: 0 0 16px 0;
        color: #1e293b;
        font-size: 20px;
        font-weight: 600;
      }
      
      .fullscreen-modal-body p {
        margin: 0 0 16px 0;
        color: #64748b;
        line-height: 1.6;
      }
      
      .fullscreen-requirements {
        text-align: left;
        margin: 16px 0;
        padding: 16px;
        background: #f8fafc;
        border-radius: 8px;
        list-style: none;
      }
      
      .fullscreen-requirements li {
        margin: 8px 0;
        color: #475569;
      }
      
      .fullscreen-warning {
        margin: 20px 0;
        padding: 16px;
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 8px;
        text-align: left;
      }
      
      .fullscreen-warning p {
        margin: 4px 0;
        color: #92400e;
        font-size: 14px;
      }
      
      .fullscreen-modal-footer {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      
      .fullscreen-accept-btn {
        flex: 1;
        padding: 12px 24px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .fullscreen-accept-btn:hover {
        background: #2563eb;
      }
      
      .fullscreen-cancel-btn {
        flex: 1;
        padding: 12px 24px;
        background: #f1f5f9;
        color: #64748b;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .fullscreen-cancel-btn:hover {
        background: #e2e8f0;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
  }

  // Proceed with full-screen after user acceptance
  proceedWithFullScreen() {
    console.log('✅ User accepted full-screen mode');
    this.executeFullScreenRequest();
  }

  // Cancel full-screen request
  cancelFullScreen() {
    console.log('❌ User cancelled full-screen mode');
    this.handleFullScreenDenied();
  }

  // Execute full-screen request
  async executeFullScreenRequest() {
    const element = document.documentElement;
    
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      } else {
        throw new Error('Full-screen API not supported');
      }
      
      this.enterFullScreen();
      return true;
    } catch (error) {
      console.error('❌ Full-screen request failed:', error);
      this.handleFullScreenError(error);
      return false;
    }
  }

  // Enter full-screen mode
  enterFullScreen() {
    this.isFullScreen = true;
    this.isLocked = true;
    this.addFullScreenStyles();
    this.setupSecurityMeasures();
    
    console.log('✅ Full-screen exam mode activated');
    
    if (this.callbacks.onEnter) {
      this.callbacks.onEnter();
    }
    
    this.showFullScreenNotification();
  }

  // Exit full-screen mode
  exitFullScreen() {
    this.isFullScreen = false;
    this.isLocked = false;
    this.removeFullScreenStyles();
    this.cleanupSecurityMeasures();
    
    console.log('🚪 Full-screen exam mode exited');
    
    if (this.callbacks.onExit) {
      this.callbacks.onExit();
    }
    
    this.recordViolation('EXIT_FULLSCREEN');
  }

  // Add full-screen styles
  addFullScreenStyles() {
    const style = document.createElement('style');
    style.id = 'fullscreen-exam-styles';
    style.textContent = `
      :fullscreen {
        background: #1e293b !important;
      }
      
      :-webkit-full-screen {
        background: #1e293b !important;
      }
      
      :-moz-full-screen {
        background: #1e293b !important;
      }
      
      :-ms-fullscreen {
        background: #1e293b !important;
      }
      
      body {
        background: #1e293b !important;
        overflow: hidden !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      
      * {
        cursor: default !important;
      }
      
      input, textarea, select {
        cursor: text !important;
      }
      
      button, a {
        cursor: pointer !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  // Remove full-screen styles
  removeFullScreenStyles() {
    const style = document.getElementById('fullscreen-exam-styles');
    if (style) {
      style.remove();
    }
  }

  // Setup security measures
  setupSecurityMeasures() {
    // Prevent right-click
    this.contextMenuListener = (e) => {
      e.preventDefault();
      this.recordViolation('CONTEXT_MENU');
      return false;
    };
    document.addEventListener('contextmenu', this.contextMenuListener);

    // Prevent common keyboard shortcuts
    this.keyListener = (e) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, etc.
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'u') ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        this.recordViolation('KEYBOARD_SHORTCUT');
        return false;
      }
    };
    document.addEventListener('keydown', this.keyListener);

    // Monitor tab visibility
    this.visibilityListener = () => {
      if (document.hidden) {
        this.recordViolation('TAB_SWITCH');
      }
    };
    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  // Cleanup security measures
  cleanupSecurityMeasures() {
    if (this.contextMenuListener) {
      document.removeEventListener('contextmenu', this.contextMenuListener);
    }
    if (this.keyListener) {
      document.removeEventListener('keydown', this.keyListener);
    }
    if (this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Listen for full-screen changes
    this.escapeListener = () => {
      if (!document.fullscreenElement && this.isFullScreen) {
        this.exitFullScreen();
      }
    };
    document.addEventListener('fullscreenchange', this.escapeListener);
  }

  // Record violation
  recordViolation(type) {
    this.violationCount++;
    console.warn(`⚠️ Exam violation recorded: ${type} (Total: ${this.violationCount})`);
    
    if (this.callbacks.onViolation) {
      this.callbacks.onViolation({
        type,
        count: this.violationCount,
        timestamp: new Date().toISOString()
      });
    }
    
    // Show warning
    this.showViolationWarning(type);
    
    // Check if max violations exceeded
    if (this.violationCount >= this.maxViolations) {
      this.handleMaxViolations();
    }
  }

  // Show violation warning
  showViolationWarning(type) {
    const warning = document.createElement('div');
    warning.className = 'exam-violation-warning';
    warning.innerHTML = `
      <div class="violation-content">
        <div class="violation-icon">⚠️</div>
        <div class="violation-text">
          <h4>Exam Violation Detected</h4>
          <p>${this.getViolationMessage(type)}</p>
          <p class="violation-count">Violations: ${this.violationCount}/${this.maxViolations}</p>
        </div>
      </div>
    `;
    
    // Add warning styles if not already present
    if (!document.getElementById('violation-warning-styles')) {
      const style = document.createElement('style');
      style.id = 'violation-warning-styles';
      style.textContent = `
        .exam-violation-warning {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #dc2626;
          color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
          z-index: 999998;
          max-width: 300px;
          animation: slideIn 0.3s ease-out;
        }
        
        .violation-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .violation-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        
        .violation-text h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .violation-text p {
          margin: 0 0 4px 0;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .violation-count {
          font-weight: 600;
          color: #fca5a5;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(warning);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (warning.parentNode) {
        warning.remove();
      }
    }, 5000);
  }

  // Get violation message
  getViolationMessage(type) {
    const messages = {
      'EXIT_FULLSCREEN': 'You exited full-screen mode. Please re-enter full-screen mode.',
      'CONTEXT_MENU': 'Right-click is disabled during exams.',
      'KEYBOARD_SHORTCUT': 'Keyboard shortcuts are disabled during exams.',
      'TAB_SWITCH': 'Tab switching is detected. Stay on the exam page.'
    };
    return messages[type] || 'Exam violation detected.';
  }

  // Show full-screen notification
  showFullScreenNotification() {
    const notification = document.createElement('div');
    notification.className = 'fullscreen-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🖥️</div>
        <div class="notification-text">
          <h4>Full-Screen Exam Mode</h4>
          <p>You are now in secure full-screen exam mode.</p>
        </div>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      .fullscreen-notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #059669;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(5, 150, 105, 0.3);
        z-index: 999998;
        animation: slideDown 0.3s ease-out;
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .notification-icon {
        font-size: 20px;
      }
      
      .notification-text h4 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .notification-text p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
      }
      
      @keyframes slideDown {
        from {
          transform: translate(-50%, -100%);
          opacity: 0;
        }
        to {
          transform: translate(-50%, 0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  // Handle full-screen denied
  handleFullScreenDenied() {
    console.warn('⚠️ Full-screen mode denied by user');
    if (this.callbacks.onViolation) {
      this.callbacks.onViolation({
        type: 'FULLSCREEN_DENIED',
        count: ++this.violationCount,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle full-screen error
  handleFullScreenError(error) {
    console.error('❌ Full-screen mode error:', error);
    if (this.callbacks.onViolation) {
      this.callbacks.onViolation({
        type: 'FULLSCREEN_ERROR',
        count: ++this.violationCount,
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  // Handle maximum violations
  handleMaxViolations() {
    console.error('🚫 Maximum violations reached. Exam may be terminated.');
    if (this.callbacks.onViolation) {
      this.callbacks.onViolation({
        type: 'MAX_VIOLATIONS',
        count: this.violationCount,
        timestamp: new Date().toISOString(),
        critical: true
      });
    }
  }

  // Get current status
  getStatus() {
    return {
      isFullScreen: this.isFullScreen,
      isLocked: this.isLocked,
      violationCount: this.violationCount,
      maxViolations: this.maxViolations
    };
  }

  // Cleanup
  cleanup() {
    this.removeFullScreenStyles();
    this.cleanupSecurityMeasures();
    
    if (this.escapeListener) {
      document.removeEventListener('fullscreenchange', this.escapeListener);
    }
    
    // Remove any remaining modals
    const modal = document.getElementById('fullscreen-request-modal');
    if (modal) {
      modal.remove();
    }
    
    console.log('🧹 Full-screen exam manager cleaned up');
  }
}

// Create global instance
window.fullScreenManager = new FullScreenExamManager();
