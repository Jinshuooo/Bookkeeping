import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import {
    Utensils, Bus, ShoppingBag, Home, Zap,
    Gamepad2, GraduationCap, Stethoscope, Plane,
    Briefcase, DollarSign, Gift, MoreHorizontal,
    Calendar, FileText
} from 'lucide-react'

const CATEGORIES = {
    expense: [
        { id: 'food', name: '餐饮', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
        { id: 'transport', name: '交通', icon: Bus, color: 'bg-blue-100 text-blue-600' },
        { id: 'shopping', name: '购物', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600' },
        { id: 'housing', name: '居住', icon: Home, color: 'bg-indigo-100 text-indigo-600' },
        { id: 'utilities', name: '水电', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
        { id: 'entertainment', name: '娱乐', icon: Gamepad2, color: 'bg-purple-100 text-purple-600' },
        { id: 'education', name: '教育', icon: GraduationCap, color: 'bg-green-100 text-green-600' },
        { id: 'medical', name: '医疗', icon: Stethoscope, color: 'bg-red-100 text-red-600' },
        { id: 'travel', name: '旅行', icon: Plane, color: 'bg-cyan-100 text-cyan-600' },
        { id: 'other', name: '其他', icon: MoreHorizontal, color: 'bg-slate-100 text-slate-600' },
    ],
    income: [
        { id: 'salary', name: '工资', icon: Briefcase, color: 'bg-green-100 text-green-600' },
        { id: 'bonus', name: '奖金', icon: DollarSign, color: 'bg-yellow-100 text-yellow-600' },
        { id: 'investment', name: '理财', icon: Zap, color: 'bg-blue-100 text-blue-600' },
        { id: 'gift', name: '礼金', icon: Gift, color: 'bg-pink-100 text-pink-600' },
        { id: 'other_income', name: '其他', icon: MoreHorizontal, color: 'bg-slate-100 text-slate-600' },
    ]
}

export default function AddTransaction() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState('expense') // 'expense' or 'income'
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState(null)
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [note, setNote] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!amount || !category) return

        setLoading(true)
        try {
            const { error } = await supabase.from('transactions').insert({
                user_id: user.id,
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
            <h2 className="text-2xl font-bold text-white drop-shadow-md">记一笔</h2>

            <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg overflow-hidden">
                {/* Type Toggle */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setType('expense')}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${type === 'expense'
                            ? 'bg-red-500/20 text-red-100 border-b-2 border-red-400'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        支出
                    </button>
                    <button
                        onClick={() => setType('income')}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${type === 'income'
                            ? 'bg-green-500/20 text-green-100 border-b-2 border-green-400'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        收入
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">金额</label>
                        <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-bold text-white/60">¥</span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-8 text-4xl font-bold text-white bg-transparent placeholder-white/20 outline-none"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Category Grid */}
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-4">分类</label>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                            {CATEGORIES[type].map((cat) => {
                                const Icon = cat.icon
                                const isSelected = category?.id === cat.id
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${isSelected ? 'bg-white/20 scale-105 shadow-inner' : 'hover:bg-white/10'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${isSelected ? 'bg-white text-indigo-600' : 'bg-white/10 text-white/60'
                                            }`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-white/60'
                                            }`}>
                                            {cat.name}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Date & Note */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                                <Calendar className="w-4 h-4" /> 日期
                            </label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white focus:bg-white/20 focus:border-white/30 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                                <FileText className="w-4 h-4" /> 备注
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="写点什么..."
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 focus:bg-white/20 focus:border-white/30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !amount || !category}
                        className="w-full bg-white/20 hover:bg-white/30 border border-white/20 text-white font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg backdrop-blur-sm"
                    >
                        {loading ? '保存中...' : '保存'}
                    </button>
                </form>
            </div>
        </div>
    )
}
