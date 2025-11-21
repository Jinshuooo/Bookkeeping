import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="bg-white/20 backdrop-blur-md p-8 rounded-3xl shadow-xl">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
        </div>
    )
}
