// src/app/dashboard/paciente/sesiones/SesionControls.tsx
'use client';

import { useState } from 'react';
import { apiService } from '@/services/api.service';
import { toast } from 'sonner';

interface SesionControlsProps {
  usuario: {
    email: string;
    nombre: string;
  };
  sesion: {
    id: number;
    numero: number;
    activa: boolean;
  };
  onSesionChange: () => void; // Callback para refrescar la lista
}

export default function SesionControls({ 
  usuario, 
  sesion, 
  onSesionChange 
}: SesionControlsProps) {
  const [loading, setLoading] = useState(false);

  // 🔥 ACTIVAR SESIÓN
  const handleActivar = async () => {
    try {
      setLoading(true);
      const toastId = toast.loading('Activando sesión...');

      // 1. Activar en el backend
      await apiService.activarSesion(sesion.id);

      // 2. ENVIAR CORREO DE NOTIFICACIÓN
      await apiService.notificarActivacionSesion({
        usuarioEmail: usuario.email,
        nombreCompleto: usuario.nombre,
        sessionNumber: sesion.numero,
      });

      toast.success(`✅ Sesión ${sesion.numero} activada`, { id: toastId });
      onSesionChange(); // Refrescar la UI

    } catch (error: any) {
      toast.error('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 DESACTIVAR SESIÓN
  const handleDesactivar = async () => {
    try {
      setLoading(true);
      const toastId = toast.loading('Desactivando sesión...');

      // 1. Desactivar en el backend
      await apiService.desactivarSesion(sesion.id);

      // 2. ENVIAR CORREO DE NOTIFICACIÓN
      await apiService.notificarDesactivacionSesion({
        usuarioEmail: usuario.email,
        nombreCompleto: usuario.nombre,
        sessionNumber: sesion.numero,
      });

      toast.success(`✅ Sesión ${sesion.numero} desactivada`, { id: toastId });
      onSesionChange(); // Refrescar la UI

    } catch (error: any) {
      toast.error('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {!sesion.activa ? (
        <button
          onClick={handleActivar}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '⏳' : '▶️'} Activar Sesión {sesion.numero}
        </button>
      ) : (
        <button
          onClick={handleDesactivar}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? '⏳' : '⏹️'} Desactivar Sesión {sesion.numero}
        </button>
      )}
    </div>
  );
}

// EJEMPLO DE USO EN EL DASHBOARD DEL PACIENTE
// src/app/dashboard/paciente/page.tsx
export function PacienteDashboard() {
  const [usuario] = useState({
    email: 'paciente@ejemplo.com',
    nombre: 'Juan Pérez',
  });

  const [sesiones, setSesiones] = useState([
    { id: 1, numero: 1, activa: false },
    { id: 2, numero: 2, activa: true },
    { id: 3, numero: 3, activa: false },
  ]);

  const refrescarSesiones = async () => {
    // Aquí harías el fetch real de las sesiones
    const nuevasSesiones = await apiService.getSesiones(usuario.email);
    setSesiones(nuevasSesiones);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Mis Sesiones</h1>

      <div className="space-y-4">
        {sesiones.map((sesion) => (
          <div 
            key={sesion.id}
            className="p-4 bg-white rounded-lg shadow border-l-4"
            style={{ 
              borderLeftColor: sesion.activa ? '#16a34a' : '#9ca3af' 
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">
                  Sesión {sesion.numero}
                </h3>
                <p className={`text-sm ${sesion.activa ? 'text-green-600' : 'text-gray-500'}`}>
                  {sesion.activa ? '✅ Activa' : '⏸️ Inactiva'}
                </p>
              </div>

              <SesionControls
                usuario={usuario}
                sesion={sesion}
                onSesionChange={refrescarSesiones}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}