describe('Gestión de Fotos - E2E', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.viewport(1280, 720)
  })

  describe('Vista de lista de fotos', () => {
    it('debe mostrar mensaje cuando no hay fotos', () => {
      cy.visit('/photos')

      cy.contains(/no hay imágenes cargadas/i).should('be.visible')
      cy.contains(/cargar primera imagen/i).should('be.visible')
    })

    it('debe mostrar fotos cargadas', () => {
      const mockPhotos = [
        {
          id: '1',
          fileName: 'familia-verano.jpg',
          people: 'María, Juan, Pedro',
          location: 'Playa del Carmen',
          context: 'Vacaciones de verano 2023',
          uploadDate: '2025-01-15T10:00:00.000Z',
          patientId: 'patient-123',
          imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        },
      ]

      cy.seedPhotos(mockPhotos)
      cy.visit('/photos')

      cy.contains('familia-verano.jpg').should('be.visible')
      cy.contains('María, Juan, Pedro').should('be.visible')
      cy.contains('Playa del Carmen').should('be.visible')
    })

    it('debe navegar a la página de carga', () => {
      cy.visit('/photos')

      cy.contains(/nueva imagen/i).click()
      cy.url().should('include', '/photos/upload')
    })
  })

  describe('Carga de fotos', () => {
    beforeEach(() => {
      cy.visit('/photos/upload')
    })

    it('debe mostrar el formulario de carga', () => {
      cy.contains(/cargar nueva imagen/i).should('be.visible')
      cy.get('input[type="file"]').should('exist')
      cy.get('input[placeholder*="María López"]').should('be.visible')
      cy.get('input[placeholder*="Parque"]').should('be.visible')
      cy.get('textarea').should('be.visible')
    })

    it('debe validar campos obligatorios', () => {
      cy.get('button[type="submit"]').click()

      cy.contains(/debes seleccionar una imagen/i).should('be.visible')
    })

    it('debe validar formato de archivo', () => {
      cy.get('input[type="file"]').selectFile(
        {
          contents: Cypress.Buffer.from('fake pdf content'),
          fileName: 'documento.pdf',
          mimeType: 'application/pdf',
        },
        { force: true }
      )

      cy.contains(/formato no válido/i).should('be.visible')
    })

    it('debe cargar una foto exitosamente', () => {
      cy.get('input[type="file"]').selectFile(
        {
          contents: Cypress.Buffer.from('fake image'),
          fileName: 'test.jpg',
          mimeType: 'image/jpeg',
        },
        { force: true }
      )

      cy.wait(1000)

      cy.get('input[placeholder*="María López"]').type('María López, Juan Pérez')
      cy.get('input[placeholder*="Parque"]').type('Parque Central')
      cy.get('textarea').type('Cumpleaños de la familia en 2020')

      cy.get('button[type="submit"]').click()

      cy.url().should('include', '/photos', { timeout: 5000 })
    })

    it('debe validar tamaño máximo de archivo', () => {
      const bigBuffer = new Uint8Array(11 * 1024 * 1024)
      
      cy.get('input[type="file"]').selectFile(
        {
          contents: Cypress.Buffer.from(bigBuffer),
          fileName: 'imagen-grande.jpg',
          mimeType: 'image/jpeg',
        },
        { force: true }
      )

      cy.contains(/supera el tamaño máximo/i, { timeout: 3000 }).should('be.visible')
    })

    it('debe cancelar y volver a la lista', () => {
      cy.contains(/cancelar/i).click()

      cy.url().should('include', '/photos')
      cy.url().should('not.include', '/upload')
    })
  })

  describe('Modal de detalle de foto', () => {
    beforeEach(() => {
      const mockPhotos = [
        {
          id: '1',
          fileName: 'detalle-test.jpg',
          people: 'Ana García',
          location: 'Casa de la abuela',
          context: 'Reunión familiar navideña',
          uploadDate: '2025-01-10T15:30:00.000Z',
          patientId: 'patient-123',
          imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        },
      ]

      cy.seedPhotos(mockPhotos)
      cy.visit('/photos')
    })

    it('debe abrir el modal al hacer click en una foto', () => {
      cy.contains('detalle-test.jpg').click()

      cy.get('.fixed').should('be.visible')
      cy.contains('Ana García').should('be.visible')
      cy.contains('Casa de la abuela').should('be.visible')
      cy.contains('Reunión familiar navideña').should('be.visible')
    })

    it('debe cerrar el modal con el botón X', () => {
      cy.contains('detalle-test.jpg').click()
      cy.get('.fixed').should('be.visible')

      cy.get('.fixed').find('button').first().click()

      cy.get('.fixed').should('not.exist')
    })

    it('debe navegar a edición desde el modal', () => {
      cy.contains('detalle-test.jpg').click()
      
      cy.get('.fixed').within(() => {
        cy.contains(/editar/i).click()
      })

      cy.url().should('include', '/photos/edit/1')
    })

    it('debe abrir modal de eliminación desde el detalle', () => {
      cy.contains('detalle-test.jpg').click()
      
      cy.get('.fixed').within(() => {
        cy.contains('button', /eliminar/i).click()
      })

      cy.wait(500)
      cy.contains('Confirmar Eliminación').should('be.visible')
    })
  })

  describe('Edición de fotos', () => {
    beforeEach(() => {
      const mockPhotos = [
        {
          id: 'edit-123',
          fileName: 'editar-test.jpg',
          people: 'Carlos López',
          location: 'Parque Nacional',
          context: 'Excursión de fin de semana',
          uploadDate: '2025-01-12T09:00:00.000Z',
          patientId: 'patient-123',
          imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        },
      ]

      cy.seedPhotos(mockPhotos)
    })

    it('debe cargar datos existentes en el formulario', () => {
      cy.visit('/photos/edit/edit-123')

      cy.get('input[value="Carlos López"]').should('exist')
      cy.get('input[value="Parque Nacional"]').should('exist')
      cy.get('textarea').should('contain.value', 'Excursión de fin de semana')
    })

    it('debe actualizar la información de la foto', () => {
      cy.visit('/photos/edit/edit-123')

      cy.get('input[value="Carlos López"]').clear().type('Carlos López, Ana López')
      cy.get('button[type="submit"]').click()

      cy.url().should('include', '/photos', { timeout: 5000 })
      cy.visit('/photos')
      cy.contains('Carlos López, Ana López').should('be.visible')
    })

    it('debe cancelar edición y volver', () => {
      cy.visit('/photos/edit/edit-123')

      cy.contains(/cancelar/i).click()

      cy.url().should('eq', Cypress.config().baseUrl + '/photos')
    })

    it('debe manejar ID inválido en edición', () => {
      cy.visit('/photos/edit/id-invalido', { failOnStatusCode: false })

      cy.wait(1000)

      cy.contains(/imagen no encontrada/i, { timeout: 3000 }).should('be.visible')
    })
  })

  describe('Eliminación de fotos', () => {
    beforeEach(() => {
      const mockPhotos = [
        {
          id: 'delete-1',
          fileName: 'eliminar-test.jpg',
          people: 'Test User',
          location: 'Test Location',
          context: 'Test Context',
          uploadDate: '2025-01-14T12:00:00.000Z',
          patientId: 'patient-123',
          imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        },
      ]

      cy.seedPhotos(mockPhotos)
      cy.visit('/photos')
    })

    it('debe abrir modal de confirmación al hacer click en eliminar', () => {
      cy.contains('eliminar-test.jpg')
        .parents('[class*="rounded-xl"]')
        .find('button')
        .contains(/eliminar/i)
        .click()

      cy.wait(300)
      cy.contains('Confirmar Eliminación').should('be.visible')
    })

    it("debe eliminar una imagen verificando estado (sin depender del overlay/toast)", () => {
  const fileName = 'eliminar-test.jpg';

  // Asegurarnos de que la foto existe antes de eliminar
  cy.contains(fileName).should('exist');

  // Abrir modal: click en el botón "Eliminar" de la tarjeta concreta
  cy.contains(fileName)
    .parents('[class*="rounded-xl"]')
    .find('button')
    .contains(/eliminar/i)
    .click({ force: true });

  // Verificar que el modal está visible (confirmación)
  cy.contains(/confirmar eliminación/i).should('be.visible');

  // Dentro del modal, hacer click en "Eliminar"
  cy.get('div.fixed.inset-0.z-50').within(() => {
    cy.contains('button', /^eliminar$/i).click({ force: true });
  });

  // --- Aquí viene lo robusto: esperar a que localStorage deje de contener el archivo ---
  // Esto usa command retries de Cypress (invoke + should) y evita depender de toasts/overlay.
  cy.window()
    .its('localStorage')
    .invoke('getItem', 'patientPhotos')
    .should((val) => {
      // si val es null o no incluye el fileName, la eliminación ocurrió correctamente
      const json = val ? val : '[]';
      expect(json).to.not.contain(fileName);
    });

  // Finalmente verificar en la UI que la foto ya no aparece
  cy.contains(fileName).should('not.exist');
});










  })

  describe('Galería del paciente', () => {
    beforeEach(() => {
      const mockPhotos = [
        {
          id: '1',
          fileName: 'foto-1.jpg',
          people: 'Persona 1',
          location: 'Lugar 1',
          context: 'Contexto 1',
          uploadDate: '2025-01-01T10:00:00.000Z',
          patientId: 'patient-123',
          imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        },
        {
          id: '2',
          fileName: 'foto-2.jpg',
          people: 'Persona 2',
          location: 'Lugar 2',
          context: 'Contexto 2',
          uploadDate: '2025-01-02T10:00:00.000Z',
          patientId: 'patient-123',
          imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        },
        {
          id: '3',
          fileName: 'foto-3.jpg',
          people: 'Persona 3',
          location: 'Lugar 3',
          context: 'Contexto 3',
          uploadDate: '2025-01-03T10:00:00.000Z',
          patientId: 'patient-123',
          imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        },
      ]

      cy.seedPhotos(mockPhotos)
      cy.visit('/photos/patient')
    })

    it('debe mostrar el carrusel de fotos', () => {
      cy.contains(/tus recuerdos/i).should('be.visible')
      cy.contains('1').should('be.visible')
      cy.contains('3').should('be.visible')
    })

    it('debe navegar entre fotos con botones', () => {
      cy.get('button').should('have.length.greaterThan', 1)
    })

    it('debe abrir foto en detalle al hacer click', () => {
      cy.get('[class*="bg-white"][class*="rounded-2xl"]').first().click()

      cy.get('.fixed.inset-0.bg-black').should('be.visible')
    })

    it('debe cerrar detalle con botón X', () => {
      cy.get('[class*="bg-white"][class*="rounded-2xl"]').first().click()
      cy.get('.fixed.inset-0.bg-black').should('be.visible')

      cy.get('button[title="Cerrar (ESC)"]').click()

      cy.wait(300)
      cy.get('.fixed.inset-0.bg-black').should('not.exist')
    })

    it('debe funcionar el zoom en la imagen', () => {
      cy.get('[class*="bg-white"][class*="rounded-2xl"]').first().click()

      cy.wait(500)
      cy.contains('100%').should('be.visible')
    })

    it('debe mostrar contador de fotos', () => {
      cy.contains('1').should('be.visible')
      cy.contains('3').should('be.visible')
    })
  })

  describe('Validaciones de formulario', () => {
    beforeEach(() => {
      cy.visit('/photos/upload')
    })

    it('debe mantener datos al mostrar error', () => {
      cy.get('input[placeholder*="María López"]').type('Test User')
      cy.get('button[type="submit"]').click()

      cy.get('input[placeholder*="María López"]').should('have.value', 'Test User')
    })
  })
})