const { supabase } = require('../packages/api/config/supabase');

require('../packages/api/middleware/auth');

console.log('OK auth.js loaded; supabaseConfigured=', !!supabase);
