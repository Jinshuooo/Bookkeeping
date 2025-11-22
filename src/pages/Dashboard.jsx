import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInCalendarDays } from 'date-fns'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, dailyAvailable: 0 })
    const [chartData, setChartData] = useState([])

    useEffect(() => {
        fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            const start = startOfMonth(new Date()).toISOString()
            const end = endOfMonth(new Date()).toISOString()

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', start)
                .lte('date', end)
                .order('date', { ascending: true })

            if (error) throw error

            setTransactions(data)
            calculateSummary(data)
            prepareChartData(data)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateSummary = (data) => {
        const income = data.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)
        const expense = data.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
        const balance = income - expense

        // Calculate daily available
        const now = new Date()
        const end = endOfMonth(now)
        // Include today in the remaining days
        const remainingDays = differenceInCalendarDays(end, now) + 1

        let dailyAvailable = null
        if (balance > 0 && remainingDays > 0) {
            dailyAvailable = balance / remainingDays
        }

        setSummary({
            income,
            expense,
            balance,
            dailyAvailable
        })
    }

    const prepareChartData = (data) => {
        const start = startOfMonth(new Date())
        const end = new Date() // Up to today
        const days = eachDayOfInterval({ start, end })

        const chartData = days.map(day => {
            const dayTransactions = data.filter(t => isSameDay(new Date(t.date), day))
            const income = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)
            const expense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
            return {
                date: format(day, 'dd'),
                income,
                expense
            }
        })
        setChartData(chartData)
    }

    if (loading) return <div className="p-8 text-center text-slate-500">加载中...</div>

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="text-white/90 font-medium">本月结余</span>
                    </div>
                    <div className="text-3xl font-bold drop-shadow-sm">¥ {summary.balance.toFixed(2)}</div>
                </div>

                <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Calendar className="w-6 h-6 text-blue-200" />
                        </div>
                        <span className="text-white/80 font-medium">日均可用</span>
                    </div>
                    <div className={`text-3xl font-bold drop-shadow-sm ${summary.dailyAvailable !== null ? 'text-white' : 'text-red-200'}`}>
                        {summary.dailyAvailable !== null
                            ? `¥ ${summary.dailyAvailable.toFixed(2)}`
                            : '余额不足'
                        }
                    </div>
                </div>

                <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <ArrowUpCircle className="w-6 h-6 text-green-200" />
                        </div>
                        <span className="text-white/80 font-medium">本月收入</span>
                    </div>
                    <div className="text-3xl font-bold text-white drop-shadow-sm">¥ {summary.income.toFixed(2)}</div>
                </div>

                <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-500/20 rounded-xl">
                            <ArrowDownCircle className="w-6 h-6 text-red-200" />
                        </div>
                        <span className="text-white/80 font-medium">本月支出</span>
                    </div>
                    <div className="text-3xl font-bold text-white drop-shadow-sm">¥ {summary.expense.toFixed(2)}</div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6 drop-shadow-md">收支趋势</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                                name="收入"
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                stroke="#ef4444"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorExpense)"
                                name="支出"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white drop-shadow-md">最近记录</h3>
                    <Link to="/transactions" className="text-sm text-white/80 hover:text-white font-medium transition-colors">
                        查看全部
                    </Link>
                </div>
                <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg divide-y divide-white/10 overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="p-8 text-center text-white/60">
                            本月还没有记录，快去<Link to="/add" className="text-white hover:underline font-bold">记一笔</Link>吧！
                        </div>
                    ) : (
                        transactions.slice(0, 5).reverse().map((t) => (
                            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
                                        }`}>
                                        {t.type === 'income' ? <Plus className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{t.category}</div>
                                        <div className="text-xs text-white/60">{format(new Date(t.date), 'MM-dd')} · {t.note || '无备注'}</div>
                                    </div>
                                </div>
                                <div className={`font-bold ${t.type === 'income' ? 'text-green-300' : 'text-white'
                                    }`}>
                                    {t.type === 'income' ? '+' : '-'} {t.amount.toFixed(2)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
