'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/types'

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffDays > 0) return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
  if (diffHours > 0) return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
  return 'hace un momento'
}

export default function NotificationsPage() {
  const { session } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
      if (!session?.user) return

      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (data) {
          setNotifications(data.map(n => ({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            message: n.message,
            read: n.read,
            createdAt: n.created_at,
          })))
        }
      } catch (err) {
        console.error('Error fetching notifications:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [session])

  const markAllRead = async () => {
    if (!session?.user) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id)
      .eq('read', false)

    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Notificaciones</h1>
          <p className="text-gray-500">
            {unreadCount > 0
              ? `${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
              : 'Todo al día'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-50"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔔</div>
            <p className="font-medium text-gray-600 mb-1">Sin notificaciones</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => markRead(notification.id)}
              className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${
                !notification.read
                  ? 'border-indigo-100 bg-indigo-50/30'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Dot indicator */}
                <div className="flex-shrink-0 mt-1">
                  {!notification.read ? (
                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                  ) : (
                    <div className="w-2.5 h-2.5 bg-gray-200 rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-semibold text-sm leading-snug ${
                      !notification.read ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
