import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import AdminRoute from './components/AdminRoute'
import HomeRedirect from './components/HomeRedirect'
import NavBar from './components/NavBar'
import BottomNav from './components/BottomNav'
import SafetyTermsModal from './components/SafetyTermsModal'
import LegalTermsModal from './components/LegalTermsModal'
import EmailConfirmationBanner from './components/EmailConfirmationBanner'
import ThemeToggle from './components/ThemeToggle'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProfilePage from './pages/ProfilePage'
import ListingPage from './pages/ListingPage'
import BrowsePage from './pages/BrowsePage'
import ConversationsPage from './pages/ConversationsPage'
import ChatPage from './pages/ChatPage'
import PaymentsPage from './pages/PaymentsPage'
import PaymentReturnPage from './pages/PaymentReturnPage'
import UserPublicProfilePage from './pages/UserPublicProfilePage'
import ListingDetailPage from './pages/ListingDetailPage'
import HomePage from './pages/HomePage'
import OnboardingPage from './pages/OnboardingPage'
import AdminPage from './pages/AdminPage'
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage'
import TermsPage from './pages/legal/TermsPage'
import ConfirmEmailPage from './pages/ConfirmEmailPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

function AppContent() {
  const { user } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isOnboarding = location.pathname === '/onboarding'
  const isLegalPage = location.pathname === '/termos' || location.pathname === '/privacidade'

  return (
    <>
      {!isOnboarding && <NavBar />}
      <EmailConfirmationBanner />
      {!user && !isHome && (
        <div className="fixed right-4 top-4 z-30">
          <ThemeToggle className="border border-line bg-surface" />
        </div>
      )}
      {/* Primeiro o aceite dos Termos/Política (LGPD); nas próprias páginas jurídicas não bloqueia a leitura. */}
      {user && !user.legalTermsAccepted && !isLegalPage && <LegalTermsModal />}
      {/* O aviso de segurança é para quem vai negociar moradia; a conta de admin não negocia. */}
      {user && user.legalTermsAccepted && !user.admin && !user.safetyTermsAccepted && <SafetyTermsModal />}
      <div className={user && !isOnboarding ? 'pb-16 lg:pb-0' : ''}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/confirmar-email/:token" element={<ConfirmEmailPage />} />
        <Route path="/termos" element={<TermsPage />} />
        <Route path="/privacidade" element={<PrivacyPolicyPage />} />
        <Route path="/redefinir-senha/:token" element={<ResetPasswordPage />} />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/anuncio"
          element={
            <ProtectedRoute>
              <RoleRoute role="ADVERTISER" redirectTo="/browse">
                <ListingPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse"
          element={
            <ProtectedRoute>
              <RoleRoute role="RENTER" redirectTo="/anuncio">
                <BrowsePage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pagamentos"
          element={
            <ProtectedRoute>
              <RoleRoute role="ADVERTISER" redirectTo="/browse">
                <PaymentsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pagamentos/retorno"
          element={
            <ProtectedRoute>
              <RoleRoute role="ADVERTISER" redirectTo="/browse">
                <PaymentReturnPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversas"
          element={
            <ProtectedRoute>
              <ConversationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversas/:conversationId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route path="/convivios" element={<Navigate to="/perfil" replace />} />
        <Route
          path="/anuncios/:listingId"
          element={
            <ProtectedRoute>
              <ListingDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios/:userId"
          element={
            <ProtectedRoute>
              <UserPublicProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
      </div>
      {!isOnboarding && <BottomNav />}
    </>
  )
}
