// src/app/sitemap.ts
import { MetadataRoute } from 'next';

const BASE_URL = 'https://txdocket.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    // Add other routes here as you expand, e.g., '/blog'
  ];
}