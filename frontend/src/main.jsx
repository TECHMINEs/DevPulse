import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import CommandPalette from './components/CommandPalette';
import NavigationProgress from './components/NavigationProgress';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <NavigationProgress />
          <App />
          <CommandPalette />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#000000',
              color: '#FFFFFF',
              border: '1px solid rgba(255,0,51,0.2)',
              borderRadius: 0,
              backdropFilter: 'blur(12px)',
            },
            success: {
              iconTheme: { primary: '#FF0000', secondary: '#FFFFFF' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#FFFFFF' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
