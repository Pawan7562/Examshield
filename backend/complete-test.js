// Complete system test - what you can do now
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function completeSystemTest() {
  try {
    console.log('🚀 Complete ExamShield System Test\n');
    
    const api = axios.create({
      baseURL: 'http://localhost:5000/api',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Add request interceptor like frontend
    api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // 1. Login as college admin
    console.log('1. 🔐 College Admin Login...');
    const loginResponse = await api.post('/auth/college/login', {
      email: 'test@examshield.com',
      password: 'password123'
    });
    
    const { accessToken, refreshToken, user } = loginResponse.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    console.log('✅ Login successful!');
    console.log('   User:', user.name, '-', user.email);
    console.log('   Role:', user.role);
    console.log('   Subscription:', user.subscriptionPlan);
    
    // 2. Test dashboard
    console.log('\n2. 📊 Dashboard Access...');
    const dashboardResponse = await api.get('/admin/dashboard');
    console.log('✅ Dashboard loaded');
    console.log('   Total Students:', dashboardResponse.data.data.stats.totalStudents);
    console.log('   Total Exams:', dashboardResponse.data.data.stats.totalExams);
    
    // 3. Test students management
    console.log('\n3. 👥 Students Management...');
    const studentsResponse = await api.get('/admin/students');
    console.log('✅ Students endpoint working');
    console.log('   Current students:', studentsResponse.data.data.students?.length || 0);
    
    // 4. Test exams
    console.log('\n4. 📝 Exams Management...');
    const examsResponse = await api.get('/admin/exams');
    console.log('✅ Exams endpoint working');
    console.log('   Current exams:', examsResponse.data.data.exams?.length || 0);
    
    // 5. Test notifications
    console.log('\n5. 🔔 Notifications...');
    const notificationsResponse = await api.get('/admin/notifications');
    console.log('✅ Notifications endpoint working');
    
    // 6. Test subscription
    console.log('\n6. 💳 Subscription Info...');
    const subscriptionResponse = await api.get('/subscriptions/current');
    console.log('✅ Subscription endpoint working');
    console.log('   Plan:', subscriptionResponse.data.data?.plan || 'No active subscription');
    
    console.log('\n🎉 ALL SYSTEMS WORKING!');
    console.log('\n📋 What you can do next:');
    console.log('   1. Add students via Admin Dashboard');
    console.log('   2. Create and manage exams');
    console.log('   3. Monitor live exam sessions');
    console.log('   4. View results and analytics');
    console.log('   5. Manage subscription plans');
    
    console.log('\n🌐 Access your application:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Login with: test@examshield.com / password123');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

completeSystemTest();
