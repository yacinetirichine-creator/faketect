export const seoConfig = {
  home: {
    title: 'Détecteur d\'Images et Documents IA - FakeTect',
    description: 'Analysez gratuitement vos images et documents pour détecter s\'ils sont générés par IA. Technologie avancée avec analyse EXIF et détection deepfake.',
    keywords: 'détection IA, images IA, deepfake, analyse image, EXIF, détecteur deepfake, vérification authenticité',
  },
  
  analyze: {
    title: 'Analyser une Image',
    description: 'Uploadez une image pour l\'analyser et détecter si elle est générée par intelligence artificielle. Résultats instantanés et détaillés.',
    keywords: 'analyser image, détection IA image, vérifier image IA, analyse deepfake',
  },
  
  history: {
    title: 'Historique des Analyses',
    description: 'Consultez l\'historique de vos analyses d\'images et documents. Accédez à vos rapports précédents.',
    keywords: 'historique analyses, rapports détection IA, mes analyses',
    noIndex: true,
  },
  
  pricing: {
    title: 'Tarifs et Abonnements',
    description: 'Découvrez nos offres : gratuit, Pro et Enterprise. Analyses illimitées, rapports détaillés et support prioritaire.',
    keywords: 'tarifs faketect, abonnement détection IA, prix analyse image',
  },
  
  legal: {
    cgu: {
      title: 'Conditions Générales d\'Utilisation',
      description: 'Conditions générales d\'utilisation de FakeTect',
      noIndex: true,
    },
    privacy: {
      title: 'Politique de Confidentialité',
      description: 'Politique de confidentialité et protection des données FakeTect',
      noIndex: true,
    },
    cookies: {
      title: 'Politique des Cookies',
      description: 'Gestion des cookies sur FakeTect',
      noIndex: true,
    },
  },
  
  blog: {
    title: 'Blog - Actualités IA et Deepfakes',
    description: 'Découvrez les dernières actualités sur la détection d\'IA, les deepfakes et la sécurité numérique.',
    keywords: 'blog IA, actualités deepfake, détection images IA, sécurité numérique',
  },
};

// Configuration du sitemap
export const sitemapConfig = {
  hostname: 'https://faketect.com',
  routes: [
    { path: '/', priority: 1.0, changefreq: 'daily' },
    { path: '/analyze', priority: 0.9, changefreq: 'daily' },
    { path: '/pricing', priority: 0.8, changefreq: 'weekly' },
    { path: '/blog', priority: 0.7, changefreq: 'daily' },
    { path: '/about', priority: 0.6, changefreq: 'monthly' },
    { path: '/contact', priority: 0.6, changefreq: 'monthly' },
    { path: '/legal/cgu', priority: 0.3, changefreq: 'monthly' },
    { path: '/legal/privacy', priority: 0.3, changefreq: 'monthly' },
    { path: '/legal/cookies', priority: 0.3, changefreq: 'monthly' },
  ],
};

// Robots.txt configuration
export const robotsConfig = {
  policies: [
    {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/dashboard/'],
    },
  ],
  sitemap: 'https://faketect.com/sitemap.xml',
};
