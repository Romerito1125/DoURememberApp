/**
 * Constantes y configuración de la aplicación
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const API_ENDPOINTS = {
  // Usuarios y Autenticación
  usuarios: {
    buscar: (id: string) => `${API_URL}/usuarios-autenticacion/buscarUsuario/${id}`,
    listar: () => `${API_URL}/usuarios-autenticacion/buscarUsuarios`,
    crear: () => `${API_URL}/usuarios-autenticacion/crearUsuario`,
    actualizar: (id: string) => `${API_URL}/usuarios-autenticacion/actualizarPerfil/${id}`,
    eliminar: (id: string) => `${API_URL}/usuarios-autenticacion/borrarPerfil/${id}`,
    pacientesDeMedico: (idMedico: string) => `${API_URL}/usuarios-autenticacion/pacientesDeMedico/${idMedico}`,
    pacienteCuidador: (idPaciente: string) => `${API_URL}/usuarios-autenticacion/pacienteCuidador/${idPaciente}`,
    medicoPaciente: (idPaciente: string) => `${API_URL}/usuarios-autenticacion/medicoPaciente/${idPaciente}`,
    totalUsuarios: () => `${API_URL}/usuarios-autenticacion/totalUsuarios`,
  },

  // Invitaciones
  invitaciones: {
    crear: () => `${API_URL}/usuarios-autenticacion/crearInvitacion`,
    verificar: (token: string) => `${API_URL}/usuarios-autenticacion/verificarToken?token=${token}`,
  },

  // Descripciones e Imágenes
  descripciones: {
    uploadImage: (userId: string) => `${API_URL}/descripciones-imagenes/uploadImage/${userId}`,
    listar: (idSesion: number, page: number, limit: number) => 
      `${API_URL}/descripciones-imagenes/listarDescripciones/${idSesion}?page=${page}&limit=${limit}`,
    crear: () => `${API_URL}/descripciones-imagenes/crearDescripcion`,
    buscar: (id: number) => `${API_URL}/descripciones-imagenes/buscarDescripcion/${id}`,
  },

  // Imágenes
  imagenes: {
    listar: (cuidadorId: string, page: number, limit: number) => 
      `${API_URL}/descripciones-imagenes/listarImagenes/${cuidadorId}?page=${page}&limit=${limit}`,
    buscar: (id: number) => `${API_URL}/descripciones-imagenes/buscarImagen/${id}`,
    actualizar: () => `${API_URL}/descripciones-imagenes/actualizarImagen`,
    eliminar: (id: number) => `${API_URL}/descripciones-imagenes/eliminar/${id}`,
  },

  // Ground Truth
  groundTruth: {
    crear: () => `${API_URL}/descripciones-imagenes/crearGroundTruth`,
    buscar: (id: number) => `${API_URL}/descripciones-imagenes/buscarGroundTruth/${id}`,
    buscarPorImagen: (idImagen: number) => 
      `${API_URL}/descripciones-imagenes/buscarGroundTruthIdImagen/${idImagen}`,
    actualizar: () => `${API_URL}/descripciones-imagenes/actualizarGroundTruth`,
    eliminar: (id: number) => `${API_URL}/descripciones-imagenes/eliminarGroundTruth/${id}`,
  },

  // Sesiones
  sesiones: {
    crear: () => `${API_URL}/descripciones-imagenes/crearSesion`,
    buscar: (id: number) => `${API_URL}/descripciones-imagenes/buscarSesion/${id}`,
    listar: (idPaciente: string, page: number, limit: number) => 
      `${API_URL}/descripciones-imagenes/listarSesiones/${idPaciente}?page=${page}&limit=${limit}`,
    listarConGt: (idPaciente: string, page: number, limit: number) => 
      `${API_URL}/descripciones-imagenes/listarSesionesGt/${idPaciente}?page=${page}&limit=${limit}`,
    listarCompletadas: (idPaciente: string) => 
      `${API_URL}/descripciones-imagenes/listarSesionesCompletadas/${idPaciente}`,
    actualizar: () => `${API_URL}/descripciones-imagenes/actualizarSesion`,
    cantidad: (idPaciente: string) => `${API_URL}/descripciones-imagenes/cantidadSesiones/${idPaciente}`,
    baseline: (idPaciente: string) => `${API_URL}/descripciones-imagenes/baseline/${idPaciente}`,
    total: () => `${API_URL}/descripciones-imagenes/totalSesiones`,
    agregarNotas: () => `${API_URL}/descripciones-imagenes/agregarNotasMedico`,
    obtenerPacientesActivos: () => `${API_URL}/descripciones-imagenes/obtenerPacientesConSesionesActivas`,
  },
} as const

export default API_URL