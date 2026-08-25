import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminAuthProvider } from './admin/auth/AdminAuthContext';
import { CustomerAuthProvider } from './hooks/useCustomerAuth';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes caching for snappy navigation
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AdminAuthProvider>
          <CustomerAuthProvider>
            <App />
          </CustomerAuthProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
