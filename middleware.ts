import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from './lib/auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = await getSessionFromRequest(req)

  if (pathname.startsWith('/admin')) {
    if (!session) return NextResponse.redirect(new URL('/login', req.url))
    if (!session.isAdmin) return NextResponse.redirect(new URL('/', req.url))
  }

  if (pathname.startsWith('/tickets') || pathname.startsWith('/scratch')) {
    if (!session) return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/tickets/:path*', '/scratch/:path*'],
}
