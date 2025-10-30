import { handleAuth, toggleAuthMode, setupPasswordToggle, initializeAuthListener } from './auth.js';
import { applyTheme, showNotification } from './ui.js';

// Initialize theme
const initialTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(initialTheme);

// Theme toggle function
const toggleTheme = () => {
    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
};

// Tab switching
const switchTab = (tabId) => { 
    document.querySelectorAll('.tab-button').forEach(btn => btn.setAttribute('aria-selected', btn.dataset.tab === tabId)); 
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    const panel = document.getElementById(tabId);
    if(panel) panel.classList.remove('hidden');
};

// Initialize the application
const initializeApp = () => {
    // Setup event listeners
    document.getElementById('auth-form').addEventListener('submit', handleAuth);
    document.getElementById('auth-toggle').addEventListener('click', (e) => { e.preventDefault(); toggleAuthMode(); });
    
    setupPasswordToggle();
    initializeAuthListener();
    
    // Tab navigation
    document.getElementById('tabs-container').addEventListener('click', (e) => { 
        if (e.target.matches('.tab-button')) switchTab(e.target.dataset.tab); 
    });
    
    console.log("Digital Wallet App Initialized");
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export for use in other modules
export { toggleTheme, switchTab };
