import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const LedgerContext = createContext({})

export const useLedger = () => useContext(LedgerContext)

export const LedgerProvider = ({ children }) => {
    const { user } = useAuth()
    const [ledgers, setLedgers] = useState([])
    const [currentLedger, setCurrentLedger] = useState(null)
    const [loading, setLoading] = useState(true)

    // Fetch ledgers when user changes
    useEffect(() => {
        if (!user) {
            setLedgers([])
            setCurrentLedger(null)
            setLoading(false)
            return
        }
        fetchLedgers()
    }, [user])

    const fetchLedgers = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('ledgers')
                .select('*')
                .order('created_at', { ascending: true })

            if (error) throw error

            if (data.length === 0) {
                // If no ledger exists, we wait or show empty state. 
                // The backend trigger should have created one for new users. 
                // However, for existing users without ledgers, they might need manual creation via UI.
                setLedgers([])
            } else {
                setLedgers(data)
                // Restore selection from local storage or default to first
                const savedId = localStorage.getItem('currentLedgerId')
                const found = data.find(l => l.id === savedId)
                if (found) {
                    setCurrentLedger(found)
                } else {
                    setCurrentLedger(data[0])
                    localStorage.setItem('currentLedgerId', data[0].id)
                }
            }
        } catch (error) {
            console.error('Error fetching ledgers:', error)
        } finally {
            setLoading(false)
        }
    }

    const createLedger = async (name) => {
        try {
            const { data, error } = await supabase
                .rpc('create_ledger', { new_ledger_name: name })

            if (error) throw error

            // Refresh ledgers list
            await fetchLedgers()
            return data
        } catch (error) {
            console.error('Error creating ledger:', error)
            throw error
        }
    }

    const switchLedger = (ledger) => {
        setCurrentLedger(ledger)
        localStorage.setItem('currentLedgerId', ledger.id)
    }

    const addMember = async (email) => {
        if (!currentLedger) return

        try {
            // 1. Find User by Email (using profiles table)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single()

            if (profileError || !profile) {
                throw new Error('未找到该用户，请确认对方已注册')
            }

            // 2. Add to Ledger Members
            const { error: memberError } = await supabase
                .from('ledger_members')
                .insert([{
                    ledger_id: currentLedger.id,
                    user_id: profile.id,
                    role: 'member'
                }])

            if (memberError) throw memberError

            return true
        } catch (error) {
            console.error('Error adding member:', error)
            throw error
        }
    }

    const getMembers = async () => {
        if (!currentLedger) return []

        try {
            // Get ledger members
            const { data: members, error: membersError } = await supabase
                .from('ledger_members')
                .select('user_id, role')
                .eq('ledger_id', currentLedger.id)

            if (membersError) throw membersError

            // Get profiles for these users
            const userIds = members.map(m => m.user_id)
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, email')
                .in('id', userIds)

            if (profilesError) throw profilesError

            // Combine the data
            return members.map(m => {
                const profile = profiles.find(p => p.id === m.user_id)
                return {
                    role: m.role,
                    email: profile?.email || '未知用户'
                }
            })
        } catch (error) {
            console.error('Error in getMembers:', error)
            throw error
        }
    }

    const value = {
        ledgers,
        currentLedger,
        loading,
        createLedger,
        switchLedger,
        addMember,
        getMembers
    }

    return (
        <LedgerContext.Provider value={value}>
            {!loading && children}
        </LedgerContext.Provider>
    )
}
