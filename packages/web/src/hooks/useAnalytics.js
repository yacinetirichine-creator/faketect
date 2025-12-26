import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../services/analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView(location.pathname, document.title);
  }, [location]);
};

export const useAnalytics = () => {
  const trackEvent = (eventName, parameters) => {
    analytics.trackEvent(eventName, parameters);
  };

  const trackHotjarEvent = (eventName) => {
    analytics.trackHotjarEvent(eventName);
  };

  const identifyUser = (userId, traits) => {
    analytics.identifyUser(userId, traits);
  };

  const trackError = (error, fatal = false) => {
    analytics.trackError(error, fatal);
  };

  return {
    trackEvent,
    trackHotjarEvent,
    identifyUser,
    trackError,
  };
};

// Hook pour tracker les performances
export const usePerformanceTracking = () => {
  useEffect(() => {
    if (!window.performance) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          analytics.trackTiming(
            'navigation',
            'page_load',
            entry.loadEventEnd - entry.fetchStart
          );
        }

        if (entry.entryType === 'largest-contentful-paint') {
          analytics.trackTiming('performance', 'lcp', entry.renderTime || entry.loadTime);
        }

        if (entry.entryType === 'first-input') {
          analytics.trackTiming('performance', 'fid', entry.processingStart - entry.startTime);
        }
      }
    });

    observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'] });

    return () => observer.disconnect();
  }, []);
};

// Hook pour tracker les erreurs
export const useErrorTracking = () => {
  useEffect(() => {
    const handleError = (event) => {
      analytics.trackError(event.error, true);
    };

    const handleUnhandledRejection = (event) => {
      analytics.trackError(event.reason, true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
};
