/**
 * ⏱️ Retry Helper - Timeout + Retry automatique
 * Gère les API calls lentes avec retry intelligent
 */

/**
 * Exécuter une fonction avec timeout et retry
 */
async function withTimeoutAndRetry(
  fn,
  options = {}
) {
  const {
    timeout = 15000,      // Timeout par défaut: 15s
    maxRetries = 2,       // Max 2 tentatives
    backoff = 'exponential', // 'linear' ou 'exponential'
    onRetry = null,       // Callback on retry
    name = 'operation'    // Nom pour logs
  } = options;

  let lastError = null;
  let delay = 1000; // 1s initial delay

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await executeWithTimeout(fn, timeout);
    } catch (error) {
      lastError = error;
      
      // Dernier essai = throw
      if (attempt > maxRetries) {
        console.error(`❌ ${name} failed after ${maxRetries} retries:`, error.message);
        throw error;
      }

      // Calculer délai avant retry
      const nextDelay = backoff === 'exponential' 
        ? delay * Math.pow(2, attempt - 1)
        : delay * attempt;

      console.warn(`⚠️  ${name} attempt ${attempt} failed (${error.message}), retrying in ${nextDelay}ms...`);
      
      if (onRetry) {
        onRetry(attempt, error, nextDelay);
      }

      // Attendre avant retry
      await new Promise(resolve => setTimeout(resolve, nextDelay));
    }
  }

  throw lastError;
}

/**
 * Exécuter une fonction avec timeout
 */
function executeWithTimeout(fn, timeout) {
  return new Promise((resolve, reject) => {
    // Timer timeout
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${timeout}ms`));
    }, timeout);

    // Exécuter fonction
    Promise.resolve(fn()).then(
      result => {
        clearTimeout(timer);
        resolve(result);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Exécuter une fonction avec timeout simple (Promise.race)
 */
async function withTimeout(fn, timeout = 15000) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
    )
  ]);
}

/**
 * Exécuter plusieurs fonctions avec fallback
 * Si une échoue → essayer la suivante
 */
async function withFallback(functions, options = {}) {
  const { timeout = 15000, name = 'fallback' } = options;
  const errors = [];

  for (let i = 0; i < functions.length; i++) {
    try {
      console.log(`🔄 ${name}: trying provider ${i + 1}/${functions.length}`);
      return await executeWithTimeout(functions[i], timeout);
    } catch (error) {
      errors.push({ provider: i + 1, error: error.message });
      console.warn(`⚠️  Provider ${i + 1} failed: ${error.message}`);
    }
  }

  throw new Error(`All fallback providers failed: ${JSON.stringify(errors)}`);
}

module.exports = {
  withTimeoutAndRetry,
  withTimeout,
  executeWithTimeout,
  withFallback
};
