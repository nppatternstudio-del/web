'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FooterNavLink, SiteControls, SiteSettings, SITE_SEO_DEFAULTS } from '@/types';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import FaviconField from '@/components/admin/FaviconField';
import ImageUploadField from '@/components/admin/ImageUploadField';

const siteHostname = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SITE_URL;
    if (url) return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    /* ignore invalid URL */
  }
  return 'yoursite.com';
})();

const defaultFooterNav: FooterNavLink[] = [
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/projects', label: 'Projects' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/contact', label: 'Contact' },
];

const defaultControls: Required<SiteControls> = {
  maintenance_mode: false,
  pages: {
    home: true,
    about: true,
    services: true,
    projects: true,
    reviews: true,
    contact: true,
  },
  sections: {
    hero: true,
    about: true,
    services: true,
    projects: true,
    reviews: true,
    contact: true,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailSenderEmail, setGmailSenderEmail] = useState('');
  const searchParams = useSearchParams();

  const supabase = createClient();

  // Handle Gmail OAuth callback status
  useEffect(() => {
    const gmailStatus = searchParams.get('gmail');
    if (gmailStatus === 'connected') {
      toast.success('Gmail connected successfully! Emails will now be sent automatically.');
    } else if (gmailStatus === 'error') {
      toast.error('Gmail connection failed. Please try again.');
    } else if (gmailStatus === 'no_refresh_token') {
      toast.error('No refresh token received. Please try connecting Gmail again.');
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('site_settings').select('*').single();
      if (!data) {
        setLoading(false);
        return;
      }
      // Check Gmail connection status
      const hasToken = !!(data.contact_info?.gmail_refresh_token);
      setGmailConnected(hasToken);
      setGmailSenderEmail(data.contact_info?.gmail_sender_email ?? data.contact_info?.email ?? '');
      setSettings({
        ...data,
        contact_info: {
          ...data.contact_info,
          controls: {
            maintenance_mode: data.contact_info?.controls?.maintenance_mode ?? defaultControls.maintenance_mode,
            pages: {
              home: data.contact_info?.controls?.pages?.home ?? defaultControls.pages.home,
              about: data.contact_info?.controls?.pages?.about ?? defaultControls.pages.about,
              services: data.contact_info?.controls?.pages?.services ?? defaultControls.pages.services,
              projects: data.contact_info?.controls?.pages?.projects ?? defaultControls.pages.projects,
              reviews: data.contact_info?.controls?.pages?.reviews ?? defaultControls.pages.reviews,
              contact: data.contact_info?.controls?.pages?.contact ?? defaultControls.pages.contact,
            },
            sections: {
              hero: data.contact_info?.controls?.sections?.hero ?? defaultControls.sections.hero,
              about: data.contact_info?.controls?.sections?.about ?? defaultControls.sections.about,
              services: data.contact_info?.controls?.sections?.services ?? defaultControls.sections.services,
              projects: data.contact_info?.controls?.sections?.projects ?? defaultControls.sections.projects,
              reviews: data.contact_info?.controls?.sections?.reviews ?? defaultControls.sections.reviews,
              contact: data.contact_info?.controls?.sections?.contact ?? defaultControls.sections.contact,
            },
          },
          footer: {
            brand_title: data.contact_info?.footer?.brand_title ?? 'Pattern.lk',
            tagline:
              data.contact_info?.footer?.tagline ??
              'Premium apparel pattern making with 35+ years of precision and craftsmanship in the heart of Sri Lanka.',
            copyright: data.contact_info?.footer?.copyright ?? '© 2026 Pattern.lk. All rights reserved.',
            nav_heading: data.contact_info?.footer?.nav_heading ?? 'NAVIGATION',
            connect_heading: data.contact_info?.footer?.connect_heading ?? 'CONNECT',
            nav_links: Array.isArray(data.contact_info?.footer?.nav_links) && data.contact_info.footer.nav_links.length
              ? data.contact_info.footer.nav_links
              : defaultFooterNav,
          },
          seo: {
            site_title: data.contact_info?.seo?.site_title ?? SITE_SEO_DEFAULTS.site_title,
            meta_description: data.contact_info?.seo?.meta_description ?? SITE_SEO_DEFAULTS.meta_description,
            og_title: data.contact_info?.seo?.og_title ?? SITE_SEO_DEFAULTS.og_title,
            og_description: data.contact_info?.seo?.og_description ?? SITE_SEO_DEFAULTS.og_description,
            og_image_url: data.contact_info?.seo?.og_image_url ?? SITE_SEO_DEFAULTS.og_image_url,
            favicon_url: data.contact_info?.seo?.favicon_url ?? SITE_SEO_DEFAULTS.favicon_url,
          },
        },
      });
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    if (!settings) return;
    const { error } = await supabase.from('site_settings').update({
      social_links: settings.social_links,
      contact_info: settings.contact_info,
      whatsapp_number: settings.whatsapp_number,
    }).eq('id', 1);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Settings updated');
    }
  };

  const saveGmailSender = async () => {
    if (!settings) return;
    const { data: current } = await supabase
      .from('site_settings')
      .select('contact_info')
      .eq('id', 1)
      .single();
    const contactInfo = (current?.contact_info as Record<string, unknown>) ?? {};
    const { error } = await supabase.from('site_settings').update({
      contact_info: { ...contactInfo, gmail_sender_email: gmailSenderEmail },
    }).eq('id', 1);
    if (error) {
      toast.error('Failed to save sender email');
    } else {
      toast.success('Sender email saved');
    }
  };

  const disconnectGmail = async () => {
    if (!confirm('Disconnect Gmail? Automatic emails will stop working.')) return;
    const { data: current } = await supabase
      .from('site_settings')
      .select('contact_info')
      .eq('id', 1)
      .single();
    const contactInfo = { ...(current?.contact_info as Record<string, unknown> ?? {}) };
    delete contactInfo.gmail_refresh_token;
    await supabase.from('site_settings').update({ contact_info: contactInfo }).eq('id', 1);
    setGmailConnected(false);
    toast.success('Gmail disconnected');
  };

  if (loading || !settings) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl">
      <div className="mb-12">
        <div className="text-xs tracking-[3px] text-zinc-500 mb-2">GLOBAL</div>
        <h1 className="text-4xl font-semibold tracking-tight">Site Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site title, meta, and favicon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Browser title</Label>
            <Input
              value={settings.contact_info?.seo?.site_title ?? ''}
              onChange={e =>
                setSettings({
                  ...settings,
                  contact_info: {
                    ...settings.contact_info,
                    seo: { ...settings.contact_info?.seo, site_title: e.target.value },
                  },
                })
              }
              placeholder={SITE_SEO_DEFAULTS.site_title}
            />
            <p className="mt-2 text-xs text-zinc-400">Shown in the tab and as the default page title.</p>
          </div>
          <div>
            <Label>Meta description</Label>
            <Textarea
              rows={3}
              value={settings.contact_info?.seo?.meta_description ?? ''}
              onChange={e =>
                setSettings({
                  ...settings,
                  contact_info: {
                    ...settings.contact_info,
                    seo: { ...settings.contact_info?.seo, meta_description: e.target.value },
                  },
                })
              }
              placeholder={SITE_SEO_DEFAULTS.meta_description}
            />
          </div>
          <div>
            <Label>Open Graph title (social previews)</Label>
            <Input
              value={settings.contact_info?.seo?.og_title ?? ''}
              onChange={e =>
                setSettings({
                  ...settings,
                  contact_info: {
                    ...settings.contact_info,
                    seo: { ...settings.contact_info?.seo, og_title: e.target.value },
                  },
                })
              }
              placeholder={SITE_SEO_DEFAULTS.og_title}
            />
          </div>
          <div>
            <Label>Open Graph description</Label>
            <Textarea
              rows={2}
              value={settings.contact_info?.seo?.og_description ?? ''}
              onChange={e =>
                setSettings({
                  ...settings,
                  contact_info: {
                    ...settings.contact_info,
                    seo: { ...settings.contact_info?.seo, og_description: e.target.value },
                  },
                })
              }
              placeholder={SITE_SEO_DEFAULTS.og_description}
            />
          </div>
          <ImageUploadField
            label="Open Graph image"
            value={settings.contact_info?.seo?.og_image_url ?? ''}
            onChange={v =>
              setSettings({
                ...settings,
                contact_info: {
                  ...settings.contact_info,
                  seo: { ...settings.contact_info?.seo, og_image_url: v },
                },
              })
            }
            hint="Used for social sharing previews (Facebook, WhatsApp, etc.). Stored as base64 in the database."
            previewAspect="max-h-40 w-full"
          />
          <FaviconField
            value={settings.contact_info?.seo?.favicon_url ?? ''}
            onChange={v =>
              setSettings({
                ...settings,
                contact_info: {
                  ...settings.contact_info,
                  seo: { ...settings.contact_info?.seo, favicon_url: v },
                },
              })
            }
            siteTitle={settings.contact_info?.seo?.site_title ?? SITE_SEO_DEFAULTS.site_title}
            siteUrl={siteHostname}
          />
          <Button onClick={save} className="w-full sm:w-auto">
            Save SEO and branding
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Public Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>WhatsApp Number</Label>
            <Input
              value={settings.whatsapp_number}
              onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })}
              placeholder="+15551234567"
            />
          </div>

          <div>
            <Label>Contact Email</Label>
            <Input
              value={settings.contact_info?.email || ''}
              onChange={e => setSettings({ ...settings, contact_info: { ...settings.contact_info, email: e.target.value } })}
              type="email"
            />
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              value={settings.contact_info?.phone || ''}
              onChange={e => setSettings({ ...settings, contact_info: { ...settings.contact_info, phone: e.target.value } })}
            />
          </div>

          <div>
            <Label>Address</Label>
            <Input
              value={settings.contact_info?.address || ''}
              onChange={e => setSettings({ ...settings, contact_info: { ...settings.contact_info, address: e.target.value } })}
            />
          </div>

          <div>
            <Label>Hours</Label>
            <Input
              value={settings.contact_info?.hours || ''}
              onChange={e => setSettings({ ...settings, contact_info: { ...settings.contact_info, hours: e.target.value } })}
            />
          </div>

          <div>
            <Label>Google Map Embed URL</Label>
            <Input
              value={settings.contact_info?.map_embed_url || ''}
              onChange={e => setSettings({ ...settings, contact_info: { ...settings.contact_info, map_embed_url: e.target.value } })}
              placeholder="https://www.google.com/maps?q=Colombo%2C%20Sri%20Lanka&output=embed"
            />
            <p className="mt-2 text-xs text-zinc-400">
              You can paste a normal Google Maps link or just a place name. It will auto-convert to an embeddable map.
            </p>
          </div>

          <div>
            <Label>Elfsight Google Reviews — app ID (optional)</Label>
            <Input
              value={settings.contact_info?.elfsight_google_reviews_app_id || ''}
              onChange={e =>
                setSettings({
                  ...settings,
                  contact_info: { ...settings.contact_info, elfsight_google_reviews_app_id: e.target.value },
                })
              }
              placeholder="e.g. f45ce138-bd56-4e17-a6ef-f0bc1d2901c8"
            />
            <p className="mt-2 text-xs text-zinc-400">
              Only the UUID from your Elfsight embed (shown as <code className="rounded bg-zinc-100 px-1">elfsight-app-…</code>).
              Leave empty to hide the embed. If the browser console logs an error from{' '}
              <code className="rounded bg-zinc-100 px-1">elfsightcdn.com</code> (often while loading Google Reviews), the ID is wrong,
              the widget is not a published Google Reviews app in Elfsight, or Elfsight rejected the request—fix it in the Elfsight
              dashboard or clear this field. Optional override:{' '}
              <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_ELFSIGHT_GOOGLE_REVIEWS_APP_ID</code> in{' '}
              <code className="rounded bg-zinc-100 px-1">.env.local</code>.
            </p>
          </div>

          <div>
            <Label>Social Links (JSON)</Label>
            <Textarea
              value={JSON.stringify(settings.social_links, null, 2)}
              onChange={e => {
                try {
                  setSettings({ ...settings, social_links: JSON.parse(e.target.value) });
                } catch {}
              }}
              className="font-mono text-sm h-48"
            />
            <div className="text-xs text-zinc-400 mt-2">Example: {`[{"platform":"Instagram","url":"https://instagram.com/visily"}]`}</div>
          </div>

          <Button onClick={save} className="w-full sm:w-auto">Save Changes</Button>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Footer (site-wide)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Brand / site name</Label>
            <Input
              value={settings.contact_info?.footer?.brand_title ?? ''}
              onChange={e =>
                setSettings({
                  ...settings,
                  contact_info: {
                    ...settings.contact_info,
                    footer: { ...settings.contact_info?.footer, brand_title: e.target.value },
                  },
                })
              }
            />
          </div>
          <div>
            <Label>Tagline</Label>
            <Textarea
              rows={3}
              value={settings.contact_info?.footer?.tagline ?? ''}
              onChange={e =>
                setSettings({
                  ...settings,
                  contact_info: {
                    ...settings.contact_info,
                    footer: { ...settings.contact_info?.footer, tagline: e.target.value },
                  },
                })
              }
            />
          </div>
          <div>
            <Label>Copyright line</Label>
            <Input
              value={settings.contact_info?.footer?.copyright ?? ''}
              onChange={e =>
                setSettings({
                  ...settings,
                  contact_info: {
                    ...settings.contact_info,
                    footer: { ...settings.contact_info?.footer, copyright: e.target.value },
                  },
                })
              }
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label>Middle column heading (navigation)</Label>
              <Input
                value={settings.contact_info?.footer?.nav_heading ?? ''}
                onChange={e =>
                  setSettings({
                    ...settings,
                    contact_info: {
                      ...settings.contact_info,
                      footer: { ...settings.contact_info?.footer, nav_heading: e.target.value },
                    },
                  })
                }
              />
            </div>
            <div>
              <Label>Right column heading (connect)</Label>
              <Input
                value={settings.contact_info?.footer?.connect_heading ?? ''}
                onChange={e =>
                  setSettings({
                    ...settings,
                    contact_info: {
                      ...settings.contact_info,
                      footer: { ...settings.contact_info?.footer, connect_heading: e.target.value },
                    },
                  })
                }
              />
            </div>
          </div>
          <div>
            <Label>Footer navigation links (JSON)</Label>
            <Textarea
              value={JSON.stringify(settings.contact_info?.footer?.nav_links ?? defaultFooterNav, null, 2)}
              onChange={e => {
                try {
                  const parsed = JSON.parse(e.target.value) as FooterNavLink[];
                  setSettings({
                    ...settings,
                    contact_info: {
                      ...settings.contact_info,
                      footer: { ...settings.contact_info?.footer, nav_links: parsed },
                    },
                  });
                } catch {
                  /* ignore until valid JSON */
                }
              }}
              className="font-mono text-sm h-40"
            />
            <p className="text-xs text-zinc-400 mt-2">
              Array of <code className="text-zinc-600">{`{ "href": "/about", "label": "About" }`}</code>. Same paths as your public pages.
            </p>
          </div>
          <p className="text-sm text-zinc-500">
            WhatsApp, email, phone, and address in the section above also appear in the footer connect block where relevant.
          </p>
          <Button onClick={save} className="w-full sm:w-auto">
            Save footer & contact
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Visibility Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.contact_info?.controls?.maintenance_mode ?? false}
              onChange={e =>
                setSettings({
                  ...settings,
                  contact_info: {
                    ...settings.contact_info,
                    controls: {
                      ...defaultControls,
                      ...settings.contact_info?.controls,
                      pages: { ...defaultControls.pages, ...settings.contact_info?.controls?.pages },
                      sections: { ...defaultControls.sections, ...settings.contact_info?.controls?.sections },
                      maintenance_mode: e.target.checked,
                    },
                  },
                })
              }
            />
            Enable website maintenance mode
          </label>

          <div>
            <Label>Pages (activate/deactivate)</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(['home', 'about', 'services', 'projects', 'reviews', 'contact'] as const).map(pageKey => (
                <label key={pageKey} className="flex items-center gap-2 text-sm capitalize">
                  <input
                    type="checkbox"
                    checked={settings.contact_info?.controls?.pages?.[pageKey] ?? true}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        contact_info: {
                          ...settings.contact_info,
                          controls: {
                            ...defaultControls,
                            ...settings.contact_info?.controls,
                            pages: {
                              ...defaultControls.pages,
                              ...settings.contact_info?.controls?.pages,
                              [pageKey]: e.target.checked,
                            },
                            sections: { ...defaultControls.sections, ...settings.contact_info?.controls?.sections },
                          },
                        },
                      })
                    }
                  />
                  {pageKey}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Home Sections (activate/deactivate)</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(['hero', 'about', 'services', 'projects', 'reviews', 'contact'] as const).map(sectionKey => (
                <label key={sectionKey} className="flex items-center gap-2 text-sm capitalize">
                  <input
                    type="checkbox"
                    checked={settings.contact_info?.controls?.sections?.[sectionKey] ?? true}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        contact_info: {
                          ...settings.contact_info,
                          controls: {
                            ...defaultControls,
                            ...settings.contact_info?.controls,
                            pages: { ...defaultControls.pages, ...settings.contact_info?.controls?.pages },
                            sections: {
                              ...defaultControls.sections,
                              ...settings.contact_info?.controls?.sections,
                              [sectionKey]: e.target.checked,
                            },
                          },
                        },
                      })
                    }
                  />
                  {sectionKey}
                </label>
              ))}
            </div>
          </div>

          <Button onClick={save} className="w-full sm:w-auto">Save Visibility Controls</Button>
        </CardContent>
      </Card>

      {/* Gmail Integration */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {gmailConnected ? (
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-emerald-800">Gmail is connected</p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  Automatic thank-you emails and reply emails are enabled.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Gmail not connected</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Connect your Gmail account to send automatic thank-you emails when customers submit the contact form, and reply emails from the Messages inbox.
                </p>
              </div>
            </div>
          )}

          <div>
            <Label>Sender email address</Label>
            <Input
              type="email"
              value={gmailSenderEmail}
              onChange={e => setGmailSenderEmail(e.target.value)}
              placeholder="hello@pattern.lk"
            />
            <p className="mt-2 text-xs text-zinc-400">
              This Gmail address will appear as the &quot;From&quot; address. Must be the same account you connect below.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={saveGmailSender} variant="outline" className="sm:w-auto">
              Save sender email
            </Button>
            {gmailConnected ? (
              <Button onClick={disconnectGmail} variant="destructive" className="sm:w-auto">
                Disconnect Gmail
              </Button>
            ) : (
              <a
                href="/api/gmail/auth"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Connect Gmail Account
              </a>
            )}
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Clicking &quot;Connect Gmail Account&quot; will open Google&apos;s permission screen. Sign in with the Gmail account you want to send from, and grant the &quot;Send email on your behalf&quot; permission. You only need to do this once — the connection is stored securely.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
