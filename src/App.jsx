import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Auth from './pages/Auth'

// Protected Route Component
function PrivateRoute({ children }) {
    const { user } = useAuth()
    return user ? children : <Navigate to="/auth" />
}

import AddTransaction from './pages/AddTransaction'

import Dashboard from './pages/Dashboard'

import Transactions from './pages/Transactions'

import Settings from './pages/Settings'

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/auth" element={<Auth />} />

                    <Route path="/" element={
                        <PrivateRoute>
                            <Layout />
                        </PrivateRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path="add" element={<AddTransaction />} />
                        <Route path="transactions" element={<Transactions />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
