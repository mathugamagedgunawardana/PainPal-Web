'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

const DoctorLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/signin');
      } else if (user?.role !== 'DOCTOR' && user?.role !== 'ADMIN') {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'DOCTOR' && user?.role !== 'ADMIN')) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">
        <Header />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DoctorLayout;