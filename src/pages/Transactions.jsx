import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { format, isSameDay, parseISO } from 'date-fns'
import { ArrowDownCircle, Plus, Trash2, Search } from 'lucide-react'

export default function Transactions() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchTransactions()
    }, [user])

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
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

    // Group transactions by date
    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = transaction.date
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(transaction)
        return groups
    }, {})

    const filteredDates = Object.keys(groupedTransactions).filter(date => {
        if (!searchTerm) return true
        const dayTransactions = groupedTransactions[date]
        return dayTransactions.some(t =>
            t.category.includes(searchTerm) ||
            (t.note && t.note.includes(searchTerm))
        )
    })

    if (loading) return <div className="p-8 text-center text-muted">加载中...</div>

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary drop-shadow-sm">收支明细</h2>
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
            </div>

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
                                {groupedTransactions[date].map(t => (
                                    <div key={t.id} className="group p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                                                }`}>
                                                {t.type === 'income' ? <Plus className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-primary">{t.category}</div>
                                                <div className="text-xs text-muted">{t.note || '无备注'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`font-bold ${t.type === 'income' ? 'text-primary' : 'text-secondary'
                                                }`}>
                                                {t.type === 'income' ? '+' : '-'} {t.amount.toFixed(2)}
                                            </div>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-muted hover:text-error transition-all"
                                                title="删除"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
