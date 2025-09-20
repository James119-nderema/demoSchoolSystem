import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom'
import './index.css'
import { setupAxiosInterceptors } from './utils/apiInterceptors'

// Setup axios interceptors for automatic auth handling
setupAxiosInterceptors();
import { AuthProvider } from './components/authentication/contexts/AuthContext'
import { StaffAuthProvider } from './components/authentication/contexts/StaffAuthContext'
import { ParentAuthProvider } from './components/authentication/contexts/ParentAuthContext'
import ProtectedRoute from './components/authentication/ProtectedRoute'
import StaffProtectedRoute from './components/authentication/StaffProtectedRoute'
import ParentProtectedRoute from './components/authentication/ParentProtectedRoute'
import AuthenticatedRoute from './components/authentication/AuthenticatedRoute'
import LandingLayout from './layout/LandingLayout'
import MainLayout from './layout/MainLayout'
import StaffMainLayout from './layout/StaffMainLayout'
import SchoolRegistration from './components/school/SchoolRegistration'
import SchoolLogin from './components/school/SchoolLogin'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import StaffRegistration from './components/staff/StaffRegistration'
import StaffLogin from './components/staff/StaffLogin'
import StaffForgotPassword from './components/staff/StaffForgotPassword'
import StaffResetPassword from './components/staff/StaffResetPassword'
import StaffDashboard from './components/staff/StaffDashboard'
import StaffStudents from './components/staff/StaffStudents'
import StaffClasses from './components/staff/StaffClasses'
import StaffSubjects from './components/staff/StaffSubjects'
import StaffResults from './components/staff/StaffResults'
import StaffProfile from './components/staff/StaffProfile'
import InputMarks from './components/staff/marks/InputMarks'
import ViewResults from './components/staff/marks/ViewResults'
import StatisticsDashboard from './pages/StatisticsDashboard'
import { StudentAnalyticsWrapper, ClassAnalyticsWrapper, SubjectAnalyticsWrapper } from './components/staff/AnalyticsWrappers'
import SchoolDashboard from './pages/SchoolDashboard'
import StudentStatistics from './components/generalFiles/analytics/StudentStatistics'
import ClassStatistics from './components/generalFiles/analytics/ClassStatistics'
import ReportsDashboard from './components/generalFiles/reports/ReportsDashboard'
import ReportsPage from './components/templates/ReportsPage'
import ParentRegistration from './components/parents/ParentRegistration'
import ParentLogin from './components/parents/ParentLogin'
import ParentForgotPassword from './components/parents/ParentForgotPassword'
import ParentDashboardContent from './components/parents/ParentDashboardContent'
import StudentAnalytics from './components/parents/StudentAnalytics'
import AcademicResultsContent from './components/parents/AcademicResultsContent'
import StudentProfileContent from './components/parents/StudentProfileContent'
import FeeInformation from './components/parents/FeeInformation'
import AttendanceContent from './components/parents/AttendanceContent'
import MessagesContent from './components/parents/MessagesContent'
import ParentMainLayout from './layout/ParentMainLayout'
import Dashboard from './pages/Dashboard'
import Home from './components/Home'
import DashboardHome from './pages/Home'
import Students from './pages/Students'
import Subjects from './pages/Subjects'
import Results from './pages/Results'
import Classes from './pages/Classes'
import Staff from './pages/Staff'
// payment
import Payment from './pages/Payment'
import SchoolFinance from './components/finance/School_Finance'
import SchoolPaymentMethod from './components/finance/School_Payment_Methods'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'create-school', element: <SchoolRegistration /> },
      { path: 'login', element: <SchoolLogin /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'parent/register', element: <ParentRegistration /> },
      { path: 'parent/login', element: <ParentLogin /> },
      { path: 'parent/forgot-password', element: <ParentForgotPassword /> },
    ],
  },
  {
    path: '/staff',
    children: [
      { path: 'register', element: <StaffRegistration /> },
      { path: 'login', element: <StaffLogin /> },
      { path: 'forgot-password', element: <StaffForgotPassword /> },
      { path: 'reset-password', element: <StaffResetPassword /> },
      {
        path: '',
        element: (
          <StaffProtectedRoute>
            <StaffMainLayout />
          </StaffProtectedRoute>
        ),
        children: [
          { path: 'dashboard', element: <StaffDashboard /> },
          { path: 'students', element: <StaffStudents /> },
          { path: 'classes', element: <StaffClasses /> },
          { path: 'subjects', element: <StaffSubjects /> },
          { path: 'results', element: <StaffResults /> },
          { path: 'input-marks', element: <InputMarks /> },
          { path: 'view-results', element: <ViewResults /> },
          { 
            path: 'statistics', 
            element: (
              <AuthenticatedRoute userType="staff">
                <StatisticsDashboard />
              </AuthenticatedRoute>
            ) 
          },
          { 
            path: 'statistics/school', 
            element: (
              <AuthenticatedRoute userType="staff">
                <SchoolDashboard />
              </AuthenticatedRoute>
            ) 
          },
          { 
            path: 'statistics/students', 
            element: (
              <AuthenticatedRoute userType="staff">
                <StudentStatistics />
              </AuthenticatedRoute>
            ) 
          },
          { 
            path: 'statistics/classes', 
            element: (
              <AuthenticatedRoute userType="staff">
                <ClassStatistics />
              </AuthenticatedRoute>
            ) 
          },
          { path: 'statistics/student/:studentId', element: <StudentAnalyticsWrapper /> },
          { path: 'statistics/class/:classId', element: <ClassAnalyticsWrapper /> },
          { path: 'statistics/subject/:subjectId', element: <SubjectAnalyticsWrapper /> },
          { 
            path: 'reports', 
            element: (
              <AuthenticatedRoute userType="staff">
                <ReportsDashboard />
              </AuthenticatedRoute>
            ) 
          },
          { 
            path: 'report-card/pdf', 
            element: (
              <AuthenticatedRoute userType="staff">
                <ReportsPage />
              </AuthenticatedRoute>
            ) 
          },
          { path: 'profile', element: <StaffProfile /> },
        ],
      },
    ],
  },
  {
    path: '/parent',
    children: [
      { path: 'register', element: <ParentRegistration /> },
      { path: 'login', element: <ParentLogin /> },
      { 
        path: 'dashboard', 
        element: (
          <ParentProtectedRoute>
            <ParentMainLayout title="Parent Dashboard">
              <ParentDashboardContent />
            </ParentMainLayout>
          </ParentProtectedRoute>
        ) 
      },
      { 
        path: 'analytics', 
        element: (
          <ParentProtectedRoute>
            <ParentMainLayout title="Student Analytics">
              <StudentAnalytics />
            </ParentMainLayout>
          </ParentProtectedRoute>
        ) 
      },
      { 
        path: 'results', 
        element: (
          <ParentProtectedRoute>
            <ParentMainLayout title="Academic Results">
              <AcademicResultsContent />
            </ParentMainLayout>
          </ParentProtectedRoute>
        ) 
      },
      { 
        path: 'profile', 
        element: (
          <ParentProtectedRoute>
            <ParentMainLayout title="Student Profile">
              <StudentProfileContent />
            </ParentMainLayout>
          </ParentProtectedRoute>
        ) 
      },
      { 
        path: 'fees', 
        element: (
          <ParentProtectedRoute>
            <ParentMainLayout title="Fee Information">
              <FeeInformation />
            </ParentMainLayout>
          </ParentProtectedRoute>
        ) 
      },
      { 
        path: 'attendance', 
        element: (
          <ParentProtectedRoute>
            <ParentMainLayout title="Attendance Records">
              <AttendanceContent />
            </ParentMainLayout>
          </ParentProtectedRoute>
        ) 
      },
      { 
        path: 'messages', 
        element: (
          <ParentProtectedRoute>
            <ParentMainLayout title="Messages">
              <MessagesContent />
            </ParentMainLayout>
          </ParentProtectedRoute>
        ) 
      },

    { 
      path: 'payment', 
      element: (
        <ParentProtectedRoute>
          <Payment />
        </ParentProtectedRoute>
      ) 
    },      
      { 
        path: 'report-card', 
        element: (
          <ParentProtectedRoute>
            <ReportsPage />
          </ParentProtectedRoute>
        ) 
      },
      { 
        path: 'report-card', 
        element: (
          <ParentProtectedRoute>
            <ReportsPage />
          </ParentProtectedRoute>
        ) 
      },

    ],
  },
  {
    path: '/school',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'students', element: <Students /> },
      { path: 'subjects', element: <Subjects /> },
      { path: 'results', element: <Results /> },
      { path: 'classes', element: <Classes /> },
      { path: 'staff', element: <Staff /> },
      { path: 'finance', element: <SchoolFinance /> },
      { path: ':schoolId/fee-payment-methods', element: <SchoolPaymentMethod /> },
      { path: '*', element: <div className="p-6">Not Found</div> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <StaffAuthProvider>
        <ParentAuthProvider>
          <RouterProvider router={router} />
        </ParentAuthProvider>
      </StaffAuthProvider>
    </AuthProvider>
  </StrictMode>,
)