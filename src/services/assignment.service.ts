const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.117.162.170'

export interface Usuario {
  idUsuario: string
  idCuidador?: string
  idPaciente?: string  
  rol: string
  nombre: string
  correo: string
  edad?: number
  fechaNacimiento?: string
}
export const assignmentService = {
  /**
   * Asignar cuidador a paciente
   */
  async assignCaregiverToPatient(idCuidador: string, idPaciente: string, token: string) {
    try{
      console.log(`📝 Asignando cuidador ${idCuidador} al paciente ${idPaciente}...`);
      
    
    const response = await fetch(`${API_URL}/api/usuarios-autenticacion/asignarCuidador`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ idCuidador, idPaciente })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al asignar cuidador' }))
      throw new Error(error.message || 'Error al asignar cuidador')
    }
    const result = await response.json()
    console.log('✅ Cuidador asignado:', result)
    return result
    } catch (error: any) {
      console.error('❌ Error en assignCaregiverToPatient:', error)
      throw error
    }

  },
  
  /**
   * Remover cuidador de paciente
   */
  async removeCaregiverFromPatient(idCuidador: string, idPaciente: string, token: string) {
    try {
      console.log('🗑️ Removiendo cuidador de paciente...')
      
      const response = await fetch(`${API_URL}/api/usuarios-autenticacion/eliminarPacienteCuidador`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ idCuidador, idPaciente })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error al remover cuidador' }))
        throw new Error(error.message || 'Error al remover cuidador')
      }

      const result = await response.json()
      console.log('✅ Cuidador removido correctamente:', result)
      return result
    } catch (error: any) {
      console.error('❌ Error en removeCaregiverFromPatient:', error)
      throw error
    }
  },

  /**
   * Obtener todos los usuarios
   */
  async getAllUsers(token: string) {
    try {
      const response = await fetch(`${API_URL}/api/usuarios-autenticacion/buscarUsuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Error al obtener usuarios')
      }

      return response.json()
    } catch (error: any) {
      console.error('❌ Error en getAllUsers:', error)
      throw error
    }
  },

  /**
   * Obtener usuarios sin relación (pacientes sin cuidador y cuidadores sin paciente)
   */
  async getUsersWithoutRelation(token: string) {
    try {
      console.log('🔍 Buscando usuarios sin relación...')
      
      const response = await fetch(`${API_URL}/api/usuarios-autenticacion/usuariosSinRelacion`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error al obtener usuarios sin relación' }))
        throw new Error(error.message || 'Error al obtener usuarios sin relación')
      }

      const result = await response.json()
      console.log('✅ Usuarios sin relación obtenidos:', result)
      return result
    } catch (error: any) {
      console.error('❌ Error en getUsersWithoutRelation:', error)
      throw error
    }
  },

  /**
   * Obtener pacientes de un cuidador
   */
  async getPatientsByCaregiver(idCuidador: string, token: string) {
    const response = await fetch(`${API_URL}/api/usuarios-autenticacion/pacienteCuidador/${idCuidador}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error('Error al obtener pacientes del cuidador')
    }

    return response.json()
  },

  /**
   * Obtener pacientes de un médico
   */
  async getPatientsByDoctor(idMedico: string, token: string) {
    const response = await fetch(`${API_URL}/api/usuarios-autenticacion/pacientesMedico/${idMedico}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error('Error al obtener pacientes del médico')
    }

    return response.json()
  },

  /**
   * Obtener cuidadores de un paciente
   */
  async getCaregiversByPatient(idPaciente: string, token: string): Promise<Usuario[]> {
    try {
      console.log(`🔍 Obteniendo cuidadores del paciente ${idPaciente}...`)
      
      // Estrategia: Obtener todos los cuidadores y verificar cuáles tienen este paciente
      const allUsers = await this.getAllUsers(token)
      const allCaregivers = allUsers.usuarios?.filter((u: any) => u.rol === 'cuidador') || []
      
      if (allCaregivers.length === 0) {
        console.log('ℹ️ No hay cuidadores en el sistema')
        return []
      }

      // Verificar cada cuidador para ver si tiene asignado este paciente
      const caregiversWithPatient: Usuario[] = []
      
      for (const caregiver of allCaregivers) {
        try {
          const patientsData = await this.getPatientsByCaregiver(caregiver.idUsuario, token)
          const patients = Array.isArray(patientsData) ? patientsData : []
          
          // Si alguno de los pacientes del cuidador coincide con el idPaciente buscado
          const hasThisPatient = patients.some((p: any) => p.idPaciente === idPaciente || p === idPaciente)
          
          if (hasThisPatient) {
            caregiversWithPatient.push(caregiver)
          }
        } catch (error) {
          // Si falla al obtener pacientes de este cuidador, continuar con el siguiente
          console.log(`⚠️ No se pudieron obtener pacientes del cuidador ${caregiver.idUsuario}`)
        }
      }
      
      console.log(`✅ Cuidadores encontrados para el paciente ${idPaciente}:`, caregiversWithPatient)
      return caregiversWithPatient
      
    } catch (error: any) {
      console.error('❌ Error en getCaregiversByPatient:', error)
      // En caso de error, retornar array vacío en lugar de lanzar error
      return []
    }
  },

  /**
   * Verificar si un cuidador puede ser asignado (no tiene paciente asignado)
   */
  async canAssignCaregiver(idCuidador: string, token: string): Promise<boolean> {
    try {
      const patients = await this.getPatientsByCaregiver(idCuidador, token)
      // Un cuidador solo puede tener 1 paciente
      return !patients || patients.length === 0
    } catch (error) {
      console.error('Error verificando disponibilidad del cuidador:', error)
      return false
    }
  },

  /**
   * Verificar cuántos cuidadores tiene un paciente
   */
  async getPatientCaregiversCount(idPaciente: string, token: string): Promise<number> {
    try {
      const caregivers = await this.getCaregiversByPatient(idPaciente, token)
      return caregivers?.length || 0
    } catch (error) {
      console.error('Error contando cuidadores del paciente:', error)
      return 0
    }
  }
  


}