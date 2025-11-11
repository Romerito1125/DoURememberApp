"use client";

import React, { JSX, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, UserCog } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";

interface CrearUsuarioRequest {
  nombre: string;
  edad: number;
  status: "activo" | "inactivo";
  correo: string;
  contrasenia: string;
  rol: "medico";
}

type MessageState = {
  type: "success" | "error";
  text: string;
};

export default function AdminDashboard(): JSX.Element {
  const [activeSection, setActiveSection] = useState<"overview" | "register">(
    "overview"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const nombre = String(form.get("nombre") || "").trim();
    const edadRaw = form.get("edad");
    const correo = String(form.get("correo") || "").trim();
    const contrasenia = String(form.get("contrasenia") || "");

    const edad = Number(edadRaw) || 0;

    const payload: CrearUsuarioRequest = {
      nombre,
      edad,
      status: "activo",
      correo,
      contrasenia,
      rol: "medico",
    };

    // validaciones simples
    if (!nombre || !correo || !contrasenia || edad < 18) {
      setMessage({
        type: "error",
        text: "Por favor completa los campos correctamente (edad >= 18).",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/usuarios-autenticacion/crearUsuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      setMessage({ type: "success", text: "Médico creado correctamente." });
      (e.currentTarget as HTMLFormElement).reset();
      setIsModalOpen(false);
    } catch (err: unknown) {
      // manejo seguro del error
      const text =
        err instanceof Error ? err.message : "Error desconocido al crear médico";
      setMessage({ type: "error", text });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1200px] mx-auto space-y-4">
        <DashboardHeader />

        <nav className="flex gap-3 bg-white rounded p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveSection("overview")}
            className={`px-4 py-2 rounded ${activeSection === "overview" ? "bg-blue-600 text-white" : "text-slate-700"}`}
          >
            <Users className="inline w-4 h-4 mr-2" />
            Vista General
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection("register");
              setIsModalOpen(true);
            }}
            className={`px-4 py-2 rounded ${activeSection === "register" ? "bg-blue-600 text-white" : "text-slate-700"}`}
          >
            <UserCog className="inline w-4 h-4 mr-2" />
            Registrar Médico
          </button>
        </nav>

        <section className="bg-white rounded p-6 shadow">
          {activeSection === "overview" ? (
            <>
              <h2 className="text-2xl font-bold mb-2">Panel de Administración</h2>
              <p>Administra usuarios y médicos desde aquí.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Registrar Médico</h2>
              <p>Pulsa en "Crear Nuevo Médico" para abrir el formulario.</p>
              <div className="mt-4">
                <Button onClick={() => setIsModalOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear Nuevo Médico
                </Button>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Modal simple */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Registrar Médico</h3>

            {message && (
              <div
                className={`p-2 mb-3 rounded ${
                  message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm">Nombre</label>
                <input name="nombre" className="w-full border p-2 rounded" placeholder="Juan Pérez" required />
              </div>

              <div>
                <label className="block text-sm">Edad</label>
                <input name="edad" type="number" min={18} className="w-full border p-2 rounded" placeholder="30" required />
              </div>

              <div>
                <label className="block text-sm">Correo</label>
                <input name="correo" type="email" className="w-full border p-2 rounded" placeholder="juan.perez@gmail.com" required />
              </div>

              <div>
                <label className="block text-sm">Contraseña</label>
                <input name="contrasenia" type="password" minLength={8} className="w-full border p-2 rounded" placeholder="MiClaveSegura123" required />
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded bg-gray-200">
                  Cancelar
                </button>

                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white">
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
