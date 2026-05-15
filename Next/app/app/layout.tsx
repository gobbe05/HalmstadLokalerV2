'use client'
import { AdvertiserRoute } from '@/components/auth/AdvertiserRoute';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdvertiserRoute>
        {children}
    </AdvertiserRoute>
  )
  
}