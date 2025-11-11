/**
 * Generador de reportes de línea base para evaluación cognitiva
 */

export interface Photo {
  id: string
  fileName: string
  people: string
  location: string
  context: string
  imageUrl: string
  uploadDate: string
  description?: string
  descriptionProgress?: string
  descriptionDate?: string
  patientId: string
}

export interface PhotoDescription {
  photoId: string
  photoName: string
  description: string
  wordCount: number
  coherenceScore: number
  memoryAccuracy: number
}

export interface BaselineReport {
  id: string
  patientId: string
  patientName: string
  sessionDate: string
  generatedDate: string
  status: "completed" | "pending"
  indicators: {
    memoryScore: number
    narrativeCoherence: number
    omissions: number
    memoryErrors: number
  }
  photosDescribed: number
  totalPhotos: number
  descriptions: PhotoDescription[]
  analysis: {
    strengths: string[]
    concerns: string[]
    recommendations: string[]
  }
}

export interface DoctorNotification {
  id: string
  type: "new_baseline_report"
  reportId: string
  patientName: string
  message: string
  date: string
  read: boolean
}

export function shouldGenerateBaselineReport(patientId: string, photos: Photo[]): boolean {
  if (!photos || photos.length === 0) return false
  
  const allPhotosDescribed = photos.every(
    photo => photo.description && photo.description.trim().length > 0
  )
  
  if (!allPhotosDescribed) return false
  
  try {
    const existingReports = JSON.parse(localStorage.getItem("baselineReports") || "[]")
    const patientReports = existingReports.filter(
      (report: BaselineReport) => report.patientId === patientId
    )
    return patientReports.length === 0
  } catch (error) {
    console.error("Error al verificar reportes:", error)
    return false
  }
}

function analyzePhotoDescription(photo: Photo): {
  coherenceScore: number
  memoryAccuracy: number
} {
  const description = photo.description || ""
  let coherenceScore = 50
  let memoryAccuracy = 50

  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length >= 3) coherenceScore += 15
  if (description.includes("porque") || description.includes("ya que")) coherenceScore += 10
  if (description.match(/primero|luego|después|finalmente/i)) coherenceScore += 10
  if (description.length > 150) coherenceScore += 15

  const descriptionLower = description.toLowerCase()
  if (photo.people && descriptionLower.includes(photo.people.toLowerCase().split(" ")[0])) {
    memoryAccuracy += 20
  }
  if (photo.location && descriptionLower.includes(photo.location.toLowerCase().split(" ")[0])) {
    memoryAccuracy += 20
  }
  if (/\d{4}/.test(description)) memoryAccuracy += 10

  return {
    coherenceScore: Math.min(coherenceScore, 100),
    memoryAccuracy: Math.min(memoryAccuracy, 100)
  }
}

export function generateBaselineReport(
  patientId: string,
  patientName: string,
  photos: Photo[]
): BaselineReport | null {
  if (!photos || photos.length === 0) return null

  const photosWithDescription = photos.filter(p => p.description && p.description.trim().length > 0)
  if (photosWithDescription.length === 0) return null

  const descriptions: PhotoDescription[] = photosWithDescription.map(photo => {
    const analysis = analyzePhotoDescription(photo)
    return {
      photoId: photo.id,
      photoName: photo.fileName,
      description: photo.description || "",
      wordCount: (photo.description || "").split(/\s+/).filter(w => w.length > 0).length,
      coherenceScore: analysis.coherenceScore,
      memoryAccuracy: analysis.memoryAccuracy
    }
  })

  const memoryScore = calculateMemoryScore(photosWithDescription)
  const narrativeCoherence = calculateNarrativeCoherence(photosWithDescription)
  const omissions = detectOmissions(photosWithDescription)
  const memoryErrors = detectMemoryErrors(photosWithDescription)

  const analysis = generateAnalysis(memoryScore, narrativeCoherence, omissions, memoryErrors)

  const report: BaselineReport = {
    id: crypto.randomUUID(),
    patientId,
    patientName,
    sessionDate: new Date().toISOString(),
    generatedDate: new Date().toISOString(),
    status: photosWithDescription.length === photos.length ? "completed" : "pending",
    indicators: {
      memoryScore,
      narrativeCoherence,
      omissions,
      memoryErrors
    },
    photosDescribed: photosWithDescription.length,
    totalPhotos: photos.length,
    descriptions,
    analysis
  }

  saveReport(report)
  return report
}

function calculateMemoryScore(photos: Photo[]): number {
  if (photos.length === 0) return 0

  let totalScore = 0
  photos.forEach(photo => {
    const description = photo.description || ""
    let score = 0

    if (description.length > 100) score += 20
    if (description.match(/recuerdo|recuerda/i)) score += 10
    
    if (photo.people) {
      const peopleLower = photo.people.toLowerCase()
      const descLower = description.toLowerCase()
      const peopleWords = peopleLower.split(/[\s,]+/)
      const matches = peopleWords.filter(word => descLower.includes(word)).length
      score += Math.min(matches * 10, 20)
    }
    
    if (photo.location && description.toLowerCase().includes(photo.location.toLowerCase())) {
      score += 15
    }
    
    if (/\d{4}/.test(description)) score += 10
    if (description.split(".").length > 2) score += 10
    if (description.length > 200) score += 10

    totalScore += Math.min(score, 100)
  })

  return Math.round(totalScore / photos.length)
}

function calculateNarrativeCoherence(photos: Photo[]): number {
  if (photos.length === 0) return 0

  let coherenceScore = 0
  photos.forEach(photo => {
    const description = photo.description || ""
    let score = 50

    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0)
    if (sentences.length >= 3) score += 15
    if (description.includes("porque") || description.includes("ya que")) score += 10
    if (description.match(/primero|luego|después|finalmente/i)) score += 10
    if (description.length > 150) score += 15

    coherenceScore += Math.min(score, 100)
  })

  return Math.round(coherenceScore / photos.length)
}

function detectOmissions(photos: Photo[]): number {
  let omissions = 0

  photos.forEach(photo => {
    const description = (photo.description || "").toLowerCase()
    
    if (photo.people && !description.includes(photo.people.toLowerCase().split(" ")[0])) {
      omissions++
    }
    if (photo.location && !description.includes(photo.location.toLowerCase().split(" ")[0])) {
      omissions++
    }
    if (description.length < 50) {
      omissions++
    }
  })

  return omissions
}

function detectMemoryErrors(photos: Photo[]): number {
  let errors = 0

  photos.forEach(photo => {
    const description = photo.description || ""
    
    if (description.includes("no recuerdo") || description.includes("creo que")) {
      errors++
    }
  })

  return errors
}

function generateAnalysis(
  memoryScore: number,
  narrativeCoherence: number,
  omissions: number,
  memoryErrors: number
) {
  const strengths: string[] = []
  const concerns: string[] = []
  const recommendations: string[] = []

  if (memoryScore >= 75) {
    strengths.push("Excelente capacidad de recordar detalles de eventos pasados")
  }
  if (narrativeCoherence >= 75) {
    strengths.push("Alta coherencia en las narrativas")
  }
  if (omissions <= 2) {
    strengths.push("Mínimas omisiones en las descripciones")
  }

  if (memoryScore < 60) {
    concerns.push("Puntaje de memoria por debajo del promedio")
  }
  if (narrativeCoherence < 60) {
    concerns.push("Las narrativas muestran falta de coherencia")
  }
  if (omissions > 5) {
    concerns.push("Número significativo de omisiones")
  }
  if (memoryErrors > 3) {
    concerns.push("Presencia de errores en los recuerdos")
  }

  if (memoryScore < 70 || narrativeCoherence < 70) {
    recommendations.push("Realizar evaluaciones de seguimiento en 2-4 semanas")
    recommendations.push("Implementar ejercicios de memoria autobiográfica")
  }
  if (omissions > 5) {
    recommendations.push("Trabajar en técnicas de recuperación de memoria")
  }
  if (memoryErrors > 2) {
    recommendations.push("Considerar evaluación neuropsicológica detallada")
  }

  if (strengths.length > 0 && concerns.length === 0) {
    recommendations.push("Continuar con evaluaciones periódicas de mantenimiento")
  }

  return { strengths, concerns, recommendations }
}

function saveReport(report: BaselineReport): void {
  try {
    const existingReports = JSON.parse(localStorage.getItem("baselineReports") || "[]")
    existingReports.push(report)
    localStorage.setItem("baselineReports", JSON.stringify(existingReports))
    console.log("✅ Reporte guardado:", report.id)
  } catch (error) {
    console.error("❌ Error al guardar:", error)
  }
}

export function notifyDoctorAboutNewReport(reportId: string, patientName: string): void {
  const notification: DoctorNotification = {
    id: crypto.randomUUID(),
    type: "new_baseline_report",
    reportId,
    patientName,
    message: `Nuevo reporte de línea base disponible`,
    date: new Date().toISOString(),
    read: false
  }

  try {
    const existingNotifications = JSON.parse(localStorage.getItem("doctorNotifications") || "[]")
    existingNotifications.push(notification)
    localStorage.setItem("doctorNotifications", JSON.stringify(existingNotifications))
    console.log("✅ Notificación enviada")
  } catch (error) {
    console.error("❌ Error en notificación:", error)
  }
}

export function getPatientReports(patientId: string): BaselineReport[] {
  try {
    const allReports = JSON.parse(localStorage.getItem("baselineReports") || "[]")
    return allReports.filter((report: BaselineReport) => report.patientId === patientId)
  } catch (error) {
    return []
  }
}

export function getReportById(reportId: string): BaselineReport | null {
  try {
    const allReports = JSON.parse(localStorage.getItem("baselineReports") || "[]")
    return allReports.find((report: BaselineReport) => report.id === reportId) || null
  } catch (error) {
    return null
  }
}