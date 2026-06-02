import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { getIconComponent } from '../lib/constants'
import CategoryEditor from './CategoryEditor'
import DeleteCategoryDialog from './DeleteCategoryDialog'

export default function CategoryManager({
    isOpen,
    onClose,
    categories,
    loading,
    onCreateCategory,
    onUpdateCategory,
    onDeleteCategory,
    getCategoryTransactionCount,
    batchReplaceCategory
}) {
    const navigate = useNavigate()
    const [activeType, setActiveType] = useState('expense')
    const [showEditor, setShowEditor] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deletingCategory, setDeletingCategory] = useState(null)
    const [deleteTransactionCount, setDeleteTransactionCount] = useState(0)
    const [checkingDelete, setCheckingDelete] = useState(false)

    const filteredCategories = categories.filter(c => c.type === activeType)

    const handleOpenAdd = () => {
        setEditingCategory(null)
        setShowEditor(true)
    }

    const handleOpenEdit = (cat) => {
        setEditingCategory(cat)
        setShowEditor(true)
    }

    const handleSave = async (data) => {
        if (editingCategory) {
            await onUpdateCategory(editingCategory.id, data)
        } else {
            await onCreateCategory({ ...data, type: activeType })
        }
    }

    const handleOpenDelete = async (cat) => {
        setDeletingCategory(cat)
        setCheckingDelete(true)

        try {
            const count = await getCategoryTransactionCount(cat.name)
            setDeleteTransactionCount(count)
        } catch (err) {
            console.error('Error checking transactions:', err)
            setDeleteTransactionCount(0)
        } finally {
            setCheckingDelete(false)
        }

        setShowDeleteDialog(true)
    }

    const handleConfirmDelete = async ({ mode, replaceTarget }) => {
        if (!deletingCategory) return

        if (mode === 'batch' && replaceTarget) {
            await batchReplaceCategory(deletingCategory.name, replaceTarget)
        } else if (mode === 'onebyone') {
            // Close dialogs and navigate to transactions page with search
            setShowDeleteDialog(false)
            setShowEditor(false)
            onClose()
            navigate(`/transactions?search=${encodeURIComponent(deletingCategory.name)}&action=reclassify`)
            return
        }
        // 'keep' mode or no transactions: just delete the category
        // 'batch' mode: already replaced above, now delete

        await onDeleteCategory(deletingCategory.id)
        setShowDeleteDialog(false)
        setDeletingCategory(null)
    }

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-primary/10 flex-shrink-0">
                        <h2 className="text-xl font-bold text-primary">分类管理</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-muted" />
                        </button>
                    </div>

                    {/* Type Tabs */}
                    <div className="flex border-b border-primary/10 flex-shrink-0">
                        <button
                            onClick={() => setActiveType('expense')}
                            className={`flex-1 py-3 text-center font-medium transition-colors ${activeType === 'expense'
                                ? 'bg-secondary/5 text-secondary border-b-2 border-secondary'
                                : 'text-muted hover:bg-primary/5 hover:text-primary'
                                }`}
                        >
                            支出分类
                        </button>
                        <button
                            onClick={() => setActiveType('income')}
                            className={`flex-1 py-3 text-center font-medium transition-colors ${activeType === 'income'
                                ? 'bg-primary/5 text-primary border-b-2 border-primary'
                                : 'text-muted hover:bg-primary/5 hover:text-primary'
                                }`}
                        >
                            收入分类
                        </button>
                    </div>

                    {/* Category Grid */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-muted" />
                            </div>
                        ) : filteredCategories.length === 0 ? (
                            <div className="text-center py-12 text-muted text-sm">
                                暂无分类，请点击下方按钮新增
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {filteredCategories.map(cat => {
                                    const Icon = getIconComponent(cat.icon)
                                    return (
                                        <div
                                            key={cat.id}
                                            className="group relative flex flex-col items-center gap-2 p-3 rounded-xl bg-background border border-primary/10 hover:border-primary/30 transition-all"
                                        >
                                            {/* Action buttons */}
                                            <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEdit(cat)}
                                                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                                    title="编辑"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                {!cat.is_default && (
                                                    <button
                                                        onClick={() => handleOpenDelete(cat)}
                                                        className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-colors"
                                                        title="删除"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Icon */}
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${activeType === 'income' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/10 text-secondary border-secondary/20'
                                                }`}>
                                                <Icon className="w-6 h-6" />
                                            </div>

                                            {/* Name */}
                                            <span className="text-sm font-medium text-primary">{cat.name}</span>

                                            {/* Default badge */}
                                            {cat.is_default && (
                                                <span className="text-[10px] text-muted bg-primary/5 px-1.5 py-0.5 rounded">默认</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Add Button */}
                    <div className="p-6 pt-0 flex-shrink-0">
                        <button
                            onClick={handleOpenAdd}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/5 border-2 border-dashed border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 font-medium transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            新增分类
                        </button>
                    </div>
                </div>
            </div>

            {/* Category Editor Dialog */}
            <CategoryEditor
                isOpen={showEditor}
                onClose={() => {
                    setShowEditor(false)
                    setEditingCategory(null)
                }}
                onSave={handleSave}
                initialData={editingCategory}
                type={activeType}
            />

            {/* Delete Confirmation Dialog */}
            {checkingDelete ? (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-surface rounded-2xl p-8 flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-muted">正在检查关联数据...</span>
                    </div>
                </div>
            ) : (
                <DeleteCategoryDialog
                    isOpen={showDeleteDialog}
                    onClose={() => {
                        setShowDeleteDialog(false)
                        setDeletingCategory(null)
                    }}
                    onConfirm={handleConfirmDelete}
                    category={deletingCategory}
                    transactionCount={deleteTransactionCount}
                    categories={categories}
                    type={activeType}
                />
            )}
        </>
    )
}
