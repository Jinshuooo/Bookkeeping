import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLedger } from '../contexts/LedgerContext'

export function useCategories() {
    const { currentLedger } = useLedger()
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchCategories = useCallback(async () => {
        if (!currentLedger) {
            setCategories([])
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('ledger_id', currentLedger.id)
                .order('sort_order', { ascending: false })
                .order('name', { ascending: true })

            if (error) throw error
            setCategories(data || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
            setCategories([])
        } finally {
            setLoading(false)
        }
    }, [currentLedger])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    const createCategory = async ({ type, name, icon }) => {
        if (!currentLedger) throw new Error('没有选择账本')

        const { data, error } = await supabase
            .from('categories')
            .insert({
                ledger_id: currentLedger.id,
                user_id: (await supabase.auth.getSession()).data.session?.user.id,
                type,
                name,
                icon,
                sort_order: 0,
                is_default: false
            })
            .select()
            .single()

        if (error) {
            if (error.code === '23505') {
                throw new Error('该分类名称已存在')
            }
            throw error
        }

        setCategories(prev => [...prev, data].sort((a, b) => {
            if (b.sort_order !== a.sort_order) return b.sort_order - a.sort_order
            return a.name.localeCompare(b.name)
        }))

        return data
    }

    const updateCategory = async (id, { name, icon }) => {
        const { data, error } = await supabase
            .from('categories')
            .update({ name, icon })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            if (error.code === '23505') {
                throw new Error('该分类名称已存在')
            }
            throw error
        }

        setCategories(prev => prev.map(c => c.id === id ? data : c))
        return data
    }

    const deleteCategory = async (id) => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)

        if (error) throw error

        setCategories(prev => prev.filter(c => c.id !== id))
    }

    /**
     * Count transactions that use a given category name within the current ledger
     */
    const getCategoryTransactionCount = async (categoryName) => {
        if (!currentLedger) return 0

        const { count, error } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('ledger_id', currentLedger.id)
            .eq('category', categoryName)

        if (error) throw error
        return count || 0
    }

    /**
     * Get all transactions that use a given category name
     */
    const getCategoryTransactions = async (categoryName) => {
        if (!currentLedger) return []

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('ledger_id', currentLedger.id)
            .eq('category', categoryName)
            .order('date', { ascending: false })

        if (error) throw error
        return data || []
    }

    /**
     * Batch replace old category name with new one for all transactions in current ledger
     */
    const batchReplaceCategory = async (oldName, newName) => {
        if (!currentLedger) throw new Error('没有选择账本')

        const { error } = await supabase
            .from('transactions')
            .update({ category: newName })
            .eq('ledger_id', currentLedger.id)
            .eq('category', oldName)

        if (error) throw error
    }

    /**
     * Update a single transaction's category
     */
    const updateTransactionCategory = async (transactionId, newCategory) => {
        const { error } = await supabase
            .from('transactions')
            .update({ category: newCategory })
            .eq('id', transactionId)

        if (error) throw error
    }

    return {
        categories,
        loading,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        getCategoryTransactionCount,
        getCategoryTransactions,
        batchReplaceCategory,
        updateTransactionCategory
    }
}
