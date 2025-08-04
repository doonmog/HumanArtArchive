// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  cy.stub(win.console, 'error').callThrough()
})

// Global configuration
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body', { timeout: 10000 }).should('be.visible')
  cy.get('body').should('not.be.empty')
  // Wait for any Vue.js hydration to complete
  cy.wait(1000)
})
