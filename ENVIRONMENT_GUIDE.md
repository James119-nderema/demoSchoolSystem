# Environment Switching Guide

## 🚀 How to Switch Between Environments

### Method 1: Using NPM Scripts (Recommended)

```bash
# Development (Local Server)
npm run dev                    # Uses http://localhost:8000

# Staging Server
npm run dev:staging           # Uses staging environment

# Production-like Development
npm run dev:production        # Uses production environment for testing
```

### Method 2: Using Environment Files

The system automatically uses the appropriate `.env` file based on the mode:

- `.env.development` - Local development
- `.env.staging` - Staging server  
- `.env.production` - Production server

### Method 3: Manual Override (Development Only)

```typescript
import { ENV } from '../config/environment';

// Switch to staging during development
ENV.setEnvironment('staging');

// Switch back to development
ENV.setEnvironment('development');
```

## 🌐 Environment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| **Development** | `http://localhost:8000` | Local Django server |
| **Staging** | `https://schoolmgmt-staging.herokuapp.com` | Testing before production |
| **Production** | `https://schoolmgmt-api.herokuapp.com` | Live production server |

## 🔧 Updating URLs

### For Your Actual Deployment:

1. **Update `.env.staging`:**
   ```bash
   VITE_API_BASE_URL=https://your-actual-staging-url.com
   ```

2. **Update `.env.production`:**
   ```bash
   VITE_API_BASE_URL=https://your-actual-production-url.com
   ```

### Common Deployment Platforms:

- **Heroku**: `https://your-app-name.herokuapp.com`
- **Vercel**: `https://your-app-name.vercel.app`
- **Netlify**: `https://your-app-name.netlify.app`
- **Railway**: `https://your-app-name.railway.app`
- **Render**: `https://your-app-name.onrender.com`

## 🏗️ Building for Different Environments

```bash
# Build for production
npm run build                 # Uses production config

# Build for staging
npm run build:staging         # Uses staging config

# Build for development
npm run build:development     # Uses development config
```

## 🐛 Development Tools

### Environment Switcher Component

Add to your app for easy environment switching during development:

```tsx
import EnvironmentSwitcher from './components/EnvironmentSwitcher';

function App() {
  return (
    <div>
      {/* Your app content */}
      <EnvironmentSwitcher />  {/* Only shows in development */}
    </div>
  );
}
```

### Check Current Environment

```typescript
import { ENV } from './config/environment';

console.log('Current environment:', ENV.getEnvironmentInfo());
```

## 📋 Environment Variables Reference

### Required Variables:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_ENV` - Environment name (development/staging/production)

### Optional Variables:
- `VITE_API_TIMEOUT` - Request timeout in milliseconds (default: 30000)
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version

## 🚨 Important Notes

1. **Never commit sensitive data** to `.env` files in version control
2. **Always test** API endpoints before switching environments
3. **Use staging** for testing new features before production
4. **Environment switcher** only appears in development mode for security

## 🔍 Troubleshooting

### API Connection Issues:
1. Check if the backend server is running
2. Verify the URL in the appropriate `.env` file
3. Check browser console for CORS errors
4. Ensure authentication tokens are valid

### Environment Not Switching:
1. Restart the development server after changing `.env` files
2. Clear browser cache and localStorage
3. Check console for environment logs
