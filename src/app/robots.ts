import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/how-it-works',
          '/pricing',
          '/contact',
          '/legal/',
          '/cinema',
          '/login',
          '/register',
        ],
        disallow: [
          '/dashboard',
          '/studio',
          '/admin',
          '/settings',
          '/create',
          '/review',
          '/requests',
          '/dev',
          '/api/',
          '/add-memory',
          '/remote',
          '/director',
          '/interviewer',
        ],
      },
    ],
    sitemap: 'https://memoryweaver.studio/sitemap.xml',
  };
}
