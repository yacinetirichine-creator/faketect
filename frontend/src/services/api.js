import axios from 'axios';

/**
 * FakeTect API Client
 *
 * Features:
 * - Automatic JWT token injection
 * - Retry logic with exponential backoff
 * - Request/response interceptors
 * - Standardized error handling
 */

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
};

/**
 * Calculate delay for exponential backoff
 * @param {number} retryCount - Current retry attempt
 * @returns {number} Delay in milliseconds
 */
const getRetryDelay = (retryCount) => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, retryCount);
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() - 0.5);
  return Math.min(delay + jitter, RETRY_CONFIG.maxDelay);
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if request should be retried
 * @param {Error} error - Axios error
 * @param {string} method - HTTP method
 * @returns {boolean}
 */
const shouldRetry = (error, method) => {
  // Don't retry if no response (network error) for non-idempotent methods
  if (!error.response && !RETRY_CONFIG.retryableMethods.includes(method.toUpperCase())) {
    return false;
  }

  // Retry network errors for idempotent methods
  if (!error.response && RETRY_CONFIG.retryableMethods.includes(method.toUpperCase())) {
    return true;
  }

  // Retry specific status codes
  return RETRY_CONFIG.retryableStatuses.includes(error.response?.status);
};

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60 seconds for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const auth = localStorage.getItem('faketect-auth');
    if (auth) {
      try {
        const { state } = JSON.parse(auth);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch {
        // Invalid JSON in storage, ignore
      }
    }

    // Add request timestamp for retry tracking
    config.metadata = { startTime: Date.now(), retryCount: 0 };

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors and retries
api.interceptors.response.use(
  (response) => {
    // Log slow requests in development
    if (import.meta.env.DEV && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      if (duration > 5000) {
        console.warn(`Slow API request: ${response.config.url} took ${duration}ms`);
      }
    }
    return response;
  },
  async (error) => {
    const config = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('faketect-auth');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Retry logic
    if (config && config.metadata) {
      const { retryCount } = config.metadata;

      if (retryCount < RETRY_CONFIG.maxRetries && shouldRetry(error, config.method)) {
        config.metadata.retryCount = retryCount + 1;
        const delay = getRetryDelay(retryCount);

        if (import.meta.env.DEV) {
          console.log(`Retrying request (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries}) after ${delay}ms`);
        }

        await sleep(delay);
        return api(config);
      }
    }

    // Enhance error with API error code if available
    if (error.response?.data?.error?.code) {
      error.apiCode = error.response.data.error.code;
      error.apiMessage = error.response.data.error.message;
    }

    return Promise.reject(error);
  }
);

// ============================================
// API Endpoints
// ============================================

export const analysisApi = {
  /**
   * Analyze a file (image or video)
   * @param {File} file - File to analyze
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise<AxiosResponse>}
   */
  analyzeFile: (file, onProgress) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/analysis/file', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 minutes for large files
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },

  /**
   * Get analysis history
   * @param {Object} params - Query parameters (page, limit, type, etc.)
   * @returns {Promise<AxiosResponse>}
   */
  getHistory: (params) => api.get('/analysis/history', { params }),

  /**
   * Get single analysis by ID
   * @param {string} id - Analysis ID
   * @returns {Promise<AxiosResponse>}
   */
  getById: (id) => api.get(`/analysis/${id}`),

  /**
   * Delete an analysis
   * @param {string} id - Analysis ID
   * @returns {Promise<AxiosResponse>}
   */
  delete: (id) => api.delete(`/analysis/${id}`),
};

export const userApi = {
  /**
   * Get user dashboard data
   * @returns {Promise<AxiosResponse>}
   */
  getDashboard: () => api.get('/user/dashboard'),

  /**
   * Update user profile
   * @param {Object} data - Profile data to update
   * @returns {Promise<AxiosResponse>}
   */
  updateProfile: (data) => api.put('/user/profile', data),

  /**
   * Delete user account
   * @returns {Promise<AxiosResponse>}
   */
  deleteAccount: () => api.delete('/user/account'),
};

export const adminApi = {
  /**
   * Get admin dashboard metrics
   * @returns {Promise<AxiosResponse>}
   */
  getMetrics: () => api.get('/admin/metrics'),

  /**
   * Get users list
   * @param {Object} params - Query parameters (page, limit, search)
   * @returns {Promise<AxiosResponse>}
   */
  getUsers: (params) => api.get('/admin/users', { params }),

  /**
   * Get analyses list
   * @param {Object} params - Query parameters
   * @returns {Promise<AxiosResponse>}
   */
  getAnalyses: (params) => api.get('/admin/analyses', { params }),

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} data - Data to update
   * @returns {Promise<AxiosResponse>}
   */
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<AxiosResponse>}
   */
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  /**
   * Get chat conversations
   * @param {Object} params - Query parameters (status, page)
   * @returns {Promise<AxiosResponse>}
   */
  getChatConversations: (params) => api.get('/admin/chat/conversations', { params }),

  /**
   * Send admin reply to chat
   * @param {string} conversationId - Conversation ID
   * @param {string} content - Message content
   * @returns {Promise<AxiosResponse>}
   */
  sendChatReply: (conversationId, content) =>
    api.post(`/admin/chat/conversations/${conversationId}/reply`, { content }),
};

export const plansApi = {
  /**
   * Get available plans
   * @returns {Promise<AxiosResponse>}
   */
  getPlans: () => api.get('/plans'),
};

export const stripeApi = {
  /**
   * Create Stripe checkout session
   * @param {string} planId - Plan ID
   * @param {string} billing - Billing period (monthly/yearly)
   * @param {string} locale - User locale
   * @returns {Promise<AxiosResponse>}
   */
  createCheckout: (planId, billing, locale) =>
    api.post('/stripe/create-checkout', { planId, billing, locale }),

  /**
   * Get Stripe customer portal URL
   * @returns {Promise<AxiosResponse>}
   */
  getCustomerPortal: () => api.post('/stripe/customer-portal'),
};

export const chatbotApi = {
  /**
   * Start a new chat conversation
   * @param {string} language - User language
   * @returns {Promise<AxiosResponse>}
   */
  startConversation: (language) => api.post('/chatbot/start', { language }),

  /**
   * Send a message to the chatbot
   * @param {string} conversationId - Conversation ID
   * @param {string} message - User message
   * @returns {Promise<AxiosResponse>}
   */
  sendMessage: (conversationId, message) =>
    api.post('/chatbot/message', { conversationId, message }),
};

export const newsletterApi = {
  /**
   * Subscribe to newsletter
   * @param {string} email - Email address
   * @param {string} language - User language
   * @returns {Promise<AxiosResponse>}
   */
  subscribe: (email, language) => api.post('/newsletter/subscribe', { email, language }),

  /**
   * Unsubscribe from newsletter
   * @param {string} email - Email address
   * @returns {Promise<AxiosResponse>}
   */
  unsubscribe: (email) => api.post('/newsletter/unsubscribe', { email }),
};

export default api;
