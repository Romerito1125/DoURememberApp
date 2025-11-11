import { authService } from './auth.service'

export interface SessionData {
  fechaInicio: string
  fechaCreacion: string
  idSesion: number
  sessionTotal: number
  sessionRecall: number
  sessionCoherencia: number
  sessionFluidez: number
  sessionOmision: number
  sessionComision: number
}

export interface PatientSummary {
  count: number
  avgSessionTotal: number
  avgRecall: number
  firstSessionTotal: number
  lastSessionTotal: number
  trend_sessionTotal: string
  slopePerDay_sessionTotal: number | null
}

export interface PatientReport {
  patientId: string
  patientName: string
  period: {
    from: string
    to: string
  }
  summary: PatientSummary
  sessions: SessionData[]
}

// Nueva interfaz para descripciones
export interface DescriptionComparison {
  idDescripcion: number
  idImagen: number
  fecha: string
  texto: string
  groundTruth?: {
    texto: string
    palabrasClave: string[]
    preguntasGuiaPaciente: string[]
  }
  puntaje?: {
    rateOmision: number
    rateComision: number
    rateExactitud: number
    puntajeCoherencia: number
    puntajeFluidez: number
    puntajeTotal: number
    detallesOmitidos: string[]
    palabrasClaveOmitidas: string[]
    elementosComision: string[]
    aciertos: string[]
    conclusion: string
  }
}

export interface SessionDetails {
  idSesion: number
  fechaCreacion: string
  estado: string
  sessionTotal: number
  sessionRecall: number
  sessionCoherencia: number
  sessionFluidez: number
  sessionOmision: number
  sessionComision: number
  conclusionTecnica: string
  conclusionNormal: string
  notasMedico: string
  fechaRevisionMedico: string | null
  IMAGEN: Array<{
    idImagen: number
    urlImagen: string
    DESCRIPCION: {
      texto: string
      fecha: string
    }
    GROUNDTRUTH?: {
      texto: string
      palabrasClave: string[]
      preguntasGuiaPaciente: string[]
    }
  }>
}

class ReportsService {
  private baseURL = 'http://localhost:3000/api/descripciones-imagenes'
  private reportesURL = 'http://localhost:3000/api/alertas-reportes'
  private authURL = 'http://localhost:3000/api/usuarios-autenticacion'

  /**
   * Obtiene la lista de todos los pacientes
   */
  async getAllPatients(): Promise<any[]> {
    try {
      const token = await authService.getAccessTokenAsync()
      
      if (!token) {
        throw new Error('No se encontró token de autenticación')
      }

      const response = await fetch(`${this.authURL}/buscarUsuarios`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      
      // Filtrar solo pacientes
      return data.usuarios?.filter((u: any) => u.rol === 'paciente') || []
    } catch (error) {
      console.error('❌ Error al obtener lista de pacientes:', error)
      throw new Error('Error al obtener lista de usuarios')
    }
  }
  
  /**
   * Obtiene las sesiones completadas de un paciente específico
   * Usa el endpoint sin paginación del backend
   */
  /**
 * Obtiene las sesiones completadas de un paciente específico
 * Usa el endpoint correcto del backend
 */
async getPatientSessions(patientId: string): Promise<SessionData[]> {
  try {
    const idStr = String(patientId).trim()
    if (!idStr) return []

    const token = await authService.getAccessTokenAsync()

    const url = `${this.baseURL}/listarSesiones?idPaciente=${encodeURIComponent(idStr)}&page=1&limit=100&estado_sesion=completado`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const msg = await response.text()
      console.error('Error listarSesiones:', msg)
      return []
    }

    const data = await response.json()
    return Array.isArray(data.data) ? data.data : []

  } catch (error) {
    console.error(`❌ Error getPatientSessions(${patientId}):`, error)
    return []
  }
}


  /**
   * Obtiene el conteo de sesiones de un paciente
   */
  async getSessionCount(patientId: string): Promise<number> {
    try {
      if (!patientId || patientId === 'undefined') {
        console.warn('⚠️ PatientId inválido para conteo:', patientId)
        return 0
      }

      const token = await authService.getAccessTokenAsync()
      
      if (!token) {
        throw new Error('No se encontró token de autenticación')
      }

      const response = await fetch(`${this.baseURL}/cantidadSesiones/${patientId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404 || response.status === 400) {
          return 0
        }
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      return data.cantidad || 0
    } catch (error) {
      console.error(`❌ Error al obtener conteo de sesiones:`, error)
      return 0
    }
  }

  // Dentro de la clase ReportsService, después de getSessionCount
// ----------------------------------------------------------------------------------

/**
 * TRAER SOLAMENTE EL BASELINE DEL PACIENTE (la primera sesión)
 * Llama al endpoint /baseline/:idPaciente
 */
async getPatientBaseline(patientId: string): Promise<SessionDetails | null> {
  try {
    if (!patientId || patientId === 'undefined') {
      console.warn('⚠️ PatientId inválido para baseline:', patientId)
      return null
    }

    const token = await authService.getAccessTokenAsync()
    
    if (!token) {
      throw new Error('No se encontró token de autenticación')
    }

    // Usar el URL correcto: `${this.reportesURL}/baseline/${patientId}`
    // NOTA: Asumo que el endpoint /baseline/ pertenece a reportesURL (http://localhost:3000/api/alertas-reportes)
    const url = `${this.baseURL}/baseline/${patientId}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        // 404 puede significar que no hay sesiones todavía.
        return null
      }
      // El error 400 que tenías antes se habría lanzado aquí si el ID fuera inválido.
      throw new Error(`Error HTTP: ${response.status}`)
    }

    // El backend devuelve el objeto SessionDetails (el baseline) directamente o null
    const data: SessionDetails = await response.json()
    
    // Si la respuesta es vacía o null, retornar null.
    // Esto dependerá de cómo tu backend maneje la respuesta si no encuentra la sesión.
    if (!data) {
        return null
    }

    return data
  } catch (error) {
    console.error(`❌ Error al obtener el baseline del paciente ${patientId}:`, error)
    return null
  }
}

  /**
   * Obtiene el reporte completo generado por el backend
   */
  async getPatientReportFromBackend(patientId: string): Promise<any> {
    try {
      if (!patientId || patientId === 'undefined') {
        throw new Error('ID de paciente inválido')
      }

      const token = await authService.getAccessTokenAsync()
      
      if (!token) {
        throw new Error('No se encontró token de autenticación')
      }

      const response = await fetch(`${this.reportesURL}/reporteTiempo/${patientId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`❌ Error al obtener reporte del backend:`, error)
      throw error
    }
  }

  /**
   * Obtiene todos los pacientes con sus reportes
   */
  async getAllPatientsWithReports(): Promise<PatientReport[]> {
    try {
      const patients = await this.getAllPatients()
      
      if (!patients || patients.length === 0) {
        console.log('ℹ️ No se encontraron pacientes')
        return []
      }

      const reports = await Promise.all(
        patients.map(async (patient) => {
          try {
            if (!patient.idUsuario || patient.idUsuario === 'undefined') {
              console.warn('⚠️ Paciente sin ID válido:', patient)
              return null
            }

            const sessions = await this.getPatientSessions(patient.idUsuario)
            
            if (sessions.length === 0) {
              return null
            }

            const summary = this.calculateSummary(sessions)
            
            return {
              patientId: patient.idUsuario,
              patientName: patient.nombre || 'Sin nombre',
              period: {
                from: sessions[0]?.fechaInicio || sessions[0]?.fechaCreacion || new Date().toISOString(),
                to: sessions[sessions.length - 1]?.fechaInicio || sessions[sessions.length - 1]?.fechaCreacion || new Date().toISOString()
              },
              summary,
              sessions
            }
          } catch (error) {
            console.error(`❌ Error procesando paciente ${patient.nombre}:`, error)
            return null
          }
        })
      )

      return reports.filter((r): r is PatientReport => r !== null)
    } catch (error) {
      console.error('❌ Error al obtener reportes de pacientes:', error)
      throw error
    }
  }

  /**
   * Obtiene el reporte de un paciente específico
   */
  async getPatientReport(patientId: string): Promise<PatientReport> {
    try {
      if (!patientId || patientId === 'undefined') {
        throw new Error('ID de paciente inválido')
      }

      const sessions = await this.getPatientSessions(patientId)
      
      if (sessions.length === 0) {
        throw new Error('No se encontraron sesiones para este paciente')
      }

      const summary = this.calculateSummary(sessions)
      
      const patients = await this.getAllPatients()
      const patient = patients.find(p => p.idUsuario === patientId)
      
      return {
        patientId,
        patientName: patient?.nombre || 'Paciente',
        period: {
          from: sessions[0].fechaInicio || sessions[0].fechaCreacion,
          to: sessions[sessions.length - 1].fechaInicio || sessions[sessions.length - 1].fechaCreacion
        },
        summary,
        sessions
      }
    } catch (error) {
      console.error(`❌ Error al obtener reporte del paciente ${patientId}:`, error)
      throw error
    }
  }

  /**
   * Obtiene los detalles de una sesión específica con GroundTruth
   */
  async getSessionDetails(sessionId: number): Promise<SessionDetails> {
    try {
      const token = await authService.getAccessTokenAsync()
      
      if (!token) {
        throw new Error('No se encontró token de autenticación')
      }

      const response = await fetch(`${this.baseURL}/buscarSesion/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`❌ Error al obtener detalles de sesión ${sessionId}:`, error)
      throw error
    }
  }

  /**
   * Obtiene las descripciones de una sesión con comparación
   */
  async getSessionDescriptions(sessionId: number, page: number = 1, limit: number = 10): Promise<{data: DescriptionComparison[], meta: any}> {
    try {
      const token = await authService.getAccessTokenAsync()
      
      if (!token) {
        throw new Error('No se encontró token de autenticación')
      }

      const response = await fetch(`${this.baseURL}/listarDescripciones/${sessionId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`❌ Error al obtener descripciones:`, error)
      throw error
    }
  }

  /**
   * Agrega notas del médico a una sesión
   */
  async addDoctorNotes(sessionId: number, notes: string): Promise<any> {
    try {
      const token = await authService.getAccessTokenAsync()
      
      if (!token) {
        throw new Error('No se encontró token de autenticación')
      }

      const response = await fetch(`${this.baseURL}/sesion/${sessionId}/notas-medico`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notasMedico: notes })
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`❌ Error al agregar notas del médico:`, error)
      throw error
    }
  }

  /**
   * Calcula el resumen estadístico de las sesiones
   */
  private calculateSummary(sessions: SessionData[]): PatientSummary {
    if (sessions.length === 0) {
      return {
        count: 0,
        avgSessionTotal: 0,
        avgRecall: 0,
        firstSessionTotal: 0,
        lastSessionTotal: 0,
        trend_sessionTotal: 'stable',
        slopePerDay_sessionTotal: null
      }
    }

    const count = sessions.length
    const avgSessionTotal = sessions.reduce((sum, s) => sum + (s.sessionTotal || 0), 0) / count
    const avgRecall = sessions.reduce((sum, s) => sum + (s.sessionRecall || 0), 0) / count
    const firstSessionTotal = sessions[0].sessionTotal || 0
    const lastSessionTotal = sessions[count - 1].sessionTotal || 0

    let trend_sessionTotal = 'stable'
    const diff = lastSessionTotal - firstSessionTotal
    if (diff > 0.05) trend_sessionTotal = 'improving'
    else if (diff < -0.05) trend_sessionTotal = 'declining'

    let slopePerDay_sessionTotal = null
    if (count >= 2) {
      const firstDate = new Date(sessions[0].fechaInicio || sessions[0].fechaCreacion).getTime()
      const lastDate = new Date(sessions[count - 1].fechaInicio || sessions[count - 1].fechaCreacion).getTime()
      const days = (lastDate - firstDate) / (1000 * 60 * 60 * 24)
      if (days > 0) {
        slopePerDay_sessionTotal = diff / days
      }
    }

    return {
      count,
      avgSessionTotal,
      avgRecall,
      firstSessionTotal,
      lastSessionTotal,
      trend_sessionTotal,
      slopePerDay_sessionTotal
    }
  }

  // Utilidades de formato
  toPercentage(value: number): string {
    return Math.round(value * 100).toString()
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  getTrendText(trend: string): string {
    switch (trend) {
      case 'improving': return 'Mejorando'
      case 'declining': return 'Declinando'
      default: return 'Estable'
    }
  }

  getScoreColor(score: number): string {
    if (score >= 0.75) return 'text-green-600'
    if (score >= 0.45) return 'text-yellow-600'
    return 'text-red-600'
  }

  getScoreBgColor(score: number): string {
    if (score >= 0.75) return 'bg-green-50'
    if (score >= 0.45) return 'bg-yellow-50'
    return 'bg-red-50'
  }
}

export const reportsService = new ReportsService()