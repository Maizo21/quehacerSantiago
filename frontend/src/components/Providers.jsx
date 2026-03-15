'use client';

import { SearchProvider } from '@/context/SearchContext';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }) {
  return (
    <SearchProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SearchProvider>
  );
}
