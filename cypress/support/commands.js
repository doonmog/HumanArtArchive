// Custom commands for Human Art Archive testing

// Login command for admin authentication
Cypress.Commands.add('loginAsAdmin', (username = 'admin', password = 'admin') => {
  // Intercept the login API request
  cy.intercept('POST', '/api/auth/login').as('loginRequest')
  
  cy.visit('/login')
  cy.get('#username').type(username)
  cy.get('#password').type(password)
  cy.get('button[type="submit"]').click()
  
  // Wait for the login API request to complete
  cy.wait('@loginRequest', { timeout: 10000 }).then((interception) => {
    // Check if login was successful
    if (interception.response && interception.response.statusCode === 200 && interception.response.body.token) {
      // If successful, wait for navigation to admin overview
      cy.url().should('include', '/admin/overview', { timeout: 10000 })
    } else {
      // If login failed, log the response for debugging
      cy.log('Login failed', interception.response ? interception.response.body : 'No response')
      throw new Error('Login failed: ' + JSON.stringify(interception.response ? interception.response.body : 'No response'))
    }
  })
})

// Command to check if user is logged out
Cypress.Commands.add('logout', () => {
  // Find and click the logout button if on admin page
  cy.url().then((url) => {
    if (url.includes('/admin')) {
      cy.contains('button', 'Logout').click();
      // Wait for redirect to login page
      cy.url().should('include', '/login', { timeout: 10000 });
    } else {
      // Fallback to manual clearing if not on admin page
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });
    }
  });
})

// Command to wait for API responses
Cypress.Commands.add('waitForApi', (alias) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201, 204])
  })
})
