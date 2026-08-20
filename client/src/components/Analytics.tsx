import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { initAnalytics, logPageView } from '@/lib/analytics';

/**
 * Renders nothing; wires GA4 into the SPA. Loads gtag once on mount, then fires a manual page_view
 * on every route change (GA4 is configured with `send_page_view: false`, so this is the single source
 * of page views and avoids double-counting the initial load). No-ops entirely when
 * VITE_GA_MEASUREMENT_ID is unset. Must render inside the router so `useLocation` is available.
 */
export function Analytics() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
}
