    -- FakeTect - Configuration Supabase
    -- Fichier 2/4 : Fonctions et triggers

    -- ============================================
    -- Fonction: Mise à jour automatique du champ updatedAt
    -- ============================================
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- ============================================
    -- Trigger: Mise à jour automatique de User.updatedAt
    -- ============================================
    DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
    CREATE TRIGGER update_user_updated_at
        BEFORE UPDATE ON "User"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- ============================================
    -- Fonction: Décrémenter les crédits utilisateur
    -- ============================================
    CREATE OR REPLACE FUNCTION decrement_user_credits(
        user_id TEXT,
        amount INTEGER,
        transaction_description TEXT
    )
    RETURNS BOOLEAN AS $$
    DECLARE
        current_credits INTEGER;
    BEGIN
        -- Vérifier les crédits disponibles
        SELECT credits INTO current_credits
        FROM "User"
        WHERE id = user_id
        FOR UPDATE;

        IF current_credits IS NULL THEN
            RAISE EXCEPTION 'User not found';
        END IF;

        IF current_credits < amount THEN
            RETURN FALSE;
        END IF;

        -- Décrémenter les crédits
        UPDATE "User"
        SET credits = credits - amount
        WHERE id = user_id;

        -- Enregistrer la transaction
        INSERT INTO "CreditTransaction" (id, "userId", amount, type, description)
        VALUES (
            gen_random_uuid()::TEXT,
            user_id,
            -amount,
            'DEBIT',
            transaction_description
        );

        RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql;

    -- ============================================
    -- Fonction: Ajouter des crédits utilisateur
    -- ============================================
    CREATE OR REPLACE FUNCTION add_user_credits(
        user_id TEXT,
        amount INTEGER,
        transaction_description TEXT
    )
    RETURNS BOOLEAN AS $$
    BEGIN
        -- Ajouter les crédits
        UPDATE "User"
        SET credits = credits + amount
        WHERE id = user_id;

        -- Enregistrer la transaction
        INSERT INTO "CreditTransaction" (id, "userId", amount, type, description)
        VALUES (
            gen_random_uuid()::TEXT,
            user_id,
            amount,
            'CREDIT',
            transaction_description
        );

        RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql;

    -- ============================================
    -- Fonction: Vérifier l'expiration des abonnements
    -- ============================================
    CREATE OR REPLACE FUNCTION check_subscription_expiry()
    RETURNS void AS $$
    BEGIN
        UPDATE "User"
        SET 
            subscription = 'FREE',
            "subscriptionExpiry" = NULL
        WHERE 
            subscription != 'FREE'
            AND "subscriptionExpiry" IS NOT NULL
            AND "subscriptionExpiry" < CURRENT_TIMESTAMP;
    END;
    $$ LANGUAGE plpgsql;

    -- ============================================
    -- Fonction: Obtenir les statistiques utilisateur
    -- ============================================
    CREATE OR REPLACE FUNCTION get_user_stats(user_id TEXT)
    RETURNS TABLE(
        total_analyses BIGINT,
        image_analyses BIGINT,
        video_analyses BIGINT,
        text_analyses BIGINT,
        ai_detected BIGINT,
        real_detected BIGINT,
        credits_spent INTEGER,
        credits_added INTEGER
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT
            -- Total analyses
            COUNT(a.id)::BIGINT,
            -- Analyses par type
            COUNT(CASE WHEN a.type = 'IMAGE' THEN 1 END)::BIGINT,
            COUNT(CASE WHEN a.type = 'VIDEO' THEN 1 END)::BIGINT,
            COUNT(CASE WHEN a.type = 'TEXT' THEN 1 END)::BIGINT,
            -- Résultats
            COUNT(CASE WHEN a."isAiGenerated" = true THEN 1 END)::BIGINT,
            COUNT(CASE WHEN a."isAiGenerated" = false THEN 1 END)::BIGINT,
            -- Crédits
            COALESCE(SUM(CASE WHEN ct.type = 'DEBIT' THEN ABS(ct.amount) ELSE 0 END), 0)::INTEGER,
            COALESCE(SUM(CASE WHEN ct.type = 'CREDIT' THEN ct.amount ELSE 0 END), 0)::INTEGER
        FROM "User" u
        LEFT JOIN "Analysis" a ON a."userId" = u.id
        LEFT JOIN "CreditTransaction" ct ON ct."userId" = u.id
        WHERE u.id = user_id
        GROUP BY u.id;
    END;
    $$ LANGUAGE plpgsql;

    -- ============================================
    -- Fin du fichier 02_functions_triggers.sql
    -- ============================================
