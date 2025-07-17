import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Remove jwt import as it's not compatible with Edge runtime
// Instead we'll just check for token presence without verification

// Define token structure for type checking
interface DecodedToken {
  userId: string;
  role: string;
  facultyId?: string;
  email?: string;
  name?: string;
  iat: number;
  exp: number;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define all public paths
  const isPublicPath = 
    path === '/auth/signin' || 
    path === '/auth/signup' || 
    path.startsWith('/auth/verify-otp') ||
    path === '/auth/faculty-redirect' ||
    path === '/home'; // Add home page as public path
  
  // Check for token in multiple cookies
  const token = 
    request.cookies.get('token')?.value || 
    request.cookies.get('auth_token')?.value || 
    '';
  
  // Check for emergency parameters
  const hasEmergencyParam = request.nextUrl.searchParams.has('emergency');
  const hasForceReload = request.nextUrl.searchParams.has('forceReload');

  console.log(`Middleware: path=${path}, token=${!!token}, isPublicPath=${isPublicPath}`);

  // Check if this is a logout request (special query parameter)
  const isLogout = request.nextUrl.searchParams.has('logout');
  
  // If it's a logout request to signin page, don't redirect even with token
  if (path === '/auth/signin' && isLogout) {
    console.log('Logout request detected - clearing token');
    const response = NextResponse.next();
    response.cookies.delete('token');
    response.cookies.delete('auth_token');
    response.cookies.delete('user_role');
    return response;
  }
  
  // Special case for faculty redirect page - always allow access
  if (path === '/auth/faculty-redirect') {
    console.log('Faculty redirect page accessed - allowing access');
    return NextResponse.next();
  }
  
  // Special case for emergency or force reload parameters
  if ((hasEmergencyParam || hasForceReload) && token) {
    console.log('Emergency redirect detected with valid token - allowing access');
    return NextResponse.next();
  }

  // Redirect to home page if accessing root path without token
  if (path === '/' && !token) {
    console.log('No token at root path, redirecting to home page');
    return NextResponse.redirect(new URL('/home', request.url));
  }
  
  // Redirect to login if trying to access other protected routes without token
  if (!isPublicPath && !token) {
    console.log('No token, redirecting to login');
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Special case for Faculty dashboard paths
  // Allow direct access to all Faculty dashboard paths when token is present
  const facultyPaths = ['/', '/class-routine', '/mark-attendance', '/attendance-report', '/account', '/request-handover'];
  
  // Check if this is a faculty dashboard path
  const isFacultyPath = facultyPaths.some(route => path === route || path.startsWith(route));
  
  // If it's a faculty path and token exists, allow direct access
  if (isFacultyPath && token) {
    console.log('Faculty path access with token - allowing direct access:', path);
    // Simply allow access if token exists (no verification in middleware)
    return NextResponse.next();
  }

  // If user has token and tries to access public path, redirect to appropriate dashboard
  if (isPublicPath && token && !isLogout) {
    // Check for user_role cookie which contains role information
    const userRole = request.cookies.get('user_role')?.value;
    console.log('User role from cookie:', userRole);
    
    // Redirect based on role from cookie
    if (userRole === 'HOD') {
      console.log('HOD user redirecting to HOD dashboard');
      return NextResponse.redirect(new URL('/hod-dashboard', request.url));
    } else if (userRole === 'Faculty') {
      console.log('Faculty user redirecting to Faculty dashboard');
      return NextResponse.redirect(new URL('/', request.url));
    } else {
      // If no role cookie but token exists, default to Faculty dashboard
      console.log('Token exists but no role cookie, defaulting to Faculty dashboard');
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Role-based access control for protected routes
  if (!isPublicPath && token) {
    // Get role from cookie instead of decoding token
    const userRole = request.cookies.get('user_role')?.value;
    console.log('Role-based access check, user role:', userRole);
    
    // HOD routes
    const hodRoutes = ['/hod-dashboard', '/hod-dashboard/staff', '/hod-dashboard/records', '/hod-dashboard/handovers', '/hod-dashboard/analytics'];
    const isHodRoute = hodRoutes.some(route => path.startsWith(route));
    
    // Faculty routes
    const facultyRoutes = ['/', '/class-routine', '/mark-attendance', '/attendance-report', '/request-handover'];
    const isFacultyRoute = facultyRoutes.some(route => path === route || path.startsWith(route));
    
    // Shared routes that both HOD and Faculty can access
    const sharedRoutes = ['/account'];
    const isSharedRoute = sharedRoutes.some(route => path === route || path.startsWith(route));
    
    console.log('Path check:', {
      path,
      role: userRole,
      isHodRoute,
      isFacultyRoute,
      isSharedRoute
    });
    
    // Enforce role-based access
    if (isHodRoute && userRole !== 'HOD') {
      // Faculty trying to access HOD routes
      console.log('Redirecting Faculty from HOD route to Faculty dashboard');
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    if (isFacultyRoute && userRole !== 'Faculty' && userRole !== undefined) {
      // HOD trying to access Faculty routes
      console.log('Redirecting HOD from Faculty route to HOD dashboard');
      return NextResponse.redirect(new URL('/hod-dashboard', request.url));
    }
    
    // Allow access to shared routes for both roles
    if (isSharedRoute) {
      console.log('Allowing access to shared route:', path);
      return NextResponse.next();
    }
    
    // If we get here and have a token but no role cookie, allow access
    // This is a fallback to prevent lockouts
    if (!userRole && token) {
      console.log('Token exists but no role cookie - allowing access as fallback');
      return NextResponse.next();
    }
  }
}

export const config = {
  matcher: [
    '/',
    '/home',
    '/auth/signin',
    '/auth/signup',
    '/auth/verify-otp',
    '/class-routine',
    '/attendance-report',
    '/account',
    '/request-handover',
    '/hod-dashboard',
    '/hod-dashboard/account',
    '/hod-dashboard/:path*'
  ]
};