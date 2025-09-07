import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Vercel Analytics & Speed Insights (for non-Next.js apps)
import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'

// Initialize analytics in all environments
try {
  inject()
  console.log('[Vercel] Analytics injected')
  injectSpeedInsights()
  console.log('[Vercel] Speed Insights injected')
} catch (e) {
  // Avoid breaking the app if analytics fail to initialize
  console.warn('Vercel analytics initialization skipped:', e)
}

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Implement hot reload functionality
        let refreshing = false;
        
        // Listen for updates to the service worker
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            window.location.reload();
            refreshing = true;
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);