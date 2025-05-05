import React, { Suspense, useState, useCallback, useEffect } from 'react'
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useLocation,
  useNavigate 
} from 'react-router-dom'
import { CartProvider } from './components/context/CartContext'
import Header from './components/Header'
import CartDropdown from './components/CartDropdown'
import { supabase } from './lib/supabaseClient'

// Import components directly to ensure they load
import Home from './components/Home'
import SignInPage from './components/SignInPage'
import CheckoutPage from './components/CheckoutPage'
import TermsOfService from './components/TermsOfService'
import PrivacyPolicy from './components/PrivacyPolicy'
import RefundPolicy from './components/RefundPolicy'
import PolicyPage from './components/PolicyPage'
import UserDashboard from './components/UserDashboard'

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#0a0415] z-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#8a4fff]"></div>
  </div>
)

// Authentication Wrapper Component
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setIsAuthenticated(true)
      } else {
        navigate('/signin', { 
          state: { 
            from: location.pathname,
            message: 'Please sign in to access this page' 
          }
        })
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [navigate, location])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return isAuthenticated ? <>{children}</> : null
}

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }

    checkAuthStatus()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const openCartHandler = () => {
      setIsCartOpen(true)
    }

    const closeCartHandler = () => {
      setIsCartOpen(false)
    }

    window.addEventListener('openCart', openCartHandler)
    window.addEventListener('closeCart', closeCartHandler)

    return () => {
      window.removeEventListener('openCart', openCartHandler)
      window.removeEventListener('closeCart', closeCartHandler)
    }
  }, [])

  const toggleCart = useCallback(() => {
    setIsCartOpen(prevState => !prevState)
  }, [])

  const closeCart = useCallback(() => {
    setIsCartOpen(false)
  }, [])

  return (
    <Router>
      <CartProvider>
        <div className="bg-[#0a0415] text-white min-h-screen">
          <Header onCartToggle={toggleCart} />
          <CartDropdown 
            isOpen={isCartOpen} 
            onClose={closeCart} 
          />
          
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route 
                path="/signin" 
                element={
                  isAuthenticated ? <Navigate to="/" replace /> : <SignInPage />
                } 
              />
              <Route 
                path="/checkout" 
                element={
                  <PrivateRoute>
                    <CheckoutPage />
                  </PrivateRoute>
                } 
              />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/refund" element={<RefundPolicy />} />
              <Route path="/policy" element={<PolicyPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <UserDashboard />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </Suspense>
        </div>
      </CartProvider>
    </Router>
  )
}

export default App
