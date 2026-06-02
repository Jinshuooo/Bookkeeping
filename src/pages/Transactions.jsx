import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLedger } from '../contexts/LedgerContext'
import { supabase } from '../lib/supabase'
import { format, isSameDay, parseISO, startOfMonth, subMonths, isSameMonth } from 'date-fns'
import { ArrowDownCircle, Plus, Trash2, Search, MoreHorizontal, Pencil, X, AlertTriangle } from 'lucide-react'
import { getCategoryIcon, getIconComponent } from '../lib/constants'
import { useCategories } from '../hooks/useCategories'
import { useSearchParams } from 'react-router-dom'

export default function Transactions() {
    const { user } = useAuth()
    const { currentLedger } = useLedger()
    const [searchParams, setSearchParams] = useSearchParams()
    const { categories } = useCategories()

    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '')
    const [selectedMonth, setSelectedMonth] = useState(new Date())
    const [reclassifyMode, setReclassifyMode] = useState(false)
    const [reclassifyCategory, setReclassifyCategory] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editCategory, setEditCategory] = useState('')
    const [saving, setSaving] = useState(false)

    // Handle reclassify mode from delete flow
    useEffect(() => {
        const searchFromParam = searchParams.get('search')
        const action = searchParams.get('action')
        if (searchFromParam && action === 'reclassify') {
            setSearchTerm(searchFromParam)
            setReclassifyMode(true)
            setReclassifyCategory(searchFromParam)
            // Clear the params from URL
            setSearchParams({}, { replace: true })
        }
    }, [])

    useEffect(() => {
        if (!user) return
        if (!currentLedger) {
            setLoading(false)
            return
        }
        setLoading(true)
        fetchTransactions()
    }, [user, currentLedger])

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('ledger_id', currentLedger.id)
                .eq('ledger_id', currentLedger.id)
                // REMOVED: .eq('user_id', user.id)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error
            setTransactions(data)
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('确定要删除这条记录吗？')) return

        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)

            if (error) throw error
            setTransactions(transactions.filter(t => t.id !== id))
        } catch (error) {
            alert('删除失败: ' + error.message)
        }
    }

    const handleEditStart = (t) => {
        setEditingId(t.id)
        setEditCategory(t.category)
    }

    const handleEditCancel = () => {
        setEditingId(null)
        setEditCategory('')
    }

    const handleEditSave = async (id) => {
        if (!editCategory.trim()) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from('transactions')
                .update({ category: editCategory.trim() })
                .eq('id', id)

            if (error) throw error

            setTransactions(prev =>
                prev.map(t => t.id === id ? { ...t, category: editCategory.trim() } : t)
            )
            setEditingId(null)
            setEditCategory('')

            // If in reclassify mode, check if all visible items are done
            if (reclassifyMode) {
                const { count, error: countError } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('ledger_id', currentLedger.id)
                    .eq('category', reclassifyCategory)

                if (!countError && count === 0) {
                    setReclassifyMode(false)
                    setReclassifyCategory('')
                    setSearchTerm('')
                }
            }
        } catch (error) {
            alert('保存失败: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const dismissReclassify = () => {
        setReclassifyMode(false)
        setReclassifyCategory('')
        setSearchTerm('')
    }

    // Get available categories for the edit dropdown
    const getAvailableCategories = (type) => {
        return categories
            .filter(c => c.type === type)
            .map(c => c.name)
    }

    // Filter transactions first
    const filteredTransactions = transactions.filter(t => {
        // 1. Filter by month
        if (selectedMonth !== 'all') {
            const transactionDate = parseISO(t.date)
            if (!isSameMonth(transactionDate, selectedMonth)) {
                return false
            }
        }

        // 2. Filter by search term
        if (!searchTerm) return true
        return (
            t.category.includes(searchTerm) ||
            (t.note && t.note.includes(searchTerm))
        )
    })

    // Calculate summary for filtered transactions
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0)

    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0)

    // Group filtered transactions by date
    const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
        const date = transaction.date
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(transaction)
        return groups
    }, {})

    const filteredDates = Object.keys(groupedTransactions)

    if (loading) return <div className="p-8 text-center text-muted">加载中...</div>

    if (!currentLedger) {
        return (
            <div className="p-8 text-center text-muted min-h-[50vh] flex items-center justify-center">
                请先创建或选择一个账本以查看明细
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary drop-shadow-sm">收支明细</h2>
                <div className="flex flex-row-reverse flex-wrap gap-2 items-center">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="搜索分类或备注"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl bg-surface border border-primary/10 text-primary placeholder-muted/50 focus:bg-surface focus:border-primary/30 outline-none transition-all"
                        />
                    </div>
                    <select
                        value={selectedMonth === 'all' ? 'all' : startOfMonth(selectedMonth).toISOString()}
                        onChange={(e) => {
                            const value = e.target.value
                            setSelectedMonth(value === 'all' ? 'all' : new Date(value))
                        }}
                        className="p-2 bg-surface rounded-xl border border-primary/10 text-sm font-medium text-primary outline-none cursor-pointer hover:bg-primary/5 transition-colors"
                    >
                        <option value="all">全部月份</option>
                        {Array.from({ length: 12 }).map((_, i) => {
                            const date = startOfMonth(subMonths(new Date(), i))
                            return (
                                <option key={i} value={date.toISOString()}>
                                    {format(date, 'yyyy年MM月')}
                                </option>
                            )
                        })}
                    </select>
                </div>
            </div>

            {/* Reclassify Banner */}
            {reclassifyMode && (
                <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-primary">
                            请逐条修改以下「{reclassifyCategory}」分类的账单
                        </p>
                        <p className="text-xs text-muted mt-1">
                            修改完毕后可返回设置页删除该分类
                        </p>
                    </div>
                    <button
                        onClick={dismissReclassify}
                        className="p-1.5 hover:bg-primary/5 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-muted" />
                    </button>
                </div>
            )}

            {/* Search Summary */}
            {searchTerm && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface p-4 rounded-2xl border border-primary/10 shadow-sm">
                        <div className="text-sm text-muted mb-1">搜索结果支出</div>
                        <div className="text-xl font-bold text-secondary">¥{totalExpense.toFixed(2)}</div>
                    </div>
                    <div className="bg-surface p-4 rounded-2xl border border-primary/10 shadow-sm">
                        <div className="text-sm text-muted mb-1">搜索结果收入</div>
                        <div className="text-xl font-bold text-primary">¥{totalIncome.toFixed(2)}</div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {filteredDates.length === 0 ? (
                    <div className="text-center py-12 text-muted">
                        没有找到相关记录
                    </div>
                ) : (
                    filteredDates.map(date => (
                        <div key={date} className="space-y-3">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-sm font-medium text-muted">
                                    {format(parseISO(date), 'yyyy年MM月dd日')}
                                </h3>
                                <div className="text-xs text-muted">
                                    支出: ¥{groupedTransactions[date]
                                        .filter(t => t.type === 'expense')
                                        .reduce((acc, t) => acc + t.amount, 0)
                                        .toFixed(2)}
                                </div>
                            </div>

                            <div className="bg-surface border border-primary/10 rounded-2xl shadow-sm divide-y divide-primary/5 overflow-hidden">
                                {groupedTransactions[date].map(t => {
                                    const Icon = getCategoryIcon(t.type, t.category, categories)
                                    const isEditing = editingId === t.id
                                    const availableCats = getAvailableCategories(t.type)

                                    // If no categories yet — fallback
                                    if (availableCats.length === 0) {
                                        availableCats.push(t.category)
                                    }

                                    return (
                                        <div key={t.id} className="group p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                                                    }`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    {isEditing ? (
                                                        <select
                                                            value={editCategory}
                                                            onChange={(e) => setEditCategory(e.target.value)}
                                                            className="w-full px-2 py-1 rounded-lg bg-background border border-primary/10 text-sm font-medium text-primary outline-none focus:border-primary/30"
                                                        >
                                                            {availableCats.map(catName => (
                                                                <option key={catName} value={catName}>{catName}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div className="font-medium text-primary truncate">{t.category}</div>
                                                    )}
                                                    <div className="text-xs text-muted truncate">{t.note || '无备注'}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className={`font-bold ${t.type === 'income' ? 'text-primary' : 'text-secondary'
                                                    }`}>
                                                    {t.type === 'income' ? '+' : '-'} {t.amount.toFixed(2)}
                                                </div>
                                                {isEditing ? (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleEditSave(t.id)}
                                                            disabled={saving}
                                                            className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors text-xs font-medium"
                                                        >
                                                            {saving ? '...' : '保存'}
                                                        </button>
                                                        <button
                                                            onClick={handleEditCancel}
                                                            disabled={saving}
                                                            className="p-1.5 text-muted hover:text-error rounded-lg transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEditStart(t)}
                                                            className="p-1.5 text-muted hover:text-primary rounded-lg transition-colors"
                                                            title="编辑分类"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(t.id)}
                                                            className="p-1.5 text-muted hover:text-error rounded-lg transition-colors"
                                                            title="删除"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
