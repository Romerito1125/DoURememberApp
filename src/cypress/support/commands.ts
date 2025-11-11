/// <reference types="cypress" />

// Comando para sembrar fotos de prueba
Cypress.Commands.add('seedPhotos', (photos: any[]) => {
  cy.window().then((win) => {
    win.localStorage.setItem('patientPhotos', JSON.stringify(photos))
  })
})

// Comando para subir una foto
Cypress.Commands.add('uploadPhoto', (photoData) => {
  cy.visit('/photos/upload')

  // Simular selección de archivo
  cy.get('input[type="file"]').selectFile(
    {
      contents: Cypress.Buffer.from('fake-image-content'),
      fileName: photoData.fileName,
      mimeType: 'image/jpeg',
    },
    { force: true }
  )

  // Llenar formulario
  cy.get('input').eq(0).type(photoData.people)
  cy.get('input').eq(1).type(photoData.location)
  cy.get('textarea').type(photoData.context)

  // Enviar
  cy.contains('button', /guardar/i).click()
})

// Comando para visitar página de fotos
Cypress.Commands.add('visitPhotosPage', () => {
  cy.visit('/photos')
})

export {}