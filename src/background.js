// Background script for Upwork Cover Letter Generator
import debug from './utils/debug.js';

debug.log('Background script loaded');

// Configuration for freemium model
const DEFAULT_CONFIG = {
  // Your backend API endpoint - update this with your deployed backend URL
  // API_BASE_URL: 'http://16.170.241.226:5500', // Updated to match your backend
  API_BASE_URL: 'http://localhost:5500', // Updated to match your backend
  // Free tier limits
  FREE_PROPOSAL_LIMIT: 50,
  DEFAULT_MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 500,
  TEMPERATURE: 0.7
};

// Authentication state
let authState = {
  isAuthenticated: false,
  token: null,
  refreshToken: null,
  user: null
};

// API Key cache to avoid repeated decryption
let apiKeyCache = {
  key: null,
  timestamp: null,
  expiresIn: 5 * 60 * 1000 // 5 minutes cache
};

// Flag to prevent redundant data fetching
let isRefetchingData = false;

// Usage tracking - now fetched from server
let userUsage = {
  currentProposals: 0,
  maxProposals: 50,
  remaining: 50,
  percentage: 0,
  subscriptionStatus: 'free', // 'free', 'premium', 'expired'
  subscriptionExpiry: null,
  userId: null
};

// Initialize authentication and usage on startup
chrome.runtime.onStartup.addListener(async () => {
  await loadUserUsage();
  await loadAuthState();
  debug.log('User usage loaded on startup:', userUsage);
  debug.log('Auth state loaded on startup:', authState);
});

// Also load on extension startup
chrome.runtime.onInstalled.addListener(async (details) => {
  await loadUserUsage();
  await loadAuthState();
  debug.log('User usage loaded on install:', userUsage);
  debug.log('Auth state loaded on install:', authState);
  
  if (details.reason === 'install') {
    debug.log('Upwork Cover Letter Generator installed');
    
    // Set default settings
    chrome.storage.local.set({
      enabled: true,
      coverLetterTemplate: 'default',
      autoFill: true
    });
  }
});

// Load authentication state from storage
async function loadAuthState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken', 'refreshToken', 'user'], (result) => {
      if (result.authToken && result.refreshToken) {
        authState = {
          isAuthenticated: true,
          token: result.authToken,
          refreshToken: result.refreshToken,
          user: result.user
        };
        debug.log('✅ Auth state loaded from storage');
      } else {
        debug.log('❌ No auth state found in storage');
      }
      resolve();
    });
  });
}

// Save authentication state to storage
async function saveAuthState() {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      authToken: authState.token,
      refreshToken: authState.refreshToken,
      user: authState.user,
      userUsage: userUsage
    }, () => {
      debug.log('✅ Auth state and usage data saved to storage');
      resolve();
    });
  });
}

// Load user usage from storage
async function loadUserUsage() {
  // If user is authenticated, fetch from server
  if (authState.isAuthenticated) {
    const statsResult = await getProposalStats();
    if (statsResult.success) {
      debug.log('✅ User usage loaded from server:', userUsage);
      return;
    }
  }
  
  // Fallback to local storage if not authenticated or server fetch failed
  return new Promise((resolve) => {
    chrome.storage.local.get(['userUsage'], (result) => {
      if (result.userUsage) {
        userUsage = { ...userUsage, ...result.userUsage };
        debug.log('✅ User usage loaded from storage (fallback):', userUsage);
      }
      resolve();
    });
  });
}

// Save user usage to storage
async function saveUserUsage() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ userUsage }, () => {
      debug.log('✅ User usage saved to storage');
      resolve();
    });
  });
}

// API Key management - fetch and decrypt from server
async function getApiKey() {
  debug.log('🔑 Fetching API key from server...');
  
  if (!authState.isAuthenticated) {
    debug.log('❌ User not authenticated');
    return { success: false, error: 'User not authenticated' };
  }

  // Check cache first
  if (apiKeyCache.key && apiKeyCache.timestamp) {
    const now = Date.now();
    const cacheAge = now - apiKeyCache.timestamp;
    if (cacheAge < apiKeyCache.expiresIn) {
      debug.log('✅ Using cached API key');
      return { success: true, apiKey: apiKeyCache.key };
    } else {
      debug.log('⏰ API key cache expired, fetching new one');
    }
  }

  try {
    // First, get the API key from server
    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/api-keys`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json'
      }
    });

    debug.log('📡 API key response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      debug.log('❌ API key fetch failed:', errorData);
      return { success: false, error: errorData.message || 'Failed to fetch API key' };
    }

    const data = await response.json();
    debug.log('📦 API key response data:', data);
    
    if (data.success && data.data && data.data.length > 0) {
      const openaiKey = data.data.find(key => key.keyType === 'OPENAI' && key.isActive);
      if (openaiKey) {
        debug.log('🔐 OpenAI API key found, checking if encrypted...');
        
        // Check if the key looks encrypted (contains non-printable characters or is base64)
        const isEncrypted = isKeyEncrypted(openaiKey.key);
        
        if (isEncrypted) {
          debug.log('🔓 Key appears encrypted, attempting decryption...');
          
          // Try to decrypt the API key using the access token
          const decryptedKey = await decryptApiKey(openaiKey.key);
          if (decryptedKey.success) {
            debug.log('✅ OpenAI API key decrypted successfully:', decryptedKey.apiKey.substring(0, 10) + '...');
            
            // Cache the decrypted key
            apiKeyCache.key = decryptedKey.apiKey;
            apiKeyCache.timestamp = Date.now();
            
            return { success: true, apiKey: decryptedKey.apiKey };
          } else {
            debug.log('❌ API key decryption failed:', decryptedKey.error);
            return { success: false, error: decryptedKey.error };
          }
        } else {
          debug.log('✅ Key appears to be plain text, using directly');
          
          // Cache the plain text key
          apiKeyCache.key = openaiKey.key;
          apiKeyCache.timestamp = Date.now();
          
          return { success: true, apiKey: openaiKey.key };
        }
      } else {
        debug.log('❌ No active OpenAI key found');
        return { success: false, error: 'No active OpenAI API key found' };
      }
    } else {
      debug.log('❌ Invalid API key response structure');
      return { success: false, error: 'Invalid API key response' };
    }
  } catch (error) {
    console.error('❌ API key fetch error:', error);
    return { success: false, error: 'Failed to fetch API key: ' + error.message };
  }
}

// Helper function to detect if a key is encrypted
function isKeyEncrypted(key) {
  if (!key || typeof key !== 'string') return false;
  
  // Check if it's a valid OpenAI key format (starts with sk-)
  if (key.startsWith('sk-') && key.length > 20) {
    return false; // Looks like a plain OpenAI key
  }
  
  // Check if it's in the encrypted format (iv:encryptedData)
  if (key.includes(':')) {
    const parts = key.split(':');
    if (parts.length === 2) {
      const [ivBase64, encryptedData] = parts;
      // Check if both parts look like base64
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      if (base64Regex.test(ivBase64) && base64Regex.test(encryptedData)) {
        debug.log('🔐 Key appears to be in encrypted format (iv:data)');
        return true;
      }
    }
  }
  
  // Check if it contains non-printable characters or looks like base64
  const hasNonPrintable = /[^\x20-\x7E]/.test(key);
  const looksLikeBase64 = /^[A-Za-z0-9+/]+=*$/.test(key) && key.length > 20;
  
  return hasNonPrintable || looksLikeBase64;
}

// Derive encryption key from access token
function deriveKeyFromToken(token) {
  debug.log('🔑 Deriving encryption key from token...');
  
  // Use Web Crypto API to derive key from token
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  
  // Create a simple hash-based key derivation
  // In a real implementation, you might want to use PBKDF2 or similar
  const hashBuffer = crypto.subtle.digest('SHA-256', data);
  
  // Convert to 32-byte key for AES-256
  return hashBuffer.then(hash => {
    const keyArray = new Uint8Array(hash);
    return crypto.subtle.importKey(
      'raw',
      keyArray,
      { name: 'AES-CBC' },
      false,
      ['encrypt', 'decrypt']
    );
  });
}

// Decrypt API key using access token (client-side)
async function decryptApiKey(encryptedKey) {
  debug.log('🔓 Decrypting API key client-side...');
  
  try {
    if (!authState.token) {
      debug.log('❌ No access token available for decryption');
      return { success: false, error: 'No access token available' };
    }

    // Check if the encrypted key has the expected format (iv:encryptedData)
    if (!encryptedKey.includes(':')) {
      debug.log('❌ Invalid encrypted key format - missing IV separator');
      return { success: false, error: 'Invalid encrypted key format' };
    }

    const [ivBase64, encryptedData] = encryptedKey.split(':');
    
    if (!ivBase64 || !encryptedData) {
      debug.log('❌ Invalid encrypted key format - missing IV or data');
      return { success: false, error: 'Invalid encrypted key format' };
    }

    debug.log('🔑 Deriving key from access token...');
    
    // Derive key from access token
    const key = await deriveKeyFromToken(authState.token);
    
    debug.log('🔓 Decrypting with AES-256-CBC...');
    
    // Convert base64 IV to ArrayBuffer
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    
    // Convert base64 encrypted data to ArrayBuffer
    const encryptedBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Decrypt using Web Crypto API
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      encryptedBuffer
    );
    
    // Convert decrypted buffer to string
    const decrypted = new TextDecoder().decode(decryptedBuffer);
    
    debug.log('✅ API key decrypted successfully:', decrypted.substring(0, 10) + '...');
    return { success: true, apiKey: decrypted };
    
  } catch (error) {
    debug.log('❌ API key decryption error:', error);
    
    // Handle specific error cases
    if (error.name === 'OperationError') {
      return { success: false, error: 'Decryption failed - invalid key or data' };
    } else if (error.name === 'InvalidAccessError') {
      return { success: false, error: 'Invalid access token for decryption' };
    } else if (error.message.includes('Invalid character')) {
      return { success: false, error: 'Invalid base64 encoding in encrypted key' };
    } else {
      return { success: false, error: 'Failed to decrypt API key: ' + error.message };
    }
  }
}

// Proposals API functions
async function incrementProposal() {
  debug.log('📈 Incrementing proposal count...');
  
  if (!authState.isAuthenticated) {
    debug.log('❌ User not authenticated');
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/proposals/increment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json'
      }
    });

    debug.log('📡 Increment proposal response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      debug.log('❌ Increment proposal failed:', errorData);
      return { success: false, error: errorData.message || 'Failed to increment proposal count' };
    }

    const data = await response.json();
    debug.log('📦 Increment proposal response data:', data);
    
    if (data.success && data.data) {
      // Update local usage tracking
      userUsage.currentProposals = data.data.currentProposals;
      userUsage.maxProposals = data.data.maxProposals;
      userUsage.remaining = data.data.remaining;
      userUsage.percentage = Math.round((userUsage.currentProposals / userUsage.maxProposals) * 100);
      
      // Save to storage
      await saveUserUsage();
      
      debug.log('✅ Proposal count incremented successfully');
      return { success: true, usage: userUsage };
    } else {
      debug.log('❌ Invalid increment response structure');
      return { success: false, error: data.message || 'Invalid increment response' };
    }
  } catch (error) {
    debug.log('❌ Increment proposal error:', error);
    return { success: false, error: 'Failed to increment proposal count: ' + error.message };
  }
}

async function getProposalStats() {
  debug.log('📊 Fetching proposal statistics...');
  
  if (!authState.isAuthenticated) {
    debug.log('❌ User not authenticated');
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/proposals/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json'
      }
    });

    debug.log('📡 Proposal stats response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      debug.log('❌ Get proposal stats failed:', errorData);
      return { success: false, error: errorData.message || 'Failed to fetch proposal statistics' };
    }

    const data = await response.json();
    debug.log('📦 Proposal stats response data:', data);
    
    if (data.success && data.data && data.data.limits) {
      // Update local usage tracking
      userUsage.currentProposals = data.data.limits.current;
      userUsage.maxProposals = data.data.limits.max;
      userUsage.remaining = data.data.limits.remaining;
      userUsage.percentage = data.data.limits.percentage;
      
      // Save to storage
      await saveUserUsage();
      
      debug.log('✅ Proposal statistics fetched successfully');
      return { success: true, data: { limits: userUsage } };
    } else {
      debug.log('❌ Invalid proposal stats response structure');
      return { success: false, error: data.message || 'Invalid proposal stats response' };
    }
  } catch (error) {
    debug.log('❌ Get proposal stats error:', error);
    return { success: false, error: 'Failed to fetch proposal statistics: ' + error.message };
  }
}

// Authentication functions
async function register(userData) {
  debug.log('📝 Registering user:', userData?.email || 'unknown');
  
  // Validate userData
  if (!userData || typeof userData !== 'object') {
    debug.log('❌ Invalid userData provided');
    return { success: false, error: 'Invalid user data provided' };
  }
  
  if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
    debug.log('❌ Missing required fields in userData');
    return { success: false, error: 'Missing required fields: email, password, firstName, lastName' };
  }
  
  try {
    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    debug.log('📦 Registration response:', data);
    
    if (response.ok && data.success) {
      debug.log('✅ Registration successful');
      return { success: true, message: data.message };
    } else {
      debug.log('❌ Registration failed:', data.message);
      return { success: false, error: data.message || 'Registration failed' };
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    return { success: false, error: 'Registration failed: ' + error.message };
  }
}

async function login(credentials) {
  debug.log('🔐 Logging in user:', credentials?.email || 'unknown');
  
  // Validate credentials
  if (!credentials || typeof credentials !== 'object') {
    debug.log('❌ Invalid credentials provided');
    return { success: false, error: 'Invalid credentials provided' };
  }
  
  if (!credentials.email || !credentials.password) {
    debug.log('❌ Missing required fields in credentials');
    return { success: false, error: 'Missing required fields: email, password' };
  }
  
  try {
    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    debug.log('📦 Login response:', data);
    
    if (response.ok && data.success && data.data) {
      const { token, refreshToken, user } = data.data;
      
      // Validate response data
      if (!token || !user) {
        debug.log('❌ Invalid response data from server - missing token or user');
        return { success: false, error: 'Invalid response from server - missing token or user' };
      }
      
      // Handle case where refreshToken might not be provided
      const actualRefreshToken = refreshToken || token; // Use token as fallback if no refresh token
      
      // Update auth state (but don't set isAuthenticated yet)
      authState = {
        isAuthenticated: false, // Will be set to true after data is loaded
        token: token,
        refreshToken: actualRefreshToken,
        user: user
      };
      
      // Save to storage
      await saveAuthState();
      
      // Load all data first
      debug.log('📊 Loading user data before setting authenticated state...');
      
      try {
        // Load user profile
        const profileResult = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (profileResult.ok) {
          const profileData = await profileResult.json();
          if (profileData.success) {
            authState.user = profileData.data;
            
            // Extract proposal data from profile response
            const profile = profileData.data;
            if (profile.currentProposals !== undefined && profile.maxProposals !== undefined) {
              userUsage = {
                currentProposals: profile.currentProposals,
                maxProposals: profile.maxProposals,
                remaining: profile.maxProposals === -1 ? -1 : profile.maxProposals - profile.currentProposals,
                percentage: profile.maxProposals === -1 ? 0 : Math.round((profile.currentProposals / profile.maxProposals) * 100)
              };
              debug.log('✅ Proposal stats loaded from profile:', userUsage);
            }
            
            await saveAuthState();
            debug.log('✅ User profile loaded with proposal data');
          }
        }
        
        // Load API key
        const apiKeyResult = await getApiKey();
        if (apiKeyResult.success) {
          debug.log('✅ API key loaded');
        }
        
        // Now set authenticated state
        authState.isAuthenticated = true;
        await saveAuthState();
        
        debug.log('✅ Login successful with all data loaded');
        return { success: true, user: authState.user, usage: userUsage };
        
      } catch (error) {
        debug.error('❌ Error loading user data:', error);
        // Still set authenticated but with limited data
        authState.isAuthenticated = true;
        await saveAuthState();
        return { success: true, user: user, error: 'Login successful but some data failed to load' };
      }
    } else {
      debug.log('❌ Login failed:', data.message);
      return { success: false, error: data.message || 'Login failed' };
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return { success: false, error: 'Login failed: ' + error.message };
  }
}

async function logout() {
  debug.log('🚪 Logging out user');
  
  // Clear auth state
  authState = {
    isAuthenticated: false,
    token: null,
    refreshToken: null,
    user: null
  };
  
  // Clear API key cache
  apiKeyCache = {
    key: null,
    timestamp: null,
    expiresIn: 5 * 60 * 1000
  };
  
  // Clear all local storage
  await new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      debug.log('✅ All local storage cleared');
      resolve();
    });
  });
  
  // Reset user usage
  userUsage = {
    currentProposals: 0,
    maxProposals: 10,
    remaining: 10,
    percentage: 0
  };
  
  // Clear the refetching flag
  isRefetchingData = false;
  
  debug.log('✅ Logout successful - all data cleared');
  return { success: true };
}

// Function to handle auth state changes and refetch data
async function handleAuthStateChange() {
  debug.log('🔄 Handling auth state change...');
  
  // Prevent redundant calls
  if (isRefetchingData) {
    debug.log('⏳ Data refetch already in progress, skipping...');
    return;
  }
  
  if (authState.isAuthenticated) {
    debug.log('✅ User authenticated - refetching data from server');
    isRefetchingData = true;
    
    try {
      // Refetch user profile
      const profileResult = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (profileResult.ok) {
        const profileData = await profileResult.json();
        if (profileData.success) {
          authState.user = profileData.data;
          await saveAuthState();
          debug.log('✅ User profile refetched');
        }
      }
      
      // Refetch proposal stats
      const statsResult = await getProposalStats();
      if (statsResult.success) {
        debug.log('✅ Proposal stats refetched:', userUsage);
      }
      
      // Refetch API key
      const apiKeyResult = await getApiKey();
      if (apiKeyResult.success) {
        debug.log('✅ API key refetched');
      }
      
    } catch (error) {
      debug.error('❌ Error refetching data:', error);
    } finally {
      isRefetchingData = false;
    }
  } else {
    debug.log('❌ User not authenticated - clearing all data');
    
    // Clear all local storage
    await new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        debug.log('✅ All local storage cleared');
        resolve();
      });
    });
    
    // Reset user usage
    userUsage = {
      currentProposals: 0,
      maxProposals: 10,
      remaining: 10,
      percentage: 0
    };
    
    // Clear API key cache
    apiKeyCache = {
      key: null,
      timestamp: null,
      expiresIn: 5 * 60 * 1000
    };
  }
}

async function refreshToken() {
  debug.log('🔄 Refreshing token...');
  
  if (!authState.refreshToken) {
    debug.log('❌ No refresh token available');
    return { success: false, error: 'No refresh token available' };
  }

  try {
    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: authState.refreshToken })
    });

    const data = await response.json();
    debug.log('📦 Token refresh response:', data);
    
    if (response.ok && data.success && data.data) {
      const { token, refreshToken } = data.data;
      
      // Validate response data
      if (!token || !refreshToken) {
        debug.log('❌ Invalid refresh token response data');
        return { success: false, error: 'Invalid refresh token response' };
      }
      
      // Update auth state
      authState.token = token;
      authState.refreshToken = refreshToken;
      
      // Save to storage
      await saveAuthState();
      
      debug.log('✅ Token refreshed successfully');
      return { success: true };
    } else {
      debug.log('❌ Token refresh failed:', data.message);
      return { success: false, error: data.message || 'Token refresh failed' };
    }
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return { success: false, error: 'Token refresh failed: ' + error.message };
  }
}

async function verifyToken() {
  debug.log('🔍 Verifying token...');
  
  if (!authState.isAuthenticated || !authState.token) {
    debug.log('❌ No token to verify');
    return { success: false, error: 'No token available' };
  }

  try {
    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      debug.log('✅ Token is valid');
      return { success: true };
    } else if (response.status === 401) {
      debug.log('❌ Token expired, attempting refresh...');
      const refreshResult = await refreshToken();
      if (refreshResult.success) {
        debug.log('✅ Token refreshed, retrying verification...');
        return await verifyToken();
      } else {
        debug.log('❌ Token refresh failed');
        return { success: false, error: 'Token expired and refresh failed' };
      }
    } else {
      debug.log('❌ Token verification failed:', response.status);
      return { success: false, error: 'Token verification failed' };
    }
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return { success: false, error: 'Token verification failed: ' + error.message };
  }
}

// Usage tracking functions
async function checkUsageLimits() {
  debug.log('📊 Checking usage limits...');
  
  if (!authState.isAuthenticated || !authState.token) {
    debug.log('❌ User not authenticated, cannot check usage limits');
    return false;
  }

  try {
    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/proposals/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      debug.log('📦 Usage data:', data.data.limits);
      
      if (data.success && data.data) {
        userUsage = { ...userUsage, ...data.data.limits };
        await saveUserUsage();
        
        const limit = userUsage.max || DEFAULT_CONFIG.FREE_PROPOSAL_LIMIT;
        const canGenerate = userUsage.current < limit || userUsage.subscriptionStatus === 'premium';
        debug.log(`📊 Usage check: ${userUsage.current}/${limit} proposals used, can generate: ${canGenerate}`);
        return canGenerate;
      }
    }
    
    debug.log('❌ Failed to fetch usage data, using local limits');
    return userUsage.proposalsUsed < DEFAULT_CONFIG.FREE_PROPOSAL_LIMIT;
  } catch (error) {
    console.error('❌ Usage check error:', error);
    return userUsage.proposalsUsed < DEFAULT_CONFIG.FREE_PROPOSAL_LIMIT;
  }
}

async function trackUsage() {
  debug.log('📈 Tracking usage...');
  
  if (!authState.isAuthenticated || !authState.token) {
    debug.log('❌ User not authenticated, cannot track usage');
    return;
  }

  try {
    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/usage/track`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: 'proposal' })
    });

    if (response.ok) {
      const data = await response.json();
      debug.log('📦 Usage tracking response:', data);
      
      if (data.success && data.data) {
        userUsage = { ...userUsage, ...data.data };
        await saveUserUsage();
        debug.log('✅ Usage tracked successfully');
      } else {
        debug.log('❌ Invalid usage tracking response, updating locally');
        userUsage.proposalsUsed++;
        await saveUserUsage();
      }
    } else {
      debug.log('❌ Failed to track usage on server, updating locally');
      userUsage.proposalsUsed++;
      await saveUserUsage();
    }
  } catch (error) {
    console.error('❌ Usage tracking error:', error);
    userUsage.proposalsUsed++;
    await saveUserUsage();
  }
}

// AI Proposal Prompts Templates
const AI_PROMPTS_TEMPLATES = {
  universal: {
    metaPrompt: `Generate an Upwork proposal. Follow ALL rules:
- Start with: "I have 8+ years of experience—[mirror client need in plain English]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools (swap per job: GSC, GA4, Screaming Frog, Git, Docker, Figma, etc.).
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.
- Prefer verbs and outcomes over adjectives. Use industry terminology.`,
    template: `I have 8+ years of experience—you need [plain-English restatement].  
Step 1: [audit/plan/prototype] → deliver [artifact] in [X days].  
Step 2: [implement/test/iterate] → ship with docs and handoff.  
KPIs: [metric 1], [metric 2], [metric 3] by [date].  
Tools: [role-specific tools].  
Tiny plan: [one sentence on sequence/milestones]. Next step: I'm available [times, TZ].  
Question: [one precise clarifying question]?`
  },
  software: {
    metaPrompt: `Generate an Upwork proposal for software development. Follow ALL rules:
- Start with: "I have 8+ years of experience—you need [feature/app/integration] that [does X]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools: Git, GitHub Actions, Docker, AWS/GCP, Postman, Jira.
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.`,
    template: `I have 8+ years of experience—you need [feature/app/integration] that [does X].  
Step 1: Define scope, API/DB schema, and tests.  
Step 2: Build, CI/CD, staging review, handoff.  
KPIs: lead time <[X] days, error rate <[Y]%, perf +[Z]%.  
Tools: Git, GitHub Actions, Docker, AWS/GCP, Postman.  
Tiny plan: weekly demo, PR reviews. I can start [date/TZ].  
Question: Any non-functional constraints I must meet first?`
  },
  marketing: {
    metaPrompt: `Generate an Upwork proposal for marketing/SEO. Follow ALL rules:
- Start with: "I have 8+ years of experience—you need growth in [traffic/conversions] from [channels/pages]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools: GSC, GA4, Screaming Frog, Ahrefs/Semrush, Looker Studio.
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.`,
    template: `I have 8+ years of experience—you need growth in [traffic/conversions] from [channels/pages].  
Step 1: Audit current state, identify gaps, create strategy.  
Step 2: Implement, monitor, optimize, report.  
KPIs: traffic +[X]%, conversions +[Y]%, ROI [Z]% by [date].  
Tools: GSC, GA4, Screaming Frog, Ahrefs/Semrush, Looker Studio.  
Tiny plan: weekly reports, monthly reviews. I can start [date/TZ].  
Question: What's your current conversion rate and main traffic source?`
  }
};

// Function to generate custom prompt based on user settings
// Helper function to generate proper name format (firstName + first letter of lastName)
function generateProperName(firstName, lastName) {
  if (!firstName) return 'Your Name';
  if (!lastName) return firstName;
  
  const firstLetter = lastName.charAt(0).toUpperCase();
  return `${firstName} ${firstLetter}.`;
}

function generateCustomPrompt(jobTitle, jobDescription, settings) {
  const customText = settings.customPrompt ? settings.customPrompt.trim() : '';
  let customPrompt = customText || getDefaultPrompt();
  
  // Generate proper name format
  const properName = generateProperName(settings.firstName, settings.lastName) || settings.yourName || 'Your Name';
  customPrompt = customPrompt.replace(/\[Your Name\]/g, properName);
  
  return customPrompt;
}

function getDefaultPrompt() {
  return AI_PROMPTS_TEMPLATES.universal.template;
}

// Apply signature to proposal
function applySignature(text, name) {
  try {
    const signatureName = name || 'Your Name';
    const nameGroup = signatureName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let out = text || '';
    const rx = new RegExp(`\\b(Thanks|Thank you),\\s*${nameGroup}`, 'gi');
    out = out.replace(rx, (_m, thanks) => `${thanks},\n${signatureName}`);
    return out;
  } catch (e) {
    return text;
  }
}

// Generate AI proposal with settings
async function generateAIProposalWithSettings(jobTitle, jobDescription, settings) {
  debug.log('📝 Generating proposal with settings...');
  debug.log('📋 Job title:', jobTitle);
  debug.log('📄 Job description length:', jobDescription ? jobDescription.length : 0);
  debug.log('⚙️ Settings:', {
    model: settings.model,
    temperature: settings.temperature,
    yourName: settings.yourName,
    proposalMode: settings.proposalMode
  });
  
  try {
        // Check proposal mode
        const isAIMode = (settings.proposalMode || 'ai') === 'ai';
        
        if (!isAIMode) {
          // Custom mode - use custom prompt directly, no AI call, no increment
          debug.log('📝 Using custom mode - no AI call needed, no proposal increment');
          const customPrompt = generateCustomPrompt(jobTitle, jobDescription, settings);
          return { success: true, coverLetter: customPrompt, shouldIncrement: false };
        }
    
    // AI mode - use templates
    debug.log('🤖 Using AI mode with templates');
    const template = AI_PROMPTS_TEMPLATES[settings.promptTemplate] || AI_PROMPTS_TEMPLATES.universal;
    
    // Check for template-specific meta prompt override
    const storageKey = `metaPromptOverride_${settings.promptTemplate}`;
    const overrideResult = await chrome.storage.local.get([storageKey]);
    const metaPromptOverride = overrideResult[storageKey];
    
    const metaPrompt = metaPromptOverride || template.metaPrompt;
    const baseTemplate = template.template;
    
    const userMessage = `JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}

Generate a proposal using this template:
${baseTemplate}

Replace placeholders with specific details from the job. Keep it under 8 lines.`;

    debug.log('📝 Generated prompt length:', userMessage.length);
    
    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: 'system', content: metaPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens || DEFAULT_CONFIG.MAX_TOKENS
      })
    });
    
    debug.log('📡 OpenAI response status:', response.status);
    const data = await response.json();
    debug.log('📦 OpenAI response data:', data);
    
    if (response.ok && data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content;
      debug.log('✅ AI proposal generated successfully');
      
      // Apply signature with proper name format
      const properName = generateProperName(settings.firstName, settings.lastName) || settings.yourName || 'Your Name';
      const finalProposal = applySignature(content, properName);
      
      return { success: true, coverLetter: finalProposal };
    } else {
      debug.log('❌ No AI proposal generated');
      return { success: false, error: 'No AI proposal generated' };
    }
  } catch (error) {
    console.error('❌ AI proposal generation error:', error);
    return { success: false, error: 'AI proposal generation failed' };
  }
}

// Generate question answers with settings
async function generateQuestionAnswersWithSettings(questions, jobTitle, jobDescription, settings) {
  debug.log('❓ Generating question answers with settings...');
  debug.log('📋 Job title:', jobTitle);
  debug.log('📄 Job description length:', jobDescription ? jobDescription.length : 0);
  debug.log('❓ Questions count:', questions ? questions.length : 0);
  debug.log('⚙️ Settings:', {
    model: settings.model,
    temperature: settings.temperature,
    yourName: settings.yourName
  });
  
  try {
    // Create a prompt for all questions
    const questionsText = questions.map((q, index) => `${index + 1}. ${q.label} (${q.type === 'textarea' ? 'Long answer' : 'Short answer'})`).join('\n');
    
    const systemMessage = `You are an expert Upwork freelancer. Answer each question concisely (2–4 sentences when multiple examples are requested; otherwise 1–3), direct and specific to the job. Do not ask any questions back. No greetings, no bullets, no numbered lists, no fluff.`;
    
    const userMessage = `Provide short, direct answers to these Upwork application questions.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}

QUESTIONS:
${questionsText}

STRICT RULES:
- Keep each answer brief: 1–3 sentences; if the prompt asks for multiple items/examples, write 2–4 sentences that cover them succinctly (no bullets).
- Be specific to the job; include concrete tech/tools if relevant.
- Do not ask any questions back.
- No bullets, no numbered lists, no salutations.

Return answers in order, one per question, separated by "---ANSWER---".`;

    debug.log('📝 Generated prompt length:', userMessage.length);
    
    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: settings.temperature,
        max_tokens: 2000
      })
    });
    
    debug.log('📡 OpenAI response status:', response.status);
    const data = await response.json();
    debug.log('📦 OpenAI response data:', data);
    
    if (response.ok && data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content;
      debug.log('✅ Question answers generated successfully');
      
      // Parse answers
      const answers = content.split('---ANSWER---').map(answer => answer.trim()).filter(answer => answer);
      
      return { success: true, answers: answers };
    } else {
      debug.log('❌ No question answers generated');
      return { success: false, error: 'No question answers generated' };
    }
  } catch (error) {
    console.error('❌ Question answers generation error:', error);
    return { success: false, error: 'Question answers generation failed' };
  }
}

// Message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    debug.log('📨 Background received message:', request?.action || 'unknown');
    
    // Validate request
    if (!request || typeof request !== 'object') {
      debug.log('❌ Invalid request received');
      sendResponse({ success: false, error: 'Invalid request' });
      return true;
    }
    
    switch (request.action) {
      case 'register':
        handleRegister(request, sendResponse);
        return true;
        
      case 'login':
        handleLogin(request, sendResponse);
        return true;
        
      case 'logout':
        handleLogout(request, sendResponse);
        return true;
        
      case 'getAuthState':
        handleGetAuthState(sendResponse);
        return true;
        
      case 'getUsage':
        handleGetUsage(sendResponse);
        return true;
        
      case 'getUserProfile':
        handleGetUserProfile(sendResponse);
        return true;
        
      case 'updateProfile':
        handleUpdateProfile(request, sendResponse);
        return true;
        
      case 'changePassword':
        handleChangePassword(request, sendResponse);
        return true;
        
      case 'getProposalStats':
        handleGetProposalStats(sendResponse);
        return true;
        
      case 'incrementProposal':
        handleIncrementProposal(sendResponse);
        return true;
        
      case 'pageReady':
        handlePageReady(request, sendResponse);
        return true;
        
      case 'getUsageInfo':
        handleGetUsageInfo(sendResponse);
        return true;
        
      case 'generateCoverLetter':
        handleGenerateCoverLetter(request, sendResponse);
        return true;
        
      case 'generateQuestionAnswers':
        handleGenerateQuestionAnswers(request, sendResponse);
        return true;
        
      case 'testConnection':
        handleTestConnection(sendResponse);
        return true;
        
      case 'getApiKey':
        handleGetApiKey(sendResponse);
        return true;
        
      default:
        debug.log('❌ Unknown action:', request.action);
        sendResponse({ success: false, error: 'Unknown action: ' + request.action });
    }
  } catch (error) {
    console.error('❌ Error in message handler:', error);
    sendResponse({ success: false, error: 'Internal error: ' + error.message });
  }
  
  return true;
});

// Authentication handlers
async function handleRegister(request, sendResponse) {
  debug.log('📝 Handling registration request');
  
  // Validate request
  if (!request || !request.userData) {
    debug.log('❌ Invalid registration request - missing userData');
    sendResponse({ success: false, error: 'Invalid registration request - missing user data' });
    return;
  }
  
  const result = await register(request.userData);
  sendResponse(result);
}

async function handleLogin(request, sendResponse) {
  debug.log('🔐 Handling login request');
  
  // Validate request
  if (!request || !request.credentials) {
    debug.log('❌ Invalid login request - missing credentials');
    sendResponse({ success: false, error: 'Invalid login request - missing credentials' });
    return;
  }
  
  const result = await login(request.credentials);
  sendResponse(result);
}

async function handleLogout(request, sendResponse) {
  debug.log('🚪 Handling logout request');
  const result = await logout();
  sendResponse(result);
}

async function handleGetAuthState(sendResponse) {
  debug.log('🔍 Getting auth state');
  sendResponse({ 
    success: true, 
    isAuthenticated: authState.isAuthenticated,
    authState: authState 
  });
}

async function handleGetUsage(sendResponse) {
  debug.log('📊 Getting usage info');
  sendResponse({ 
    success: true, 
    usage: userUsage 
  });
}

async function handleTestConnection(sendResponse) {
  debug.log('🔗 Testing connection to backend');
  
  try {
    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      debug.log('✅ Backend connection successful');
      sendResponse({ success: true, message: 'Backend connection successful' });
    } else {
      debug.log('❌ Backend connection failed:', response.status);
      sendResponse({ success: false, error: 'Backend connection failed' });
    }
  } catch (error) {
    console.error('❌ Backend connection error:', error);
    sendResponse({ success: false, error: 'Backend connection failed: ' + error.message });
  }
}

async function handleGetApiKey(sendResponse) {
  debug.log('🔑 Direct API key fetch requested');
  const result = await getApiKey();
  sendResponse(result);
}

async function handleGenerateQuestionAnswers(request, sendResponse) {
  debug.log('❓ Generating question answers for:', request.questions?.length || 0, 'questions');
  
  // Check usage limits first
  const canGenerate = await checkUsageLimits();
  if (!canGenerate) {
    debug.log('❌ Usage limit reached');
    sendResponse({ 
      success: false, 
      error: 'Usage limit reached', 
      limitReached: true,
      usage: userUsage 
    });
    return;
  }
  
  try {
    // Check authentication first
    if (!authState.isAuthenticated) {
      debug.log('❌ User not authenticated');
      sendResponse({ success: false, error: 'Please log in to generate question answers' });
      return;
    }
    
    // Verify token
    const verifyResult = await verifyToken();
    if (!verifyResult.success) {
      debug.log('❌ Token verification failed');
      sendResponse({ success: false, error: 'Authentication failed. Please log in again.' });
      return;
    }
    
    // Get API key from server
    const apiKeyResult = await getApiKey();
    if (!apiKeyResult.success) {
      debug.log('❌ API key fetch failed:', apiKeyResult.error);
      sendResponse({ success: false, error: apiKeyResult.error });
      return;
    }
    
    const apiKey = apiKeyResult.apiKey;
    debug.log('✅ Server API key retrieved for question answers');
    
    // Get other settings
    const settings = await new Promise((resolve) => {
      chrome.storage.local.get(['openaiModel', 'openaiTemperature', 'yourName', 'firstName', 'lastName'], resolve);
    });
    
    // Generate question answers
    const result = await generateQuestionAnswersWithSettings(request.questions, request.jobTitle, request.jobDescription, {
      apiKey,
      model: settings.openaiModel || DEFAULT_CONFIG.DEFAULT_MODEL,
      temperature: typeof settings.openaiTemperature === 'number' ? settings.openaiTemperature : DEFAULT_CONFIG.TEMPERATURE,
      yourName: settings.yourName || 'Your Name',
      firstName: settings.firstName,
      lastName: settings.lastName
    });
    
    if (result.success) {
      // Update usage
      userUsage.proposalsUsed++;
      await saveUserUsage();
      sendResponse({ success: true, answers: result.answers, usage: userUsage });
    } else {
      sendResponse({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('❌ Question answers generation error:', error);
    sendResponse({ success: false, error: 'Failed to generate question answers' });
  }
}

// Handle cover letter generation
async function handleGenerateCoverLetter(request, sendResponse) {
  debug.log('📝 Generating cover letter for:', request.jobTitle);
  
  // Check usage limits first
  const canGenerate = await checkUsageLimits();
  if (!canGenerate) {
    debug.log('❌ Usage limit reached');
    sendResponse({ 
      success: false, 
      error: 'Usage limit reached', 
      limitReached: true,
      usage: userUsage 
    });
    return;
  }
  
  try {
    // Check authentication first
    if (!authState.isAuthenticated) {
      debug.log('❌ User not authenticated');
      sendResponse({ success: false, error: 'Please log in to generate cover letters' });
      return;
    }
    
    // Verify token
    const verifyResult = await verifyToken();
    if (!verifyResult.success) {
      debug.log('❌ Token verification failed');
      sendResponse({ success: false, error: 'Authentication failed. Please log in again.' });
      return;
    }
    
    // Get API key from server
    const apiKeyResult = await getApiKey();
    if (!apiKeyResult.success) {
      debug.log('❌ API key fetch failed:', apiKeyResult.error);
      sendResponse({ success: false, error: apiKeyResult.error });
      return;
    }
    
    const apiKey = apiKeyResult.apiKey;
    debug.log('✅ Server API key retrieved');
    
    // Get other settings
    const settings = await new Promise((resolve) => {
      chrome.storage.local.get(['openaiModel', 'openaiTemperature', 'yourName', 'customPrompt', 'proposalMode', 'promptTemplate', 'firstName', 'lastName'], resolve);
    });
    
    // Generate the cover letter
    const result = await generateAIProposalWithSettings(request.jobTitle, request.jobDescription, {
      apiKey,
      model: settings.openaiModel || DEFAULT_CONFIG.DEFAULT_MODEL,
      temperature: typeof settings.openaiTemperature === 'number' ? settings.openaiTemperature : DEFAULT_CONFIG.TEMPERATURE,
      yourName: settings.yourName || 'Your Name',
      firstName: settings.firstName,
      lastName: settings.lastName,
      customPrompt: settings.customPrompt || '',
      proposalMode: settings.proposalMode || 'ai',
      promptTemplate: settings.promptTemplate || 'universal'
    });
    
    if (result.success) {
      // Only increment usage for AI mode proposals
      const isAIMode = (settings.proposalMode || 'ai') === 'ai';
      if (isAIMode) {
        const incrementResult = await incrementProposal();
        if (incrementResult.success) {
          debug.log('📊 Usage incremented for AI mode proposal');
        } else {
          debug.log('⚠️ Failed to increment proposal count:', incrementResult.error);
        }
      } else {
        debug.log('📊 No usage increment for custom mode proposal');
      }
      sendResponse({ success: true, coverLetter: result.coverLetter, usage: userUsage });
    } else {
      sendResponse({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('❌ Cover letter generation error:', error);
    sendResponse({ success: false, error: 'Failed to generate cover letter' });
  }
}

// Legacy functions for compatibility with original content script
async function generateCoverLetter(jobTitle, jobDescription) {
  debug.log('📝 Legacy generateCoverLetter called');
  
  // Check usage limits first
  const canGenerate = await checkUsageLimits();
  if (!canGenerate) {
    throw new Error('Usage limit reached');
  }
  
  // Check authentication first
  if (!authState.isAuthenticated) {
    throw new Error('Please log in to generate cover letters');
  }
  
  // Verify token
  const verifyResult = await verifyToken();
  if (!verifyResult.success) {
    throw new Error('Authentication failed. Please log in again.');
  }
  
  // Get API key from server
  const apiKeyResult = await getApiKey();
  if (!apiKeyResult.success) {
    throw new Error(apiKeyResult.error);
  }
  
  const apiKey = apiKeyResult.apiKey;
  debug.log('✅ Server API key retrieved for legacy call');
  
  // Get other settings
  const settings = await new Promise((resolve) => {
    chrome.storage.local.get(['openaiModel', 'openaiTemperature', 'yourName', 'customPrompt', 'proposalMode', 'promptTemplate'], resolve);
  });
  
  // Generate the cover letter
  const result = await generateAIProposalWithSettings(jobTitle, jobDescription, {
    apiKey,
    model: settings.openaiModel || DEFAULT_CONFIG.DEFAULT_MODEL,
    temperature: typeof settings.openaiTemperature === 'number' ? settings.openaiTemperature : DEFAULT_CONFIG.TEMPERATURE,
    yourName: settings.yourName || 'Your Name',
    customPrompt: settings.customPrompt || '',
    proposalMode: settings.proposalMode || 'ai',
    promptTemplate: settings.promptTemplate || 'universal'
  });
  
  if (result.success) {
    // Update usage
    userUsage.proposalsUsed++;
    await saveUserUsage();
    return result.coverLetter;
  } else {
    throw new Error(result.error);
  }
}

async function generateQuestionAnswers(questions, jobTitle, jobDescription) {
  debug.log('❓ Legacy generateQuestionAnswers called');
  
  // Check usage limits first
  const canGenerate = await checkUsageLimits();
  if (!canGenerate) {
    throw new Error('Usage limit reached');
  }
  
  // Check authentication first
  if (!authState.isAuthenticated) {
    throw new Error('Please log in to generate question answers');
  }
  
  // Verify token
  const verifyResult = await verifyToken();
  if (!verifyResult.success) {
    throw new Error('Authentication failed. Please log in again.');
  }
  
  // Get API key from server
  const apiKeyResult = await getApiKey();
  if (!apiKeyResult.success) {
    throw new Error(apiKeyResult.error);
  }
  
  const apiKey = apiKeyResult.apiKey;
  debug.log('✅ Server API key retrieved for legacy question answers call');
  
  // Get other settings
  const settings = await new Promise((resolve) => {
    chrome.storage.local.get(['openaiModel', 'openaiTemperature', 'yourName'], resolve);
  });
  
  // Generate question answers
  const result = await generateQuestionAnswersWithSettings(questions, jobTitle, jobDescription, {
    apiKey,
    model: settings.openaiModel || DEFAULT_CONFIG.DEFAULT_MODEL,
    temperature: typeof settings.openaiTemperature === 'number' ? settings.openaiTemperature : DEFAULT_CONFIG.TEMPERATURE,
    yourName: settings.yourName || 'Your Name'
  });
  
  if (result.success) {
    // Update usage
    userUsage.proposalsUsed++;
    await saveUserUsage();
    return result.answers;
  } else {
    throw new Error(result.error);
  }
}

// Handle get user profile
async function handleGetUserProfile(sendResponse) {
  try {
    if (!authState.isAuthenticated) {
      sendResponse({ success: false, error: 'User not authenticated' });
      return;
    }

    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      sendResponse({ success: false, error: errorData.message || 'Failed to fetch profile' });
      return;
    }

    const data = await response.json();
    if (data.success) {
      // Update local user data
      authState.user = data.data;
      
      // Extract proposal data from profile response
      const profile = data.data;
      if (profile.currentProposals !== undefined && profile.maxProposals !== undefined) {
        userUsage = {
          currentProposals: profile.currentProposals,
          maxProposals: profile.maxProposals,
          remaining: profile.maxProposals === -1 ? -1 : profile.maxProposals - profile.currentProposals,
          percentage: profile.maxProposals === -1 ? 0 : Math.round((profile.currentProposals / profile.maxProposals) * 100)
        };
        debug.log('✅ Proposal stats updated from profile:', userUsage);
      }
      
      await saveAuthState();
      sendResponse({ success: true, profile: data.data });
    } else {
      sendResponse({ success: false, error: data.message || 'Failed to fetch profile' });
    }
  } catch (error) {
    debug.error('Get user profile error:', error);
    sendResponse({ success: false, error: 'Failed to fetch profile' });
  }
}

// Handle update profile
async function handleUpdateProfile(request, sendResponse) {
  try {
    if (!authState.isAuthenticated) {
      sendResponse({ success: false, error: 'User not authenticated' });
      return;
    }

    const { firstName, lastName } = request.data;
    
    if (!firstName || !lastName) {
      sendResponse({ success: false, error: 'First name and last name are required' });
      return;
    }

    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ firstName, lastName })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      sendResponse({ success: false, error: errorData.message || 'Failed to update profile' });
      return;
    }

    const data = await response.json();
    if (data.success) {
      // Update local user data
      authState.user = { ...authState.user, ...data.data };
      await saveAuthState();
      sendResponse({ success: true, profile: data.data });
    } else {
      sendResponse({ success: false, error: data.message || 'Failed to update profile' });
    }
  } catch (error) {
    debug.error('Update profile error:', error);
    sendResponse({ success: false, error: 'Failed to update profile' });
  }
}

// Handle change password
async function handleChangePassword(request, sendResponse) {
  try {
    if (!authState.isAuthenticated) {
      sendResponse({ success: false, error: 'User not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = request.data;
    
    if (!currentPassword || !newPassword) {
      sendResponse({ success: false, error: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      sendResponse({ success: false, error: 'New password must be at least 6 characters long' });
      return;
    }

    const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/api/users/change-password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      sendResponse({ success: false, error: errorData.message || 'Failed to change password' });
      return;
    }

    const data = await response.json();
    if (data.success) {
      sendResponse({ success: true, message: 'Password changed successfully' });
    } else {
      sendResponse({ success: false, error: data.message || 'Failed to change password' });
    }
  } catch (error) {
    debug.error('Change password error:', error);
    sendResponse({ success: false, error: 'Failed to change password' });
  }
}

async function handleGetProposalStats(sendResponse) {
  try {
    const result = await getProposalStats();
    sendResponse(result);
  } catch (error) {
    debug.error('Get proposal stats error:', error);
    sendResponse({ success: false, error: 'Failed to get proposal statistics' });
  }
}

async function handleIncrementProposal(sendResponse) {
  try {
    const result = await incrementProposal();
    sendResponse(result);
  } catch (error) {
    debug.error('Increment proposal error:', error);
    sendResponse({ success: false, error: 'Failed to increment proposal' });
  }
}

async function handleGetUsageInfo(sendResponse) {
  try {
    // Return current usage info from memory
    sendResponse({ 
      success: true, 
      data: { limits: userUsage } 
    });
  } catch (error) {
    debug.error('Get usage info error:', error);
    sendResponse({ success: false, error: 'Failed to get usage info' });
  }
}

async function handlePageReady(request, sendResponse) {
  try {
    debug.log('Page ready signal received:', request.url);
    
    // Store the page ready state
    await chrome.storage.local.set({ 
      pageReady: true,
      currentJob: {
        title: request.jobTitle,
        description: request.jobDescription,
        url: request.url
      }
    });
    
    sendResponse({ success: true });
  } catch (error) {
    debug.error('Page ready handler error:', error);
    sendResponse({ success: false, error: 'Failed to handle page ready' });
  }
}

debug.log('✅ Background script loaded with modern authentication and server API key support');
