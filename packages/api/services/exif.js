const ExifReader = require('exifreader');
const fs = require('fs');

const AI_SOFTWARE_MARKERS = [
  'midjourney', 'stable diffusion', 'dall-e', 'dalle', 'comfyui',
  'automatic1111', 'invoke ai', 'leonardo', 'firefly', 'adobe firefly',
  'canva ai', 'flux', 'novelai', 'niji', 'bluewillow'
];

/**
 * Extraire les métadonnées EXIF d'une image
 */
async function extractExif(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    return extractExifFromBuffer(buffer);
  } catch (error) {
    console.error('Erreur EXIF:', error.message);
    return { success: false, data: null };
  }
}

/**
 * Extraire EXIF depuis un buffer
 */
async function extractExifFromBuffer(buffer) {
  try {
    const tags = ExifReader.load(buffer, { expanded: true });
    
    const exifData = {
      // Infos appareil
      make: tags.exif?.Make?.description || null,
      model: tags.exif?.Model?.description || null,
      
      // Logiciel
      software: tags.exif?.Software?.description || tags.xmp?.CreatorTool?.description || null,
      
      // Date
      dateTime: tags.exif?.DateTime?.description || tags.exif?.DateTimeOriginal?.description || null,
      
      // Dimensions
      width: tags.file?.['Image Width']?.value || tags.exif?.ImageWidth?.value || null,
      height: tags.file?.['Image Height']?.value || tags.exif?.ImageHeight?.value || null,
      
      // GPS (si présent)
      gps: tags.gps ? {
        latitude: tags.gps.Latitude,
        longitude: tags.gps.Longitude
      } : null,
      
      // Autres métadonnées utiles
      artist: tags.exif?.Artist?.description || null,
      copyright: tags.exif?.Copyright?.description || null,
      description: tags.exif?.ImageDescription?.description || null,
      
      // XMP (souvent utilisé par les IA)
      xmpCreator: tags.xmp?.creator?.description || null,
      xmpDescription: tags.xmp?.description?.description || null,
      
      // Données brutes pour analyse
      raw: {
        exif: tags.exif || {},
        xmp: tags.xmp || {},
        iptc: tags.iptc || {}
      }
    };
    
    // Vérifier les marqueurs IA
    const aiCheck = checkForAIMarkers(exifData);
    
    return {
      success: true,
      data: exifData,
      aiMarkers: aiCheck
    };
  } catch (error) {
    return { success: false, data: null, aiMarkers: { hasMarkers: false, markers: [] } };
  }
}

/**
 * Vérifier si les métadonnées contiennent des marqueurs IA
 */
function checkForAIMarkers(exifData) {
  const markers = [];
  const fieldsToCheck = [
    { key: 'software', value: exifData.software },
    { key: 'artist', value: exifData.artist },
    { key: 'description', value: exifData.description },
    { key: 'xmpCreator', value: exifData.xmpCreator },
    { key: 'xmpDescription', value: exifData.xmpDescription }
  ];
  
  for (const field of fieldsToCheck) {
    if (field.value && typeof field.value === 'string') {
      const lowerValue = field.value.toLowerCase();
      for (const marker of AI_SOFTWARE_MARKERS) {
        if (lowerValue.includes(marker)) {
          markers.push({
            field: field.key,
            value: field.value,
            marker: marker
          });
        }
      }
    }
  }
  
  // Vérifier aussi si AUCUNE métadonnée (suspect pour une vraie photo)
  const hasBasicExif = exifData.make || exifData.model || exifData.dateTime;
  const suspiciouslyEmpty = !hasBasicExif && !exifData.software;
  
  return {
    hasMarkers: markers.length > 0,
    markers,
    suspiciouslyEmpty,
    confidence: markers.length > 0 ? 'high' : (suspiciouslyEmpty ? 'low' : 'none')
  };
}

/**
 * Résumé lisible des métadonnées
 */
function summarizeExif(exifData) {
  if (!exifData) return null;
  
  const parts = [];
  
  if (exifData.make && exifData.model) {
    parts.push(`📷 ${exifData.make} ${exifData.model}`);
  }
  if (exifData.software) {
    parts.push(`💻 ${exifData.software}`);
  }
  if (exifData.dateTime) {
    parts.push(`📅 ${exifData.dateTime}`);
  }
  if (exifData.width && exifData.height) {
    parts.push(`📐 ${exifData.width}x${exifData.height}`);
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Aucune métadonnée';
}

module.exports = { extractExif, extractExifFromBuffer, checkForAIMarkers, summarizeExif };
