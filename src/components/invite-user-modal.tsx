"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Mail, User, Sparkles } from "lucide-react"

interface InviteUserModalProps {
    open: boolean
    onClose: () => void
}

export function InviteUserModal({ open, onClose }: InviteUserModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: ""
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log("Invitando usuario:", formData)
        alert(`✅ Invitación enviada a ${formData.email} como ${formData.role}`)
        onClose()
        setFormData({ name: "", email: "", role: "" })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0">
                {/* Header simple sin degradado */}
                <div className="relative bg-white px-6 py-8 border-b border-gray-100">
                    <DialogHeader className="relative">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                                <UserPlus className="w-6 h-6 text-purple-600" />
                            </div>
                            <DialogTitle className="text-2xl font-bold text-gray-900">
                                Invitar Usuario
                            </DialogTitle>
                        </div>
                        <p className="text-gray-600 text-sm">
                            Añade un nuevo paciente o cuidador a tu red
                        </p>
                    </DialogHeader>
                </div>
                
                {/* Formulario */}
                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5 bg-white">
                    {/* Campo Nombre */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                            Nombre Completo
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                            <Input
                                id="name"
                                placeholder="Ej: Juan Pérez"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="pl-10 h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl bg-white text-gray-900"
                                required
                            />
                        </div>
                    </div>

                    {/* Campo Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                            Correo Electrónico
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="juan.perez@ejemplo.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="pl-10 h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl bg-white text-gray-900"
                                required
                            />
                        </div>
                    </div>

                    {/* Campo Rol */}
                    <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                            Rol del Usuario
                        </Label>
                        <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                            <SelectTrigger className="h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl text-gray-900">
                                <SelectValue placeholder="Selecciona el rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="patient" className="cursor-pointer text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span>Paciente</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="caregiver" className="cursor-pointer text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span>Cuidador</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onClose} 
                            className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50 text-gray-900"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            className="flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Enviar Invitación
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}