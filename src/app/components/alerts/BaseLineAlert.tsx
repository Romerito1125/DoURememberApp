// src/app/dashboard/medico/baseline/GenerarBaselineForm.tsx
'use client';

import { useState } from 'react';
import { apiService } from '@/services/api.service';
import { toast } from 'sonner'; // o tu librería de notificaciones

interface BaselineFormProps {
  paciente: {
    id: string;
    nombre: string;
    email: string;
  };
  medico: {
    nombre: string;
    email: string;
  };
}

export default function GenerarBaselineForm({ paciente, medico }: BaselineFormProps) {
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({
    coherencia: 0,
    comision: 0,
    fluidez: 0,
    omision: 0,
    recall: 0,
  });

  const calcularTotal = () => {
    return Object.values(scores).reduce((sum, val) => sum + val, 0);
  };

  const handleGenerarBaseline = async () => {
    try {
      setLoading(true);
      const toastId = toast.loading('Generando baseline...');

      // 1. Crear el baseline en el backend
      const baseline = await apiService.crearBaseline({
        idPaciente: paciente.id,
        ...scores,
        total: calcularTotal(),
      });

      // 2. 🔥 ENVIAR CORREO DE NOTIFICACIÓN
      await apiService.enviarAvisoBaseline({
        usuarioEmail: medico.email,
        nombreDoctor: medico.nombre,
        nombrePaciente: paciente.nombre,
        sessionCoherencia: scores.coherencia,
        sessionComision: scores.comision,
        sessionFluidez: scores.fluidez,
        sessionOmision: scores.omision,
        sessionRecall: scores.recall,
        sessionTotal: calcularTotal(),
      });

      toast.success('✅ Baseline generado y correo enviado', { id: toastId });

    } catch (error: any) {
      toast.error('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Generar Baseline</h2>
      <p className="text-gray-600 mb-6">Paciente: {paciente.nombre}</p>

      <div className="space-y-4">
        {/* Inputs para los scores */}
        {Object.keys(scores).map((key) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-2 capitalize">
              {key}
            </label>
            <input
              type="number"
              value={scores[key as keyof typeof scores]}
              onChange={(e) =>
                setScores({ ...scores, [key]: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        ))}

        <div className="pt-4 border-t">
          <p className="text-lg font-semibold">
            Total: {calcularTotal()} puntos
          </p>
        </div>

        <button
          onClick={handleGenerarBaseline}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Generando...' : 'Generar Baseline y Enviar Correo'}
        </button>
      </div>
    </div>
  );
}