// src/lib/seo.ts
import { Metadata } from 'next';

type SEOProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
};

const BASE_URL = 'https://txdocket.vercel.app'; // Replace with your custom domain later

export function generateSEO({ title, description, path = '', image = '/og-image.png' }: SEOProps): Metadata {
  const url = `${BASE_URL}${path}`;
  return {
    title,
    description: 'Turn any EVM wallet activity into clean, review-ready transaction schedules.',
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}