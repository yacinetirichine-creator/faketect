const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

/**
 * Service de génération de factures PDF
 * Conforme aux exigences légales françaises et européennes
 */

class InvoicePDFService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads/invoices');
    
    // Créer le dossier si nécessaire
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Générer une facture PDF
   */
  async generateInvoicePDF(invoiceId) {
    try {
      // Récupérer la facture complète
      const { data: invoice, error } = await supabase.client
        .from('invoices')
        .select(`
          *,
          invoice_items(*),
          user_profiles!invoices_profile_id_fkey(*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      if (!invoice) throw new Error('Facture non trouvée');

      // Créer le PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Facture ${invoice.invoice_number}`,
          Author: 'Faketect',
          Subject: `Facture ${invoice.invoice_type === 'invoice' ? '' : 'avoir '}${invoice.invoice_number}`,
          Keywords: 'facture, invoice, faketect',
          Creator: 'Faketect Billing System',
          Producer: 'Faketect'
        }
      });

      // Nom du fichier
      const filename = `invoice_${invoice.invoice_number}.pdf`;
      const filepath = path.join(this.uploadsDir, filename);

      // Créer le stream
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Générer le contenu
      await this.buildInvoicePDF(doc, invoice);

      // Finaliser
      doc.end();

      // Attendre que le stream soit terminé
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      // Mettre à jour la facture avec le chemin du PDF
      await supabase.client
        .from('invoices')
        .update({ pdf_path: filepath })
        .eq('id', invoiceId);

      console.log(`✅ PDF généré: ${filename}`);

      return {
        filename,
        filepath,
        url: `/api/invoices/${invoiceId}/pdf`
      };
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw error;
    }
  }

  /**
   * Construire le contenu du PDF
   */
  async buildInvoicePDF(doc, invoice) {
    const profile = invoice.user_profiles;
    
    // En-tête avec logo
    this.addHeader(doc, invoice);

    // Informations entreprise émettrice
    this.addCompanyInfo(doc);

    // Informations client
    this.addClientInfo(doc, invoice, profile);

    // Détails de la facture
    this.addInvoiceDetails(doc, invoice);

    // Tableau des lignes
    this.addItemsTable(doc, invoice);

    // Totaux
    this.addTotals(doc, invoice);

    // Conditions de paiement
    this.addPaymentTerms(doc, invoice);

    // Pied de page légal
    this.addLegalFooter(doc, invoice);

    // Numéro de page
    this.addPageNumbers(doc);
  }

  /**
   * En-tête du document
   */
  addHeader(doc, invoice) {
    const type = invoice.invoice_type === 'credit_note' ? 'AVOIR' : 'FACTURE';
    
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#2563eb')
       .text(type, 50, 50);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`N° ${invoice.invoice_number}`, 50, 85);

    // Ligne de séparation
    doc.strokeColor('#e5e7eb')
       .lineWidth(1)
       .moveTo(50, 110)
       .lineTo(545, 110)
       .stroke();
  }

  /**
   * Informations de l'entreprise émettrice
   */
  addCompanyInfo(doc) {
    const startY = 130;

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#111827')
       .text('ÉMETTEUR', 50, startY);

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#374151')
       .text('Faketect', 50, startY + 20);

    doc.font('Helvetica')
       .fillColor('#6b7280')
       .text('[ADRESSE COMPLÈTE]', 50, startY + 35)
       .text('[CODE POSTAL] [VILLE]', 50, startY + 48)
       .text('France', 50, startY + 61)
       .text('', 50, startY + 74)
       .text('SIRET: [SIRET]', 50, startY + 87)
       .text('TVA: [NUMÉRO TVA]', 50, startY + 100)
       .text('Email: contact@faketect.com', 50, startY + 113);
  }

  /**
   * Informations du client
   */
  addClientInfo(doc, invoice, profile) {
    const startY = 130;
    const startX = 320;

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#111827')
       .text('CLIENT', startX, startY);

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#374151')
       .text(invoice.client_name, startX, startY + 20);

    let y = startY + 35;

    if (invoice.client_address) {
      doc.font('Helvetica')
         .fillColor('#6b7280')
         .text(invoice.client_address, startX, y, { width: 200 });
      y += 26;
    }

    if (invoice.client_email) {
      doc.text(invoice.client_email, startX, y);
      y += 13;
    }

    // Informations entreprise si applicable
    if (invoice.client_type === 'business') {
      y += 5;
      if (invoice.client_siret) {
        doc.text(`SIRET: ${invoice.client_siret}`, startX, y);
        y += 13;
      }
      if (invoice.client_vat_number) {
        doc.text(`TVA: ${invoice.client_vat_number}`, startX, y);
        y += 13;
      }
    }
  }

  /**
   * Détails de la facture
   */
  addInvoiceDetails(doc, invoice) {
    const startY = 280;

    // Cadre gris pour les informations importantes
    doc.fillColor('#f3f4f6')
       .rect(50, startY, 495, 60)
       .fill();

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Date de facture:', 60, startY + 15);

    doc.font('Helvetica-Bold')
       .fillColor('#111827')
       .text(this.formatDate(invoice.invoice_date), 160, startY + 15);

    if (invoice.due_date) {
      doc.font('Helvetica')
         .fillColor('#6b7280')
         .text('Date d\'échéance:', 60, startY + 30);

      doc.font('Helvetica-Bold')
         .fillColor('#111827')
         .text(this.formatDate(invoice.due_date), 160, startY + 30);
    }

    // Statut
    doc.font('Helvetica')
       .fillColor('#6b7280')
       .text('Statut:', 320, startY + 15);

    const statusColors = {
      draft: '#9ca3af',
      sent: '#3b82f6',
      paid: '#10b981',
      overdue: '#ef4444',
      cancelled: '#6b7280'
    };

    const statusLabels = {
      draft: 'BROUILLON',
      sent: 'ENVOYÉE',
      paid: 'PAYÉE',
      overdue: 'EN RETARD',
      cancelled: 'ANNULÉE'
    };

    doc.font('Helvetica-Bold')
       .fillColor(statusColors[invoice.status] || '#6b7280')
       .text(statusLabels[invoice.status] || invoice.status.toUpperCase(), 370, startY + 15);

    if (invoice.payment_date) {
      doc.font('Helvetica')
         .fillColor('#6b7280')
         .text('Date de paiement:', 320, startY + 30);

      doc.font('Helvetica-Bold')
         .fillColor('#10b981')
         .text(this.formatDate(invoice.payment_date), 420, startY + 30);
    }
  }

  /**
   * Tableau des lignes de facturation
   */
  addItemsTable(doc, invoice) {
    const startY = 360;
    const tableTop = startY;
    let y = tableTop;

    // En-têtes du tableau
    doc.fillColor('#f9fafb')
       .rect(50, y, 495, 25)
       .fill();

    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor('#374151')
       .text('DESCRIPTION', 60, y + 8)
       .text('QTÉ', 340, y + 8)
       .text('P.U. HT', 390, y + 8)
       .text('MONTANT HT', 470, y + 8, { align: 'right', width: 65 });

    y += 25;

    // Lignes du tableau
    invoice.invoice_items.forEach((item, index) => {
      // Alterner les couleurs de fond
      if (index % 2 === 0) {
        doc.fillColor('#ffffff')
           .rect(50, y, 495, 30)
           .fill();
      }

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#111827')
         .text(item.description, 60, y + 8, { width: 270 });

      doc.text(item.quantity.toString(), 340, y + 8, { width: 40, align: 'center' });

      doc.text(this.formatCurrency(item.unit_price_cents), 390, y + 8, { width: 70, align: 'right' });

      doc.text(this.formatCurrency(item.subtotal_cents), 470, y + 8, { width: 65, align: 'right' });

      y += 30;

      // Nouvelle page si nécessaire
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    // Ligne de séparation
    doc.strokeColor('#e5e7eb')
       .lineWidth(1)
       .moveTo(50, y)
       .lineTo(545, y)
       .stroke();
  }

  /**
   * Totaux de la facture
   */
  addTotals(doc, invoice) {
    let y = doc.y + 20;

    // Si on est trop bas, nouvelle page
    if (y > 650) {
      doc.addPage();
      y = 50;
    }

    const labelX = 380;
    const valueX = 470;

    // Total HT
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Total HT:', labelX, y);

    doc.font('Helvetica-Bold')
       .fillColor('#111827')
       .text(this.formatCurrency(invoice.subtotal_cents || 0), valueX, y, { width: 75, align: 'right' });

    y += 20;

    // TVA
    doc.font('Helvetica')
       .fillColor('#6b7280')
       .text(`TVA (${invoice.tax_rate}%):`, labelX, y);

    doc.font('Helvetica-Bold')
       .fillColor('#111827')
       .text(this.formatCurrency(invoice.tax_cents || 0), valueX, y, { width: 75, align: 'right' });

    y += 30;

    // Cadre pour le total TTC
    doc.fillColor('#2563eb')
       .rect(370, y - 5, 175, 35)
       .fill();

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('TOTAL TTC:', labelX, y + 5);

    doc.fontSize(13)
       .text(this.formatCurrency(invoice.total_cents || 0), valueX, y + 5, { width: 75, align: 'right' });
  }

  /**
   * Conditions de paiement
   */
  addPaymentTerms(doc, invoice) {
    let y = doc.y + 40;

    if (y > 680) {
      doc.addPage();
      y = 50;
    }

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#111827')
       .text('CONDITIONS DE PAIEMENT', 50, y);

    y += 20;

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#6b7280');

    if (invoice.status === 'paid') {
      doc.fillColor('#10b981')
         .text('✓ Facture payée', 50, y);
      
      if (invoice.payment_method) {
        const methods = {
          card: 'Carte bancaire',
          stripe: 'Stripe',
          bank_transfer: 'Virement bancaire',
          check: 'Chèque',
          cash: 'Espèces'
        };
        doc.text(`Mode de paiement: ${methods[invoice.payment_method] || invoice.payment_method}`, 50, y + 13);
      }
    } else {
      doc.text('Paiement à réception de facture', 50, y);
      y += 13;
      doc.text('Acceptons: Carte bancaire, Virement bancaire', 50, y);
      y += 13;
      
      if (invoice.due_date) {
        doc.fillColor('#ef4444')
           .text(`Échéance: ${this.formatDate(invoice.due_date)}`, 50, y);
      }
    }

    if (invoice.notes) {
      y += 25;
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text('NOTES:', 50, y);
      
      y += 15;
      doc.font('Helvetica')
         .fillColor('#6b7280')
         .text(invoice.notes, 50, y, { width: 495 });
    }
  }

  /**
   * Pied de page légal
   */
  addLegalFooter(doc, invoice) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 80;

    // Ligne de séparation
    doc.strokeColor('#e5e7eb')
       .lineWidth(0.5)
       .moveTo(50, footerY)
       .lineTo(545, footerY)
       .stroke();

    doc.fontSize(7)
       .font('Helvetica')
       .fillColor('#9ca3af')
       .text(
         'Faketect - [ADRESSE] - SIRET: [SIRET] - TVA: [NUMÉRO TVA]',
         50,
         footerY + 10,
         { width: 495, align: 'center' }
       );

    doc.text(
      'En cas de retard de paiement, une pénalité égale à 3 fois le taux d\'intérêt légal sera appliquée, ainsi qu\'une indemnité forfaitaire de 40€ pour frais de recouvrement.',
      50,
      footerY + 22,
      { width: 495, align: 'center' }
    );

    // Mentions RGPD
    if (invoice.client_type === 'business') {
      doc.text(
        'Conformément au RGPD, vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données.',
        50,
        footerY + 40,
        { width: 495, align: 'center' }
      );
    }
  }

  /**
   * Numéros de page
   */
  addPageNumbers(doc) {
    const pages = doc.bufferedPageRange();
    
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#9ca3af')
         .text(
           `Page ${i + 1} / ${pages.count}`,
           50,
           doc.page.height - 50,
           { align: 'center', width: 495 }
         );
    }
  }

  /**
   * Formater une date
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formater un montant en centimes
   */
  formatCurrency(cents) {
    const euros = cents / 100;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(euros);
  }

  /**
   * Récupérer le PDF d'une facture
   */
  async getInvoicePDF(invoiceId) {
    const { data: invoice, error } = await supabase.client
      .from('invoices')
      .select('pdf_path, invoice_number')
      .eq('id', invoiceId)
      .single();

    if (error) throw error;

    if (!invoice.pdf_path || !fs.existsSync(invoice.pdf_path)) {
      // Générer le PDF s'il n'existe pas
      return await this.generateInvoicePDF(invoiceId);
    }

    return {
      filename: `invoice_${invoice.invoice_number}.pdf`,
      filepath: invoice.pdf_path
    };
  }

  /**
   * Supprimer un PDF de facture
   */
  async deleteInvoicePDF(invoiceId) {
    const { data: invoice } = await supabase.client
      .from('invoices')
      .select('pdf_path')
      .eq('id', invoiceId)
      .single();

    if (invoice?.pdf_path && fs.existsSync(invoice.pdf_path)) {
      fs.unlinkSync(invoice.pdf_path);
      
      await supabase.client
        .from('invoices')
        .update({ pdf_path: null })
        .eq('id', invoiceId);

      console.log(`✅ PDF supprimé pour facture ${invoiceId}`);
    }
  }

  /**
   * Régénérer un PDF de facture
   */
  async regenerateInvoicePDF(invoiceId) {
    // Supprimer l'ancien
    await this.deleteInvoicePDF(invoiceId);
    
    // Générer le nouveau
    return await this.generateInvoicePDF(invoiceId);
  }
}

// Instance singleton
const invoicePDFService = new InvoicePDFService();

module.exports = invoicePDFService;
