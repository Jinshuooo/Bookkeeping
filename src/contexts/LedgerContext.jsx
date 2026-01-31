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
                // If no ledger exists, create a default one
                await createLedger('默认账本')
                return // createLedger will trigger fetchLedgers again hopefully or we just set it there
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
            // 1. Create Ledger
            const { data: ledger, error: ledgerError } = await supabase
                .from('ledgers')
                .insert([{ name, created_by: user.id }])
                .select()
                .single()

            if (ledgerError) throw ledgerError

            // 2. Add Member (Owner) - This might be handled by RLS/Trigger but let's be explicit if needed.
            // My SQL policy allows insert to 'ledger_members' if it's the first one.
            // Wait, my SQL said: "Owners can add members". 
            // And "Allow self-insert if it's the first member".

            const { error: memberError } = await supabase
                .from('ledger_members')
                .insert([{ ledger_id: ledger.id, user_id: user.id, role: 'owner' }])

            if (memberError) {
                // If member creation fails, maybe we should cleanup the ledger? 
                // Or maybe the Trigger handled it? I didn't verify a trigger for this in SQL. 
                // I rely on client call.
                console.error('Error adding member:', memberError)
                throw memberError
            }

            // Refresh
            await fetchLedgers() // simpler than updating state manually
            return ledger
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
        const { data, error } = await supabase
            .from('ledger_members')
            .select(`
                role,
                profiles:user_id (email)
            `)
            .eq('ledger_id', currentLedger.id)

        if (error) throw error
        return data.map(m => ({
            role: m.role,
            email: m.profiles.email
        }))
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
