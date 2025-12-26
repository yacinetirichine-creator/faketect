const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const JSZip = require('jszip');
let createCanvas = null;
try {
  ({ createCanvas } = require('canvas'));
} catch {
  // canvas is an optional dependency; PDF rasterization requires it.
  createCanvas = null;
}

const TEMP_DIR = path.join(__dirname, '..', 'uploads', 'temp');

const MAX_PDF_PAGES = Math.max(1, parseInt(process.env.MAX_PDF_PAGES || '20', 10) || 20);
const PDF_RENDER_SCALE = Math.max(1, parseFloat(process.env.PDF_RENDER_SCALE || '2') || 2);

// ✅ Protection Zip Bomb
const MAX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024; // 100 MB max décompressé
const MAX_COMPRESSION_RATIO = 100; // Ratio 100:1 max suspect

// ✅ Protection PDF Memory
const MAX_PAGE_DIMENSION = 4096; // 4K max par dimension
const MAX_PAGE_PIXELS = 16777216; // 4096 × 4096 max pixels
const MAX_PAGE_BUFFER = 10 * 1024 * 1024; // 10 MB max buffer par page

// Créer le dossier temp si nécessaire
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Extraire les images d'un document
 */
async function extractImages(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    switch (ext) {
      case '.pdf':
        return await extractFromPDF(filePath);
      case '.docx':
        return await extractFromDOCX(filePath);
      case '.pptx':
        return await extractFromPPTX(filePath);
      case '.xlsx':
        return await extractFromXLSX(filePath);
      default:
        return { success: false, error: 'Format non supporté', images: [] };
    }
  } catch (error) {
    console.error('Erreur extraction:', error.message);
    return { success: false, error: error.message, images: [] };
  }
}

/**
 * Extraire les images d'un PDF
 */
async function extractFromPDF(filePath) {
  const images = [];

  if (!createCanvas) {
    return {
      success: false,
      error: 'Dépendance manquante: canvas. Le rendu PDF en images nécessite node-canvas (canvas).',
      images: []
    };
  }

  try {
    const dataBuffer = fs.readFileSync(filePath);

    // Render pages to images (robust & cross-platform).
    // This doesn't "extract embedded images"; it rasterizes each page.
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer, disableWorker: true });
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages || 0;
    console.log(`📄 PDF: ${totalPages} pages détectées`);

    const pagesToRender = Math.min(totalPages, MAX_PDF_PAGES);
    if (totalPages > pagesToRender) {
      console.log(`⚠️ PDF trop long: rendu limité à ${pagesToRender} pages (MAX_PDF_PAGES=${MAX_PDF_PAGES})`);
    }

    for (let pageIndex = 1; pageIndex <= pagesToRender; pageIndex++) {
      const page = await pdf.getPage(pageIndex);
      const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });

      // ✅ Vérifier dimensions page (protection memory exhaustion)
      const width = Math.ceil(viewport.width);
      const height = Math.ceil(viewport.height);
      
      if (width > MAX_PAGE_DIMENSION || height > MAX_PAGE_DIMENSION) {
        console.warn(`⚠️ Page ${pageIndex} trop grande: ${width}×${height}px, skip`);
        continue;
      }
      
      const pixels = width * height;
      if (pixels > MAX_PAGE_PIXELS) {
        console.warn(`⚠️ Page ${pageIndex} trop de pixels: ${pixels.toLocaleString()}, skip`);
        continue;
      }

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;

      const pngBuffer = canvas.toBuffer('image/png');
      
      // ✅ Vérifier taille buffer
      if (pngBuffer.length > MAX_PAGE_BUFFER) {
        console.warn(`⚠️ Page ${pageIndex} buffer trop gros: ${(pngBuffer.length / 1024 / 1024).toFixed(2)} MB, skip`);
        continue;
      }
      
      const tempPath = path.join(TEMP_DIR, `${uuidv4()}_page_${pageIndex}.png`);
      fs.writeFileSync(tempPath, pngBuffer);

      images.push({
        id: uuidv4(),
        page: pageIndex,
        name: `page_${pageIndex}.png`,
        tempPath,
        size: pngBuffer.length,
        extracted: true
      });
    }

    return {
      success: true,
      documentType: 'pdf',
      pageCount: totalPages,
      imageCount: images.length,
      images,
      note: images.length > 0 ? 'Pages PDF rendues en images pour analyse.' : 'PDF vide ou rendu impossible.'
    };
  } catch (error) {
    console.error('Erreur PDF:', error.message);
    return { success: false, error: error.message, images: [] };
  }
}

/**
 * Extraire les images d'un fichier DOCX (Word)
 */
async function extractFromDOCX(filePath) {
  const images = [];
  
  try {
    const stats = fs.statSync(filePath);
    const compressedSize = stats.size;
    
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);
    
    // Les images sont dans word/media/
    const mediaFolder = zip.folder('word/media');
    if (!mediaFolder) {
      return { success: true, documentType: 'docx', imageCount: 0, images: [], note: 'Aucune image' };
    }
    
    const imageFiles = [];
    let totalUncompressedSize = 0;
    
    mediaFolder.forEach((relativePath, file) => {
      if (!file.dir && /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(relativePath)) {
        imageFiles.push({ path: relativePath, file });
      }
    });
    
    for (const imgFile of imageFiles) {
      // ✅ Vérifier taille avant décompression (protection Zip Bomb)
      const fileData = imgFile.file._data;
      const uncompressedSize = fileData.uncompressedSize || 0;
      
      totalUncompressedSize += uncompressedSize;
      
      if (totalUncompressedSize > MAX_UNCOMPRESSED_SIZE) {
        throw new Error(`Document trop volumineux: ${(totalUncompressedSize / 1024 / 1024).toFixed(2)} MB décompressé (max ${MAX_UNCOMPRESSED_SIZE / 1024 / 1024} MB)`);
      }
      
      // ✅ Vérifier ratio compression suspect
      const ratio = compressedSize > 0 ? uncompressedSize / compressedSize : 0;
      if (ratio > MAX_COMPRESSION_RATIO) {
        throw new Error(`Ratio compression suspect: ${ratio.toFixed(1)}:1 (max ${MAX_COMPRESSION_RATIO}:1) - possible Zip Bomb`);
      }
      
      const buffer = await imgFile.file.async('nodebuffer');
      const tempPath = path.join(TEMP_DIR, `${uuidv4()}_${imgFile.path.replace(/\//g, '_')}`);
      fs.writeFileSync(tempPath, buffer);
      
      images.push({
        id: uuidv4(),
        name: imgFile.path,
        tempPath,
        buffer,
        size: buffer.length,
        extracted: true
      });
    }
    
    return {
      success: true,
      documentType: 'docx',
      imageCount: images.length,
      images
    };
    
  } catch (error) {
    console.error('Erreur DOCX:', error.message);
    return { success: false, error: error.message, images: [] };
  }
}

/**
 * Extraire les images d'un fichier PPTX (PowerPoint)
 */
async function extractFromPPTX(filePath) {
  const images = [];
  
  try {
    const stats = fs.statSync(filePath);
    const compressedSize = stats.size;
    
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);
    
    // Les images sont dans ppt/media/
    const mediaFolder = zip.folder('ppt/media');
    if (!mediaFolder) {
      return { success: true, documentType: 'pptx', imageCount: 0, images: [] };
    }
    
    const imageFiles = [];
    let totalUncompressedSize = 0;
    
    mediaFolder.forEach((relativePath, file) => {
      if (!file.dir && /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(relativePath)) {
        imageFiles.push({ path: relativePath, file });
      }
    });
    
    for (const imgFile of imageFiles) {
      // ✅ Protection Zip Bomb
      const fileData = imgFile.file._data;
      const uncompressedSize = fileData.uncompressedSize || 0;
      totalUncompressedSize += uncompressedSize;
      
      if (totalUncompressedSize > MAX_UNCOMPRESSED_SIZE) {
        throw new Error(`PPTX trop volumineux: ${(totalUncompressedSize / 1024 / 1024).toFixed(2)} MB décompressé`);
      }
      
      const ratio = compressedSize > 0 ? uncompressedSize / compressedSize : 0;
      if (ratio > MAX_COMPRESSION_RATIO) {
        throw new Error(`Ratio compression suspect: ${ratio.toFixed(1)}:1 - possible Zip Bomb`);
      }
      
      const buffer = await imgFile.file.async('nodebuffer');
      const tempPath = path.join(TEMP_DIR, `${uuidv4()}_${imgFile.path.replace(/\//g, '_')}`);
      fs.writeFileSync(tempPath, buffer);
      
      images.push({
        id: uuidv4(),
        name: imgFile.path,
        tempPath,
        buffer,
        size: buffer.length,
        extracted: true
      });
    }
    
    return {
      success: true,
      documentType: 'pptx',
      imageCount: images.length,
      images
    };
    
  } catch (error) {
    console.error('Erreur PPTX:', error.message);
    return { success: false, error: error.message, images: [] };
  }
}

/**
 * Extraire les images d'un fichier XLSX (Excel)
 */
async function extractFromXLSX(filePath) {
  const images = [];
  
  try {
    const stats = fs.statSync(filePath);
    const compressedSize = stats.size;
    
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);
    
    // Les images sont dans xl/media/
    const mediaFolder = zip.folder('xl/media');
    if (!mediaFolder) {
      return { success: true, documentType: 'xlsx', imageCount: 0, images: [] };
    }
    
    const imageFiles = [];
    let totalUncompressedSize = 0;
    
    mediaFolder.forEach((relativePath, file) => {
      if (!file.dir && /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(relativePath)) {
        imageFiles.push({ path: relativePath, file });
      }
    });
    
    for (const imgFile of imageFiles) {
      // ✅ Protection Zip Bomb
      const fileData = imgFile.file._data;
      const uncompressedSize = fileData.uncompressedSize || 0;
      totalUncompressedSize += uncompressedSize;
      
      if (totalUncompressedSize > MAX_UNCOMPRESSED_SIZE) {
        throw new Error(`XLSX trop volumineux: ${(totalUncompressedSize / 1024 / 1024).toFixed(2)} MB décompressé`);
      }
      
      const ratio = compressedSize > 0 ? uncompressedSize / compressedSize : 0;
      if (ratio > MAX_COMPRESSION_RATIO) {
        throw new Error(`Ratio compression suspect: ${ratio.toFixed(1)}:1 - possible Zip Bomb`);
      }
      
      const buffer = await imgFile.file.async('nodebuffer');
      const tempPath = path.join(TEMP_DIR, `${uuidv4()}_${imgFile.path.replace(/\//g, '_')}`);
      fs.writeFileSync(tempPath, buffer);
      
      images.push({
        id: uuidv4(),
        name: imgFile.path,
        tempPath,
        buffer,
        size: buffer.length,
        extracted: true
      });
    }
    
    return {
      success: true,
      documentType: 'xlsx',
      imageCount: images.length,
      images
    };
    
  } catch (error) {
    console.error('Erreur XLSX:', error.message);
    return { success: false, error: error.message, images: [] };
  }
}

/**
 * Nettoyer les fichiers temporaires
 */
function cleanupTempFiles(images) {
  for (const img of images) {
    if (img.tempPath && fs.existsSync(img.tempPath)) {
      try {
        fs.unlinkSync(img.tempPath);
      } catch (e) {
        // Ignorer
      }
    }
  }
}

module.exports = { extractImages, cleanupTempFiles };
