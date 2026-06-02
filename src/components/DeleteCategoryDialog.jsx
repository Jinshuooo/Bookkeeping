import { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'

export default function DeleteCategoryDialog({
    isOpen,
    onClose,
    onConfirm,
    category,
    transactionCount,
    categories,
    type
}) {
    const [mode, setMode] = useState(null) // null | 'batch' | 'onebyone' | 'keep'
    const [replaceTarget, setReplaceTarget] = useState('')
    const [processing, setProcessing] = useState(false)

    // When dialog opens, try to auto-select the first available category
    useEffect(() => {
        if (isOpen && category) {
            const firstOther = categories.find(
                c => c.type === type && c.name !== category.name
            )
            setReplaceTarget(firstOther?.name || '')
            setMode(null)
        }
    }, [isOpen, category, categories, type])

    const handleConfirm = async () => {
        if (mode === 'batch' && !replaceTarget) return

        setProcessing(true)
        try {
            await onConfirm({
                mode,
                replaceTarget: mode === 'batch' ? replaceTarget : null
            })
        } finally {
            setProcessing(false)
        }
    }

    if (!isOpen) return null

    const hasTransactions = transactionCount > 0
    const otherCategories = categories.filter(
        c => c.type === type && c.name !== category?.name
    )

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-surface rounded-2xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-primary/10">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                        <h2 className="text-lg font-bold text-primary">删除分类</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
                        disabled={processing}
                    >
                        <X className="w-5 h-5 text-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    <p className="text-primary">
                        确定要删除分类 "<span className="font-bold">{category?.name}</span>" 吗？
                    </p>

                    {!hasTransactions ? (
                        /* No transactions — simple confirmation */
                        <div className="bg-background border border-primary/10 rounded-xl p-4 text-sm text-muted">
                            该分类下暂无账单记录，可以直接删除。
                        </div>
                    ) : (
                        /* Has transactions — show options */
                        <div className="space-y-3">
                            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 text-sm text-primary flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                                <span>
                                    该分类下有 <span className="font-bold">{transactionCount}</span> 条账单记录，请选择处理方式：
                                </span>
                            </div>

                            {/* Option 1: Batch Replace */}
                            <label
                                className={`block p-4 rounded-xl border transition-colors cursor-pointer ${mode === 'batch'
                                    ? 'bg-primary/5 border-primary'
                                    : 'bg-background border-primary/10 hover:border-primary/30'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="radio"
                                        name="deleteMode"
                                        checked={mode === 'batch'}
                                        onChange={() => setMode('batch')}
                                        className="mt-0.5 accent-primary"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-primary">批量替换</div>
                                        <div className="text-xs text-muted mt-1">
                                            将所有「{category?.name}」分类的账单统一替换为另一个分类
                                        </div>
                                        {mode === 'batch' && (
                                            <select
                                                value={replaceTarget}
                                                onChange={(e) => setReplaceTarget(e.target.value)}
                                                className="mt-2 w-full px-3 py-2 rounded-lg bg-surface border border-primary/10 text-sm text-primary outline-none focus:border-primary/30"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="">请选择目标分类</option>
                                                {otherCategories.map(c => (
                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </label>

                            {/* Option 2: One by One */}
                            <label
                                className={`block p-4 rounded-xl border transition-colors cursor-pointer ${mode === 'onebyone'
                                    ? 'bg-primary/5 border-primary'
                                    : 'bg-background border-primary/10 hover:border-primary/30'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="radio"
                                        name="deleteMode"
                                        checked={mode === 'onebyone'}
                                        onChange={() => setMode('onebyone')}
                                        className="mt-0.5 accent-primary"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-primary">逐一处理</div>
                                        <div className="text-xs text-muted mt-1">
                                            跳转到明细页面，逐条查看并修改每笔账单的分类后再删除
                                        </div>
                                    </div>
                                </div>
                            </label>

                            {/* Option 3: Keep */}
                            <label
                                className={`block p-4 rounded-xl border transition-colors cursor-pointer ${mode === 'keep'
                                    ? 'bg-primary/5 border-primary'
                                    : 'bg-background border-primary/10 hover:border-primary/30'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="radio"
                                        name="deleteMode"
                                        checked={mode === 'keep'}
                                        onChange={() => setMode('keep')}
                                        className="mt-0.5 accent-primary"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-primary">保留不变</div>
                                        <div className="text-xs text-muted mt-1">
                                            删除分类但保留已有账单的分类名称（将显示通用图标）
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="flex-1 px-4 py-3 rounded-xl bg-background border border-primary/10 text-muted hover:text-primary font-medium transition-colors disabled:opacity-50"
                        >
                            取消
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={processing || (hasTransactions && !mode) || (mode === 'batch' && !replaceTarget)}
                            className="flex-1 px-4 py-3 rounded-xl bg-error hover:bg-error/90 text-surface font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? '处理中...' : hasTransactions ? '确认删除' : '确认删除'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
