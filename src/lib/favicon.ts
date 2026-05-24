import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type FaviconPayload = {
  body: Buffer;
  contentType: string;
};

const FALLBACK_PATH = '/favicon.jpg';

function parseDataUrl(url: string): FaviconPayload | null {
  const match = url.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    contentType: match[1],
    body: Buffer.from(match[2], 'base64'),
  };
}

async function readPublicFile(publicPath: string): Promise<FaviconPayload | null> {
  const normalized = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath;
  const filePath = path.join(process.cwd(), 'public', normalized);

  try {
    const body = await readFile(filePath);
    const ext = path.extname(normalized).toLowerCase();
    const contentType =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.svg'
            ? 'image/svg+xml'
            : ext === '.ico'
              ? 'image/x-icon'
              : 'image/jpeg';
    return { body, contentType };
  } catch {
    return null;
  }
}

async function fetchRemote(url: string): Promise<FaviconPayload | null> {
  try {
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') ?? 'image/png';
    const body = Buffer.from(await response.arrayBuffer());
    return { body, contentType };
  } catch {
    return null;
  }
}

/** Resolve a favicon URL (data URL, site path, or remote URL) to bytes. */
export async function resolveFavicon(url: string | undefined): Promise<FaviconPayload | null> {
  const trimmed = url?.trim();
  if (!trimmed || trimmed === '/favicon.ico') {
    return readPublicFile(FALLBACK_PATH);
  }

  if (trimmed.startsWith('data:')) {
    return parseDataUrl(trimmed) ?? readPublicFile(FALLBACK_PATH);
  }

  if (trimmed.startsWith('/')) {
    return (await readPublicFile(trimmed)) ?? readPublicFile(FALLBACK_PATH);
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return (await fetchRemote(trimmed)) ?? readPublicFile(FALLBACK_PATH);
  }

  return readPublicFile(FALLBACK_PATH);
}
