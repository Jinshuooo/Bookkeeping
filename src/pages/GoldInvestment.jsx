import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLedger } from '../contexts/LedgerContext'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'
import { Landmark, TrendingUp, TrendingDown, RefreshCw, Trash2, Loader2, Calendar, FileText, Scale, Banknote, DollarSign } from 'lucide-react'

const GOLD_PRICE_CACHE_KEY = 'gold_price_cache'
const GOLD_PRICE_LAST_FETCH_KEY = 'gold_price_last_fetch'
const CACHE_DURATION_MS = 60 * 60 * 1000 // 1 hour
const REFRESH_COOLDOWN_MS = 30 * 1000 // 30 seconds between refreshes
const OUNCE_TO_GRAM = 31.1034768

// Try Supabase Edge Function first, then direct API as fallback
// Enforces 30-second cooldown between API calls to avoid IP bans
async function fetchGoldPrice(force = false) {
    // Enforce rate limit cooldown
    if (!force) {
        const lastFetch = localStorage.getItem(GOLD_PRICE_LAST_FETCH_KEY)
        if (lastFetch) {
            const elapsed = Date.now() - parseInt(lastFetch)
            if (elapsed < REFRESH_COOLDOWN_MS) {
                // Use cached data if available, otherwise throw
                const cached = localStorage.getItem(GOLD_PRICE_CACHE_KEY)
                if (cached) {
                    const parsed = JSON.parse(cached)
                    return { price_per_gram: parsed.price_per_gram, timestamp: parsed.timestamp }
                }
                throw new Error(`请等待 ${Math.ceil((REFRESH_COOLDOWN_MS - elapsed) / 1000)} 秒后再刷新`)
            }
        }
    }

    // Check cache first
    const cached = localStorage.getItem(GOLD_PRICE_CACHE_KEY)
    if (cached) {
        try {
            const parsed = JSON.parse(cached)
            const age = Date.now() - parsed.fetchedAt
            if (age < CACHE_DURATION_MS) {
                return { price_per_gram: parsed.price_per_gram, timestamp: parsed.timestamp }
            }
        } catch { /* ignore corrupt cache */ }
    }

    // Try Supabase Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    let priceData = null

    try {
        const edgeFnUrl = `${supabaseUrl}/functions/v1/gold-price`
        const res = await fetch(edgeFnUrl, {
            headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }
        })
        if (res.ok) {
            priceData = await res.json()
        }
    } catch {
        // Edge function not deployed — fall back to direct call
        console.warn('Edge function unavailable, trying direct API call...')
    }

    // Fallback: direct gold-api.com call
    if (!priceData) {
        try {
            const res = await fetch('https://api.gold-api.com/price/XAU/CNY')
            if (res.ok) {
                const data = await res.json()
                // gold-api.com returns price per troy ounce, convert to per gram
                const pricePerGram = data.price / OUNCE_TO_GRAM
                priceData = {
                    price_per_gram: Math.round(pricePerGram * 100) / 100,
                    timestamp: data.updatedAt || new Date().toISOString(),
                    currency: data.currency || 'CNY'
                }
            }
        } catch (err) {
            throw new Error('无法获取实时金价，请稍后重试')
        }
    }

    if (!priceData || !priceData.price_per_gram) {
        throw new Error('无法获取实时金价数据')
    }

    // Record fetch timestamp for rate limiting
    localStorage.setItem(GOLD_PRICE_LAST_FETCH_KEY, Date.now().toString())

    // Cache the result
    localStorage.setItem(GOLD_PRICE_CACHE_KEY, JSON.stringify({
        ...priceData,
        fetchedAt: Date.now()
    }))

    return priceData
}

export default function GoldInvestment() {
    const { user } = useAuth()
    const { currentLedger } = useLedger()

    // Gold price state
    const [goldPrice, setGoldPrice] = useState(null)
    const [priceLoading, setPriceLoading] = useState(true)
    const [priceError, setPriceError] = useState(null)
    const [priceFetchedAt, setPriceFetchedAt] = useState(null)
    const [refreshCooldown, setRefreshCooldown] = useState(0) // remaining seconds

    // Investments state
    const [investments, setInvestments] = useState([])
    const [dataLoading, setDataLoading] = useState(true)

    // Form state
    const [grams, setGrams] = useState('')
    const [totalPrice, setTotalPrice] = useState('')
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [note, setNote] = useState('')
    const [saving, setSaving] = useState(false)

    // Cooldown countdown timer
    useEffect(() => {
        if (refreshCooldown <= 0) return
        const timer = setInterval(() => {
            setRefreshCooldown(prev => {
                if (prev <= 1) return 0
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [refreshCooldown])

    // Fetch gold price
    const refreshPrice = useCallback(async (force = false) => {
        // Check cooldown
        if (force) {
            const lastFetch = localStorage.getItem(GOLD_PRICE_LAST_FETCH_KEY)
            if (lastFetch) {
                const elapsed = Date.now() - parseInt(lastFetch)
                if (elapsed < REFRESH_COOLDOWN_MS) {
                    const remaining = Math.ceil((REFRESH_COOLDOWN_MS - elapsed) / 1000)
                    setRefreshCooldown(remaining)
                    return // silently ignore
                }
            }
        }

        setPriceLoading(true)
        setPriceError(null)
        try {
            const data = await fetchGoldPrice(force)
            setGoldPrice(data.price_per_gram)
            setPriceFetchedAt(new Date())
            // Set cooldown
            setRefreshCooldown(30)
        } catch (err) {
            setPriceError(err.message)
            // Try to use cached price even if expired
            const cached = localStorage.getItem(GOLD_PRICE_CACHE_KEY)
            if (cached) {
                try {
                    const parsed = JSON.parse(cached)
                    setGoldPrice(parsed.price_per_gram)
                    setPriceFetchedAt(new Date(parsed.fetchedAt))
                } catch { /* ignore */ }
            }
        } finally {
            setPriceLoading(false)
        }
    }, [])

    // Fetch investments
    const fetchInvestments = useCallback(async () => {
        if (!currentLedger) {
            setDataLoading(false)
            return
        }
        setDataLoading(true)
        try {
            const { data, error } = await supabase
                .from('gold_investments')
                .select('*')
                .eq('ledger_id', currentLedger.id)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error
            setInvestments(data || [])
        } catch (err) {
            console.error('Error fetching investments:', err)
        } finally {
            setDataLoading(false)
        }
    }, [currentLedger])

    useEffect(() => {
        if (!user || !currentLedger) return
        refreshPrice()
        fetchInvestments()
    }, [user, currentLedger, refreshPrice, fetchInvestments])

    // Calculate derived values
    const pricePerGram = goldPrice
    const totalGrams = investments.reduce((sum, inv) => sum + parseFloat(inv.grams), 0)
    const totalCost = investments.reduce((sum, inv) => sum + parseFloat(inv.total_price), 0)
    const currentValue = pricePerGram ? totalGrams * pricePerGram : 0
    const totalProfit = currentValue - totalCost
    const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!grams || !totalPrice || !currentLedger) return

        const gramsNum = parseFloat(grams)
        const totalPriceNum = parseFloat(totalPrice)
        if (isNaN(gramsNum) || isNaN(totalPriceNum) || gramsNum <= 0 || totalPriceNum <= 0) return

        setSaving(true)
        try {
            const pricePerGramNum = Math.round((totalPriceNum / gramsNum) * 100) / 100

            const { error } = await supabase.from('gold_investments').insert({
                user_id: user.id,
                ledger_id: currentLedger.id,
                grams: gramsNum,
                total_price: totalPriceNum,
                price_per_gram: pricePerGramNum,
                date,
                note: note || null
            })

            if (error) throw error

            // Reset form and refresh
            setGrams('')
            setTotalPrice('')
            setDate(format(new Date(), 'yyyy-MM-dd'))
            setNote('')
            await fetchInvestments()
        } catch (err) {
            alert('保存失败: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    // Handle delete
    const handleDelete = async (id) => {
        if (!confirm('确定要删除这条记录吗？')) return
        try {
            const { error } = await supabase
                .from('gold_investments')
                .delete()
                .eq('id', id)

            if (error) throw error
            setInvestments(prev => prev.filter(inv => inv.id !== id))
        } catch (err) {
            alert('删除失败: ' + err.message)
        }
    }

    // Calculate profit/loss for a single investment
    const calcProfit = (investment) => {
        if (!pricePerGram) return { profit: 0, percent: 0 }
        const gramsNum = parseFloat(investment.grams)
        const cost = parseFloat(investment.total_price)
        const currentVal = gramsNum * pricePerGram
        const profit = currentVal - cost
        const percent = cost > 0 ? (profit / cost) * 100 : 0
        return { profit, percent }
    }

    // ---------- Render ----------

    if (!currentLedger) {
        return (
            <div className="p-8 text-center text-muted min-h-[50vh] flex flex-col items-center justify-center">
                <TrendingUp className="w-12 h-12 text-muted mb-4" />
                <p>请先创建或选择一个账本</p>
            </div>
        )
    }

    const isLoading = priceLoading || dataLoading

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary drop-shadow-sm">黄金理财</h2>
                <button
                    onClick={() => refreshPrice(true)}
                    disabled={priceLoading || refreshCooldown > 0}
                    className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-primary/5 rounded-xl text-sm font-medium text-muted hover:text-primary transition-colors border border-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw className={`w-4 h-4 ${priceLoading ? 'animate-spin' : ''}`} />
                    {refreshCooldown > 0 ? `${refreshCooldown}秒后可刷新` : '刷新金价'}
                </button>
            </div>

            {/* Live Gold Price Card */}
            <div className="bg-surface border border-primary/10 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-500/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted">实时金价 (XAU/CNY)</p>
                            {priceLoading ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted" />
                                    <span className="text-muted">获取中...</span>
                                </div>
                            ) : priceError && !goldPrice ? (
                                <p className="text-lg font-bold text-error">{priceError}</p>
                            ) : (
                                <p className="text-3xl font-bold text-primary">¥{goldPrice?.toFixed(2)}<span className="text-sm font-normal text-muted ml-1">/克</span></p>
                            )}
                        </div>
                    </div>
                    {priceFetchedAt && goldPrice && (
                        <div className="text-right text-xs text-muted">
                            <p>更新时间</p>
                            <p>{format(priceFetchedAt, 'HH:mm:ss')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Portfolio Summary */}
            {investments.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-surface p-4 rounded-2xl shadow-sm border border-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Scale className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                        <p className="text-xs text-muted">总克重</p>
                        <p className="text-xl font-bold text-primary">{totalGrams.toFixed(2)} g</p>
                    </div>
                    <div className="bg-surface p-4 rounded-2xl shadow-sm border border-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Banknote className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                        <p className="text-xs text-muted">总成本</p>
                        <p className="text-xl font-bold text-primary">¥{totalCost.toFixed(2)}</p>
                    </div>
                    <div className="bg-surface p-4 rounded-2xl shadow-sm border border-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <DollarSign className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                        <p className="text-xs text-muted">当前市值</p>
                        <p className="text-xl font-bold text-primary">¥{currentValue.toFixed(2)}</p>
                    </div>
                    <div className="bg-surface p-4 rounded-2xl shadow-sm border border-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`p-2 rounded-lg ${totalProfit >= 0 ? 'bg-success/10' : 'bg-error/10'}`}>
                                {totalProfit >= 0
                                    ? <TrendingUp className="w-4 h-4 text-success" />
                                    : <TrendingDown className="w-4 h-4 text-error" />
                                }
                            </div>
                        </div>
                        <p className="text-xs text-muted">总盈亏</p>
                        <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-success' : 'text-error'}`}>
                            {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
                        </p>
                        <p className={`text-xs ${totalProfit >= 0 ? 'text-success' : 'text-error'}`}>
                            {totalProfitPercent >= 0 ? '+' : ''}{totalProfitPercent.toFixed(2)}%
                        </p>
                    </div>
                </div>
            )}

            {/* Add Purchase Form */}
            <div className="bg-surface border border-primary/10 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-primary/10">
                    <h3 className="text-lg font-bold text-primary">记录买入</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Grams */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-muted">
                                <Scale className="w-4 h-4" /> 克重 (g)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={grams}
                                onChange={(e) => setGrams(e.target.value)}
                                placeholder="如: 10"
                                className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 text-primary placeholder-muted/50 focus:border-primary/30 outline-none transition-all"
                            />
                        </div>
                        {/* Total Price */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-muted">
                                <Banknote className="w-4 h-4" /> 买入总价 (¥)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={totalPrice}
                                onChange={(e) => setTotalPrice(e.target.value)}
                                placeholder="如: 5500"
                                className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 text-primary placeholder-muted/50 focus:border-primary/30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Calculated unit price */}
                    {grams && totalPrice && parseFloat(grams) > 0 && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 rounded-xl">
                            <span className="text-sm text-muted">买入单价：</span>
                            <span className="text-sm font-bold text-primary">
                                ¥{(parseFloat(totalPrice) / parseFloat(grams)).toFixed(2)} /克
                            </span>
                            {goldPrice && (
                                <span className={`text-xs ml-2 ${(parseFloat(totalPrice) / parseFloat(grams)) <= goldPrice ? 'text-success' : 'text-error'}`}>
                                    ({((parseFloat(totalPrice) / parseFloat(grams)) <= goldPrice) ? '低于' : '高于'}当前金价)
                                </span>
                            )}
                        </div>
                    )}

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
                                className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 text-primary focus:border-primary/30 outline-none transition-all"
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
                                placeholder="如: 周大福金条"
                                className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 text-primary placeholder-muted/50 focus:border-primary/30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving || !grams || !totalPrice}
                        className="w-full bg-primary hover:bg-primary/90 border border-primary text-surface font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {saving ? '保存中...' : '保存买入记录'}
                    </button>
                </form>
            </div>

            {/* Holdings Detail List */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Landmark className="w-5 h-5" /> 持仓明细
                </h3>
                {dataLoading ? (
                    <div className="text-center py-8 text-muted">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        加载中...
                    </div>
                ) : investments.length === 0 ? (
                    <div className="bg-surface border border-primary/10 rounded-2xl p-8 text-center text-muted shadow-sm">
                        <Landmark className="w-12 h-12 mx-auto mb-3 text-muted/50" />
                        <p>暂无黄金持仓记录</p>
                        <p className="text-xs mt-1">上方添加你的第一笔黄金买入记录</p>
                    </div>
                ) : (
                    <div className="bg-surface border border-primary/10 rounded-2xl shadow-sm divide-y divide-primary/5 overflow-hidden">
                        {investments.map((inv) => {
                            const { profit, percent } = calcProfit(inv)
                            const isProfit = profit >= 0
                            const gramsNum = parseFloat(inv.grams)
                            const costNum = parseFloat(inv.total_price)
                            const currentVal = pricePerGram ? gramsNum * pricePerGram : costNum

                            return (
                                <div key={inv.id} className="group p-4 hover:bg-primary/5 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted">
                                                {format(parseISO(inv.date), 'yyyy-MM-dd')}
                                            </span>
                                            {inv.note && (
                                                <span className="text-xs text-muted/70 truncate max-w-[120px]">
                                                    · {inv.note}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(inv.id)}
                                            className="p-1.5 text-muted hover:text-error rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="删除"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                                        <div>
                                            <span className="text-xs text-muted">克重</span>
                                            <p className="font-medium text-primary">{gramsNum.toFixed(2)} g</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted">买入单价</span>
                                            <p className="font-medium text-primary">¥{parseFloat(inv.price_per_gram).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted">总成本</span>
                                            <p className="font-medium text-primary">¥{costNum.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted">当前市值</span>
                                            <p className="font-medium text-primary">¥{currentVal.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted">盈亏</span>
                                            <p className={`font-bold ${isProfit ? 'text-success' : 'text-error'}`}>
                                                {isProfit ? '+' : ''}{profit.toFixed(2)}
                                            </p>
                                            <p className={`text-xs ${isProfit ? 'text-success' : 'text-error'}`}>
                                                {isProfit ? '+' : ''}{percent.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
