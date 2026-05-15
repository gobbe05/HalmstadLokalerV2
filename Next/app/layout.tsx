'use client'
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from "@/components/ui/sonner";
import './globals.css';
import { CityProvider } from "@/contexts/CityContext";
import { PublicAuthProvider } from "@/contexts/PublicAuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollToTop } from '@/components/ScrollToTop';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { AuthProvider } from '@/contexts/AuthContext';
import { ImpersonationProvider } from '@/contexts/ImpersonationContext';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());    return (
    <html lang="en">
      <body>
        <QueryClientProvider client={client}>
            <Toaster />
            <Sonner />
            <ScrollToTop />
            <ScrollToTopButton />
            <AuthProvider>
                <PublicAuthProvider >
                    <ImpersonationProvider>
                        <ImpersonationBanner />
                        <CityProvider>
                            {children}
                        </CityProvider>
                    </ImpersonationProvider>
                </PublicAuthProvider>
            </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}