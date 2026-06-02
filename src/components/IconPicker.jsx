import { useState } from 'react'
import { ICON_POOL, getIconComponent } from '../lib/constants'

export default function IconPicker({ selectedIcon, onSelect }) {
    const [activeGroup, setActiveGroup] = useState(ICON_POOL[0].group)

    const currentGroup = ICON_POOL.find(g => g.group === activeGroup) || ICON_POOL[0]

    return (
        <div className="space-y-3">
            {/* Group Tabs */}
            <div className="flex flex-wrap gap-1.5">
                {ICON_POOL.map(group => (
                    <button
                        key={group.group}
                        type="button"
                        onClick={() => setActiveGroup(group.group)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeGroup === group.group
                            ? 'bg-primary text-surface'
                            : 'bg-background text-muted hover:bg-primary/5 hover:text-primary border border-primary/10'
                            }`}
                    >
                        {group.group}
                    </button>
                ))}
            </div>

            {/* Icon Grid */}
            <div className="bg-background border border-primary/10 rounded-xl p-3">
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-48 overflow-y-auto">
                    {currentGroup.icons.map(iconName => {
                        const Icon = getIconComponent(iconName)
                        const isSelected = selectedIcon === iconName
                        return (
                            <button
                                key={iconName}
                                type="button"
                                onClick={() => onSelect(iconName)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected
                                    ? 'bg-primary text-surface scale-110 shadow-sm'
                                    : 'bg-surface text-muted hover:bg-primary/10 hover:text-primary border border-primary/10'
                                    }`}
                                title={iconName}
                            >
                                <Icon className="w-5 h-5" />
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
