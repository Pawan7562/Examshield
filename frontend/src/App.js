import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SuperAdminLogin from './pages/auth/SuperAdminLogin';
import Home from './pages/public/Home';
import FeaturesPage from './pages/public/Features';
import HowItWorksPage from './pages/public/HowItWorks';
import PricingPage from './pages/public/Pricing';
import ContactPage from './pages/public/Contact';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import StudentManagement from './pages/admin/StudentManagement';
import ExamManagement from './pages/admin/ExamManagement';
import CreateExam from './pages/admin/CreateExam';
import AIQuestionGenerator from './pages/admin/AIQuestionGenerator';
import ExamQuestions from './pages/admin/ExamQuestions';
import QuestionDetail from './pages/admin/QuestionDetail';
import LiveMonitor from './pages/admin/LiveMonitor';
import Results from './pages/admin/Results';
import EvaluateResult from './pages/admin/EvaluateResult';
import Subscription from './pages/admin/Subscription';

import StudentLayout from './components/student/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import ExamList from './pages/student/ExamList';
import ExamRoom from './pages/student/ExamRoom';
import StudentResults from './pages/student/Results';
import Profile from './pages/student/Profile';
import PasswordReset from './pages/student/PasswordReset';
import Settings from './pages/student/Settings';

import SuperAdminLayout from './components/admin/SuperAdminLayout';
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import CollegeManagement from './pages/super-admin/CollegeManagement';

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
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#fffdf8',
              color: '#2d3138',
              border: '1px solid rgba(255, 184, 0, 0.25)',
              fontFamily: 'Manrope, sans-serif',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#d34235', secondary: '#fff' } },
          }}
        />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login role="admin" />} />
          <Route path="/admin/register" element={<Register />} />
          <Route path="/student/login" element={<Login role="student" />} />
          <Route path="/student/password-reset" element={<PasswordReset />} />
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
            <Route path="exams/create" element={<CreateExam />} />
            <Route path="ai-questions" element={<AIQuestionGenerator />} />
            <Route path="exams/:id/questions" element={<ExamQuestions />} />
            <Route path="exams/:id/questions/:questionId" element={<QuestionDetail />} />
            <Route path="exams/:id/monitor" element={<LiveMonitor />} />
            <Route path="results" element={<Results />} />
            <Route path="results/:id/evaluate" element={<EvaluateResult />} />
            <Route path="subscription" element={<Subscription />} />
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
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function NotFoundPage() {
  return (
    <div style={loadingStyles.page}>
      <div style={loadingStyles.card}>
        <h1 style={loadingStyles.heading}>404</h1>
        <p style={loadingStyles.text}>Page not found</p>
        <a href="/" style={loadingStyles.link}>
          Back to Home
        </a>
      </div>
    </div>
  );
}

const loadingStyles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #fff8e7 0%, #fffdf9 100%)',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 32,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.94)',
    border: '1px solid rgba(255,184,0,0.18)',
    boxShadow: '0 16px 38px rgba(191,156,53,0.16)',
    textAlign: 'center',
    fontFamily: 'Manrope, sans-serif',
  },
  spinner: {
    width: 34,
    height: 34,
    margin: '0 auto',
    border: '3px solid rgba(255,184,0,0.2)',
    borderTopColor: '#ffb400',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  heading: {
    margin: 0,
    fontSize: 72,
    lineHeight: 1,
    color: '#ffb400',
    fontWeight: 900,
  },
  text: {
    margin: '16px 0 0',
    color: '#7a818b',
    fontWeight: 700,
  },
  link: {
    display: 'inline-block',
    marginTop: 18,
    color: '#9b6c00',
    fontWeight: 800,
    textDecoration: 'none',
  },
};

export default App;
