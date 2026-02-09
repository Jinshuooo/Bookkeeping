import { useState, useEffect } from 'react'
import { useLedger } from '../contexts/LedgerContext'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { X, Download, Calendar, Book, Loader2, FileSpreadsheet } from 'lucide-react'

export default function ExportDialog({ isOpen, onClose, onExport }) {
    const { ledgers, currentLedger } = useLedger()
    const [selectedLedgers, setSelectedLedgers] = useState([])
    const [timeRange, setTimeRange] = useState('all') // 'month', 'year', 'all', 'custom'
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [previewInfo, setPreviewInfo] = useState(null)
    const [loading, setLoading] = useState(false)

    // 初始化选择当前账本
    useEffect(() => {
        if (isOpen && currentLedger && selectedLedgers.length === 0) {
            setSelectedLedgers([currentLedger.id])
        }
    }, [isOpen, currentLedger])

    // 计算预览信息
    useEffect(() => {
        if (!isOpen) return
        calculatePreview()
    }, [selectedLedgers, timeRange, startDate, endDate, isOpen])

    const calculatePreview = async () => {
        if (selectedLedgers.length === 0) {
            setPreviewInfo(null)
            return
        }

        try {
            const { start, end } = getDateRange()

            // 获取交易数量预览
            let query = supabase
                .from('transactions')
                .select('id', { count: 'exact', head: true })
                .in('ledger_id', selectedLedgers)

            if (start) query = query.gte('date', start)
            if (end) query = query.lte('date', end)

            const { count } = await query

            setPreviewInfo({
                ledgerCount: selectedLedgers.length,
                transactionCount: count || 0,
                timeRangeText: getTimeRangeText()
            })
        } catch (error) {
            console.error('预览计算失败:', error)
        }
    }

    const getDateRange = () => {
        const now = new Date()
        let start = null
        let end = null

        switch (timeRange) {
            case 'month':
                start = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd')
                end = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd')
                break
            case 'year':
                start = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd')
                end = format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd')
                break
            case 'custom':
                start = startDate
                end = endDate
                break
            case 'all':
            default:
                // 不设置时间限制
                break
        }

        return { start, end }
    }

    const getTimeRangeText = () => {
        switch (timeRange) {
            case 'month': return '本月'
            case 'year': return '本年'
            case 'custom': return startDate && endDate ? `${startDate} 至 ${endDate}` : '自定义'
            case 'all':
            default: return '全部时间'
        }
    }

    const toggleLedger = (ledgerId) => {
        setSelectedLedgers(prev =>
            prev.includes(ledgerId)
                ? prev.filter(id => id !== ledgerId)
                : [...prev, ledgerId]
        )
    }

    const toggleAllLedgers = () => {
        if (selectedLedgers.length === ledgers.length) {
            setSelectedLedgers([])
        } else {
            setSelectedLedgers(ledgers.map(l => l.id))
        }
    }

    const handleExport = async () => {
        if (selectedLedgers.length === 0) {
            alert('请至少选择一个账本')
            return
        }

        if (timeRange === 'custom' && (!startDate || !endDate)) {
            alert('请选择开始和结束日期')
            return
        }

        setLoading(true)
        try {
            const { start, end } = getDateRange()
            await onExport({
                ledgerIds: selectedLedgers,
                startDate: start,
                endDate: end,
                timeRangeText: getTimeRangeText()
            })
            onClose()
        } catch (error) {
            console.error('导出失败:', error)
            alert('导出失败: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* 头部 */}
                <div className="sticky top-0 bg-surface border-b border-primary/10 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-primary">导出设置</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-muted" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* 账本选择 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-primary flex items-center gap-2">
                                <Book className="w-4 h-4" />
                                选择账本
                            </label>
                            <button
                                onClick={toggleAllLedgers}
                                className="text-xs text-primary hover:underline"
                            >
                                {selectedLedgers.length === ledgers.length ? '取消全选' : '全选'}
                            </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto bg-background rounded-lg p-3 border border-primary/10">
                            {ledgers.map(ledger => (
                                <label
                                    key={ledger.id}
                                    className="flex items-center gap-3 p-2 hover:bg-primary/5 rounded-lg cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedLedgers.includes(ledger.id)}
                                        onChange={() => toggleLedger(ledger.id)}
                                        className="w-4 h-4 accent-primary"
                                    />
                                    <span className="text-sm text-primary">{ledger.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 时间范围选择 */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-primary flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            时间范围
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'month', label: '本月' },
                                { value: 'year', label: '本年' },
                                { value: 'all', label: '全部时间' },
                                { value: 'custom', label: '自定义' }
                            ].map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setTimeRange(option.value)}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${timeRange === option.value
                                            ? 'bg-primary text-surface border-primary'
                                            : 'bg-background text-muted border-primary/10 hover:border-primary/30'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* 自定义日期输入 */}
                        {timeRange === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div>
                                    <label className="text-xs text-muted mb-1 block">开始日期</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-background border border-primary/10 outline-none focus:border-primary/30 text-sm text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted mb-1 block">结束日期</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-background border border-primary/10 outline-none focus:border-primary/30 text-sm text-primary"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 导出预览 */}
                    {previewInfo && (
                        <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                            <p className="text-xs text-muted mb-2">导出预览</p>
                            <div className="space-y-1 text-sm text-primary">
                                <p>• 账本数量: <span className="font-bold">{previewInfo.ledgerCount}</span> 个</p>
                                <p>• 时间范围: <span className="font-bold">{previewInfo.timeRangeText}</span></p>
                                <p>• 交易记录: 约 <span className="font-bold">{previewInfo.transactionCount}</span> 条</p>
                            </div>
                        </div>
                    )}

                    {/* 导出按钮 */}
                    <button
                        onClick={handleExport}
                        disabled={loading || selectedLedgers.length === 0}
                        className="w-full bg-primary hover:bg-primary/90 text-surface py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                导出中...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                确认导出
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
