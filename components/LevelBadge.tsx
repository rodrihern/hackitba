import type { UserLevel } from '@/lib/types'

const levelConfig: Record<UserLevel, { color: string; icon: string }> = {
  Bronze: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '🥉' },
  Silver: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: '🥈' },
  Gold: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '🥇' },
  Platinum: { color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: '💎' },
  Diamond: { color: 'bg-violet-100 text-violet-700 border-violet-200', icon: '✨' },
}

interface Props {
  level: UserLevel
  size?: 'sm' | 'md' | 'lg'
}

export default function LevelBadge({ level, size = 'md' }: Props) {
  const config = levelConfig[level]
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-4 py-1.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${sizeClass}`}>
      {config.icon} {level}
    </span>
  )
}
