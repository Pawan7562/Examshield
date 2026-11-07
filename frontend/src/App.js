import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import NotFound from './pages/public/NotFound';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SuperAdminLogin from './pages/auth/SuperAdminLogin';
import Home from './pages/public/Home';
import FeaturesPage from './pages/public/Features';
import HowItWorksPage from './pages/public/HowItWorks';
import PricingPage from './pages/public/Pricing';
import ContactPage from './pages/public/Contact';
import AboutPage from './pages/public/About';

import AdminLayout from './components/admin/AdminLayout';
import StudentLayout from './components/student/StudentLayout';
import SuperAdminLayout from './components/admin/SuperAdminLayout';

// Route-level code-splitting: loads heavy page components only on demand
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const StudentManagement = lazy(() => import('./pages/admin/StudentManagement'));
const ExamManagement = lazy(() => import('./pages/admin/ExamManagement'));
const CreateExam = lazy(() => import('./pages/admin/CreateExam'));
const AIQuestionGenerator = lazy(() => import('./pages/admin/AIQuestionGenerator'));
const ExamQuestions = lazy(() => import('./pages/admin/ExamQuestions'));
const QuestionDetail = lazy(() => import('./pages/admin/QuestionDetail'));
const LiveMonitor = lazy(() => import('./pages/admin/LiveMonitor'));
const Results = lazy(() => import('./pages/admin/Results'));
const EvaluateResult = lazy(() => import('./pages/admin/EvaluateResult'));
const Subscription = lazy(() => import('./pages/admin/Subscription'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminSupport = lazy(() => import('./pages/admin/Support'));

const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const ExamList = lazy(() => import('./pages/student/ExamList'));
const ExamRoom = lazy(() => import('./pages/student/ExamRoom'));
const StudentResults = lazy(() => import('./pages/student/Results'));
const Profile = lazy(() => import('./pages/student/Profile'));
const PasswordReset = lazy(() => import('./pages/student/PasswordReset'));
const Settings = lazy(() => import('./pages/student/Settings'));
const AdminResetPassword = lazy(() => import('./pages/auth/AdminResetPassword'));

const SuperAdminDashboard = lazy(() => import('./pages/super-admin/Dashboard'));
const CollegeManagement = lazy(() => import('./pages/super-admin/CollegeManagement'));
const PaymentManagement = lazy(() => import('./pages/super-admin/PaymentManagement'));
const AuditLogs = lazy(() => import('./pages/super-admin/AuditLogs'));
const PlatformSettings = lazy(() => import('./pages/super-admin/PlatformSettings'));

const PageFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <div style={{
      width: '32px',
      height: '32px',
      border: '3px solid rgba(10, 116, 218, 0.15)',
      borderTopColor: '#0a74da',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite'
    }} />
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={loadingStyles.page}>
        <div style={loadingStyles.card}>
          <div style={loadingStyles.spinner} />
          <p style={loadingStyles.text}>Loading Exam Monitoring...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirect = user.role === 'student' ? '/student/dashboard' : '/admin/dashboard';
    return <Navigate to={redirect} replace />;
  }
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0e1726',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontFamily: 'Inter, sans-serif',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />

          <Suspense fallback={<PageFallback />}>
            <Routes>
            <Route path="/" element={<Home />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pricing" element={<Navigate to="/" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login role="admin" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/register" element={<Register />} />
          <Route path="/student/login" element={<Login role="student" />} />
          <Route path="/college/reset-password" element={<AdminResetPassword />} />
          <Route path="/admin/reset-password" element={<AdminResetPassword />} />
          <Route path="/student/password-reset" element={<Navigate to="/student/login" replace />} />
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['college_admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="exams" element={<ExamManagement />} />
            <Route path="exams/:id/edit" element={<ExamManagement />} />
            <Route path="exams/create" element={<CreateExam />} />
            <Route path="ai-questions" element={<AIQuestionGenerator />} />
            <Route path="exams/:id/questions" element={<ExamQuestions />} />
            <Route path="exams/:id/questions/:questionId" element={<QuestionDetail />} />
            <Route path="monitoring" element={<LiveMonitor />} />
            <Route path="exams/:id/monitor" element={<LiveMonitor />} />
            <Route path="results" element={<Results />} />
            <Route path="results/:id/evaluate" element={<EvaluateResult />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="support" element={<AdminSupport />} />
          </Route>

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="exams" element={<ExamList />} />
            <Route path="results" element={<StudentResults />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route
            path="/student/exam/:examId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams/:examId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamRoom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="colleges" element={<CollegeManagement />} />
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<PlatformSettings />} />
          </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
  );
}

export default App;
