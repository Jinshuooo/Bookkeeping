import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, List, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
    const { signOut } = useAuth()
    const location = useLocation()

    const navigation = [
        { name: '仪表盘', href: '/', icon: LayoutDashboard },
        { name: '记一笔', href: '/add', icon: PlusCircle },
        { name: '明细', href: '/transactions', icon: List },
        { name: '设置', href: '/settings', icon: Settings },
    ]

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-background text-primary">
            {/* Sidebar for Desktop */}
            <div className="hidden md:flex flex-col w-64 h-[calc(100vh-2rem)] m-4 rounded-3xl bg-surface border border-primary/10 shadow-sm sticky top-4">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-primary">
                        极简记账
                    </h1>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    {navigation.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-primary text-surface shadow-sm'
                                    : 'text-muted hover:bg-primary/5 hover:text-primary'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>
                <div className="p-4 border-t border-primary/10">
                    <button
                        onClick={signOut}
                        className="flex items-center gap-3 px-4 py-3 w-full text-muted hover:text-error hover:bg-error/10 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">退出登录</span>
                    </button>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden bg-surface border-b border-primary/10 sticky top-0 z-10 px-4 py-3 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold text-primary">
                    极简记账
                </h1>
                <button onClick={signOut} className="p-2 text-muted hover:text-primary">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                <div className="max-w-4xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-primary/10 px-6 py-2 z-10 safe-area-bottom">
                <nav className="flex justify-between items-center">
                    {navigation.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive ? 'text-primary' : 'text-muted'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'fill-current/10' : ''}`} />
                                <span className="text-[10px] font-medium">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}
