import { useEffect, useCallback } from 'react';

export function usePanelLogger(panelName: string) {
  const logPanelData = useCallback((dataType: string, data: any, status: 'loading' | 'success' | 'error' = 'success') => {
    if (typeof window !== 'undefined' && (window as any).trackPanelData) {
      (window as any).trackPanelData(panelName, dataType, data, status);
    }
    
    // Also log to console for immediate visibility
    console.log(`[${panelName}] ${dataType}:`, data);
  }, [panelName]);

  const logAPICall = useCallback((endpoint: string, method: string = 'GET', data?: any) => {
    logPanelData('API_CALL', { endpoint, method, requestData: data }, 'loading');
  }, [logPanelData]);

  const logAPIResponse = useCallback((endpoint: string, response: any, status: 'success' | 'error' = 'success') => {
    logPanelData('API_RESPONSE', { endpoint, response }, status);
  }, [logPanelData]);

  const logStateChange = useCallback((stateName: string, oldValue: any, newValue: any) => {
    logPanelData('STATE_CHANGE', { stateName, oldValue, newValue });
  }, [logPanelData]);

  const logUserAction = useCallback((action: string, details?: any) => {
    logPanelData('USER_ACTION', { action, details });
  }, [logPanelData]);

  const logError = useCallback((error: any, context?: string) => {
    logPanelData('ERROR', { error: error.message || error, context }, 'error');
  }, [logPanelData]);

  return {
    logPanelData,
    logAPICall,
    logAPIResponse,
    logStateChange,
    logUserAction,
    logError
  };
}