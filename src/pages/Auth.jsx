import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Wallet } from 'lucide-react'

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { signIn, signUp } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            if (isLogin) {
                const { error } = await signIn({ email, password })
                if (error) throw error
                navigate('/')
            } else {
                const { error } = await signUp({ email, password })
                if (error) throw error
                navigate('/')
            }
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white/30 backdrop-blur-md border border-white/20 w-full max-w-md rounded-3xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <div className="bg-white/40 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white drop-shadow-md">
                        {isLogin ? '欢迎回来' : '创建账户'}
                    </h2>
                    <p className="text-white/80 mt-2">
                        {isLogin ? '登录以管理您的财务' : '开始您的理财之旅'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/30 text-white p-4 rounded-xl text-sm mb-6 backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/90">邮箱</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/10 text-white placeholder-white/50 focus:bg-white/30 focus:border-white/30 focus:ring-2 focus:ring-white/20 outline-none transition-all"
                            placeholder="your@email.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/90">密码</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/10 text-white placeholder-white/50 focus:bg-white/30 focus:border-white/30 focus:ring-2 focus:ring-white/20 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white/20 hover:bg-white/30 border border-white/20 text-white font-bold py-3 rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg backdrop-blur-sm"
                    >
                        {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-white/80 hover:text-white font-medium text-sm transition-colors"
                    >
                        {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
                    </button>
                </div>
            </div>
        </div>
    )
}
