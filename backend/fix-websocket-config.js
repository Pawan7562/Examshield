// fix-websocket-config.js - Fix WebSocket connection issues
const fs = require('fs');
const path = require('path');

// Fix frontend WebSocket configuration
const frontendSrcPath = path.join(__dirname, '..', 'frontend', 'src');
const servicesPath = path.join(frontendSrcPath, 'services');

// Create WebSocket service
const webSocketService = `
// src/services/websocket.js - Professional WebSocket service
import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    try {
      // Connect to backend WebSocket server (port 5000, not 3000)
      this.socket = io('http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        this.connected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('🔄 Max reconnection attempts reached, stopping...');
        }
      });

      return this.socket;

    } catch (error) {
      console.error('❌ WebSocket initialization error:', error);
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected && this.socket;
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
`;

// Write WebSocket service
fs.writeFileSync(path.join(servicesPath, 'websocket.js'), webSocketService);
console.log('✅ WebSocket service created');

// Fix API service to handle WebSocket errors
const apiServicePath = path.join(servicesPath, 'api.js');
if (fs.existsSync(apiServicePath)) {
  let apiContent = fs.readFileSync(apiServicePath, 'utf8');
  
  // Add better error handling for 401 errors
  if (!apiContent.includes('401 Unauthorized handling')) {
    apiContent = apiContent.replace(
      '// Response interceptor - handle token refresh',
      `// Response interceptor - handle token refresh and WebSocket issues
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Checking authentication...');
      
      // Don't retry login requests
      if (original.url?.includes('/auth/')) {
        console.log('🔐 Authentication failed, please check credentials');
        localStorage.clear();
        return Promise.reject(error);
      }
      
      // Try token refresh for other requests
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken && !original._retry) {
        original._retry = true;
        try {
          const response = await axios.post(\`\${API_BASE_URL}/auth/refresh\`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
          api.defaults.headers.common['Authorization'] = \`Bearer \${accessToken}\`;
          original.headers.Authorization = \`Bearer \${accessToken}\`;
          return api(original);
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } else {
        console.log('🔐 No refresh token available, redirecting to login');
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    // Response interceptor - handle token refresh`
    );
    
    fs.writeFileSync(apiServicePath, apiContent);
    console.log('✅ API service updated with better 401 handling');
  }
}

console.log('🎉 WebSocket configuration fixes applied!');
console.log('📝 Restart frontend to apply changes');
`;

fs.writeFileSync(path.join(__dirname, 'fix-websocket-config.js'), webSocketFixCode);
console.log('✅ WebSocket fix script created');
