import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInCalendarDays } from 'date-fns'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus, Calendar, TrendingUp, PieChart, Moon, Sun, Monitor } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

export default function Dashboard() {
    const { user } = useAuth()
    const { theme, setTheme } = useTheme()
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

    const toggleTheme = () => {
        if (theme === 'light') setTheme('dark')
        else if (theme === 'dark') setTheme('system')
        else setTheme('light')
    }

    const getThemeIcon = () => {
        if (theme === 'light') return <Sun className="w-5 h-5" />
        if (theme === 'dark') return <Moon className="w-5 h-5" />
        return <Monitor className="w-5 h-5" />
    }

    if (loading) return <div className="p-8 text-center text-muted">加载中...</div>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-primary">概览</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 bg-surface rounded-lg text-muted hover:text-primary transition-colors"
                        title="切换主题"
                    >
                        {getThemeIcon()}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-muted truncate">本月支出</p>
                            <p className="text-2xl font-bold text-primary truncate">¥{summary.expense.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-muted truncate">本月收入</p>
                            <p className="text-2xl font-bold text-primary truncate">¥{summary.income.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <PieChart className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-muted truncate">结余</p>
                            <p className="text-2xl font-bold text-primary truncate">¥{summary.balance.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-muted truncate">剩余日均预算</p>
                            <p className={`text-2xl font-bold truncate ${summary.dailyAvailable !== null ? 'text-primary' : 'text-error'}`}>
                                {summary.dailyAvailable !== null
                                    ? `¥${summary.dailyAvailable.toFixed(2)}`
                                    : '余额不足'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-primary/10">
                <h3 className="text-lg font-bold text-primary mb-6">收支趋势</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--color-muted)' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--color-muted)' }}
                            />
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-surface)" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="var(--color-primary)"
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                                strokeWidth={3}
                                name="收入"
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                stroke="var(--color-secondary)"
                                fillOpacity={1}
                                fill="url(#colorExpense)"
                                strokeWidth={3}
                                name="支出"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-primary">最近记录</h3>
                    <Link to="/transactions" className="text-sm text-muted hover:text-primary font-medium transition-colors">
                        查看全部
                    </Link>
                </div>
                <div className="bg-surface border border-primary/10 rounded-2xl shadow-sm divide-y divide-primary/5 overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="p-8 text-center text-muted">
                            本月还没有记录，快去<Link to="/add" className="text-primary hover:underline font-bold">记一笔</Link>吧！
                        </div>
                    ) : (
                        transactions.slice(0, 5).reverse().map((t) => (
                            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                                        }`}>
                                        {t.type === 'income' ? <Plus className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-primary">{t.category}</div>
                                        <div className="text-xs text-muted">{format(new Date(t.date), 'MM-dd')} · {t.note || '无备注'}</div>
                                    </div>
                                </div>
                                <div className={`font-bold ${t.type === 'income' ? 'text-primary' : 'text-secondary'
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
