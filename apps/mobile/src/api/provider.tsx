import React, { createContext, useContext } from 'react';
import { apiClient } from './client';

const ApiContext = createContext(apiClient);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  return <ApiContext.Provider value={apiClient}>{children}</ApiContext.Provider>;
}

export function useApi() {
  return useContext(ApiContext);
}
