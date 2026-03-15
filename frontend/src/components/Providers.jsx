'use client';

import { SearchProvider } from '@/context/SearchContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <SearchProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </SearchProvider>
    </ThemeProvider>
  );
}
