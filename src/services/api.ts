/**
 * Servicio API Centralizado
 * Gestiona todas las peticiones HTTP al backend
 */

import { authService } from './auth.service'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.devcorebits.com'

export interface CreateUserDto {
  nombre: string
  correo: string
  contrasenia: string
  rol?: 'medico' | 'paciente' | 'cuidador' | 'administrador'
  edad?: number
  status?: string
}

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_URL
    console.log('🔗 API Service inicializado con URL:', this.baseUrl)
  }

  /**
   * Obtener headers con autenticación automática
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await authService.getAccessTokenAsync()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  // =========================================
  // SECCIÓN: USUARIOS Y AUTENTICACIÓN
  // =========================================

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(
        `${this.baseUrl}/api/usuarios-autenticacion/buscarUsuario/${userId}`,
        {
          method: 'GET',
          headers,
        }
      )

      if (!response.ok) {
        throw new Error('Error al obtener usuario')
      }

      return await response.json()
    } catch (error: any) {
      console.error('Error en getUserById:', error)
      throw error
    }
  }

  /**
   * Listar todos los usuarios
   */
  async getAllUsers(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(`${this.baseUrl}/api/usuarios-autenticacion/buscarUsuarios`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error('Error al listar usuarios')
      }

      return await response.json()
    } catch (error: any) {
      console.error('Error en getAllUsers:', error)
      throw error
    }
  }


  // =========================================
  // SECCIÓN: INVITACIONES Y REGISTRO
  // =========================================

  /**
   * Verificar token de invitación
   * Usa el endpoint: verificarInvitacion (cmd: 'verificarInvitacion')
   */
  async verificarInvitacion(token: string) {
    try {
      console.log('🔍 Verificando token de invitación...')
      
      const response = await fetch(
        `${this.baseUrl}/api/usuarios-autenticacion/verificarToken?token=${token}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Token inválido o expirado');
      }
      
      const data = await response.json();
      console.log('✅ Token válido:', data);
      console.log("Id médico en invitacion:", data.invitacion.idMedico);
      
      // El backend devuelve: { ok, message, invitacion: { id, correo, nombreCompleto, rol } }
      return {
        email: data.invitacion.correo,
        rol: data.invitacion.rol,
        nombreCompleto: data.invitacion.nombreCompleto,
        idMedico: data.invitacion.idMedico || undefined
      };
      
    } catch (error: any) {
      console.error('❌ Error en verificarInvitacion:', error);
      throw new Error(error.message || 'Error al verificar invitación');
    }
  }

  /**
   * Completar registro con invitación
   * Usa el endpoint: createUsuariosAutenticacion (cmd: 'createUsuariosAutenticacion')
   * 
   * NOTA: El backend automáticamente:
   * 1. Crea el usuario en Supabase Auth
   * 2. Crea el perfil en la tabla PERFIL
   * 3. Elimina la invitación de la BD
   */
  async completarRegistroConInvitacion(data: {
    nombre: string;
    correo: string;
    contrasenia: string;
    rol: string;
    fechaNacimiento?: string;
    idMedico?: string; //Para el registro de pacientes
  }): Promise<any> {
    try {
      console.log('📝 Completando registro con invitación...')

      //Construir payload
      const payload: any = {
        nombre: data.nombre,
        correo: data.correo,
        contrasenia: data.contrasenia,
        rol: data.rol,
        fechaNacimiento: data.fechaNacimiento,
        status: 'activo'
      }
      if (data.rol === 'paciente' && data.idMedico){
        payload.idMedico = data.idMedico
        console.log('id del médico incluido en el payload:', data.idMedico)
      }
      console.log('Payload para completo:', payload);
      
      const response = await fetch(
        `${this.baseUrl}/api/usuarios-autenticacion/crearUsuario`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al completar el registro');
      }

      const result = await response.json();
      console.log('✅ Registro completado:', result);
      return result;
      
    } catch (error: any) {
      console.error('❌ Error en completarRegistroConInvitacion:', error);
      throw new Error(error.message || 'Error al completar el registro');
    }
  }

  /**
   * Invitar usuario (para el dashboard de admin)
   * Usa el endpoint: crearInvitacion (cmd: 'crearInvitacion')
   */
  async invitarUsuario(data: { 
    nombreCompleto: string; 
    email: string; 
    rol: string;
    idMedico?:string;
  }) {
    try {
      console.log('📧 Enviando invitación...')
      
      // 🔥 CAMBIO: await this.getAuthHeaders() porque es async
      const headers = await this.getAuthHeaders()

      const payload: any = {
        nombreCompleto: data.nombreCompleto,
        email: data.email,
        rol: data.rol,

      }
      if (data.idMedico){
        payload.idMedico = data.idMedico
      }
      
      const response = await fetch(
        `${this.baseUrl}/api/usuarios-autenticacion/crearInvitacion`, 
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al enviar invitación')
      }

      const result = await response.json()
      console.log('✅ Invitación enviada:', result)
      return result
      
    } catch (error: any) {
      console.error('❌ Error en invitarUsuario:', error)
      throw new Error(error.message || 'Error al enviar invitación')
    }
  }

  // =========================================
  // SECCIÓN: DESCRIPCIONES E IMÁGENES
  // =========================================

  /**
   * Subir imagen
   */
  async uploadImage(file: File, userId: string) {
    try {
      const token = await authService.getAccessTokenAsync()
      
      const formData = new FormData()
      formData.append('file', file)

      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(
        `${this.baseUrl}/api/descripciones-imagenes/uploadImage/${userId}`,
        {
          method: 'POST',
          headers,
          body: formData,
        }
      )

      if (!response.ok) throw new Error('Error al subir imagen')
      return await response.json()
    } catch (error: any) {
      console.error('Error en uploadImage:', error)
      throw error
    }
  }

  /**
   * Crear Ground Truth
   */
  async crearGroundTruth(data: {
    texto: string
    idImagen: number
    palabrasClave: string[]
    preguntasGuiaPaciente: string[]
  }) {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(
        `${this.baseUrl}/api/descripciones-imagenes/crearGroundTruth`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) throw new Error('Error al crear ground truth')
      return await response.json()
    } catch (error: any) {
      console.error('Error en crearGroundTruth:', error)
      throw error
    }
  }

  /**
   * Listar imágenes de un cuidador
   */
  async listarImagenes(cuidadorId: string, page = 1, limit = 10) {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(
        `${this.baseUrl}/api/descripciones-imagenes/listarImagenes/${cuidadorId}?page=${page}&limit=${limit}`,
        {
          headers,
        }
      )

      if (!response.ok) throw new Error('Error al listar imágenes')
      return await response.json()
    } catch (error: any) {
      console.error('Error en listarImagenes:', error)
      throw error
    }
  }

  /**
   * Obtener baseline de un paciente
   */
  async getBaseline(idPaciente: string) {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(
        `${this.baseUrl}/api/descripciones-imagenes/baseline/${idPaciente}`,
        {
          headers,
        }
      )

      if (!response.ok) throw new Error('Error al obtener baseline')
      return await response.json()
    } catch (error: any) {
      console.error('Error en getBaseline:', error)
      throw error
    }
  }

  /**
   * Eliminar imagen
   */
  async eliminarImagen(idImagen: number) {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(
        `${this.baseUrl}/api/descripciones-imagenes/eliminar/${idImagen}`,
        {
          method: 'DELETE',
          headers,
        }
      )

      if (!response.ok) throw new Error('Error al eliminar imagen')
      return await response.json()
    } catch (error: any) {
      console.error('Error en eliminarImagen:', error)
      throw error
    }
  }
}

// =============================================
// EXPORTAR INSTANCIA ÚNICA (SINGLETON)
// =============================================
export const apiService = new ApiService()

// =============================================
// FUNCIONES DE COMPATIBILIDAD
// =============================================
export const uploadImage = (file: File, userId: string) => 
  apiService.uploadImage(file, userId)

export const crearGroundTruth = (data: {
  texto: string
  idImagen: number
  palabrasClave: string[]
  preguntasGuiaPaciente: string[]
}) => apiService.crearGroundTruth(data)

export const listarImagenes = (cuidadorId: string, page = 1, limit = 10) => 
  apiService.listarImagenes(cuidadorId, page, limit)

export const getBaseline = (idPaciente: string) => 
  apiService.getBaseline(idPaciente)

