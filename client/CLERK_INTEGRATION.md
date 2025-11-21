# Clerk Authentication Integration Guide

## Overview
The Sidebar component is now set up to work with role-based authentication. This guide explains how to integrate Clerk for full authentication functionality.

## Current Implementation (Mock Mode)
The Sidebar currently accepts props:
- `userRole`: 'doctor' | 'patient' | 'admin'
- `userName`: Display name
- `userEmail`: User email

## Steps to Integrate Clerk

### 1. Install Clerk
```bash
npm install @clerk/nextjs
```

### 2. Set Up Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/doctor/overview
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/doctor/overview
```

### 3. Update app/layout.tsx
```tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### 4. Update Sidebar Component
Replace the current implementation with:

```tsx
'use client'

import { useUser, useClerk } from '@clerk/nextjs';

export default function Sidebar({ activeItem }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  
  // Get user role from Clerk public metadata
  const userRole = user?.publicMetadata?.role as 'doctor' | 'patient' | 'admin' || 'doctor';
  const userName = user?.fullName || user?.firstName || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const sidebarItems = navigationByRole[userRole] || navigationByRole.doctor;
  
  const handleSignOut = () => {
    signOut();
  };
  
  // Rest of the component...
}
```

### 5. Set User Roles in Clerk Dashboard

#### Option A: Using Clerk Dashboard
1. Go to Clerk Dashboard → Users
2. Select a user
3. Go to "Metadata" tab
4. Add to Public Metadata:
```json
{
  "role": "doctor"
}
```

#### Option B: Programmatically (Server-side)
```tsx
import { clerkClient } from '@clerk/nextjs/server';

await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    role: 'doctor' // or 'patient' or 'admin'
  }
});
```

### 6. Create Sign-In/Sign-Up Pages

#### app/sign-in/[[...sign-in]]/page.tsx
```tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-softblue">
      <SignIn />
    </div>
  );
}
```

#### app/sign-up/[[...sign-up]]/page.tsx
```tsx
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-softblue">
      <SignUp />
    </div>
  );
}
```

### 7. Protect Routes with Middleware

#### middleware.ts
```tsx
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  // Routes that require specific roles
  afterAuth(auth, req) {
    // Redirect logic based on user role
    if (auth.userId) {
      const role = auth.sessionClaims?.metadata?.role;
      const path = req.nextUrl.pathname;
      
      // Redirect based on role and current path
      if (role === 'doctor' && path.startsWith('/patient')) {
        return Response.redirect(new URL('/doctor/overview', req.url));
      }
      if (role === 'patient' && path.startsWith('/doctor')) {
        return Response.redirect(new URL('/patient/overview', req.url));
      }
      if (role === 'admin' && !path.startsWith('/admin')) {
        return Response.redirect(new URL('/admin/dashboard', req.url));
      }
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### 8. Update Layout Files

#### app/(roles)/doctor/layout.tsx
```tsx
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';

export default async function DoctorLayout({ children }) {
  const { userId, sessionClaims } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  const userRole = sessionClaims?.metadata?.role;
  
  if (userRole !== 'doctor') {
    redirect(`/${userRole}/overview`);
  }
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
```

## Role-Based Navigation

The Sidebar automatically shows different menu items based on the user's role:

### Doctor Role
- Overview
- Patients
- Analytics
- Risk Assessment
- Treatments
- Settings
- Notifications

### Patient Role
- Overview
- My Episodes
- My Treatments
- Appointments
- Reports
- Messages
- Settings
- Notifications

### Admin Role
- Dashboard
- Doctors
- Patients
- Analytics
- System Settings
- Notifications

## Testing

### Test with Mock Data (Current)
```tsx
<Sidebar 
  userRole="doctor" 
  userName="Dr. Sarah Johnson" 
  userEmail="sarah.johnson@hospital.com" 
/>
```

### Test with Clerk (After Integration)
The component will automatically pull user data from Clerk's `useUser()` hook.

## Additional Features

### Custom User Profiles
Add more metadata fields:
```json
{
  "role": "doctor",
  "specialization": "Neurology",
  "licenseNumber": "MD12345",
  "clinic": "City Medical Center"
}
```

### Role-Based Components
Create a hook for role checking:
```tsx
// hooks/useRole.ts
import { useUser } from '@clerk/nextjs';

export function useRole() {
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string;
  
  return {
    role,
    isDoctor: role === 'doctor',
    isPatient: role === 'patient',
    isAdmin: role === 'admin',
  };
}
```

Use in components:
```tsx
const { isDoctor, isAdmin } = useRole();

{isDoctor && <DoctorOnlyFeature />}
{isAdmin && <AdminPanel />}
```

## Troubleshooting

1. **Role not updating**: Clear Clerk cache and re-authenticate
2. **Redirect loops**: Check middleware logic and role assignments
3. **Missing metadata**: Ensure public metadata is set correctly in Clerk Dashboard

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js App Router with Clerk](https://clerk.com/docs/quickstarts/nextjs)
- [User Metadata Guide](https://clerk.com/docs/users/metadata)
