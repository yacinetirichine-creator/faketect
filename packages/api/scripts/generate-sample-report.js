const path = require('path');
const pdfReport = require('../services/pdf-report');

async function main() {
  const purpose = process.env.PURPOSE || 'juridique_investigations';
  const batch = {
    id: null,
    name: 'Exemple FakeTect',
    source_type: 'image',
    original_filename: 'example.jpg',
    total_images: 1
  };

  const analyses = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      filename: 'example.jpg',
      source_type: 'image',
      combined_score: 0.82,
      confidence_level: 'medium',
      is_ai_generated: true,
      sightengine_score: 0.76,
      illuminarty_score: 0.88,
      illuminarty_model: 'stable-diffusion',
      exif_has_ai_markers: false,
      created_at: new Date().toISOString()
    }
  ];

  const certificate = {
    id: '00000000-0000-0000-0000-00000000cafe',
    generated_at: new Date().toISOString(),
    purpose,
    payload_hash: 'demo-payload-hash',
    pdf_hash: null,
    signature: 'demo-signature',
    alg: 'HS256',
    verify_url: 'http://localhost:3001/api/report/verify/00000000-0000-0000-0000-00000000cafe'
  };

  const out = await pdfReport.generateReportWithCertificate(batch, analyses, certificate);
  console.log('PDF generated:', out.filename);
  console.log('Path:', out.filePath);
  console.log('Size:', out.fileSize);
  console.log('Reports dir:', path.dirname(out.filePath));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
