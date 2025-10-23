import React, { useState, useEffect } from 'react';
import './styles.css';
import { AI_PROMPTS_TEMPLATES, getTemplateOptions, getTemplate, getMetaPromptStorageKey } from '../templates/aiTemplates.js';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    yourName: '',
    customPrompt: '',
    promptTemplate: 'universal',
    metaPromptEditor: '',
    customAiPrompt: ''
  });
  const [statusMessage, setStatusMessage] = useState({ show: false, type: '', message: '' });
  const [templatePreview, setTemplatePreview] = useState({ show: false, content: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      setIsLoading(true);
      
      // First try to get auth state from background script
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getAuthState' }, resolve);
      });
      
      console.log('Auth state response:', response);
      
      // If background script response is successful, use it
      if (response && response.success) {
        if (response.isAuthenticated) {
          console.log('User is authenticated, loading profile...');
          setIsAuthenticated(true);
          await loadUserProfile();
          await loadAllSettings();
        } else {
          console.log('User is not authenticated from background script');
          setIsAuthenticated(false);
          // Clear all local data when not authenticated
          setUserProfile({});
          setSettings({
            yourName: '',
            customPrompt: '',
            promptTemplate: 'universal',
            metaPromptEditor: '',
            customAiPrompt: ''
          });
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setShowPasswordChange(false);
          showStatusMessage('error', 'Please log in to access settings');
        }
      } else {
        // Fallback: check auth state directly from storage
        console.log('Background script response failed, checking storage directly...');
        const storageResult = await chrome.storage.local.get(['authToken', 'refreshToken', 'user']);
        
        if (storageResult.authToken && storageResult.refreshToken) {
          console.log('User is authenticated from storage');
          setIsAuthenticated(true);
          await loadUserProfile();
          await loadAllSettings();
        } else {
          console.log('User is not authenticated from storage');
          setIsAuthenticated(false);
          // Clear all local data when not authenticated
          setUserProfile({});
          setSettings({
            yourName: '',
            customPrompt: '',
            promptTemplate: 'universal',
            metaPromptEditor: '',
            customAiPrompt: ''
          });
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setShowPasswordChange(false);
          showStatusMessage('error', 'Please log in to access settings');
        }
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
      // Clear all local data on error
      setUserProfile({});
      setSettings({
        yourName: '',
        customPrompt: '',
        promptTemplate: 'universal',
        metaPromptEditor: '',
        customAiPrompt: ''
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordChange(false);
      showStatusMessage('error', 'Failed to check authentication status');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getUserProfile' }, resolve);
      });
      
      if (response && response.success) {
        setUserProfile(response.profile);
        setSettings(prev => ({
          ...prev,
          yourName: `${response.profile.firstName || ''} ${response.profile.lastName || ''}`.trim()
        }));
      } else {
        showStatusMessage('error', 'Failed to load user profile');
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      showStatusMessage('error', 'Failed to load user profile');
    }
  };

  const loadAllSettings = async () => {
    try {
      const result = await chrome.storage.local.get([
        'customPrompt',
        'promptTemplate',
        'customAiPrompt',
        'proposalMode',
        'user'
      ]);
      
      const templateType = result.promptTemplate || 'universal';
      const template = getTemplate(templateType);
      
      // Load template-specific meta prompt override
      const storageKey = getMetaPromptStorageKey(templateType);
      const metaResult = await chrome.storage.local.get([storageKey]);
      const metaPromptOverride = metaResult[storageKey];
      
      // Get user name from backend user data
      const userName = result.user ? `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim() : '';
      
      setSettings(prev => ({
        ...prev,
        yourName: userName,
        customPrompt: result.customPrompt || '',
        promptTemplate: templateType,
        metaPromptEditor: metaPromptOverride || template.metaPrompt || '',
        customAiPrompt: result.customAiPrompt || ''
      }));
      
      // Set active tab based on proposal mode
      const mode = result.proposalMode || 'ai';
      if (mode === 'custom') {
        setActiveTab('custom-instructions');
      } else if (mode === 'ai') {
        setActiveTab('ai-prompts');
      } else {
        setActiveTab('profile');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateProfile = async () => {
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          action: 'updateProfile',
          data: {
            firstName: userProfile?.firstName || '',
            lastName: userProfile?.lastName || ''
          }
        }, resolve);
      });
      
      if (response && response.success) {
        showStatusMessage('success', 'Profile updated successfully!');
        await loadUserProfile(); // Refresh profile data
      } else {
        showStatusMessage('error', response?.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      showStatusMessage('error', 'Failed to update profile');
    }
  };

  const changePassword = async () => {
    try {
      // Validate passwords
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showStatusMessage('error', 'New passwords do not match');
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        showStatusMessage('error', 'New password must be at least 6 characters long');
        return;
      }

      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          action: 'changePassword',
          data: {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          }
        }, resolve);
      });
      
      if (response && response.success) {
        showStatusMessage('success', 'Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordChange(false);
      } else {
        showStatusMessage('error', response?.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change failed:', error);
      showStatusMessage('error', 'Failed to change password');
    }
  };

  const saveCustomPrompt = async () => {
    try {
      await chrome.storage.local.set({ customPrompt: settings.customPrompt });
      showStatusMessage('success', 'Custom prompt saved successfully!');
    } catch (error) {
      showStatusMessage('error', 'Failed to save custom prompt');
    }
  };

  const resetCustomPrompt = () => {
    setSettings(prev => ({ ...prev, customPrompt: '' }));
    chrome.storage.local.set({ customPrompt: '' });
    showStatusMessage('info', 'Custom prompt reset to default');
  };

  const saveCustomAiPrompt = async () => {
    try {
      await chrome.storage.local.set({ customAiPrompt: settings.customAiPrompt });
      showStatusMessage('success', 'Custom AI prompt saved successfully!');
    } catch (error) {
      showStatusMessage('error', 'Failed to save custom AI prompt');
    }
  };

  const saveMetaPrompt = async () => {
    try {
      const templateType = settings.promptTemplate;
      const storageKey = getMetaPromptStorageKey(templateType);
      await chrome.storage.local.set({ [storageKey]: settings.metaPromptEditor });
      showStatusMessage('success', `Meta prompt saved for ${templateType} template!`);
    } catch (error) {
      showStatusMessage('error', 'Failed to save meta prompt');
    }
  };

  const resetMetaPrompt = async () => {
    try {
      const templateType = settings.promptTemplate;
      const storageKey = getMetaPromptStorageKey(templateType);
      const template = getTemplate(templateType);
      
      // Remove the override to use default
      await chrome.storage.local.remove([storageKey]);
      
      // Load the default meta prompt
      setSettings(prev => ({ 
        ...prev, 
        metaPromptEditor: template.metaPrompt || '' 
      }));
      
      showStatusMessage('info', `Meta prompt reset to default for ${templateType} template`);
    } catch (error) {
      showStatusMessage('error', 'Failed to reset meta prompt');
    }
  };

  const handleTemplateChange = async () => {
    const templateType = settings.promptTemplate;
    const template = getTemplate(templateType);
    
    // Load meta prompt override if it exists
    const storageKey = getMetaPromptStorageKey(templateType);
    try {
      const result = await chrome.storage.local.get([storageKey]);
      const metaPromptOverride = result[storageKey];
      
      setSettings(prev => ({
        ...prev,
        metaPromptEditor: metaPromptOverride || template.metaPrompt || ''
      }));
    } catch (error) {
      console.error('Error loading meta prompt override:', error);
      setSettings(prev => ({
        ...prev,
        metaPromptEditor: template.metaPrompt || ''
      }));
    }
  };

  const previewTemplate = () => {
    const templateType = settings.promptTemplate;
    const template = getTemplate(templateType);
    
    const previewContent = `
      <div style="margin-bottom: 15px;">
        <h5>Meta Prompt:</h5>
        <pre style="white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 12px;">${settings.metaPromptEditor || template.metaPrompt}</pre>
      </div>
      <div>
        <h5>Template Body:</h5>
        <pre style="white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px;">${template.template}</pre>
      </div>
    `;
    
    setTemplatePreview({
      show: true,
      content: previewContent
    });
  };

  const showStatusMessage = (type, message) => {
    setStatusMessage({ show: true, type, message });
    setTimeout(() => {
      setStatusMessage({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container fade-in">
        <div className="header">
          <h1>Upwork Cover Letter Generator</h1>
          <p>Loading settings...</p>
        </div>
        <div style={{textAlign: 'center', padding: '50px'}}>
          <div className="loading"></div>
          <p style={{marginTop: '20px', color: '#666'}}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show authentication required
  if (!isAuthenticated) {
    return (
      <div className="container fade-in">
        <div className="header">
          <h1>Upwork Cover Letter Generator</h1>
          <p>Please log in to access settings</p>
        </div>
        <div style={{textAlign: 'center', padding: '50px'}}>
          <div style={{fontSize: '48px', marginBottom: '20px', color: '#666'}}>🔐</div>
          <h2 style={{color: '#4a5568', marginBottom: '20px'}}>Authentication Required</h2>
          <p style={{color: '#666', marginBottom: '30px'}}>
            You need to be logged in to access the settings page.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <div className="header">
        <h1>Upwork Cover Letter Generator</h1>
        <p>Customize your proposal generation settings and create winning proposals</p>
      </div>
      
      {statusMessage.show && (
        <div className={`status-message status-${statusMessage.type}`}>
          {statusMessage.message}
        </div>
      )}
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={async () => {
            setActiveTab('profile');
            await chrome.storage.local.set({ proposalMode: 'profile' });
          }}
        >
          Profile
        </button>
        <button 
          className={`tab ${activeTab === 'custom-instructions' ? 'active' : ''}`}
          onClick={async () => {
            setActiveTab('custom-instructions');
            await chrome.storage.local.set({ proposalMode: 'custom' });
          }}
        >
          Custom Proposal
        </button>
        <button 
          className={`tab ${activeTab === 'ai-prompts' ? 'active' : ''}`}
          onClick={async () => {
            setActiveTab('ai-prompts');
            await chrome.storage.local.set({ proposalMode: 'ai' });
          }}
        >
          AI Prompts
        </button>
      </div>
      
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="tab-content active">
          <div className="settings-grid">
            <div className="settings-card">
              <h3 className="card-title">👤 Your Information</h3>
              
              {userProfile && (
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    className="form-input" 
                    value={userProfile.email || ''}
                    readOnly
                    style={{backgroundColor: '#f8f9fa', cursor: 'not-allowed'}}
                  />
                  <div className="form-help">Your email address (cannot be changed)</div>
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label" htmlFor="first-name">First Name</label>
                <input 
                  type="text" 
                  id="first-name" 
                  className="form-input" 
                  placeholder="Enter your first name"
                  value={userProfile?.firstName || ''}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="last-name">Last Name</label>
                <input 
                  type="text" 
                  id="last-name" 
                  className="form-input" 
                  placeholder="Enter your last name"
                  value={userProfile?.lastName || ''}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <button className="btn btn-primary" onClick={updateProfile}>
                  Update Profile
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    loadUserProfile();
                    showStatusMessage('info', 'Profile data refreshed from backend');
                  }}
                >
                  Refresh Profile Data
                </button>
              </div>
              <hr/>
              <div className="form-group" style={{display: 'flex', justifyContent:"flex-end",alignItems:"center",marginTop: '20px'}}>
               
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                >
                  {showPasswordChange ? 'Cancel Password Change' : 'Change Password'}
                </button>
              </div>
              
              {showPasswordChange && (
                <div className="form-group" style={{borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px'}}>
                  <h4 style={{marginBottom: '15px', color: '#4a5568'}}>Change Password</h4>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="current-password">Current Password</label>
                    <input 
                      type="password" 
                      id="current-password" 
                      className="form-input" 
                      placeholder="Enter current password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="new-password">New Password</label>
                    <input 
                      type="password" 
                      id="new-password" 
                      className="form-input" 
                      placeholder="Enter new password (min 6 characters)"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                    <input 
                      type="password" 
                      id="confirm-password" 
                      className="form-input" 
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                  
                  <div className="form-group">
                    <button className="btn btn-primary" onClick={changePassword}>
                      Change Password
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setShowPasswordChange(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Instructions Tab */}
      {activeTab === 'custom-instructions' && (
        <div className="tab-content active">
          <div className="settings-grid">
            <div className="settings-card" style={{gridColumn: '1 / -1'}}>
              <h3 className="card-title">Custom Proposal</h3>
              <p style={{marginBottom: '25px', color: '#4a5568', fontSize: '16px', lineHeight: '1.6'}}>
                Customize your proposals below to make them personal.
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="custom-prompt">Complete Proposal Generation Prompt</label>
                <textarea 
                  id="custom-prompt" 
                  className="form-textarea" 
                  rows="20" 
                  placeholder="Write your custom prompt here. This will be used to generate your cover letters.

EXAMPLE:
I have extensive experience in web development and I'm excited about this project. 

Based on the job description, I can see you need someone with expertise in the required technologies. I have extensive experience with these technologies and I'm confident I can deliver excellent results.

I'd love to learn more about your specific requirements and timeline. What's the most important aspect of this project for you?

Best regards,
[Your Name]"
                  value={settings.customPrompt}
                  onChange={(e) => setSettings({...settings, customPrompt: e.target.value})}
                />
                <div className="form-help">
                  <strong>How to use:</strong><br/>
                  • Write your custom proposal template here<br/>
                  • The AI will use this template to generate cover letters<br/>
                  • Make sure to include "[Your Name]" where you want your name to appear
                </div>
              </div>
              <div className="form-group">
                <button className="btn btn-primary" onClick={saveCustomPrompt}>
                  Save Settings
                </button>
                <button className="btn btn-secondary" onClick={resetCustomPrompt}>
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Prompts Tab */}
      {activeTab === 'ai-prompts' && (
        <div className="tab-content active">
          <div className="settings-grid">
            <div className="settings-card" style={{gridColumn: '1 / -1'}}>
              <h3 className="card-title">AI Proposal Prompts</h3>
              <p style={{marginBottom: '25px', color: '#4a5568', fontSize: '16px', lineHeight: '1.6'}}>
                Use these optimized AI prompts to generate high-converting Upwork proposals. Each template follows proven rules for maximum impact.
              </p>
              
              <div className="form-group">
                <label className="form-label" htmlFor="prompt-template">Template Type</label>
                <select 
                  id="prompt-template" 
                  className="form-input"
                  value={settings.promptTemplate}
                  onChange={async (e) => {
                    const newTemplate = e.target.value;
                    setSettings({...settings, promptTemplate: newTemplate});
                    
                    // Save template selection
                    await chrome.storage.local.set({ promptTemplate: newTemplate });
                    
                    // Load template-specific meta prompt
                    await handleTemplateChange();
                  }}
                >
                  {getTemplateOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
                <div className="form-help">Choose the template that best matches your target jobs</div>
              </div>

              <div className="form-group" id="meta-prompt-editor-section">
                <label className="form-label" htmlFor="meta-prompt-editor">Meta Prompt (advanced)</label>
                <textarea 
                  id="meta-prompt-editor" 
                  className="form-textarea" 
                  rows="8" 
                  placeholder="Edit the Meta Prompt for the selected template..."
                  value={settings.metaPromptEditor}
                  onChange={async (e) => {
                    const newValue = e.target.value;
                    setSettings({...settings, metaPromptEditor: newValue});
                    // Auto-save meta prompt override
                    const storageKey = getMetaPromptStorageKey(settings.promptTemplate);
                    await chrome.storage.local.set({ [storageKey]: newValue });
                  }}
                />
                <div className="form-help">This controls the rules the AI follows for this template. Overrides are saved per template.</div>
                <div style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
                  <button className="btn btn-primary" onClick={saveMetaPrompt}>
                    Save Meta Prompt
                  </button>
                  <button className="btn btn-secondary" onClick={resetMetaPrompt}>
                    Reset to Default
                  </button>
                </div>
              </div>

              {templatePreview.show && (
                <div className="template-preview">
                  <h4>Template Preview:</h4>
                  <div dangerouslySetInnerHTML={{ __html: templatePreview.content }} />
                </div>
              )}

              {settings.promptTemplate === 'custom' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="custom-ai-prompt">Custom AI Prompt</label>
                  <textarea 
                    id="custom-ai-prompt" 
                    className="form-textarea" 
                    rows="15" 
                    placeholder="Enter your custom AI prompt here..."
                    value={settings.customAiPrompt}
                    onChange={async (e) => {
                      const newValue = e.target.value;
                      setSettings({...settings, customAiPrompt: newValue});
                      // Auto-save custom AI prompt
                      await chrome.storage.local.set({ customAiPrompt: newValue });
                    }}
                  />
                  <div className="form-help">
                    <strong>Tips for custom prompts:</strong><br/>
                    • Start with "I have 8+ years of experience"<br/>
                    • Keep it under 8 lines<br/>
                    • Include 2 steps and 2-3 KPIs<br/>
                    • End with one clarifying question<br/>
                    • Use industry-specific terminology
                  </div>
                  <div style={{marginTop: '10px'}}>
                    <button className="btn btn-primary" onClick={saveCustomAiPrompt}>
                      Save Custom AI Prompt
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <button className="btn btn-secondary" onClick={previewTemplate}>
                  Preview Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;