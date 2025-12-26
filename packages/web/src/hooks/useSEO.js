import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const defaultMeta = {
  title: 'FakeTect - Détecteur d\'Images et Documents IA',
  description: 'Analysez vos images et documents pour détecter s\'ils sont générés par IA. Technologie avancée de détection avec analyse EXIF, métadonnées et intelligence artificielle.',
  keywords: 'détection IA, images IA, deepfake, analyse image, EXIF, détecteur deepfake, intelligence artificielle, analyse document',
  ogType: 'website',
  ogImage: 'https://faketect.com/og-image.jpg',
  twitterCard: 'summary_large_image',
  robots: 'index, follow',
  author: 'FakeTect',
  language: 'fr',
};

export const useSEO = ({
  title,
  description,
  keywords,
  ogType = 'website',
  ogImage,
  canonical,
  noIndex = false,
} = {}) => {
  const location = useLocation();

  useEffect(() => {
    // Titre
    document.title = title 
      ? `${title} | FakeTect` 
      : defaultMeta.title;

    // Meta description
    updateMetaTag('name', 'description', description || defaultMeta.description);

    // Meta keywords
    updateMetaTag('name', 'keywords', keywords || defaultMeta.keywords);

    // Meta robots
    updateMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : defaultMeta.robots);

    // Meta author
    updateMetaTag('name', 'author', defaultMeta.author);

    // Open Graph
    updateMetaTag('property', 'og:title', title || defaultMeta.title);
    updateMetaTag('property', 'og:description', description || defaultMeta.description);
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:url', canonical || window.location.href);
    updateMetaTag('property', 'og:image', ogImage || defaultMeta.ogImage);
    updateMetaTag('property', 'og:locale', 'fr_FR');
    updateMetaTag('property', 'og:site_name', 'FakeTect');

    // Twitter Card
    updateMetaTag('name', 'twitter:card', defaultMeta.twitterCard);
    updateMetaTag('name', 'twitter:title', title || defaultMeta.title);
    updateMetaTag('name', 'twitter:description', description || defaultMeta.description);
    updateMetaTag('name', 'twitter:image', ogImage || defaultMeta.ogImage);

    // Canonical
    updateCanonicalLink(canonical || `https://faketect.com${location.pathname}`);

    // Language
    document.documentElement.lang = defaultMeta.language;
  }, [title, description, keywords, ogType, ogImage, canonical, noIndex, location]);
};

function updateMetaTag(attribute, key, content) {
  if (!content) return;

  let element = document.querySelector(`meta[${attribute}="${key}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

function updateCanonicalLink(url) {
  let link = document.querySelector('link[rel="canonical"]');
  
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  
  link.setAttribute('href', url);
}

// Hook pour le JSON-LD (Schema.org)
export const useStructuredData = (data) => {
  useEffect(() => {
    const scriptId = 'structured-data';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(data);

    return () => {
      script?.remove();
    };
  }, [data]);
};

// Données structurées par défaut pour la page d'accueil
export const homePageStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'FakeTect',
  description: 'Détecteur d\'images et documents générés par IA',
  url: 'https://faketect.com',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'Web, Chrome Extension',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  featureList: [
    'Détection d\'images IA',
    'Analyse de documents',
    'Extraction de métadonnées EXIF',
    'Rapport détaillé',
    'Extension Chrome',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
  },
};
