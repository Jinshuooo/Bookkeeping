import { useAuth } from '../contexts/AuthContext'
import { User, Shield, Github, HelpCircle } from 'lucide-react'

export default function Settings() {
    const { user, signOut } = useAuth()

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-white drop-shadow-md">设置</h2>

            {/* User Profile */}
            <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                    {user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">当前账户</h3>
                    <p className="text-white/80">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                        <Shield className="w-3 h-3" />
                        已通过 Supabase 安全验证
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="px-4 py-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-100 rounded-lg text-sm font-medium transition-colors border border-white/10"
                >
                    退出登录
                </button>
            </div>

            {/* App Info */}
            <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 text-blue-200 rounded-lg">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-white">关于应用</span>
                    </div>
                    <span className="text-white/60 text-sm">v1.3.0</span>
                </div>

                <a
                    href="https://github.com/Jinshuooo"
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 text-white rounded-lg">
                            <Github className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-white">作者主页</span>
                    </div>
                    <span className="text-white/60 text-sm">GitHub</span>
                </a>
            </div>

            {/* Coming Soon */}
            <div className="text-center pt-8">
                <p className="text-white/40 text-sm">
                    更多功能（自定义分类、数据导出、多账本）正在开发中...
                </p>
            </div>
        </div>
    )
}
