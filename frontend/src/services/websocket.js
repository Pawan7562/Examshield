// src/services/websocket.js - Professional WebSocket service with robust error handling
import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.connectionPromise = null;
  }

  async connect(token) {
    try {
      // If already connecting, wait for it to complete
      if (this.connectionPromise) {
        return this.connectionPromise;
      }

      this.connectionPromise = new Promise((resolve, reject) => {
        // Clear any existing reconnection timeout
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
        }

        console.log('🔗 Attempting WebSocket connection to backend...');

        // Connect to backend WebSocket server with professional configuration
        const wsUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5000' 
          : window.location.origin; // Use current domain in production
        
        this.socket = io(wsUrl, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: false, // Handle reconnection manually
          upgrade: false,
          rememberUpgrade: false,
          forceNew: true
        });

        const connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout after 20 seconds'));
        }, 20000);

        // Success handler
        this.socket.on('connect', () => {
          clearTimeout(connectionTimeout);
          console.log('✅ WebSocket connected successfully to backend');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          resolve(this.socket);
        });

        // Error handler
        this.socket.on('connect_error', (error) => {
          clearTimeout(connectionTimeout);
          console.error('❌ WebSocket connection error:', error);
          this.connectionPromise = null;
          
          // Provide user-friendly error message
          const errorMessage = this.getErrorMessage(error);
          console.error(`🔍 Connection failed: ${errorMessage}`);
          
          // Show user-friendly notification
          if (typeof window !== 'undefined') {
            const notification = document.createElement('div');
            notification.innerHTML = `
              <div style="position: fixed; top: 20px; right: 20px; background: #f44336; color: white; padding: 15px; border-radius: 8px; z-index: 9999; font-family: Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.0.15);">
                <div style="font-weight: bold; margin-bottom: 8px;">⚠️ Connection Issue</div>
                <div style="font-size: 14px;">Unable to connect to server. Please check your internet connection and try refreshing the page.</div>
                <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">Error: ${errorMessage}</div>
              </div>
            `;
            document.body.appendChild(notification);
            
            // Auto-remove after 8 seconds
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 8000);
          }
          
          reject(new Error(errorMessage));
        });

        // Disconnect handler
        this.socket.on('disconnect', (reason) => {
          console.log('❌ WebSocket disconnected:', reason);
          this.connected = false;
          this.connectionPromise = null;
        });

      });

      return await this.connectionPromise;

    } catch (error) {
      console.error('❌ WebSocket initialization error:', error);
      this.connectionPromise = null;
      throw error;
    }
  }

  getErrorMessage(error) {
    if (!error) return 'Unknown error';
    
    if (error.message) {
      if (error.message.includes('ECONNREFUSED')) {
        return 'Server is not running or not accessible';
      } else if (error.message.includes('ETIMEDOUT')) {
        return 'Connection timed out. Please check your internet connection';
      } else if (error.message.includes('ENOTFOUND')) {
        return 'Server address not found';
      } else if (error.message.includes('ECONNRESET')) {
        return 'Connection was reset by server';
      }
    }
    
    return error.message || error.toString();
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
    
    this.connectionPromise = null;
  }

  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  emit(event, data) {
    if (this.isConnected()) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ WebSocket not connected, cannot emit:', event);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new WebSocketService();
