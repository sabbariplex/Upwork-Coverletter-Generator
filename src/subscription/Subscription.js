import React, { useState, useEffect } from 'react';
import './styles.css';

const Subscription = () => {
  const [usage, setUsage] = useState({
    proposalsUsed: 0,
    proposalLimit: 50,
    subscriptionStatus: 'Free',
    totalProposals: 0,
    remainingProposals: 50
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = () => {
    chrome.runtime.sendMessage({action: 'getUsage'}, function(response) {
      if (response && response.success) {
        const usageData = response.usage;
        setUsage({
          proposalsUsed: usageData.proposalsUsed || 0,
          proposalLimit: usageData.proposalLimit || 50,
          subscriptionStatus: usageData.subscriptionStatus || 'Free',
          totalProposals: usageData.totalProposals || 0,
          remainingProposals: (usageData.proposalLimit || 50) - (usageData.proposalsUsed || 0)
        });
      }
      setLoading(false);
    });
  };

  const handleUpgrade = () => {
    // Handle upgrade logic
    chrome.runtime.sendMessage({action: 'upgradeSubscription'}, function(response) {
      if (response && response.success) {
        alert('Upgrade successful!');
        loadSubscriptionInfo();
      } else {
        alert('Upgrade failed: ' + (response?.error || 'Unknown error'));
      }
    });
  };

  const getCurrentPlanName = () => {
    if (usage.subscriptionStatus === 'premium') return 'Premium';
    if (usage.subscriptionStatus === 'expired') return 'Expired';
    return 'Free';
  };

  const getCurrentLimit = () => {
    if (usage.subscriptionStatus === 'premium') return '∞';
    return usage.proposalLimit;
  };

  const getUsagePercentage = () => {
    if (usage.subscriptionStatus === 'premium') return 0;
    return Math.min((usage.proposalsUsed / usage.proposalLimit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Upgrade Your Plan</h1>
        <p>Unlock unlimited AI-powered proposals and boost your Upwork success</p>
      </div>
      
      <div id="current-plan-info" className={`current-plan ${usage.subscriptionStatus !== 'Free' ? '' : 'hidden'}`}>
        <h3>Current Plan: <span id="current-plan-name">{getCurrentPlanName()}</span></h3>
        <p>Proposals used: <span id="current-usage">{usage.proposalsUsed}</span>/<span id="current-limit">{getCurrentLimit()}</span></p>
      </div>
      
      <div className="usage-stats">
        <h3>Usage Statistics</h3>
        <div className="usage-item">
          <span className="usage-label">Proposals Generated</span>
          <span className="usage-value" id="total-proposals">{usage.totalProposals}</span>
        </div>
        <div className="usage-item">
          <span className="usage-label">Remaining (Free Tier)</span>
          <span className="usage-value" id="remaining-proposals">{usage.remainingProposals}</span>
        </div>
        <div className="usage-item">
          <span className="usage-label">Plan Status</span>
          <span className="usage-value" id="plan-status">{getCurrentPlanName()}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            id="usage-progress" 
            style={{width: `${getUsagePercentage()}%`}}
          ></div>
        </div>
      </div>
      
      <div className="subscription-grid">
        <div className="subscription-card">
          <div className="plan-name">Free</div>
          <div className="plan-price">$0<span className="period">/month</span></div>
          <ul className="plan-features">
            <li>50 AI-generated proposals</li>
            <li>Basic customization</li>
            <li>Standard support</li>
            <li>Upwork integration</li>
          </ul>
          <button className="btn btn-secondary" disabled>Current Plan</button>
        </div>
        
        <div className="subscription-card featured">
          <div className="plan-name">Premium</div>
          <div className="plan-price">$9.99<span className="period">/month</span></div>
          <ul className="plan-features">
            <li>Unlimited AI proposals</li>
            <li>Advanced customization</li>
            <li>Priority support</li>
            <li>Multiple templates</li>
            <li>Analytics dashboard</li>
            <li>Export/Import settings</li>
          </ul>
          <button className="btn btn-primary" id="upgrade-btn" onClick={handleUpgrade}>
            Upgrade Now
          </button>
        </div>
      </div>
      
      <div style={{textAlign: 'center', marginTop: '30px'}}>
        <p style={{color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px'}}>
          Secure payment processing • Cancel anytime • 30-day money-back guarantee
        </p>
      </div>
    </div>
  );
};

export default Subscription;