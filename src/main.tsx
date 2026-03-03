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
import StaffProtectedRoute from './components/authentication/StaffProtectedRoute'
import ParentProtectedRoute from './components/authentication/ParentProtectedRoute'
import AuthenticatedRoute from './components/authentication/AuthenticatedRoute'
import LandingLayout from './layout/LandingLayout'
import StaffMainLayout from './layout/StaffMainLayout'
import SchoolRegistration from './components/school/SchoolRegistration'
import SchoolProfile from './components/school/profile'
import StaffRegistration from './components/staff/StaffRegistration'
import StaffForgotPassword from './components/staff/StaffForgotPassword'
import UnifiedLogin from './components/authentication/UnifiedLogin'
import UnifiedRegister from './components/authentication/UnifiedRegister'
import StaffResetPassword from './components/staff/StaffResetPassword'
import StaffDashboard from './components/staff/StaffDashboard'
import StaffStudents from './components/staff/StaffStudents'
import StaffClasses from './components/staff/StaffClasses'
import StaffSubjects from './components/staff/StaffSubjects'
import StaffResults from './components/staff/StaffResults'
import StaffProfile from './components/staff/StaffProfile'
import InputMarks from './components/staff/marks/InputMarks'
import ViewResults from './components/staff/marks/ViewResults'
import EditMarks from './components/staff/marks/EditMarks'
import FullResults from './components/staff/marks/FullResults'
import StatisticsDashboard from './pages/StatisticsDashboard'
import { StudentAnalyticsWrapper, ClassAnalyticsWrapper, SubjectAnalyticsWrapper } from './components/staff/AnalyticsWrappers'
import SchoolDashboard from './pages/SchoolDashboard'
import StudentStatistics from './components/generalFiles/analytics/StudentStatistics'
import SubjectList from './components/generalFiles/analytics/SubjectList'
import ClassStatistics from './components/generalFiles/analytics/ClassStatistics'
import ReportsDashboard from './components/generalFiles/reports/ReportsDashboard'
import AdminStudents from './components/generalFiles/students/Students'
import AdminClasses from './components/generalFiles/classes/Classes'
import AdminSubjects from './components/generalFiles/subjects/Subjects'
import StudentProfile from './components/students/StudentProfile'
import ReportsPage from './components/templates/ReportsPage'
import TemplateFullPreview from './components/templates/TemplateFullPreview'
import TimetableDashboard from './components/timetable/TimetableDashboard'
import SubjectFrequency from './components/timetable/SubjectFrequency/SubjectFrequency'
import TeacherSubjectAssignment from './components/timetable/TeacherSubjectAssignment/TeacherSubjectAssignment'
import Priorities from './components/timetable/priorities/Priorities'
import ClassSchedules from './components/timetable/classSchedule/ClassSchedules'
import Teachers from './components/timetable/teachers/Teachers'
import TeacherProfile from './components/timetable/teachers/TeacherProfile'
import BlockSubjects from './components/timetable/blockSubjects/BlockSubjects'
import TimetableView from './components/timetable/generation/TimetableView'
import TeacherTimetableView from './components/timetable/TeacherTimetableView'
import AllTeachersSchedules from './components/timetable/AllTeachersSchedules'
import FailedSchedules from './components/timetable/generation/FailedSchedules'
import Grading from './components/results/grading'
import UploadResults from './components/nationalExams.tsx/uploadResults'
import NationalExamStatistics from './components/nationalExams.tsx/NationalExamStatistics'
import InvoiceManagement from './components/feeManagement/invoice'
import BursarDashboard from './components/feeManagement/BursarDashboard'
import Payments from './components/feeManagement/payments'
import Reconcile from './components/feeManagement/Reconcile'
import ParentPaymentHistory from './components/feeManagement/ParentPaymentHistory'
import PayFees from './components/feeManagement/PayFees'
import PaymentInstructions from './components/feeManagement/PaymentInstructions'
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
import Home from './components/Home'
import Pricing from './components/pricing'
import SubscriptionPayment from './components/school/SubscriptionPayment'
import Staff from './pages/Staff'
import FeaturesPage from './components/pages/FeaturesPage'
import AboutPage from './components/pages/AboutPage'
import ContactPage from './components/pages/ContactPage'
import MessagingHub from './components/messaging/MessagingHub'
import StaffMessage from './components/messaging/StaffMessage'
import ParentMessageType from './components/messaging/ParentMessageType'
import ParentCustomMessage from './components/messaging/ParentCustomMessage'
import ParentExamResults from './components/messaging/ParentExamResults'
import ParentTermSummary from './components/messaging/ParentTermSummary'
// payment
import Payment from './pages/Payment'
import SchoolFinance from './components/finance/School_Finance'
import SchoolPaymentMethod from './components/finance/School_Payment_Methods'
import { RouteErrorBoundary } from './components/ErrorBoundary'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Home /> },
      { path: 'features', element: <FeaturesPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'pricing', element: <Pricing /> },
      { path: 'subscription-payment', element: <SubscriptionPayment /> },
      { path: 'create-school', element: <SchoolRegistration /> },
      { path: 'register-school', element: <SchoolRegistration /> },
      { path: 'register', element: <UnifiedRegister /> },
      { path: 'login', element: <UnifiedLogin /> },
      { path: 'forgot-password', element: <StaffForgotPassword /> },
      { path: 'reset-password', element: <StaffResetPassword /> },
      { path: 'staff/register', element: <StaffRegistration /> },
      { path: 'staff/forgot-password', element: <StaffForgotPassword /> },
      { path: 'staff/reset-password', element: <StaffResetPassword /> },
      { path: 'parent/register', element: <ParentRegistration /> },
      { path: 'parent/login', element: <ParentLogin /> },
      { path: 'parent/forgot-password', element: <ParentForgotPassword /> },
    ],
  },
  // Main authenticated routes (dashboard, students, classes, etc.)
  {
    path: '/',
    errorElement: <RouteErrorBoundary />,
    element: (
      <StaffProtectedRoute>
        <StaffMainLayout />
      </StaffProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <StaffDashboard /> },
      { path: 'students', element: <StaffStudents /> },
      { path: 'students/:studentId', element: <StudentProfile /> },
      { path: 'classes', element: <StaffClasses /> },
      { path: 'subjects', element: <StaffSubjects /> },
      // Admin routes for Administrative Staff (uses school admin pages)
      { 
        path: 'admin/students', 
        element: (
          <AuthenticatedRoute userType="staff">
            <AdminStudents />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'admin/students/:studentId', 
        element: (
          <AuthenticatedRoute userType="staff">
            <StudentProfile />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'admin/classes', 
        element: (
          <AuthenticatedRoute userType="staff">
            <AdminClasses />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'admin/subjects', 
        element: (
          <AuthenticatedRoute userType="staff">
            <AdminSubjects />
          </AuthenticatedRoute>
        ) 
      },
      { path: 'results', element: <StaffResults /> },
      { path: 'input-marks', element: <InputMarks /> },
      { path: 'view-results', element: <ViewResults /> },
      { path: 'edit-marks', element: <EditMarks /> },
      { path: 'full-results', element: <FullResults /> },
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
      { 
        path: 'statistics/subjects', 
        element: (
          <AuthenticatedRoute userType="staff">
            <SubjectList />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'statistics/subject/:subjectId', 
        element: (
          <AuthenticatedRoute userType="staff">
            <SubjectAnalyticsWrapper />
          </AuthenticatedRoute>
        ) 
      },
      { path: 'statistics/student/:studentId', element: <StudentAnalyticsWrapper /> },
      { path: 'statistics/class/:classId', element: <ClassAnalyticsWrapper /> },
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
      { 
        path: 'report-card/pdf/:templateName', 
        element: (
          <AuthenticatedRoute userType="staff">
            <TemplateFullPreview />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'messaging', 
        element: (
          <AuthenticatedRoute userType="staff">
            <MessagingHub />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'messaging/staff', 
        element: (
          <AuthenticatedRoute userType="staff">
            <StaffMessage />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'messaging/parent', 
        element: (
          <AuthenticatedRoute userType="staff">
            <ParentMessageType />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'messaging/parent/custom', 
        element: (
          <AuthenticatedRoute userType="staff">
            <ParentCustomMessage />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'messaging/parent/exam-results', 
        element: (
          <AuthenticatedRoute userType="staff">
            <ParentExamResults />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'messaging/parent/term-summary', 
        element: (
          <AuthenticatedRoute userType="staff">
            <ParentTermSummary />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable', 
        element: (
          <AuthenticatedRoute userType="staff">
            <TimetableDashboard />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/time', 
        element: (
          <AuthenticatedRoute userType="staff">
            <TimetableDashboard />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/schedule', 
        element: (
          <AuthenticatedRoute userType="staff">
            <TimetableDashboard />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/classes', 
        element: (
          <AuthenticatedRoute userType="staff">
            <TimetableDashboard />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/subject-frequency', 
        element: (
          <AuthenticatedRoute userType="staff">
            <SubjectFrequency />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/teacher-subject', 
        element: (
          <AuthenticatedRoute userType="staff">
            <TeacherSubjectAssignment />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/priorities', 
        element: (
          <AuthenticatedRoute userType="staff">
            <Priorities />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/class-schedules', 
        element: (
          <AuthenticatedRoute userType="staff">
            <ClassSchedules />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/teachers', 
        element: (
          <AuthenticatedRoute userType="staff">
            <Teachers />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/teachers/:id', 
        element: (
          <AuthenticatedRoute userType="staff">
            <TeacherProfile />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/block-subjects', 
        element: (
          <AuthenticatedRoute userType="staff">
            <BlockSubjects />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/view', 
        element: (
          <AuthenticatedRoute userType="staff">
            <TeacherTimetableView />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/all-teachers', 
        element: (
          <AuthenticatedRoute userType="staff">
            <AllTeachersSchedules />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/manage', 
        element: (
          <AuthenticatedRoute userType="staff">
            <TimetableView />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'timetable/failed', 
        element: (
          <AuthenticatedRoute userType="staff">
            <FailedSchedules />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'grading', 
        element: (
          <AuthenticatedRoute userType="staff">
            <Grading />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'national-exams', 
        element: (
          <AuthenticatedRoute userType="staff">
            <UploadResults />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'national-exams/upload', 
        element: (
          <AuthenticatedRoute userType="staff">
            <UploadResults />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'national-exams/statistics', 
        element: (
          <AuthenticatedRoute userType="staff">
            <NationalExamStatistics />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'finance/invoices', 
        element: (
          <AuthenticatedRoute userType="staff">
            <InvoiceManagement />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'finance/dashboard', 
        element: (
          <AuthenticatedRoute userType="staff">
            <BursarDashboard />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'finance/payments', 
        element: (
          <AuthenticatedRoute userType="staff">
            <Payments />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'finance/reconcile', 
        element: (
          <AuthenticatedRoute userType="staff">
            <Reconcile />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'finance', 
        element: (
          <AuthenticatedRoute userType="staff">
            <SchoolFinance />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: ':schoolId/fee-payment-methods', 
        element: (
          <AuthenticatedRoute userType="staff">
            <SchoolPaymentMethod />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'staff-management', 
        element: (
          <AuthenticatedRoute userType="staff">
            <Staff />
          </AuthenticatedRoute>
        ) 
      },
      { 
        path: 'school-profile', 
        element: (
          <AuthenticatedRoute userType="staff">
            <SchoolProfile />
          </AuthenticatedRoute>
        ) 
      },
      { path: 'profile', element: <StaffProfile /> },
    ],
  },
  // Parent routes
  {
    path: '/parent',
    errorElement: <RouteErrorBoundary />,
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
        path: 'payment-history', 
        element: (
          <ParentProtectedRoute>
            <ParentMainLayout title="Payment History">
              <ParentPaymentHistory />
            </ParentMainLayout>
          </ParentProtectedRoute>
        ) 
      },
      { 
        path: 'pay-fees', 
        element: (
          <ParentProtectedRoute>
            <ParentMainLayout title="Pay Fees">
              <PayFees />
            </ParentMainLayout>
          </ParentProtectedRoute>
        ) 
      },
      { 
        path: 'pay-fees/:methodId', 
        element: (
          <ParentProtectedRoute>
            <ParentMainLayout title="Payment Instructions">
              <PaymentInstructions />
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
