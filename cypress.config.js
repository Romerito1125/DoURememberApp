const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config
    },
    specPattern: 'src/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'src/cypress/support/e2e.ts',
    video: false, // Cambiar a false para desarrollo, true para CI
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    // Tiempos de espera
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    // Configuración de reintentos
    retries: {
      runMode: 2, // Reintentos en CI
      openMode: 0 // Sin reintentos en desarrollo
    },
    // Configuración adicional
    chromeWebSecurity: false,
    watchForFileChanges: true,
    experimentalStudio: true
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'src/cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'src/cypress/support/component.ts'
  }
})