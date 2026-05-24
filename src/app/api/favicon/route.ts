import { getPublicSettings } from '@/lib/content';
import { resolveFavicon } from '@/lib/favicon';
import { NextResponse } from 'next/server';

export async function GET() {
  const settings = await getPublicSettings();
  const favicon = await resolveFavicon(settings.seo.favicon_url);

  if (!favicon) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(favicon.body), {
    headers: {
      'Content-Type': favicon.contentType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
