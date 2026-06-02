import {
    Utensils, Bus, ShoppingBag, Home, Zap,
    Gamepad2, GraduationCap, Stethoscope, Plane,
    Briefcase, DollarSign, Gift, MoreHorizontal,
    TrendingUp, Wallet, Coffee, Beer, Wine,
    Pizza, CakeSlice, IceCream2, Apple, Croissant,
    ChefHat, CookingPot, Sandwich, Beef, Grape,
    Car, Bike, Train, Ship, CarTaxiFront, Fuel,
    Navigation, ParkingCircle, ShoppingCart, ShoppingBasket,
    CreditCard, Banknote, Receipt, Tag, Percent,
    Gem, Store, Building2, Sofa, Lightbulb,
    Wrench, PaintBucket, Hammer, Ruler, Bed, Bath,
    Wifi, Phone, Smartphone, Radio, Tv, Router,
    Droplets, Power, Cable, Music, Film, Tv2,
    Clapperboard, Dumbbell, Trophy, Ticket, PartyPopper,
    Palette, BookOpen, BookMarked, Library, PenTool,
    Pencil, School, Languages, Calculator, Globe,
    HeartPulse, Pill, Syringe, Ambulance, Activity,
    Brain, Eye, Thermometer, Cross,
    Landmark, PiggyBank, LineChart, BarChart3,
    CircleDollarSign, ReceiptText, BadgeDollarSign,
    Star, Heart, Camera, Baby, PawPrint,
    Flower2, Umbrella, Backpack, Sun, Moon,
    Cloud, Settings, Bell
} from 'lucide-react'

// ==========================================
// Icon Name → Lucide Component Mapping
// ==========================================
const ICON_MAP = {
    Utensils, Bus, ShoppingBag, Home, Zap,
    Gamepad2, GraduationCap, Stethoscope, Plane,
    Briefcase, DollarSign, Gift, MoreHorizontal,
    TrendingUp, Wallet, Coffee, Beer, Wine,
    Pizza, CakeSlice, IceCream2, Apple, Croissant,
    ChefHat, CookingPot, Sandwich, Beef, Grape,
    Car, Bike, Train, Ship, CarTaxiFront, Fuel,
    Navigation, ParkingCircle, ShoppingCart, ShoppingBasket,
    CreditCard, Banknote, Receipt, Tag, Percent,
    Gem, Store, Building2, Sofa, Lightbulb,
    Wrench, PaintBucket, Hammer, Ruler, Bed, Bath,
    Wifi, Phone, Smartphone, Radio, Tv, Router,
    Droplets, Power, Cable, Music, Film, Tv2,
    Clapperboard, Dumbbell, Trophy, Ticket, PartyPopper,
    Palette, BookOpen, BookMarked, Library, PenTool,
    Pencil, School, Languages, Calculator, Globe,
    HeartPulse, Pill, Syringe, Ambulance, Activity,
    Brain, Eye, Thermometer, Cross,
    Landmark, PiggyBank, LineChart, BarChart3,
    CircleDollarSign, ReceiptText, BadgeDollarSign,
    Star, Heart, Camera, Baby, PawPrint,
    Flower2, Umbrella, Backpack, Sun, Moon,
    Cloud, Settings, Bell
}

/**
 * Convert an icon name string to a Lucide React component.
 * Falls back to MoreHorizontal if the icon is not found.
 */
export function getIconComponent(iconName) {
    if (!iconName) return MoreHorizontal
    return ICON_MAP[iconName] || MoreHorizontal
}

// ==========================================
// Default Categories (for initialization)
// ==========================================
export const DEFAULT_CATEGORIES = {
    expense: [
        { name: '餐饮', icon: 'Utensils', sort_order: 10 },
        { name: '交通', icon: 'Bus', sort_order: 9 },
        { name: '购物', icon: 'ShoppingBag', sort_order: 8 },
        { name: '居住', icon: 'Home', sort_order: 7 },
        { name: '水电', icon: 'Zap', sort_order: 6 },
        { name: '娱乐', icon: 'Gamepad2', sort_order: 5 },
        { name: '教育', icon: 'GraduationCap', sort_order: 4 },
        { name: '医疗', icon: 'Stethoscope', sort_order: 3 },
        { name: '旅行', icon: 'Plane', sort_order: 2 },
        { name: '其他', icon: 'MoreHorizontal', sort_order: 1 },
    ],
    income: [
        { name: '工资', icon: 'Wallet', sort_order: 6 },
        { name: '奖金', icon: 'DollarSign', sort_order: 5 },
        { name: '理财', icon: 'TrendingUp', sort_order: 4 },
        { name: '礼金', icon: 'Gift', sort_order: 3 },
        { name: '固收', icon: 'Briefcase', sort_order: 2 },
        { name: '其他收入', icon: 'MoreHorizontal', sort_order: 1 },
    ]
}

// ==========================================
// Icon Pool for User Selection
// Grouped by category for easy browsing
// ==========================================
export const ICON_POOL = [
    {
        group: '餐饮美食',
        icons: [
            'Utensils', 'Coffee', 'Beer', 'Wine', 'Pizza',
            'CakeSlice', 'IceCream2', 'Apple', 'Croissant', 'ChefHat',
            'CookingPot', 'Sandwich', 'Beef', 'Grape'
        ]
    },
    {
        group: '交通出行',
        icons: [
            'Bus', 'Car', 'Plane', 'Bike', 'Train',
            'Ship', 'CarTaxiFront', 'Fuel', 'Navigation', 'ParkingCircle'
        ]
    },
    {
        group: '购物消费',
        icons: [
            'ShoppingBag', 'ShoppingCart', 'ShoppingBasket', 'CreditCard',
            'Banknote', 'Receipt', 'Tag', 'Percent', 'Gem', 'Store'
        ]
    },
    {
        group: '居家生活',
        icons: [
            'Home', 'Building2', 'Sofa', 'Lightbulb', 'Wrench',
            'PaintBucket', 'Hammer', 'Ruler', 'Bed', 'Bath'
        ]
    },
    {
        group: '水电通讯',
        icons: [
            'Zap', 'Wifi', 'Phone', 'Smartphone', 'Radio',
            'Tv', 'Router', 'Droplets', 'Power', 'Cable'
        ]
    },
    {
        group: '娱乐休闲',
        icons: [
            'Gamepad2', 'Music', 'Film', 'Tv2', 'Clapperboard',
            'Dumbbell', 'Trophy', 'Ticket', 'PartyPopper', 'Palette'
        ]
    },
    {
        group: '教育学习',
        icons: [
            'GraduationCap', 'BookOpen', 'BookMarked', 'Library',
            'PenTool', 'Pencil', 'School', 'Languages', 'Calculator', 'Globe'
        ]
    },
    {
        group: '医疗健康',
        icons: [
            'Stethoscope', 'HeartPulse', 'Pill', 'Syringe', 'Ambulance',
            'Activity', 'Brain', 'Eye', 'Thermometer', 'Cross'
        ]
    },
    {
        group: '金融理财',
        icons: [
            'Briefcase', 'TrendingUp', 'DollarSign', 'Wallet',
            'Landmark', 'PiggyBank', 'LineChart', 'BarChart3',
            'CircleDollarSign', 'ReceiptText', 'BadgeDollarSign'
        ]
    },
    {
        group: '其他',
        icons: [
            'Gift', 'MoreHorizontal', 'Star', 'Heart',
            'Camera', 'Baby', 'PawPrint', 'Flower2', 'Umbrella',
            'Backpack', 'Sun', 'Moon', 'Cloud', 'Settings', 'Bell'
        ]
    }
]

// ==========================================
// Backward Compatibility Helpers
// ==========================================

/**
 * @deprecated Use useCategories hook instead.
 * Returns a legacy-format category object for components
 * that haven't been migrated yet.
 */
export function getCategoryIcon(type, name, categoriesList) {
    if (!type || !name) return MoreHorizontal
    // If a dynamic categories list is provided, search it first
    if (categoriesList && categoriesList.length > 0) {
        const cat = categoriesList.find(c => c.type === type && c.name === name)
        if (cat) return getIconComponent(cat.icon)
    }
    // Fallback to default categories
    const defaultList = DEFAULT_CATEGORIES[type]
    const cat = defaultList?.find(c => c.name === name)
    if (cat) return getIconComponent(cat.icon)
    return MoreHorizontal
}
