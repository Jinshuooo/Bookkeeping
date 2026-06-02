import { useState } from 'react'
import { X } from 'lucide-react'
import IconPicker from './IconPicker'

export default function CategoryEditor({ isOpen, onClose, onSave, initialData, type }) {
    const [name, setName] = useState(initialData?.name || '')
    const [icon, setIcon] = useState(initialData?.icon || 'MoreHorizontal')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const isEditing = !!initialData

    const handleSave = async () => {
        if (!name.trim()) {
            setError('请输入分类名称')
            return
        }

        setSaving(true)
        setError('')
        try {
            await onSave({ name: name.trim(), icon })
            setName('')
            setIcon('MoreHorizontal')
            onClose()
        } catch (err) {
            setError(err.message || '保存失败')
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-surface rounded-2xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-primary/10">
                    <h2 className="text-lg font-bold text-primary">
                        {isEditing ? '编辑分类' : '新增分类'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Type display */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted">分类类型：</span>
                        <span className={`text-sm font-medium px-2 py-0.5 rounded ${type === 'income' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                            }`}>
                            {type === 'income' ? '收入' : '支出'}
                        </span>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-muted">分类名称</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError('') }}
                            placeholder="例如：网购、外卖、兼职..."
                            className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 text-primary placeholder-muted/50 outline-none focus:border-primary/30 transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Icon Picker */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-muted">选择图标</label>
                        <IconPicker selectedIcon={icon} onSelect={setIcon} />
                    </div>

                    {error && (
                        <p className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl bg-background border border-primary/10 text-muted hover:text-primary font-medium transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !name.trim()}
                            className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-surface font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
