const stripe = require('stripe');
const supabase = require('../config/supabase');

/**
 * Service de facturation pour entreprises et particuliers
 * Gestion Stripe + génération de factures PDF
 */

class BillingService {
  constructor() {
    // Initialiser Stripe (sera actif quand STRIPE_SECRET_KEY est défini)
    this.stripeClient = process.env.STRIPE_SECRET_KEY 
      ? stripe(process.env.STRIPE_SECRET_KEY)
      : null;
    
    this.isStripeEnabled = !!this.stripeClient;
    
    if (!this.isStripeEnabled) {
      console.warn('⚠️  Stripe non configuré - fonctionnalités de paiement désactivées');
    }
  }

  /**
   * Créer ou récupérer un profil utilisateur
   */
  async getOrCreateUserProfile(userId, profileData) {
    try {
      // Vérifier si le profil existe
      const { data: existingProfile } = await supabase.client
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingProfile) {
        return existingProfile;
      }

      // Créer le profil
      const { data: newProfile, error } = await supabase.client
        .from('user_profiles')
        .insert([{
          user_id: userId,
          account_type: profileData.account_type || 'individual',
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          company_name: profileData.company_name,
          company_legal_form: profileData.company_legal_form,
          siret: profileData.siret,
          vat_number: profileData.vat_number,
          company_address: profileData.company_address,
          company_postal_code: profileData.company_postal_code,
          company_city: profileData.company_city,
          phone: profileData.phone,
          country: profileData.country || 'FR'
        }])
        .select()
        .single();

      if (error) throw error;

      // Créer un customer Stripe si activé
      if (this.isStripeEnabled) {
        await this.createStripeCustomer(userId, newProfile);
      }

      return newProfile;
    } catch (error) {
      console.error('Erreur création profil:', error);
      throw error;
    }
  }

  /**
   * Créer un customer Stripe
   */
  async createStripeCustomer(userId, profile) {
    if (!this.isStripeEnabled) {
      console.log('Stripe désactivé - customer non créé');
      return null;
    }

    try {
      const customerData = {
        email: profile.email,
        metadata: {
          user_id: userId,
          profile_id: profile.id
        }
      };

      // Ajouter les informations selon le type de compte
      if (profile.account_type === 'business') {
        customerData.name = profile.company_name;
        customerData.description = `Entreprise: ${profile.company_name}`;
        if (profile.siret) {
          customerData.metadata.siret = profile.siret;
        }
        if (profile.vat_number) {
          customerData.tax_id_data = [{
            type: 'eu_vat',
            value: profile.vat_number
          }];
        }
      } else {
        customerData.name = `${profile.first_name} ${profile.last_name}`;
        customerData.description = 'Compte particulier';
      }

      // Ajouter l'adresse si disponible
      if (profile.company_address || profile.billing_address) {
        customerData.address = {
          line1: profile.company_address || profile.billing_address,
          city: profile.company_city || profile.billing_city,
          postal_code: profile.company_postal_code || profile.billing_postal_code,
          country: profile.company_country || profile.billing_country || 'FR'
        };
      }

      const customer = await this.stripeClient.customers.create(customerData);

      // Sauvegarder l'ID Stripe dans le profil
      await supabase.client
        .from('user_profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', profile.id);

      console.log(`✅ Customer Stripe créé: ${customer.id}`);
      return customer;
    } catch (error) {
      console.error('Erreur création customer Stripe:', error);
      throw error;
    }
  }

  /**
   * Générer un numéro de facture unique
   */
  async generateInvoiceNumber() {
    const { data, error } = await supabase.client
      .rpc('generate_invoice_number');

    if (error) {
      // Fallback si la fonction n'existe pas encore
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 99999);
      return `${year}${String(random).padStart(5, '0')}`;
    }

    return data;
  }

  /**
   * Créer une facture
   */
  async createInvoice(userId, invoiceData) {
    try {
      // Récupérer le profil
      const { data: profile } = await supabase.client
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        throw new Error('Profil utilisateur non trouvé');
      }

      // Générer le numéro de facture
      const invoiceNumber = await this.generateInvoiceNumber();

      // Préparer les données de facturation
      const clientName = profile.account_type === 'business'
        ? profile.company_name
        : `${profile.first_name} ${profile.last_name}`;

      const invoiceRecord = {
        user_id: userId,
        profile_id: profile.id,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: invoiceData.due_date,
        invoice_type: invoiceData.invoice_type || 'invoice',
        status: 'draft',
        client_type: profile.account_type,
        client_name: clientName,
        client_email: profile.billing_email || profile.email,
        client_address: profile.company_address || profile.billing_address,
        client_siret: profile.siret,
        client_vat_number: profile.vat_number,
        tax_rate: invoiceData.tax_rate || 20.00,
        currency: 'EUR',
        notes: invoiceData.notes
      };

      // Créer la facture
      const { data: invoice, error: invoiceError } = await supabase.client
        .from('invoices')
        .insert([invoiceRecord])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Ajouter les lignes de facturation
      if (invoiceData.items && invoiceData.items.length > 0) {
        const items = invoiceData.items.map((item, index) => {
          const subtotal = item.quantity * item.unit_price_cents;
          const tax = Math.round(subtotal * (invoiceData.tax_rate || 20) / 100);
          const total = subtotal + tax;

          return {
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
            subtotal_cents: subtotal,
            tax_rate: invoiceData.tax_rate || 20.00,
            tax_cents: tax,
            total_cents: total,
            product_type: item.product_type,
            product_id: item.product_id,
            sort_order: index
          };
        });

        const { error: itemsError } = await supabase.client
          .from('invoice_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      // Récupérer la facture complète avec les montants calculés
      const { data: completeInvoice } = await supabase.client
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', invoice.id)
        .single();

      console.log(`✅ Facture créée: ${invoiceNumber}`);
      return completeInvoice;
    } catch (error) {
      console.error('Erreur création facture:', error);
      throw error;
    }
  }

  /**
   * Créer une facture pour un abonnement
   */
  async createSubscriptionInvoice(userId, subscriptionData) {
    const items = [{
      description: `Abonnement ${subscriptionData.plan_name} - ${subscriptionData.billing_cycle === 'yearly' ? 'Annuel' : 'Mensuel'}`,
      quantity: 1,
      unit_price_cents: subscriptionData.amount_cents,
      product_type: 'subscription',
      product_id: subscriptionData.plan_id
    }];

    return this.createInvoice(userId, {
      items,
      invoice_type: 'invoice',
      notes: `Abonnement ${subscriptionData.plan_name}`,
      tax_rate: 20.00
    });
  }

  /**
   * Créer une facture pour achat de quotas
   */
  async createQuotaPackInvoice(userId, packData) {
    const items = [{
      description: `Pack de ${packData.analyses_count} analyses`,
      quantity: 1,
      unit_price_cents: packData.price_cents,
      product_type: 'quota_pack',
      product_id: packData.pack_id
    }];

    return this.createInvoice(userId, {
      items,
      invoice_type: 'invoice',
      notes: `Achat de ${packData.analyses_count} analyses`,
      tax_rate: 20.00
    });
  }

  /**
   * Marquer une facture comme payée
   */
  async markInvoiceAsPaid(invoiceId, paymentData) {
    const { data, error } = await supabase.client
      .from('invoices')
      .update({
        status: 'paid',
        payment_method: paymentData.payment_method,
        payment_date: new Date().toISOString(),
        stripe_payment_intent_id: paymentData.stripe_payment_intent_id,
        stripe_invoice_id: paymentData.stripe_invoice_id
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Facture ${data.invoice_number} marquée comme payée`);
    return data;
  }

  /**
   * Récupérer les factures d'un utilisateur
   */
  async getUserInvoices(userId, filters = {}) {
    let query = supabase.client
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('user_id', userId)
      .order('invoice_date', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.year) {
      query = query.gte('invoice_date', `${filters.year}-01-01`)
                   .lte('invoice_date', `${filters.year}-12-31`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  }

  /**
   * Créer une session de paiement Stripe
   */
  async createCheckoutSession(userId, sessionData) {
    if (!this.isStripeEnabled) {
      throw new Error('Stripe non configuré');
    }

    try {
      // Récupérer le profil avec customer ID
      const { data: profile } = await supabase.client
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        throw new Error('Profil non trouvé');
      }

      // Créer ou récupérer le customer Stripe
      let customerId = profile.stripe_customer_id;
      if (!customerId) {
        const customer = await this.createStripeCustomer(userId, profile);
        customerId = customer.id;
      }

      // Créer la session Checkout
      const session = await this.stripeClient.checkout.sessions.create({
        customer: customerId,
        mode: sessionData.mode || 'payment', // payment ou subscription
        line_items: sessionData.line_items,
        success_url: sessionData.success_url,
        cancel_url: sessionData.cancel_url,
        metadata: {
          user_id: userId,
          profile_id: profile.id,
          ...sessionData.metadata
        },
        automatic_tax: { enabled: true },
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: sessionData.description,
            metadata: {
              user_id: userId
            }
          }
        }
      });

      return session;
    } catch (error) {
      console.error('Erreur création session Checkout:', error);
      throw error;
    }
  }

  /**
   * Créer un portail client Stripe
   */
  async createCustomerPortalSession(userId, returnUrl) {
    if (!this.isStripeEnabled) {
      throw new Error('Stripe non configuré');
    }

    try {
      const { data: profile } = await supabase.client
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new Error('Customer Stripe non trouvé');
      }

      const session = await this.stripeClient.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: returnUrl
      });

      return session;
    } catch (error) {
      console.error('Erreur création portail client:', error);
      throw error;
    }
  }

  /**
   * Gérer les webhooks Stripe
   */
  async handleStripeWebhook(event) {
    if (!this.isStripeEnabled) {
      return { received: false, reason: 'Stripe non configuré' };
    }

    console.log(`📨 Webhook Stripe reçu: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionChange(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        default:
          console.log(`Webhook non géré: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Erreur traitement webhook:', error);
      throw error;
    }
  }

  /**
   * Gérer la complétion d'un checkout
   */
  async handleCheckoutCompleted(session) {
    const userId = session.metadata?.user_id;
    if (!userId) return;

    console.log(`✅ Checkout complété pour user ${userId}`);

    // Créer une transaction
    await supabase.client
      .from('transactions')
      .insert([{
        user_id: userId,
        transaction_type: session.mode === 'subscription' ? 'subscription' : 'quota_purchase',
        status: 'succeeded',
        amount_cents: session.amount_total,
        currency: session.currency,
        stripe_payment_intent_id: session.payment_intent,
        description: session.client_reference_id || 'Paiement via Checkout',
        metadata: { session_id: session.id }
      }]);
  }

  /**
   * Gérer une facture payée
   */
  async handleInvoicePaid(invoice) {
    console.log(`✅ Facture Stripe payée: ${invoice.id}`);

    // Trouver la facture locale correspondante
    const { data: localInvoice } = await supabase.client
      .from('invoices')
      .select('*')
      .eq('stripe_invoice_id', invoice.id)
      .single();

    if (localInvoice) {
      await this.markInvoiceAsPaid(localInvoice.id, {
        payment_method: 'stripe',
        stripe_payment_intent_id: invoice.payment_intent,
        stripe_invoice_id: invoice.id
      });
    }
  }

  /**
   * Gérer un paiement échoué
   */
  async handleInvoicePaymentFailed(invoice) {
    console.error(`❌ Paiement échoué pour facture: ${invoice.id}`);

    const { data: localInvoice } = await supabase.client
      .from('invoices')
      .select('*')
      .eq('stripe_invoice_id', invoice.id)
      .single();

    if (localInvoice) {
      await supabase.client
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('id', localInvoice.id);
    }
  }

  /**
   * Gérer le changement d'abonnement
   */
  async handleSubscriptionChange(subscription) {
    const customerId = subscription.customer;
    
    // Trouver le profil correspondant
    const { data: profile } = await supabase.client
      .from('user_profiles')
      .select('user_id, id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) return;

    // Mettre à jour ou créer l'abonnement
    const { data: existing } = await supabase.client
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    const subscriptionData = {
      user_id: profile.user_id,
      profile_id: profile.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      stripe_price_id: subscription.items.data[0]?.price.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      amount_cents: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.currency.toUpperCase()
    };

    if (existing) {
      await supabase.client
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existing.id);
    } else {
      await supabase.client
        .from('subscriptions')
        .insert([subscriptionData]);
    }

    console.log(`✅ Abonnement mis à jour: ${subscription.id}`);
  }

  /**
   * Gérer la suppression d'abonnement
   */
  async handleSubscriptionDeleted(subscription) {
    await supabase.client
      .from('subscriptions')
      .update({
        status: 'canceled',
        ended_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    console.log(`✅ Abonnement annulé: ${subscription.id}`);
  }

  /**
   * Gérer un paiement réussi
   */
  async handlePaymentSucceeded(paymentIntent) {
    const userId = paymentIntent.metadata?.user_id;
    if (!userId) return;

    await supabase.client
      .from('transactions')
      .insert([{
        user_id: userId,
        transaction_type: paymentIntent.metadata?.type || 'payment',
        status: 'succeeded',
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: paymentIntent.charges?.data[0]?.id,
        payment_method_type: paymentIntent.payment_method_types[0],
        description: paymentIntent.description || 'Paiement',
        metadata: paymentIntent.metadata
      }]);

    console.log(`✅ Transaction enregistrée: ${paymentIntent.id}`);
  }
}

// Instance singleton
const billingService = new BillingService();

module.exports = billingService;
