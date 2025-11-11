/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Limpia el localStorage antes de cada test
       * @example cy.clearLocalStorage()
       */

      /**
       * Carga fotos de prueba en localStorage
       * @param photos - Array de fotos a cargar
       * @example cy.seedPhotos([{id: '1', fileName: 'test.jpg', ...}])
       */
      seedPhotos(photos: any[]): Chainable<void>

      /**
       * Sube una foto usando el formulario
       * @param photoData - Datos de la foto
       * @example cy.uploadPhoto({fileName: 'test.jpg', people: 'John', location: 'Park', context: 'Birthday'})
       */
      uploadPhoto(photoData: {
        fileName: string
        people: string
        location: string
        context: string
      }): Chainable<void>

      /**
       * Navega a la página de fotos
       * @example cy.visitPhotosPage()
       */
      visitPhotosPage(): Chainable<void>
    }
  }
}

export {}