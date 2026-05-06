import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication (prefix-based)
const protectedPrefixes = ['/dashboard', '/onboarding', '/admin', '/accept-invite']

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

// Transient pages — skip ALL auth logic (e.g. OAuth callback carries tokens in the URL,
// so an existing session cookie must not redirect it away and lose the params)
const bypassRoutes = ['/auth/callback']

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value
    const { pathname } = request.nextUrl

    // Never interfere with bypass routes
    if (bypassRoutes.some(route => pathname === route)) {
        return NextResponse.next()
    }

    // Check if route is protected (prefix match)
    const isProtected = protectedPrefixes.some(prefix => pathname.startsWith(prefix))

    // Check if route is an auth route (exact match)
    const isAuthRoute = authRoutes.some(route => pathname === route)

    // Redirect to login if accessing protected route without token
    if (isProtected && !token) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect to dashboard if accessing auth routes with token
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, public assets
         * - p/[uuid] (public passport pages)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|p/).*)',
    ],
}
