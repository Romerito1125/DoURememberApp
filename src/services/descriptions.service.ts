const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export interface SessionImage {
  idImagen: number
  urlImagen: string
  contexto: string
}

export interface Session {
  idSesion: number
  imagenesIds: number[]
  fechaCreacion: string
  completada: boolean
  imagenes?: SessionImage[]
}

export interface Description {
  idDescripcion: number
  idSesion: number
  idImagen: number
  descripcionPaciente: string
  descripcionReal: string
  similitud: number
  fechaCreacion: string
}

export const descriptionsService = {
  async getPatientSessions(idPaciente: string, token: string): Promise<Session[]> {
    const sesionesLocal: Session[] = JSON.parse(localStorage.getItem('sesionesImagenes') || '[]')
    
    const sesionesConImagenes = await Promise.all(
      sesionesLocal.map(async (sesion) => {
        try {
          const response = await fetch(
            `${API_URL}/api/descripciones-imagenes/obtenerImagenes/${sesion.idSesion}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            return {
              ...sesion,
              imagenes: data.imagenes || []
            }
          }
        } catch (error) {
          console.error('Error al cargar imágenes:', error)
        }
        
        return sesion
      })
    )

    return sesionesConImagenes
  },

  async createDescription(
    idSesion: number,
    idImagen: number,
    descripcionPaciente: string,
    token: string
  ) {
    const response = await fetch(`${API_URL}/api/descripciones-imagenes/crearDescripcion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        idSesion,
        idImagen,
        descripcionPaciente
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear descripción')
    }

    return response.json()
  },

  async getSessionDescriptions(idSesion: number, token: string): Promise<Description[]> {
    const response = await fetch(
      `${API_URL}/api/descripciones-imagenes/listarDescripciones/${idSesion}?page=1&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Error al obtener descripciones')
    }

    const data = await response.json()
    return data.data || []
  }
}