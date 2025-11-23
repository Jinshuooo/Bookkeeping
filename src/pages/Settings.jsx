import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Shield, Github, HelpCircle, Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { utils, writeFile } from 'xlsx'
import { format } from 'date-fns'

export default function Settings() {
    const { user, signOut } = useAuth()
    const [exporting, setExporting] = useState(false)

    const handleExport = async () => {
        try {
            setExporting(true)

            // 1. Fetch all transactions
            const { data: transactions, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })

            if (error) throw error

            if (!transactions || transactions.length === 0) {
                alert('暂无数据可导出')
                return
            }

            // 2. Format data for Excel
            const exportData = transactions.map(t => ({
                '日期': format(new Date(t.date), 'yyyy-MM-dd'),
                '类型': t.type === 'income' ? '收入' : '支出',
                '金额': t.amount,
                '分类': t.category,
                '备注': t.note || ''
            }))

            // 3. Create workbook and worksheet
            const wb = utils.book_new()
            const ws = utils.json_to_sheet(exportData)

            // Set column widths
            const wscols = [
                { wch: 15 }, // Date
                { wch: 10 }, // Type
                { wch: 15 }, // Amount
                { wch: 15 }, // Category
                { wch: 30 }  // Note
            ]
            ws['!cols'] = wscols

            utils.book_append_sheet(wb, ws, "收支明细")

            // 4. Download file
            const fileName = `记账数据_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
            writeFile(wb, fileName)

        } catch (error) {
            console.error('Export failed:', error)
            alert('导出失败: ' + error.message)
        } finally {
            setExporting(false)
        }
    }

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

            {/* Data Management */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white px-2">数据管理</h3>
                <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg overflow-hidden">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 text-green-200 rounded-lg">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-medium text-white">导出数据</div>
                                <div className="text-xs text-white/60">将所有记录导出为 Excel 表格</div>
                            </div>
                        </div>
                        {exporting ? (
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                            <Download className="w-5 h-5 text-white/60" />
                        )}
                    </button>
                </div>
            </div>

            {/* App Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white px-2">关于</h3>
                <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 text-blue-200 rounded-lg">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-white">关于应用</span>
                        </div>
                        <span className="text-white/60 text-sm">v1.5.1</span>
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
            </div>

            {/* Coming Soon */}
            <div className="text-center pt-8">
                <p className="text-white/40 text-sm">
                    更多功能（自定义分类、多账本）正在开发中...
                </p>
            </div>
        </div>
    )
}
