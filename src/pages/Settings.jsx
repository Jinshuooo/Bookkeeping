import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Shield, Github, HelpCircle, Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'

export default function Settings() {
    const { user, signOut } = useAuth()
    const [exporting, setExporting] = useState(false)

    const handleExport = async () => {
        try {
            setExporting(true)

            // 1. Fetch all transactions
            const { data: transactions, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })

            if (error) throw error

            if (!transactions || transactions.length === 0) {
                alert('暂无数据可导出')
                return
            }

            // 2. Create Workbook
            const workbook = new ExcelJS.Workbook()
            workbook.creator = 'Money Manager'
            workbook.created = new Date()

            // ==========================================
            // Sheet 1: 收支明细
            // ==========================================
            const sheet1 = workbook.addWorksheet('收支明细')

            sheet1.columns = [
                { header: '日期', key: 'date', width: 15 },
                { header: '类型', key: 'type', width: 10 },
                { header: '金额', key: 'amount', width: 15 },
                { header: '分类', key: 'category', width: 15 },
                { header: '备注', key: 'note', width: 30 }
            ]

            // Style header row
            sheet1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
            sheet1.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF262626' } // Primary Color
            }

            // Add data
            transactions.forEach(t => {
                const row = sheet1.addRow({
                    date: format(new Date(t.date), 'yyyy-MM-dd'),
                    type: t.type === 'income' ? '收入' : '支出',
                    amount: t.amount,
                    category: t.category,
                    note: t.note || ''
                })

                // Color code amount
                const amountCell = row.getCell('amount')
                amountCell.font = {
                    color: { argb: t.type === 'income' ? 'FF16A34A' : 'FFDC2626' } // Green or Red
                }
            })

            // ==========================================
            // Sheet 2: 数据分析
            // ==========================================
            const sheet2 = workbook.addWorksheet('数据分析')

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

            // 4. Download file
            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `记账数据_分析版_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
            anchor.click()
            window.URL.revokeObjectURL(url)

        } catch (error) {
            console.error('Export failed:', error)
            alert('导出失败: ' + error.message)
        } finally {
            setExporting(false)
        }
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
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-medium text-primary">导出数据</div>
                                <div className="text-xs text-muted">导出包含数据分析的 Excel 表格</div>
                            </div>
                        </div>
                        {exporting ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                            <Download className="w-5 h-5 text-muted" />
                        )}
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
                        <span className="text-muted text-sm">v1.8.8</span>
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

            {/* Coming Soon */}
            <div className="text-center pt-8">
                <p className="text-muted/50 text-sm">
                    更多功能（自定义分类...）正在开发中...
                </p>
            </div>
        </div>
    )
}
