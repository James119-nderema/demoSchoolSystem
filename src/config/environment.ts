// Environment configuration
export const ENV = {
  // Current environment from Vite or fallback to development
  NODE_ENV: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development',
  
  // App information
  APP_NAME: import.meta.env.VITE_APP_NAME || 'School Management System',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // API configuration based on environment
  API: {
    // Development environment (local backend)
    development: {
      BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
      NAME: 'Local Development',
    },
    
    // Staging environment 
    staging: {
      BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://schoolmgmt-staging.herokuapp.com',
      TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 45000,
      NAME: 'Staging Server',
    },
    
    // Production environment
    production: {
      BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://schoolmgmt-api.herokuapp.com',
      TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 45000,
      NAME: 'Production Server',
    },
    
    // Testing environment (for running tests)
    test: {
      BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
      NAME: 'Test Environment',
    }
  },
  
  // Get current API config
  getCurrentApiConfig() {
    return this.API[this.NODE_ENV as keyof typeof this.API] || this.API.development;
  },
  
  // Manually override environment (useful for debugging)
  setEnvironment(env: keyof typeof this.API) {
    this.NODE_ENV = env;
    console.log(`🔄 Environment switched to: ${env} (${this.getCurrentApiConfig().BASE_URL})`);
  },
  
  // Get current environment info
  getEnvironmentInfo() {
    const config = this.getCurrentApiConfig();
    return {
      environment: this.NODE_ENV,
      name: config.NAME,
      baseUrl: config.BASE_URL,
      timeout: config.TIMEOUT,
      appName: this.APP_NAME,
      version: this.APP_VERSION
    };
  }
};

// Export current API URL
export const API_BASE_URL = ENV.getCurrentApiConfig().BASE_URL;
export const API_TIMEOUT = ENV.getCurrentApiConfig().TIMEOUT;
