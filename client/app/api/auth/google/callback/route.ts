import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { signToken, setAuthCookie } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${url.origin}/signin?error=google_${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${url.origin}/signin?error=google_missing_params`);
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get('google_oauth_state')?.value;
  cookieStore.delete('google_oauth_state');

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${url.origin}/signin?error=google_invalid_state`);
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI || `${url.origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${url.origin}/signin?error=google_not_configured`);
  }

  // Exchange authorization code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${url.origin}/signin?error=google_token_error`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token as string | undefined;
  const refreshToken = tokenData.refresh_token as string | undefined;

  if (!accessToken) {
    return NextResponse.redirect(`${url.origin}/signin?error=google_no_access_token`);
  }

  // Fetch user info from Google
  const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userInfoResponse.ok) {
    return NextResponse.redirect(`${url.origin}/signin?error=google_userinfo_error`);
  }

  const profile = (await userInfoResponse.json()) as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };

  if (!profile.email) {
    return NextResponse.redirect(`${url.origin}/signin?error=google_no_email`);
  }

  if (profile.email_verified === false) {
    return NextResponse.redirect(`${url.origin}/signin?error=google_email_not_verified`);
  }

  // Find existing user by email (no auto-registration to keep roles consistent)
  let user = await prisma.user.findUnique({
    where: { email: profile.email },
    include: {
      admin: true,
      teacher: true,
      student: true,
    },
  });

  if (!user) {
    return NextResponse.redirect(`${url.origin}/signin?error=google_no_account`);
  }

  if (!user.isActive) {
    return NextResponse.redirect(`${url.origin}/signin?error=google_account_inactive`);
  }

  // Store Google identifiers and refresh token for per-user Drive access
  try {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.sub,
        googleEmail: profile.email,
        ...(refreshToken ? { googleRefreshToken: refreshToken } : {}),
      },
      include: {
        admin: true,
        teacher: true,
        student: true,
      },
    });
  } catch (e) {
    console.error('Failed to store Google OAuth data for user', e);
  }

  let name = profile.name || '';
  if (!name) {
    if (user.admin) {
      name = user.admin.name;
    } else if (user.teacher) {
      name = `${user.teacher.firstName} ${user.teacher.lastName}`;
    } else if (user.student) {
      name = `${user.student.firstName} ${user.student.lastName}`;
    } else {
      name = user.email;
    }
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name,
  });

  await setAuthCookie(token);

  // Redirect based on role
  let redirectPath = '/';
  switch (user.role) {
    case 'ADMIN':
      redirectPath = '/admin/overview';
      break;
    case 'TEACHER':
      redirectPath = '/teacher/overview';
      break;
    case 'STUDENT':
      redirectPath = '/student/overview';
      break;
  }

  return NextResponse.redirect(new URL(redirectPath, url.origin));
}
