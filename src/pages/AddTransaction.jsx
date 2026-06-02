import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLedger } from '../contexts/LedgerContext'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { useCategories } from '../hooks/useCategories'
import { getIconComponent } from '../lib/constants'
import { Calendar, FileText, Loader2 } from 'lucide-react'

export default function AddTransaction() {
    const { user } = useAuth()
    const { currentLedger } = useLedger()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState('expense')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState(null)
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [note, setNote] = useState('')

    const { categories, loading: categoriesLoading } = useCategories()
    const filteredCategories = categories.filter(c => c.type === type)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!amount || !category) return

        setLoading(true)
        try {
            const { error } = await supabase.from('transactions').insert({
                user_id: user.id,
                ledger_id: currentLedger.id,
                type,
                amount: parseFloat(amount),
                category: category.name,
                date,
                note
            })

            if (error) throw error
            navigate('/')
        } catch (error) {
            alert('保存失败: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-primary drop-shadow-sm">记一笔</h2>

            <div className="bg-surface border border-primary/10 rounded-2xl shadow-sm overflow-hidden">
                {/* Type Toggle */}
                <div className="flex border-b border-primary/10">
                    <button
                        onClick={() => setType('expense')}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${type === 'expense'
                            ? 'bg-primary text-surface border-b-2 border-primary'
                            : 'text-muted hover:bg-primary/5 hover:text-primary'
                            }`}
                    >
                        支出
                    </button>
                    <button
                        onClick={() => setType('income')}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${type === 'income'
                            ? 'bg-primary text-surface border-b-2 border-primary'
                            : 'text-muted hover:bg-primary/5 hover:text-primary'
                            }`}
                    >
                        收入
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-muted mb-2">金额</label>
                        <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-bold text-muted">¥</span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-8 text-4xl font-bold text-primary bg-transparent placeholder-muted/50 outline-none"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Category Grid */}
                    <div>
                        <label className="block text-sm font-medium text-muted mb-4">分类</label>
                        {categoriesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-muted" />
                            </div>
                        ) : filteredCategories.length === 0 ? (
                            <div className="text-center py-8 text-muted text-sm">
                                暂无分类，请前往
                                <button
                                    type="button"
                                    onClick={() => navigate('/settings')}
                                    className="text-primary hover:underline font-medium mx-1"
                                >
                                    设置 → 分类管理
                                </button>
                                添加
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                                {filteredCategories.map((cat) => {
                                    const Icon = getIconComponent(cat.icon)
                                    const isSelected = category?.id === cat.id
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${isSelected ? 'bg-primary/10 scale-105 shadow-inner' : 'hover:bg-primary/5'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${isSelected
                                                ? type === 'income' ? 'bg-primary text-surface' : 'bg-secondary text-surface'
                                                : 'bg-surface text-muted border-2 border-muted'
                                                }`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-muted'
                                                }`}>
                                                {cat.name}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Date & Note */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-muted">
                                <Calendar className="w-4 h-4" /> 日期
                            </label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-surface border border-primary/10 text-primary focus:bg-surface focus:border-primary/30 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-muted">
                                <FileText className="w-4 h-4" /> 备注
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="写点什么..."
                                className="w-full px-4 py-3 rounded-xl bg-surface border border-primary/10 text-primary placeholder-muted/50 focus:bg-surface focus:border-primary/30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !amount || !category}
                        className="w-full bg-primary hover:bg-primary/90 border border-primary text-surface font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {loading ? '保存中...' : '保存'}
                    </button>
                </form>
            </div>
        </div>
    )
}
