import { useState, useRef, useEffect } from 'react'
import { useLedger } from '../contexts/LedgerContext'
import { useAuth } from '../contexts/AuthContext'
import { ChevronDown, Plus, Users, Check, X, Book } from 'lucide-react'

export default function LedgerSwitcher() {
    const { ledgers, currentLedger, switchLedger, createLedger, addMember, getMembers } = useLedger()
    const { user } = useAuth()

    const [isOpen, setIsOpen] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [showMembers, setShowMembers] = useState(false)
    const [newLedgerName, setNewLedgerName] = useState('')
    const [inviteEmail, setInviteEmail] = useState('')
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
                setShowCreate(false)
                setShowMembers(false)
                setError('')
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!newLedgerName.trim()) return
        setLoading(true)
        setError('')
        try {
            await createLedger(newLedgerName)
            setNewLedgerName('')
            setShowCreate(false)
            setIsOpen(false)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!inviteEmail.trim()) return
        setLoading(true)
        setError('')
        try {
            await addMember(inviteEmail)
            setInviteEmail('')
            loadMembers()
            alert('邀请成功')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const loadMembers = async () => {
        try {
            const data = await getMembers()
            setMembers(data)
        } catch (err) {
            console.error(err)
        }
    }

    const openMembers = () => {
        setShowMembers(true)
        loadMembers()
        setShowCreate(false)
        setError('')
    }

    const openCreate = () => {
        setShowCreate(true)
        setShowMembers(false)
        setError('')
    }

    // REMOVED: if (!currentLedger) return null

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-primary/5 transition-colors text-primary font-medium w-full"
            >
                <Book className="w-4 h-4" />
                <span className="truncate flex-1 text-left">
                    {currentLedger ? currentLedger.name : '选择/创建账本'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-xl shadow-lg border border-primary/10 py-1 z-50 min-w-[240px]">
                    {!showCreate && !showMembers && (
                        <>
                            <div className="max-h-60 overflow-y-auto">
                                {ledgers.length > 0 ? (
                                    ledgers.map(ledger => (
                                        <button
                                            key={ledger.id}
                                            onClick={() => {
                                                switchLedger(ledger)
                                                setIsOpen(false)
                                            }}
                                            className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-primary/5 transition-colors ${currentLedger?.id === ledger.id ? 'text-primary font-bold' : 'text-muted'
                                                }`}
                                        >
                                            <span className="truncate">{ledger.name}</span>
                                            {currentLedger?.id === ledger.id && <Check className="w-4 h-4" />}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-muted text-sm text-center">
                                        暂无账本
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-primary/10 mt-1 pt-1">
                                <button
                                    onClick={openCreate}
                                    className="w-full text-left px-4 py-3 flex items-center gap-2 text-primary hover:bg-primary/5 transition-colors font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    创建新账本
                                </button>
                                {currentLedger && (
                                    <button
                                        onClick={openMembers}
                                        className="w-full text-left px-4 py-3 flex items-center gap-2 text-primary hover:bg-primary/5 transition-colors font-medium"
                                    >
                                        <Users className="w-4 h-4" />
                                        成员管理
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {showCreate && (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-primary">创建账本</h3>
                                <button onClick={() => setShowCreate(false)} className="text-muted hover:text-primary">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="账本名称"
                                    value={newLedgerName}
                                    onChange={(e) => setNewLedgerName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-background border border-primary/10 outline-none focus:border-primary/30"
                                    autoFocus
                                />
                                {error && <p className="text-xs text-error">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary hover:bg-primary/90 text-surface py-2 rounded-lg font-medium disabled:opacity-50"
                                >
                                    {loading ? '创建中...' : '确认创建'}
                                </button>
                            </form>
                        </div>
                    )}

                    {showMembers && (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-primary">成员管理</h3>
                                <button onClick={() => setShowMembers(false)} className="text-muted hover:text-primary">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <form onSubmit={handleInvite} className="space-y-2">
                                    <p className="text-xs text-muted">邀请成员</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder="对方邮箱"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-background border border-primary/10 outline-none focus:border-primary/30 text-sm"
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-primary/10 text-primary px-3 py-2 rounded-lg font-medium text-sm hover:bg-primary/20 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            邀请
                                        </button>
                                    </div>
                                    {error && <p className="text-xs text-error">{error}</p>}
                                </form>

                                <div className="space-y-2">
                                    <p className="text-xs text-muted">现有成员</p>
                                    <div className="max-h-32 overflow-y-auto space-y-2">
                                        {members.length > 0 ? (
                                            members.map((m, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm p-2 bg-background rounded-lg border border-primary/5">
                                                    <span className="truncate text-primary">{m.email}</span>
                                                    <span className="text-xs text-muted px-2 py-0.5 bg-primary/5 rounded">{m.role === 'owner' ? '以及' : m.role}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted text-center py-2">加载中...</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
