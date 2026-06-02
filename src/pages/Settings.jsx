import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLedger } from '../contexts/LedgerContext'
import { User, Shield, Github, HelpCircle, Download, FileSpreadsheet, Loader2, Tags } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import ExportDialog from '../components/ExportDialog'
import CategoryManager from '../components/CategoryManager'
import { useCategories } from '../hooks/useCategories'

export default function Settings() {
    const { user, signOut } = useAuth()
    const { ledgers } = useLedger()
    const [showExportDialog, setShowExportDialog] = useState(false)
    const [showCategoryManager, setShowCategoryManager] = useState(false)

    const {
        categories,
        loading: categoriesLoading,
        createCategory,
        updateCategory,
        deleteCategory,
        getCategoryTransactionCount,
        batchReplaceCategory
    } = useCategories()

    const handleExport = async ({ ledgerIds, startDate, endDate, timeRangeText }) => {
        try {
            // 1. Fetch transactions
            let query = supabase
                .from('transactions')
                .select('*')
                .in('ledger_id', ledgerIds)
                .order('date', { ascending: false })

            if (startDate) query = query.gte('date', startDate)
            if (endDate) query = query.lte('date', endDate)

            const { data: transactions, error } = await query

            if (error) throw error

            if (!transactions || transactions.length === 0) {
                alert('暂无数据可导出')
                return
            }

            // 2. Create Workbook
            const workbook = new ExcelJS.Workbook()
            workbook.creator = 'Money Manager'
            workbook.created = new Date()

            // Helper to get ledger name
            const getLedgerName = (id) => ledgers.find(l => l.id === id)?.name || '未知账本'

            // Strategy: One sheet per ledger if multiple, or Standard (Detail+Analysis) if single
            if (ledgerIds.length === 1) {
                // === Single Ledger Mode (Rich Format) ===
                const ledgerName = getLedgerName(ledgerIds[0])

                // Sheet 1: 收支明细
                const sheet1 = workbook.addWorksheet('收支明细')
                setupDetailSheet(sheet1, transactions)

                // Sheet 2: 数据分析
                const sheet2 = workbook.addWorksheet('数据分析')
                setupAnalysisSheet(sheet2, transactions)
            } else {
                // === Multi Ledger Mode (One Sheet per Ledger) ===

                // Group transactions by ledger
                const transactionsByLedger = transactions.reduce((acc, t) => {
                    if (!acc[t.ledger_id]) acc[t.ledger_id] = []
                    acc[t.ledger_id].push(t)
                    return acc
                }, {})

                // Create a sheet for each selected ledger (even if empty)
                ledgerIds.forEach(ledgerId => {
                    const ledgerName = getLedgerName(ledgerId)
                    // Excel sheet names have length limit (31 chars) and invalid chars
                    const safeName = ledgerName.replace(/[\\/?*[\]]/g, '_').substring(0, 31)

                    const sheet = workbook.addWorksheet(safeName)
                    const ledgerTrans = transactionsByLedger[ledgerId] || []

                    setupDetailSheet(sheet, ledgerTrans)
                })
            }

            // 4. Download file
            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url

            const fileName = ledgerIds.length === 1
                ? `${getLedgerName(ledgerIds[0])}_${timeRangeText}_导出.xlsx`
                : `多账本合并_${timeRangeText}_导出.xlsx`

            anchor.download = fileName
            anchor.click()
            window.URL.revokeObjectURL(url)

        } catch (error) {
            console.error('Export failed:', error)
            throw error // Let Dialog handle the error alert
        }
    }

    // Helper: Setup Detail Sheet
    const setupDetailSheet = (sheet, transactions) => {
        sheet.columns = [
            { header: '日期', key: 'date', width: 15 },
            { header: '类型', key: 'type', width: 10 },
            { header: '金额', key: 'amount', width: 15 },
            { header: '分类', key: 'category', width: 15 },
            { header: '备注', key: 'note', width: 30 }
        ]

        // Style header row
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF262626' }
        }

        // Add data
        transactions.forEach(t => {
            const row = sheet.addRow({
                date: format(new Date(t.date), 'yyyy-MM-dd'),
                type: t.type === 'income' ? '收入' : '支出',
                amount: t.amount,
                category: t.category,
                note: t.note || ''
            })

            // Color code amount
            const amountCell = row.getCell('amount')
            amountCell.font = {
                color: { argb: t.type === 'income' ? 'FF16A34A' : 'FFDC2626' }
            }
        })
    }

    // Helper: Setup Analysis Sheet
    const setupAnalysisSheet = (sheet2, transactions) => {
        // Calculate stats
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)

        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)

        const balance = totalIncome - totalExpense

        // Group by category
        const expenseByCategory = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount
                return acc
            }, {})

        const incomeByCategory = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount
                return acc
            }, {})

        // --- Section 1: Overview ---
        sheet2.mergeCells('A1:B1')
        sheet2.getCell('A1').value = '收支概览'
        sheet2.getCell('A1').font = { bold: true, size: 14 }

        sheet2.getCell('A2').value = '总收入'
        sheet2.getCell('B2').value = totalIncome
        sheet2.getCell('B2').numFmt = '0.00'
        sheet2.getCell('B2').font = { color: { argb: 'FF16A34A' } }

        sheet2.getCell('A3').value = '总支出'
        sheet2.getCell('B3').value = totalExpense
        sheet2.getCell('B3').numFmt = '0.00'
        sheet2.getCell('B3').font = { color: { argb: 'FFDC2626' } }

        sheet2.getCell('A4').value = '结余'
        sheet2.getCell('B4').value = balance
        sheet2.getCell('B4').numFmt = '0.00'
        sheet2.getCell('B4').font = { bold: true }

        // --- Section 2: Expense Stats ---
        sheet2.mergeCells('D1:E1')
        sheet2.getCell('D1').value = '支出分类统计'
        sheet2.getCell('D1').font = { bold: true, size: 14 }

        sheet2.getCell('D2').value = '分类'
        sheet2.getCell('E2').value = '金额'
        sheet2.getRow(2).getCell(4).font = { bold: true } // D2
        sheet2.getRow(2).getCell(5).font = { bold: true } // E2

        let rowIdx = 3
        Object.entries(expenseByCategory)
            .sort(([, a], [, b]) => b - a)
            .forEach(([cat, amount]) => {
                sheet2.getCell(`D${rowIdx}`).value = cat
                sheet2.getCell(`E${rowIdx}`).value = amount
                sheet2.getCell(`E${rowIdx}`).numFmt = '0.00'
                rowIdx++
            })

        // --- Section 3: Income Stats ---
        sheet2.mergeCells('G1:H1')
        sheet2.getCell('G1').value = '收入分类统计'
        sheet2.getCell('G1').font = { bold: true, size: 14 }

        sheet2.getCell('G2').value = '分类'
        sheet2.getCell('H2').value = '金额'
        sheet2.getRow(2).getCell(7).font = { bold: true } // G2
        sheet2.getRow(2).getCell(8).font = { bold: true } // H2

        rowIdx = 3
        Object.entries(incomeByCategory)
            .sort(([, a], [, b]) => b - a)
            .forEach(([cat, amount]) => {
                sheet2.getCell(`G${rowIdx}`).value = cat
                sheet2.getCell(`H${rowIdx}`).value = amount
                sheet2.getCell(`H${rowIdx}`).numFmt = '0.00'
                rowIdx++
            })

        // Set column widths for stats
        sheet2.getColumn(1).width = 15 // A
        sheet2.getColumn(2).width = 15 // B
        sheet2.getColumn(3).width = 5  // C (spacer)
        sheet2.getColumn(4).width = 15 // D
        sheet2.getColumn(5).width = 15 // E
        sheet2.getColumn(6).width = 5  // F (spacer)
        sheet2.getColumn(7).width = 15 // G
        sheet2.getColumn(8).width = 15 // H
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-primary drop-shadow-sm">设置</h2>

            {/* User Profile */}
            <div className="bg-surface border border-primary/10 rounded-2xl p-6 shadow-sm flex items-center gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl shadow-inner">
                    {user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-primary">当前账户</h3>
                    <p className="text-muted">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                        <Shield className="w-3 h-3" />
                        已通过 Supabase 安全验证
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="px-4 py-2 bg-surface hover:bg-error/10 text-muted hover:text-error rounded-lg text-sm font-medium transition-colors border border-primary/10"
                >
                    退出登录
                </button>
            </div>

            {/* Data Management */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary px-2">数据管理</h3>
                <div className="bg-surface border border-primary/10 rounded-2xl shadow-sm overflow-hidden">
                    <button
                        onClick={() => setShowCategoryManager(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors cursor-pointer text-left border-b border-primary/10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                <Tags className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-medium text-primary">分类管理</div>
                                <div className="text-xs text-muted">自定义收入与支出的分类及图标</div>
                            </div>
                        </div>
                        <span className="text-muted text-sm">→</span>
                    </button>
                    <button
                        onClick={() => setShowExportDialog(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors cursor-pointer text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-medium text-primary">导出数据</div>
                                <div className="text-xs text-muted">支持多账本和自定义时间范围导出</div>
                            </div>
                        </div>
                        <Download className="w-5 h-5 text-muted" />
                    </button>
                </div>
            </div>

            {/* App Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary px-2">关于</h3>
                <div className="bg-surface border border-primary/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-primary/10 flex items-center justify-between hover:bg-primary/5 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-primary">关于应用</span>
                        </div>
                        <span className="text-muted text-sm">v1.2.2</span>
                    </div>

                    <a
                        href="https://github.com/Jinshuooo"
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                <Github className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-primary">作者主页</span>
                        </div>
                        <span className="text-muted text-sm">GitHub</span>
                    </a>
                </div>
            </div>

            {/* Export Dialog */}
            <ExportDialog
                isOpen={showExportDialog}
                onClose={() => setShowExportDialog(false)}
                onExport={handleExport}
            />

            {/* Category Manager */}
            <CategoryManager
                isOpen={showCategoryManager}
                onClose={() => setShowCategoryManager(false)}
                categories={categories}
                loading={categoriesLoading}
                onCreateCategory={createCategory}
                onUpdateCategory={updateCategory}
                onDeleteCategory={deleteCategory}
                getCategoryTransactionCount={getCategoryTransactionCount}
                batchReplaceCategory={batchReplaceCategory}
            />
        </div>
    )
}
