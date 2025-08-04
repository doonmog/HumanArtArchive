describe('Human Art Archive - Basic Functionality', () => {
  beforeEach(() => {
    // Visit the homepage before each test
    cy.visit('/')
  })

  it('should connect to the application', () => {
    // Basic connectivity test
    cy.request('/')
      .its('status')
      .should('eq', 200)
    
    cy.visit('/')
    cy.get('body', { timeout: 15000 }).should('exist')
  })

  it('should load the homepage successfully', () => {
    cy.waitForPageLoad()
    cy.get('body').should('be.visible')
    // Check for any content that indicates the page loaded
    cy.get('body').should('not.be.empty')
  })

  it('should be able to search for artwork', () => {
    // Look for search functionality on the homepage using the correct selector
    cy.get('input[placeholder="Search artwork..."]', { timeout: 10000 })
      .should('be.visible')
      .type('mage{enter}')
    
    // Should navigate to search results page
    cy.url().should('include', '/search')
    cy.url().should('include', 'q=mage')
    
    // Wait for page to load
    cy.waitForPageLoad()
  })

  it('should navigate to login page', () => {
    cy.visit('/login')
    cy.waitForPageLoad()
    
    // Check login form elements using correct selectors
    cy.get('#username').should('be.visible')
    cy.get('#password').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
    cy.get('h1').should('contain.text', 'Admin Login')
  })

  it('should handle invalid login attempts', () => {
    cy.visit('/login')
    cy.waitForPageLoad()
    
    // Try invalid credentials
    cy.get('#username').type('invalid')
    cy.get('#password').type('invalid')
    cy.get('button[type="submit"]').click()
    
    // Should show error message or stay on login page
    cy.url().should('include', '/login')
    // Check for error message or that we didn't navigate away
    cy.get('body').should('satisfy', ($body) => {
      const text = $body.text()
      return text.includes('failed') || text.includes('invalid') || text.includes('error') || $body.find('#username').length > 0
    })
  })

  it('should test API endpoint availability', () => {
    // Test if the art API endpoint is accessible
    cy.request({
      method: 'GET',
      url: '/api/art',
      failOnStatusCode: false
    }).then((response) => {
      // Should get either 200 (success) or 404 (not found) but not 500 (server error)
      expect(response.status).to.be.oneOf([200, 404])
    })
  })
})
