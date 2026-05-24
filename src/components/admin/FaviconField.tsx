'use client';

import { useRef, useState } from 'react';
import { Globe, ImageIcon, Monitor, Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { SITE_SEO_DEFAULTS } from '@/types';

const MAX_DIMENSION = 512;
const MAX_FILE_MB = 2;

function resolvePreviewSrc(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === '/favicon.ico') return SITE_SEO_DEFAULTS.favicon_url;
  return trimmed;
}

function fileToFaviconDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width >= height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const usePng = file.type === 'image/png' || file.type === 'image/webp';
        resolve(canvas.toDataURL(usePng ? 'image/png' : 'image/jpeg', usePng ? undefined : 0.92));
      };
      img.onerror = () => reject(new Error('Could not decode image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

type FaviconFieldProps = {
  value: string;
  onChange: (value: string) => void;
  siteTitle?: string;
  siteUrl?: string;
};

export default function FaviconField({
  value,
  onChange,
  siteTitle = 'Your site',
  siteUrl = 'yoursite.com',
}: FaviconFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewSrc = resolvePreviewSrc(value);
  const liveSrc = `/favicon.ico?v=${encodeURIComponent(previewSrc.slice(0, 32))}`;

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_FILE_MB} MB.`);
      return;
    }
    setConverting(true);
    try {
      const dataUrl = await fileToFaviconDataUrl(file);
      onChange(dataUrl);
    } catch {
      setError('Failed to process image. Use a square PNG or JPG (at least 48×48 px).');
    } finally {
      setConverting(false);
    }
  };

  const triggerPick = () => inputRef.current?.click();

  return (
    <div className="space-y-4">
      <Label>Favicon</Label>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Preview — how visitors see it
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              <Monitor className="h-3 w-3" />
              Browser tab
            </div>
            <div className="flex items-center gap-2 rounded-md bg-[#f0f0f0] px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt=""
                className="h-4 w-4 shrink-0 rounded-sm object-contain"
              />
              <span className="truncate text-sm text-slate-800">{siteTitle}</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              <Globe className="h-3 w-3" />
              Google search
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt=""
                  className="h-[18px] w-[18px] shrink-0 rounded-full object-cover"
                />
                <span className="text-xs text-slate-600">{siteUrl}</span>
              </div>
              <p className="text-sm font-medium text-[#1a0dab]">{siteTitle}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Sizes</span>
            {[16, 32, 48].map(size => (
              <div key={size} className="flex flex-col items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt=""
                  width={size}
                  height={size}
                  className="rounded border border-slate-200 bg-white object-contain"
                  style={{ width: size, height: size }}
                />
                <span className="text-[10px] text-slate-400">{size}px</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500">
            Live URL:{' '}
            <a
              href={liveSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-slate-700 underline-offset-2 hover:underline"
            >
              /favicon.ico
            </a>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/x-icon,.ico"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {value ? (
        <div className="relative flex items-center gap-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt="Uploaded favicon"
            className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800">Current favicon</p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {value.startsWith('data:') ? 'Uploaded image (saved to database)' : value}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={triggerPick}
              disabled={converting}
              className="flex h-8 items-center gap-1.5 rounded-md bg-white px-2.5 text-xs font-medium text-slate-700 shadow ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {converting ? 'Processing…' : 'Change'}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Remove favicon"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-500 shadow ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerPick}
          disabled={converting}
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {converting ? (
            <span className="text-xs text-slate-400">Processing image…</span>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-slate-300" />
              <span className="font-medium">Upload favicon</span>
              <span className="text-xs text-slate-400">
                Square PNG or JPG · 48×48 px or larger · max {MAX_FILE_MB} MB
              </span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && (
        <p className="text-xs text-zinc-500">
          Shown in the browser tab and Google search results. Save settings after uploading, then request
          re-indexing in Google Search Console for search results to update.
        </p>
      )}
    </div>
  );
}
