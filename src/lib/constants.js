import {
    Utensils, Bus, ShoppingBag, Home, Zap,
    Gamepad2, GraduationCap, Stethoscope, Plane,
    Briefcase, DollarSign, Gift, MoreHorizontal,
    Calendar, FileText, TrendingUp, Wallet
} from 'lucide-react'

export const CATEGORIES = {
    expense: [
        { id: 'food', name: '餐饮', icon: Utensils, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'transport', name: '交通', icon: Bus, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'shopping', name: '购物', icon: ShoppingBag, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'housing', name: '居住', icon: Home, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'utilities', name: '水电', icon: Zap, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'entertainment', name: '娱乐', icon: Gamepad2, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'education', name: '教育', icon: GraduationCap, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'medical', name: '医疗', icon: Stethoscope, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'travel', name: '旅行', icon: Plane, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'other', name: '其他', icon: MoreHorizontal, color: 'bg-surface text-primary border-2 border-primary' },
    ],
    income: [
        { id: 'fixed', name: '固收', icon: Briefcase, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'salary', name: '工资', icon: Wallet, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'bonus', name: '奖金', icon: DollarSign, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'investment', name: '理财', icon: TrendingUp, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'gift', name: '礼金', icon: Gift, color: 'bg-surface text-primary border-2 border-primary' },
        { id: 'other_income', name: '其他', icon: MoreHorizontal, color: 'bg-surface text-primary border-2 border-primary' },
    ]
}

export const getCategoryIcon = (type, name) => {
    if (!type || !name) return MoreHorizontal
    const categoryList = CATEGORIES[type]
    const category = categoryList?.find(c => c.name === name)
    return category ? category.icon : MoreHorizontal
}
