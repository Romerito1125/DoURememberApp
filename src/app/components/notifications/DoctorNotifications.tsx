"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, X, FileText, Eye } from "lucide-react"

interface Notification {
  id: string
  type: string
  reportId: string
  patientName: string
  message: string
  date: string
  read: boolean
}

export default function DoctorNotifications() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = () => {
    const stored = JSON.parse(localStorage.getItem("doctorNotifications") || "[]")
    setNotifications(stored)
    setUnreadCount(stored.filter((n: Notification) => !n.read).length)
  }

  const markAsRead = (notificationId: string) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    )
    setNotifications(updated)
    localStorage.setItem("doctorNotifications", JSON.stringify(updated))
    setUnreadCount(updated.filter(n => !n.read).length)
  }

  const viewReport = (notification: Notification) => {
    markAsRead(notification.id)
    setIsOpen(false)
    router.push(`/reports/baseline/${notification.reportId}`)
  }

  const clearAll = () => {
    localStorage.setItem("doctorNotifications", "[]")
    setNotifications([])
    setUnreadCount(0)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Hace un momento"
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    return `Hace ${diffDays}d`
  }

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-slate-800">Notificaciones</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-slate-500">{unreadCount} sin leer</p>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            {/* Lista de notificaciones */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !notification.read ? "bg-purple-50/50" : ""
                      }`}
                      onClick={() => viewReport(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          !notification.read ? "bg-purple-100" : "bg-slate-100"
                        }`}>
                          <FileText className={`w-5 h-5 ${
                            !notification.read ? "text-purple-600" : "text-slate-600"
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-sm font-medium ${
                              !notification.read ? "text-slate-900" : "text-slate-700"
                            }`}>
                              {notification.patientName}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          
                          <p className="text-sm text-slate-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              {formatDate(notification.date)}
                            </span>
                            <button className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Ver reporte
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}