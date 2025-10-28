import React, { useState, useEffect, useRef } from 'react';
import debug from '../utils/debug.js';

const Popup = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null
  });
  
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  
  const [settings, setSettings] = useState({
    autoFill: true,
    notifications: true,
    autoAnswerQuestions: false,
    openaiModel: 'gpt-3.5-turbo',
    openaiTemperature: 0.7
  });
  
  const [usage, setUsage] = useState({
    currentProposals: 0,
    maxProposals: 50,
    remaining: 50,
    percentage: 0,
    subscriptionStatus: 'free'
  });
  
  const [promptMode, setPromptMode] = useState('ai'); // 'ai' or 'custom'
  
  const [currentJob, setCurrentJob] = useState({
    title: '',
    description: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [debugMode, setDebugMode] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [pageReady, setPageReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const notificationTimeout = useRef(null);

  useEffect(() => {
    checkAuthState();
    loadSettings();
    loadCurrentJob();
    loadDebugMode();
    checkPageReady();
    loadUserProfile();
    
    // Check page ready state every 2 seconds
    const pageInterval = setInterval(checkPageReady, 2000);
    
    return () => {
      clearInterval(pageInterval);
    };
  }, []);

  const checkAuthState = () => {
    chrome.runtime.sendMessage({ action: 'getAuthState' }, (response) => {
      if (response && response.success) {
        const newAuthState = response.authState;
        const wasAuthenticated = authState.isAuthenticated;
        const isNowAuthenticated = newAuthState.isAuthenticated;
        
        setAuthState(newAuthState);
        
        // If auth state changed, refetch all data
        if (wasAuthenticated !== isNowAuthenticated) {
          debug.log('🔄 Auth state changed, refetching data...');
          
          if (isNowAuthenticated) {
            // User logged in - data should already be loaded by background script
            debug.log('✅ User logged in - data should be loaded');
            loadUserProfile();
            loadSettings();
            checkPageReady();
          } else {
            // User logged out - clear all local data
            debug.log('❌ User logged out - clearing all data');
            setCurrentJob({ title: '', description: '' });
            setUsage({ currentProposals: 0, maxProposals: 10, remaining: 10, percentage: 0 });
            setPageReady(false);
            setIsLoading(true);
            setNotification({ message: 'Please log in to use the extension.', type: 'info' });
            
            // Clear all internal state
            setAuthForm({ firstName: '', lastName: '', email: '', password: '' });
            setSettings({});
            setPromptMode('ai');
            setDebugMode(false);
            setShowDebug(false);
            setDebugInfo({});
          }
        } else {
          debug.log('✅ Auth state unchanged - no refetch needed');
        }
      }
    });
  };

  const handleAuth = async () => {
    // Validate form fields
    if (!authForm.email || !authForm.password) {
      showNotification('Please fill in email and password', 'error');
      return;
    }
    
    if (authMode === 'register' && (!authForm.firstName || !authForm.lastName)) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    // Extra smart validation for registration
    if (authMode === 'register') {
      const validationError = validateRegistration(authForm);
      if (validationError) {
        showNotification(validationError, 'error');
        return;
      }
    }
    
    if (authMode === 'login') {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  // Validate registration fields with specific messages
  function validateRegistration(form) {
    const errors = [];

    // Email
    const email = (form.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address.');
    }

    // First name
    const firstName = (form.firstName || '').trim();
    if (firstName.length < 2) {
      errors.push('First name must be at least 2 letters.');
    }
    if (/\d/.test(firstName)) {
      errors.push('First name cannot contain numbers.');
    }

    // Last name
    const lastName = (form.lastName || '').trim();
    if (lastName.length < 2) {
      errors.push('Last name must be at least 2 letters.');
    }
    if (/\d/.test(lastName)) {
      errors.push('Last name cannot contain numbers.');
    }

    // Password
    const password = form.password || '';
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.push('Password must include at least one letter and one number.');
    }

    return errors.length ? errors.join(' ') : null;
  }

  const handleLogin = async () => {
    chrome.runtime.sendMessage({
      action: 'login',
      credentials: {
        email: authForm.email,
        password: authForm.password
      }
    }, (response) => {
      if (response && response.success) {
        setAuthState({
          isAuthenticated: true,
          user: response.user
        });
        
        // Update usage data if provided
        if (response.usage) {
          setUsage(response.usage);
          debug.log('Usage data updated from login response:', response.usage);
        }
        
        setShowAuth(false);
        setAuthForm({ firstName: '', lastName: '', email: '', password: '' });
        showNotification('Login successful!');
      } else {
        showNotification(response?.error || 'Login failed');
      }
    });
  };

  const handleRegister = async () => {
    chrome.runtime.sendMessage({
      action: 'register',
      userData: {
        firstName: authForm.firstName,
        lastName: authForm.lastName,
        email: authForm.email,
        password: authForm.password
      }
    }, (response) => {
      if (response && response.success) {
        // Switch to login tab after successful registration
        setAuthMode('login');
        setAuthForm({ firstName: '', lastName: '', email: '', password: '' });
        showNotification('Registration successful! Please log in to continue.', 'success');
      } else {
        // Prefer specific server error if provided
        const err = response?.error || response?.specificError || 'Registration failed';
        showNotification(err, 'error');
      }
    });
  };

  const handleLogout = () => {
    chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
      if (response && response.success) {
        setAuthState({
          isAuthenticated: false,
          user: null
        });
        showNotification('Logged out successfully');
      }
    });
  };

  const loadSettings = () => {
    chrome.storage.local.get(['autoFill', 'notifications', 'autoAnswerQuestions', 'openaiModel', 'openaiTemperature', 'proposalMode'], (result) => {
      setSettings({
        autoFill: result.autoFill !== false,
        notifications: result.notifications !== false,
        autoAnswerQuestions: result.autoAnswerQuestions === true,
        openaiModel: result.openaiModel || 'gpt-3.5-turbo',
        openaiTemperature: typeof result.openaiTemperature === 'number' ? result.openaiTemperature : 0.7
      });
      setPromptMode(result.proposalMode || 'ai');
    });
  };

  const loadCurrentJob = () => {
    chrome.storage.local.get(['jobTitle', 'jobDescription'], (result) => {
      if (result.jobTitle && result.jobDescription) {
        setCurrentJob({
          title: result.jobTitle,
          description: result.jobDescription
        });
      }
    });
  };

  const saveSettings = () => {
    const settingsToSave = {
      autoFill: settings.autoFill,
      notifications: settings.notifications,
      autoAnswerQuestions: settings.autoAnswerQuestions
    };
    chrome.storage.local.set(settingsToSave, () => {
      console.log('Settings saved');
    });
  };

  const saveOpenAISettings = () => {
    const model = settings.openaiModel.trim();
    const temperature = Math.max(0, Math.min(1, settings.openaiTemperature));
    
    chrome.storage.local.set({ 
      openaiModel: model, 
      openaiTemperature: temperature 
    }, () => {
      showNotification('OpenAI settings saved');
    });
  };


  const toggleSetting = (settingName) => {
    const newSettings = {
      ...settings,
      [settingName]: !settings[settingName]
    };
    setSettings(newSettings);
    
    // Save the specific setting immediately
    const settingsToSave = {
      [settingName]: newSettings[settingName]
    };
    chrome.storage.local.set(settingsToSave, () => {
      debug.log('Setting saved:', settingName, newSettings[settingName]);
    });
  };

  const generateCoverLetter = () => {
    if (!pageReady) {
      showNotification('Upwork page not ready. Open a job post and click Apply.');
      return;
    }

    setIsGenerating(true);
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url && tab.url.includes('upwork.com')) {
        chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' }, (resp) => {
          if (!resp || !resp.success) {
            showNotification('Could not read job data from the page. Open a job post and try again.');
            setIsGenerating(false);
            return;
          }
          chrome.runtime.sendMessage({ action: 'generateCoverLetter', jobTitle: resp.jobTitle, jobDescription: resp.jobDescription }, (bgResp) => {
            if (bgResp && bgResp.limitReached) {
              showNotification('Free limit reached! Upgrade to Premium for unlimited proposals.');
            } else if (bgResp && bgResp.success) {
              showNotification('Cover letter generated successfully!');
              chrome.storage.local.set({
                coverLetter: bgResp.coverLetter,
                jobTitle: resp.jobTitle,
                jobDescription: resp.jobDescription
              }, () => {
                chrome.tabs.sendMessage(tab.id, { action: 'fillCoverLetter', coverLetter: bgResp.coverLetter });
                
                // Reload current job to refresh the UI
                setTimeout(() => {
                  loadCurrentJob();
                }, 500);
                
                // Check if auto-answer questions is enabled and trigger it
                chrome.storage.local.get(['autoAnswerQuestions'], (result) => {
                  if (result.autoAnswerQuestions === true) {
                    debug.log('Auto-answer questions enabled, triggering question detection...');
                    // Wait a bit for the cover letter to be filled, then detect and answer questions
                    setTimeout(() => {
                      chrome.tabs.sendMessage(tab.id, { action: 'detectAndAnswerQuestions' });
                    }, 2000);
                  }
                });
              });
            } else {
              const errMsg = (bgResp && bgResp.error) || 'Failed to generate cover letter. Please try again.';
              showNotification(errMsg);
            }
            setIsGenerating(false);
          });
        });
      } else {
        showNotification('Please navigate to an Upwork job posting first.');
        setIsGenerating(false);
      }
    });
  };

  const loadUsageInfo = () => {
    // First try to get fresh data from server
    chrome.runtime.sendMessage({action: 'getProposalStats'}, (response) => {
      if (response && response.success) {
        // The response structure is response.data.limits
        const usageData = response.data?.limits || response.data || response;
        setUsage(usageData);
        debug.log('Usage info loaded from server:', usageData);
      } else {
        console.error('Failed to get usage info from server:', response);
        
        // Fallback: try to get from background script memory
        chrome.runtime.sendMessage({action: 'getUsageInfo'}, (fallbackResponse) => {
          if (fallbackResponse && fallbackResponse.success) {
            const usageData = fallbackResponse.data?.limits || fallbackResponse.data || fallbackResponse;
            setUsage(usageData);
            debug.log('Usage info loaded from background memory:', usageData);
          } else {
            // Final fallback: try to load from local storage
            chrome.storage.local.get(['userUsage'], (result) => {
              if (result.userUsage) {
                setUsage(result.userUsage);
                debug.log('Usage info loaded from storage (fallback):', result.userUsage);
              } else {
                // Set default usage if no data available
                setUsage({ currentProposals: 0, maxProposals: 10, remaining: 10, percentage: 0 });
                debug.log('Using default usage info');
              }
            });
          }
        });
      }
    });
  };

  const savePromptMode = (mode) => {
    setPromptMode(mode);
    chrome.storage.local.set({ proposalMode: mode });
  };

  const loadUserProfile = async () => {
    try {
      chrome.runtime.sendMessage({ action: 'getUserProfile' }, (response) => {
        if (response && response.success && response.profile) {
          const { firstName, lastName, currentProposals, maxProposals } = response.profile;
          
          // Save firstName and lastName to storage for use in prompts
          chrome.storage.local.set({
            firstName: firstName || '',
            lastName: lastName || '',
            yourName: `${firstName || ''} ${lastName || ''}`.trim()
          });
          
          // Extract and set usage data from profile
          if (currentProposals !== undefined && maxProposals !== undefined) {
            const usageData = {
              currentProposals: currentProposals,
              maxProposals: maxProposals,
              remaining: maxProposals === -1 ? -1 : maxProposals - currentProposals,
              percentage: maxProposals === -1 ? 0 : Math.round((currentProposals / maxProposals) * 100)
            };
            setUsage(usageData);
            debug.log('Usage data loaded from profile:', usageData);
          }
          
          debug.log('User profile loaded:', { firstName, lastName, currentProposals, maxProposals });
        }
      });
    } catch (error) {
      debug.error('Failed to load user profile:', error);
    }
  };

  const checkPageReady = () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        const url = tabs[0].url;
        if (url && (url.includes('upwork.com') && (url.includes('/apply/') || url.includes('/proposals/')))) {
          // First check if page is already ready in storage
          chrome.storage.local.get(['pageReady', 'currentJob'], (result) => {
            if (result.pageReady && result.currentJob) {
              setPageReady(true);
              setCurrentJob(result.currentJob);
              setIsLoading(false);
            } else {
              // Page not marked as ready, actively check with content script
              debug.log('Page not marked as ready, checking with content script...');
              chrome.tabs.sendMessage(tabs[0].id, { action: 'extractJobData' }, (response) => {
                if (chrome.runtime.lastError) {
                  // Content script not loaded or error
                  debug.log('Content script not available:', chrome.runtime.lastError.message);
                  setPageReady(false);
                  setIsLoading(false);
                } else if (response && response.success) {
                  // Page is ready and has job data
                  setPageReady(true);
                  setCurrentJob({
                    title: response.jobTitle,
                    description: response.jobDescription
                  });
                  debug.log('Page is ready with job data:', response);
                } else {
                  // Page is not ready or no job data
                  setPageReady(false);
                  debug.log('Page not ready or no job data:', response);
                }
                setIsLoading(false);
              });
            }
          });
        } else {
          setPageReady(false);
          setIsLoading(false);
        }
      }
    });
  };

  const openAdvancedSettings = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  };

  const openSubscriptionPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('subscription.html') });
  };

  const showNotification = (message, type = 'info') => {
    // Clear any existing timeout
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }
    
    setNotification({ message, type });
    
    // Set new timeout
    notificationTimeout.current = setTimeout(() => {
      setNotification({ message: '', type: '' });
      notificationTimeout.current = null;
    }, 2000);
  };

  const loadDebugMode = async () => {
    try {
      const result = await chrome.storage.local.get(['debugMode']);
      setDebugMode(result.debugMode || false);
    } catch (error) {
      console.error('Failed to load debug mode:', error);
    }
  };

  const toggleDebugMode = async () => {
    const newDebugMode = !debugMode;
    setDebugMode(newDebugMode);
    await debug.setDebugMode(newDebugMode);
    showNotification(`Debug mode ${newDebugMode ? 'enabled' : 'disabled'}`);
  };

  const getDebugInfo = () => {
    chrome.runtime.sendMessage({ action: 'getAuthState' }, (response) => {
      if (response && response.success) {
        setDebugInfo({
          authState: response.authState,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      }
    });
  };

  const testCoverLetterGeneration = () => {
    chrome.runtime.sendMessage({ action: 'generateCoverLetter', jobTitle: 'Test Job', jobDescription: 'Test Description' }, (response) => {
      console.log('Cover letter generation test response:', response);
      showNotification(response?.success ? 'Cover letter generation test completed!' : 'Test failed: ' + (response?.error || 'Unknown error'));
    });
  };

  const testConnection = () => {
    chrome.runtime.sendMessage({ action: 'testConnection' }, (response) => {
      console.log('Connection test response:', response);
      setDebugInfo(prev => ({
        ...prev,
        connectionTest: response,
        timestamp: new Date().toISOString()
      }));
      showNotification(response?.success ? 'Connection test completed - check debug panel' : 'Connection test failed');
    });
  };

  const testApiKeyFetch = () => {
    chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
      console.log('API Key fetch test response:', response);
      setDebugInfo(prev => ({
        ...prev,
        apiKeyTest: response,
        timestamp: new Date().toISOString()
      }));
      showNotification(response?.success ? 'API Key fetched successfully!' : 'API Key fetch failed: ' + (response?.error || 'Unknown error'));
    });
  };

  const getProposalLimit = () => {
    return usage.maxProposals === -1 ? '∞' : (usage.maxProposals || 50);
  };

  const getSubscriptionStatusText = () => {
    return usage.subscriptionStatus === 'premium' ? 'Premium' : 'Free';
  };

  // Show authentication form if not logged in
  if (!authState.isAuthenticated) {
    return (
      <div className="container">
        {notification.message && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        
        <div className="header">
          <h1>Upwork Cover Letter Generator</h1>
          <p>Please log in to continue</p>
        </div>
        
        <div className="settings">
          <div className="setting-item">
            <span className="setting-label">Authentication</span>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                className={`btn ${authMode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAuthMode('login')}
                style={{ flex: 1 }}
              >
                Login
              </button>
              <button 
                className={`btn ${authMode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAuthMode('register')}
                style={{ flex: 1 }}
              >
                Register
              </button>
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '15px' }}>
            {authMode === 'register' && (
              <>
                <input 
                  type="text" 
                  placeholder="First Name" 
                  className="form-input"
                  value={authForm.firstName}
                  onChange={(e) => setAuthForm({...authForm, firstName: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Last Name" 
                  className="form-input"
                  value={authForm.lastName}
                  onChange={(e) => setAuthForm({...authForm, lastName: e.target.value})}
                />
              </>
            )}
            <input 
              type="email" 
              placeholder="Email" 
              className="form-input"
              value={authForm.email}
              onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="form-input"
              value={authForm.password}
              onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleAuth}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </div>
        </div>
        
        <div className="info">
          <h3>How to use:</h3>
          <p>
            1. Register or login to your account<br/>
            2. Your OpenAI API key is managed securely by your account<br/>
            3. Navigate to any Upwork job posting<br/>
            4. The extension will automatically generate and fill your cover letter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container container-popup">
      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="header">
        <h1>Upwork Cover Letter Generator</h1>
        <p>Welcome, {authState.user?.firstName || 'User'}!</p>
        <button 
          className="btn btn-secondary" 
          onClick={handleLogout}
          style={{ fontSize: '10px', padding: '5px 10px', marginTop: '5px' }}
        >
          Logout
        </button>
      </div>
      
      <div className="status">
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span className="status-text">Extension Active</span>
        </div>
        <div id="usage-info" style={{marginTop: '10px', fontSize: '12px', opacity: 0.9}}>
          <div>Proposals Used: <span id="proposals-used">{usage.currentProposals || 0}</span>/<span id="proposal-limit">{usage.maxProposals || 50}</span></div>
          <div>Remaining: <span id="remaining-proposals">{usage.remaining || 50}</span></div>
          <div>Status: <span id="subscription-status">{getSubscriptionStatusText()}</span></div>
        </div>
        <div id="current-job" className={currentJob.title ? '' : 'hidden'}>
          <p style={{margin: '0', fontSize: '12px', opacity: 0.8}}>Current Job: <span id="job-title">{currentJob.title}</span></p>
        </div>
      </div>
      
      <div className="settings">
        {/* <div className="setting-item">
          <span className="setting-label">Auto-fill Cover Letter</span>
          <div 
            className={`toggle ${settings.autoFill ? 'active' : ''}`} 
            onClick={() => toggleSetting('autoFill')}
          >
            <div className="toggle-slider"></div>
          </div>
        </div> */}
        <div className="setting-item">
          <span className="setting-label">Show Notifications</span>
          <div 
            className={`toggle ${settings.notifications ? 'active' : ''}`} 
            onClick={() => toggleSetting('notifications')}
          >
            <div className="toggle-slider"></div>
          </div>
        </div>
        <div className="setting-item">
          <span className="setting-label">Auto-answer Questions</span>
          <div 
            className={`toggle ${settings.autoAnswerQuestions ? 'active' : ''}`} 
            onClick={() => toggleSetting('autoAnswerQuestions')}
          >
            <div className="toggle-slider"></div>
          </div>
        </div>
      </div>
      
      
      <div className="actions">
        <button 
          className="btn btn-primary" 
          onClick={generateCoverLetter}
          disabled={isGenerating || !pageReady || isLoading}
        >
          {isLoading ? 'Loading Page...' : isGenerating ? 'Generating...' : !pageReady ? 'Page Not Ready' : 'Generate Cover Letter'}
        </button>
      </div>
      
      <div className="actions">
        <button 
          className="btn btn-secondary btn-full-width" 
          onClick={openAdvancedSettings}
        >
          Advanced Settings & Templates
        </button>
      </div>
      
      <div className="settings" style={{marginTop: '15px'}}>
        <div className="setting-item">
          <span className="setting-label">Mode</span>
          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
              <input
                type="radio"
                name="promptMode"
                value="ai"
                checked={promptMode === 'ai'}
                onChange={(e) => savePromptMode(e.target.value)}
                style={{ margin: 0 }}
              />
              AI Generated
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
              <input
                type="radio"
                name="promptMode"
                value="custom"
                checked={promptMode === 'custom'}
                onChange={(e) => savePromptMode(e.target.value)}
                style={{ margin: 0 }}
              />
              Custom Template
            </label>
          </div>
        </div>
          <div style={{ fontSize: '10px', color: '#DDD', marginTop: '3px' }}>
            {promptMode === 'ai' ? 'Uses AI templates and counts against usage' : 'Uses your custom template, no usage count'}
          </div>
      </div>
      
      <div className="settings" style={{marginTop: '15px'}}>
        <div className="setting-item">
          <span className="setting-label">Subscription</span>
          <button 
            className="btn btn-primary" 
            onClick={openSubscriptionPage}
            style={{padding: '8px 16px', fontSize: '11px'}}
          >
            Manage Subscription
          </button>
        </div>
      </div>
{/*       
      <div className="settings" style={{marginTop: '10px'}}>
          <span className="setting-label">Debug Tools</span>
        <div className="setting-item">
          <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowDebug(!showDebug)}
              style={{padding: '5px 10px', fontSize: '10px'}}
            >
              {showDebug ? 'Hide' : 'Show'} Debug
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={getDebugInfo}
              style={{padding: '5px 10px', fontSize: '10px'}}
            >
              Get Info
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={testCoverLetterGeneration}
              style={{padding: '5px 10px', fontSize: '10px'}}
            >
              Test Generation
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={testConnection}
              style={{padding: '5px 10px', fontSize: '10px'}}
            >
              Test Connection
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={testApiKeyFetch}
              style={{padding: '5px 10px', fontSize: '10px'}}
            >
              Test API Access
            </button>
          </div>
        </div>
        
        {showDebug && (
          <div className="debug-panel">
            <h4>Debug Tools</h4>
            <div className="debug-controls">
              <button 
                className={`btn ${debugMode ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleDebugMode}
              >
                {debugMode ? 'Debug ON' : 'Debug OFF'}
              </button>
            <button 
              className="btn btn-secondary"
              onClick={getDebugInfo}
            >
              Get Debug Info
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                  const tab = tabs[0];
                  if (tab && tab.url && tab.url.includes('upwork.com')) {
                    chrome.tabs.sendMessage(tab.id, { action: 'detectAndAnswerQuestions' });
                    showNotification('Testing auto-answer questions...');
                  } else {
                    showNotification('Please navigate to an Upwork job posting first.');
                  }
                });
              }}
            >
              Test Auto-Answer
            </button>
            </div>
            <div className="debug-info">
              <h5>Debug Information:</h5>
              <pre>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div> */}
      
      <div className="info">
        <h3>How to use:</h3>
        <p>
          1. Navigate to any Upwork job posting<br/>
          2. Click "Apply Now" button<br/>
          3. Once the job is detected. You can use the "Generate Cover Letter" button to generate a cover letter.
          4. You can also use the "Auto-answer Questions" button to automatically answer the questions in the cover letter.
          5. You can also use the "Advanced Settings & Templates" button to open the advanced settings and templates.
        </p>
      </div>
    </div>
  );
};

export default Popup;