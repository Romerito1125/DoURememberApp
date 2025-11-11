"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, TrendingUp, FileText, MessageSquare, Activity, Sparkles, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PatientDetailModalProps {
    patient: any
    open: boolean
    onClose: () => void
}

export function PatientDetailModal({ patient, open, onClose }: PatientDetailModalProps) {
    const [selectedSession, setSelectedSession] = useState("")

    const generateReport = () => {
        if (!selectedSession) {
            alert("Por favor selecciona una sesión")
            return
        }
        
        const session = patient.sessions.find((s: any) => s.id.toString() === selectedSession)
        const improvement = ((session.score - patient.baseline.score) / patient.baseline.score * 100).toFixed(1)
        
        alert(`
📊 Reporte Evaluativo Generado

Paciente: ${patient.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Baseline (${patient.baseline.date}): ${patient.baseline.score}/100
Sesión Actual (${session.date}): ${session.score}/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Mejora: ${improvement}% desde el baseline
        `)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 border-0">
                {/* Header simple sin degradado */}
                <div className="bg-white px-8 py-6 border-b border-gray-200">
                    <DialogHeader>
                        <div className="flex items-center gap-5">
                            <Avatar className="w-20 h-20 border-4 border-gray-100 shadow-lg">
                                <AvatarImage src={`/avatars/${patient.name.toLowerCase()}.jpg`} />
                                <AvatarFallback className="bg-purple-100 text-purple-600 text-2xl font-bold">
                                    {patient.name.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <DialogTitle className="text-3xl font-bold text-gray-900 mb-1">
                                    {patient.name}
                                </DialogTitle>
                                <p className="text-gray-600 text-sm">{patient.email}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="px-3 py-1 bg-purple-100 rounded-full text-xs text-purple-700 font-medium">
                                        {patient.totalSessions} sesiones
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 font-medium">
                                        {patient.age} años
                                    </span>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Contenido con tabs */}
                <div className="overflow-y-auto max-h-[calc(90vh-180px)] bg-gray-50">
                    <Tabs defaultValue="sessions" className="p-6">
                        <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 p-1 rounded-xl h-14">
                            <TabsTrigger 
                                value="sessions" 
                                className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold text-gray-600"
                            >
                                <Activity className="w-4 h-4 mr-2" />
                                Sesiones
                            </TabsTrigger>
                            <TabsTrigger 
                                value="baseline"
                                className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold text-gray-600"
                            >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Baseline
                            </TabsTrigger>
                            <TabsTrigger 
                                value="reports"
                                className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold text-gray-600"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Reportes
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab de Sesiones */}
                        <TabsContent value="sessions" className="space-y-4 mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Historial de Sesiones</h3>
                                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                                    {patient.sessions.length} sesiones
                                </span>
                            </div>
                            
                            {patient.sessions.map((session: any, index: number) => (
                                <div 
                                    key={session.id} 
                                    className="group relative p-5 rounded-2xl border-2 border-gray-200 hover:border-purple-300 bg-white hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 rounded-l-2xl" />
                                    
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-600 text-sm font-bold">
                                                    #{patient.sessions.length - index}
                                                </span>
                                                <h4 className="font-bold text-gray-900 text-lg">{session.description}</h4>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(session.date).toLocaleDateString('es-ES', { 
                                                    weekday: 'long', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="px-4 py-3 bg-purple-50 rounded-2xl border border-purple-100">
                                                <div className="text-3xl font-black text-purple-600">
                                                    {session.score}
                                                </div>
                                                <div className="text-xs text-gray-500 font-semibold">puntos</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Retroalimentación */}
                                    <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                <MessageSquare className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-purple-900 mb-1 uppercase tracking-wide">
                                                    Retroalimentación
                                                </p>
                                                <p className="text-sm text-gray-700 leading-relaxed">{session.feedback}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </TabsContent>

                        {/* Tab de Baseline */}
                        <TabsContent value="baseline" className="mt-6">
                            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
                                        <TrendingUp className="w-8 h-8 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Baseline Inicial</h3>
                                        <p className="text-gray-600">Evaluación de referencia</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                                        <p className="text-sm text-gray-600 mb-2">Fecha de Evaluación</p>
                                        <p className="text-xl font-bold text-gray-900">{new Date(patient.baseline.date).toLocaleDateString('es-ES')}</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
                                        <p className="text-sm text-gray-600 mb-2">Puntuación Inicial</p>
                                        <p className="text-4xl font-black text-purple-600">{patient.baseline.score}<span className="text-xl">/100</span></p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mb-6">
                                    <p className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-900">
                                        <FileText className="w-4 h-4" />
                                        Notas del Especialista
                                    </p>
                                    <p className="text-sm leading-relaxed text-gray-700">{patient.baseline.notes}</p>
                                </div>

                                {patient.sessions.length > 0 && (
                                    <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-sm font-bold text-gray-900">Progreso Actual</p>
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-purple-600" />
                                                <span className="text-lg font-black text-purple-600">
                                                    +{patient.sessions[0].score - patient.baseline.score} pts
                                                </span>
                                            </div>
                                        </div>
                                        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className="absolute top-0 left-0 h-full bg-purple-600 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${(patient.sessions[0].score / 100) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                                            <span>0</span>
                                            <span className="font-semibold text-purple-600">{patient.sessions[0].score}/100</span>
                                            <span>100</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Tab de Reportes */}
                        <TabsContent value="reports" className="mt-6">
                            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-300 p-10">
                                <div className="text-center max-w-md mx-auto">
                                    <div className="inline-block mb-6">
                                        <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center">
                                            <FileText className="w-10 h-10 text-purple-600" />
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Generar Reporte Evaluativo</h3>
                                    <p className="text-sm text-gray-600 mb-8">
                                        Compara el baseline con una sesión específica para obtener un análisis detallado del progreso
                                    </p>

                                    <div className="space-y-4">
                                        <div className="text-left">
                                            <label className="text-sm font-bold text-gray-700 mb-2 block">
                                                Seleccionar Sesión para Comparar
                                            </label>
                                            <Select value={selectedSession} onValueChange={setSelectedSession}>
                                                <SelectTrigger className="h-14 border-2 border-gray-200 focus:border-purple-400 rounded-xl bg-white text-gray-900">
                                                    <SelectValue placeholder="Elige una sesión del historial" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {patient.sessions.map((session: any, index: number) => (
                                                        <SelectItem key={session.id} value={session.id.toString()} className="text-gray-900">
                                                            <div className="flex items-center gap-3 py-1">
                                                                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-purple-100 text-purple-600 text-xs font-bold">
                                                                    #{patient.sessions.length - index}
                                                                </span>
                                                                <div className="text-left">
                                                                    <div className="font-semibold">{session.description}</div>
                                                                    <div className="text-xs text-gray-500">{session.date}</div>
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button 
                                            onClick={generateReport}
                                            className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-base"
                                        >
                                            <Download className="w-5 h-5 mr-2" />
                                            Generar Reporte Completo
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}