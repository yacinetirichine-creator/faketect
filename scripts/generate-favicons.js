#!/usr/bin/env node

/**
 * Script de génération automatique des favicons et logos
 * Génère tous les formats requis depuis favicon.svg
 * 
 * Usage: node scripts/generate-favicons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  sourceSVG: path.join(__dirname, '../packages/web/public/favicon.svg'),
  outputDir: path.join(__dirname, '../packages/web/public'),
  extensionIconsDir: path.join(__dirname, '../packages/extension/icons'),
  
  // Tailles à générer
  sizes: [
    { name: 'favicon-16x16.png', size: 16, description: 'Favicon 16px' },
    { name: 'favicon-32x32.png', size: 32, description: 'Favicon 32px' },
    { name: 'apple-touch-icon.png', size: 180, description: 'Apple Touch Icon' },
    { name: 'android-chrome-192x192.png', size: 192, description: 'Android Chrome 192px' },
    { name: 'android-chrome-512x512.png', size: 512, description: 'Android Chrome 512px' },
  ],
  
  // Tailles pour l'extension
  extensionSizes: [
    { name: 'icon16.png', size: 16 },
    { name: 'icon48.png', size: 48 },
    { name: 'icon128.png', size: 128 },
    { name: 'icon512.png', size: 512 },
  ],
};

// Couleurs
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

// Logger avec couleurs
const log = {
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  warning: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
};

// Vérifier que le fichier source existe
function checkSourceExists() {
  if (!fs.existsSync(config.sourceSVG)) {
    log.error(`Fichier source introuvable: ${config.sourceSVG}`);
    log.warning('Veuillez créer favicon.svg dans packages/web/public/');
    process.exit(1);
  }
  log.success(`Source trouvée: ${path.basename(config.sourceSVG)}`);
}

// Créer les dossiers si nécessaire
function ensureDirectories() {
  [config.outputDir, config.extensionIconsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log.info(`Dossier créé: ${dir}`);
    }
  });
}

// Générer un PNG à partir du SVG
async function generatePNG(outputPath, size, description) {
  try {
    await sharp(config.sourceSVG)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);
    
    log.success(`${description || path.basename(outputPath)} (${size}x${size})`);
  } catch (error) {
    log.error(`Erreur lors de la génération de ${path.basename(outputPath)}: ${error.message}`);
  }
}

// Générer Open Graph image (avec fond)
async function generateOGImage() {
  const outputPath = path.join(config.outputDir, 'og-image.jpg');
  
  try {
    await sharp(config.sourceSVG)
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 10, g: 10, b: 15 }, // Couleur bg-dark-950
      })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(outputPath);
    
    log.success(`Open Graph image (1200x630)`);
  } catch (error) {
    log.error(`Erreur lors de la génération de og-image.jpg: ${error.message}`);
  }
}

// Générer favicon.ico multi-résolution
async function generateICO() {
  const icoPath = path.join(config.outputDir, 'favicon.ico');
  
  try {
    // Sharp ne supporte pas directement ICO multi-size
    // On génère juste un PNG 32x32 renommé en .ico comme fallback
    await sharp(config.sourceSVG)
      .resize(32, 32)
      .png()
      .toFile(icoPath);
    
    log.success(`favicon.ico (32x32)`);
    log.warning('Pour un vrai ICO multi-résolution, utilisez ImageMagick ou RealFaviconGenerator.net');
  } catch (error) {
    log.error(`Erreur lors de la génération de favicon.ico: ${error.message}`);
  }
}

// Générer tous les favicons
async function generateAllFavicons() {
  log.info('Génération des favicons web...');
  
  for (const { name, size, description } of config.sizes) {
    const outputPath = path.join(config.outputDir, name);
    await generatePNG(outputPath, size, description);
  }
  
  await generateICO();
  await generateOGImage();
}

// Générer les icônes d'extension
async function generateExtensionIcons() {
  log.info('Génération des icônes d\'extension...');
  
  for (const { name, size } of config.extensionSizes) {
    const outputPath = path.join(config.extensionIconsDir, name);
    await generatePNG(outputPath, size, `Extension ${size}x${size}`);
  }
}

// Afficher le résumé
function displaySummary() {
  console.log('\n' + '='.repeat(60));
  log.success('Génération terminée !');
  console.log('='.repeat(60));
  
  console.log('\n📦 Fichiers générés:');
  console.log(`  Web:       ${config.sizes.length} + ICO + OG image`);
  console.log(`  Extension: ${config.extensionSizes.length} icônes`);
  
  console.log('\n🔍 Vérifications recommandées:');
  console.log('  1. Ouvrir packages/web/public/ et vérifier les images');
  console.log('  2. Tester dans le navigateur (Shift+F5 pour forcer le refresh)');
  console.log('  3. Valider avec https://realfavicongenerator.net/favicon_checker');
  console.log('  4. Tester Open Graph avec https://www.opengraph.xyz/');
  
  console.log('\n📝 Prochaines étapes:');
  console.log('  - Commit les fichiers générés');
  console.log('  - Déployer sur Vercel/Render');
  console.log('  - Vider le cache du navigateur pour voir les changements');
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Fonction principale
async function main() {
  console.log('\n🎨 Générateur de Favicons FakeTect\n');
  
  // Vérifications
  checkSourceExists();
  ensureDirectories();
  
  // Génération
  await generateAllFavicons();
  await generateExtensionIcons();
  
  // Résumé
  displaySummary();
}

// Exécution
main().catch((error) => {
  log.error(`Erreur fatale: ${error.message}`);
  console.error(error);
  process.exit(1);
});
