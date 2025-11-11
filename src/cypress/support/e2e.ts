// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Importar cypress-real-events si está instalado
// import 'cypress-real-events'

// Configuración global para Cypress
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevenir que errores de Next.js detengan los tests
  if (err.message.includes('Hydration')) {
    return false
  }
  if (err.message.includes('NotFoundError')) {
    return false
  }
  // Permitir que otros errores fallen los tests
  return true
})

// Export to make this a module
export {}