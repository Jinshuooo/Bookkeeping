import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="bg-white/20 backdrop-blur-md p-8 rounded-3xl shadow-xl">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
        </div>
    )
}
