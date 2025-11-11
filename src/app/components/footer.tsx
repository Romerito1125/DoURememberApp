export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Información de Contacto</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p>+57 310 101 1010</p>
                <p>contacto@douremember.com</p>
                <p>UAO, CALI</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Horarios de Atención</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p>Lunes - Viernes: 8:00 AM - 6:00 PM</p>
                <p>Sábados: 9:00 AM - 2:00 PM</p>
                <p>Domingos: Cerrado</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 mt-8 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Aplicación Proyecto Informático - Universidad Autónoma de Occidente &copy; 2025.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
