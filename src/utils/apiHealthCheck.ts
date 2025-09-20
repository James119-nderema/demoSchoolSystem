import { APIService, AuthAPI, DataAPI } from '../services/baseUrl';

// API Health Check utility
export class APIHealthCheck {
  static async checkConnection(): Promise<boolean> {
    try {
      // Try to make a simple request to check if backend is accessible
      const response = await fetch(APIService.getUrl('/'), { method: 'HEAD' });
      return response.status !== 0; // Any response means backend is reachable
    } catch {
      return false;
    }
  }
  
  static async testAuthEndpoints() {
    console.log('🔐 Testing Auth Endpoints...');
    try {
      // Test staff login (this will fail with 401 but confirms endpoint exists)
      await AuthAPI.staffLogin({ email: 'test@test.com', password: 'test' });
    } catch (error) {
      console.log('Staff login endpoint:', error instanceof Error ? error.message : 'Available');
    }
  }
  
  static async testDataEndpoints() {
    console.log('📊 Testing Data Endpoints...');
    try {
      // Test classes endpoint (requires auth)
      await DataAPI.getClasses();
      console.log('Classes endpoint: Available');
    } catch (error) {
      console.log('Classes endpoint:', error instanceof Error ? error.message : 'Requires auth');
    }
  }
  
  static async runFullTest() {
    console.log('🚀 Starting API Health Check...');
    
    const isConnected = await this.checkConnection();
    console.log(`Backend connection: ${isConnected ? '✅ Connected' : '❌ Disconnected'}`);
    
    if (isConnected) {
      await this.testAuthEndpoints();
      await this.testDataEndpoints();
    }
    
    console.log('✅ API Health Check Complete');
  }
}

// Export for use in development
if (import.meta.env.MODE === 'development') {
  (window as any).APIHealthCheck = APIHealthCheck;
  console.log('API Health Check available at window.APIHealthCheck');
}
