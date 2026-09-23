import { Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import HomeRedirect from './components/HomeRedirect'
import NavBar from './components/NavBar'
import SafetyTermsModal from './components/SafetyTermsModal'
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
import ConviviosPage from './pages/ConviviosPage'
import UserPublicProfilePage from './pages/UserPublicProfilePage'
import UserSearchPage from './pages/UserSearchPage'

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const { user } = useAuth()

  return (
    <>
      <NavBar />
      {user && !user.safetyTermsAccepted && <SafetyTermsModal />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
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
          path="/anuncio"
          element={
            <ProtectedRoute>
              <ListingPage />
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
        <Route
          path="/convivios"
          element={
            <ProtectedRoute>
              <ConviviosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pessoas"
          element={
            <ProtectedRoute>
              <UserSearchPage />
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
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </>
  )
}
