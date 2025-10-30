// ===== COMBINED SCRIPT FOR DIGITAL WALLET =====
// This combines all modules into one file to fix module loading issues

// Firebase Configuration
const firebaseConfig = { 
    apiKey: "AIzaSyBzF1agrBFFh4cC2DkmZKePf4-gjE05OQo", 
    authDomain: "review-world-1312e.firebaseapp.com", 
    projectId: "review-world-1312e", 
    storageBucket: "review-world-1312e.firebasestorage.app", 
    messagingSenderId: "372772434173", 
    appId: "1:372772434173:web:bfeb08e0c96886ace94", 
    measurementId: "G-X90GP8JTL8" 
};

// Constants
const ADMIN_UID = "mOs5Fmp4RoRzeBDH4pZLMOpQx7Q2";
const appId = 'digital-wallet-prod';

// Global variables
let currentUser = null;
let currentUserData = null;
let allUsersCache = [];
let allFundRequestsCache = [];
let unifiedHistoryCache = [];
let notificationTimeout;
const unsubscribers = [];

// ===== UTILITY FUNCTIONS =====
const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const d = timestamp.toDate();
    const date = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    const time = d.toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true 
    });
    return `${date} ${time}`;
};

const formatDateDDMMYY = (timestamp) => { 
    if (!timestamp) return 'N/A'; 
    const d = timestamp.toDate(); 
    const dd = String(d.getDate()).padStart(2, '0'); 
    const mm = String(d.getMonth() + 1).padStart(2, '0'); 
    const yy = String(d.getFullYear()).slice(-2); 
    const time = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    return `${dd}/${mm}/${yy} ${time}`; 
};

// Sound functions
const playSuccessSound = () => {
    const audio = document.getElementById('success-sound');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Audio play failed:", e));
    }
};

const playErrorSound = () => {
    const audio = document.getElementById('error-sound');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Audio play failed:", e));
    }
};

// ===== NOTIFICATION SYSTEM =====
const closeNotification = () => {
    if (notificationTimeout) clearTimeout(notificationTimeout);
    document.getElementById('notification-toast').classList.remove('show');
};

const showNotification = (message, isError = false, playSound = true) => {
    const toast = document.getElementById('notification-toast');
    if (notificationTimeout) clearTimeout(notificationTimeout); 

    const toastClass = isError ? 'toast-error' : 'toast-success';
    const iconPath = isError 
        ? 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
        : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    
    toast.innerHTML = `
        <div class="toast-content ${toastClass}">
            <div class="toast-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}" />
                </svg>
            </div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="closeNotification()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
            <div class="toast-progress"></div>
        </div>`;
    
    toast.classList.add('show');
    
    if (playSound) {
        if (isError) {
            playErrorSound();
        } else {
            playSuccessSound();
        }
    }
    
    notificationTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

// ===== MODAL SYSTEM =====
const renderModal = (title, content, actions, size = 'max-w-md', colorfulBorder = false) => { 
    const borderClass = colorfulBorder ? 'colorful-border' : '';
    document.getElementById('modal-container').innerHTML = `
        <div id="app-modal" class="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div class="fixed inset-0 modal-backdrop" onclick="closeModal()"></div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 w-full ${size} p-6 transform transition-all scale-95 opacity-0 animate-modal-in ${borderClass}">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">${title}</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl">&times;</button>
                </div>
                <div>${content}</div>
                <div class="mt-6 flex justify-end space-x-3">${actions}</div>
            </div>
        </div>`; 
};

const closeModal = () => { 
    document.getElementById('modal-container').innerHTML = ''; 
};

// ===== PAGE NAVIGATION =====
const showPage = (content) => {
    document.getElementById('dashboard-content').classList.add('hidden');
    const pageContainer = document.getElementById('page-container');
    pageContainer.innerHTML = content;
    pageContainer.classList.remove('hidden');
    const backButton = pageContainer.querySelector('.page-back-btn');
    if (backButton) {
        backButton.onclick = hidePage;
    }
};

const hidePage = () => {
    document.getElementById('dashboard-content').classList.remove('hidden');
    document.getElementById('page-container').classList.add('hidden');
    document.getElementById('page-container').innerHTML = '';
};

// ===== THEME SYSTEM =====
const applyTheme = (theme) => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
};

const toggleTheme = () => {
    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
};

// ===== AUTHENTICATION =====
const handleAuth = async (e) => { 
    e.preventDefault(); 
    const email = document.getElementById('email').value; 
    const password = document.getElementById('password').value; 
    const name = document.getElementById('name').value; 
    const mobile = document.getElementById('mobile').value; 
    document.getElementById('auth-error').textContent = ''; 
    
    showNotification('Attempting login...', false, false);
    
    try { 
        if (document.getElementById('auth-form').dataset.authMode === 'login') { 
            await firebase.auth().signInWithEmailAndPassword(email, password); 
        } else { 
            if (!name || !mobile) {
                document.getElementById('auth-error').textContent = 'Name and Mobile Number are required.';
                return;
            }
            const cred = await firebase.auth().createUserWithEmailAndPassword(email, password); 
            await firebase.firestore().doc(`artifacts/${appId}/public/data/users/${cred.user.uid}`).set({ 
                uid: cred.user.uid, 
                email: cred.user.email, 
                name, 
                mobile,
                paymentMethod: '',
                paymentDetails: {},
                balance: 0, 
                createdAt: firebase.firestore.FieldValue.serverTimestamp() 
            }); 
        } 
    } catch (error) { 
        document.getElementById('auth-error').textContent = error.message; 
        showNotification('Login failed: ' + error.message, true);
        console.error("Auth failed:", error);
    }
};

const toggleAuthMode = () => { 
    const form = document.getElementById('auth-form'); 
    const isLogin = form.dataset.authMode === 'signup'; 
    form.dataset.authMode = isLogin ? 'login' : 'signup'; 
    document.getElementById('auth-error').textContent = ''; 
    form.reset(); 
    document.getElementById('auth-title').textContent = isLogin ? 'Login to your Wallet' : 'Create a New Wallet'; 
    document.getElementById('auth-button').textContent = isLogin ? 'Login' : 'Sign Up'; 
    document.getElementById('auth-prompt').textContent = isLogin ? "Don't have an account? " : 'Already have an account? '; 
    document.getElementById('auth-toggle').textContent = isLogin ? 'Sign Up' : 'Login'; 
};

// ===== PASSWORD TOGGLE =====
const setupPasswordToggle = () => {
    document.getElementById('password-toggle').addEventListener('click', () => { 
        const passInput = document.getElementById('password'); 
        const isOpen = passInput.type === 'password'; 
        passInput.type = isOpen ? 'text' : 'password'; 
        document.getElementById('eye-open').classList.toggle('hidden', isOpen); 
        document.getElementById('eye-closed').classList.toggle('hidden', !isOpen); 
    });
};

// ===== INITIALIZE FIREBASE =====
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// ===== AUTH STATE LISTENER =====
firebase.auth().onAuthStateChanged(async (user) => {
    console.log("Auth state changed, user:", user ? user.uid : 'null');
    
    if (user) {
        currentUser = user;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        
        const isAdmin = user.uid === ADMIN_UID;
        
        // Show admin tab if admin
        document.getElementById('admin-tab-button').classList.toggle('hidden', !isAdmin);
        document.getElementById('main-menu-btn').classList.remove('hidden');

        // Load user data
        await loadUserData(user.uid);
        
        showNotification('Login successful!', false, true);
        
    } else {
        currentUser = null;
        currentUserData = null;
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('main-content').classList.add('hidden');
        document.getElementById('main-menu-btn').classList.add('hidden');
    }
});

// ===== LOAD USER DATA =====
const loadUserData = async (userId) => {
    try {
        const userDoc = await firebase.firestore().doc(`artifacts/${appId}/public/data/users/${userId}`).get();
        if (userDoc.exists) {
            currentUserData = userDoc.data();
            document.getElementById('user-balance').textContent = formatCurrency(currentUserData.balance);
            
            if (userId === ADMIN_UID) {
                document.getElementById('admin-wallet-balance').textContent = formatCurrency(currentUserData.balance);
            }
            
            // Load transactions
            loadUserTransactions(userId);
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        showNotification('Error loading user data', true);
    }
};

// ===== LOAD TRANSACTIONS =====
const loadUserTransactions = async (userId) => {
    try {
        const transactionsQuery = firebase.firestore()
            .collection(`artifacts/${appId}/public/data/users/${userId}/transactions`)
            .orderBy('timestamp', 'desc')
            .limit(5);
        
        transactionsQuery.onSnapshot((snapshot) => {
            const transactions = snapshot.docs.map(doc => doc.data());
            renderTransactions(transactions);
        });
    } catch (error) {
        console.error("Error loading transactions:", error);
    }
};

// ===== RENDER TRANSACTIONS =====
const renderTransactions = (transactions) => {
    const transactionsList = document.getElementById('transactions-list');
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No transactions yet.</p>';
        return;
    }
    
    transactionsList.innerHTML = transactions.map(transaction => `
        <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
            <div class="flex-1">
                <p class="font-semibold capitalize">${transaction.comment || 'Transaction'}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${formatDateDDMMYY(transaction.timestamp)}</p>
            </div>
            <p class="font-bold ${transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'}">
                ${transaction.type === 'credit' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </p>
        </div>
    `).join('');
};

// ===== BASIC BUTTON HANDLERS =====
const setupBasicHandlers = () => {
    // Withdraw button
    document.getElementById('withdraw-fund-btn').addEventListener('click', () => {
        showNotification('Withdraw feature coming soon!', false, true);
    });
    
    // Redeem gift card
    document.getElementById('redeem-gift-card-btn').addEventListener('click', () => {
        renderModal('Redeem Gift Card', 
            `<input type="text" id="gift-code-input" placeholder="Enter your code" class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg">`, 
            `<button onclick="closeModal()" class="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
             <button onclick="handleRedeem()" class="px-4 py-2 text-sm bg-green-500 text-white rounded-lg">Redeem</button>`); 
    });
    
    // Pay to wallet
    document.getElementById('pay-to-wallet-btn').addEventListener('click', () => {
        showNotification('Pay to wallet feature coming soon!', false, true);
    });
    
    // Take loan
    document.getElementById('take-loan-btn').addEventListener('click', () => {
        showNotification('Loan feature coming soon!', false, true);
    });
    
    // View all transactions
    document.getElementById('view-all-tx-btn').addEventListener('click', () => {
        showNotification('View all transactions feature coming soon!', false, true);
    });
    
    // Admin wallet management
    document.getElementById('manage-admin-wallet-btn').addEventListener('click', () => {
        showNotification('Admin wallet management coming soon!', false, true);
    });
};

// ===== REDEEM HANDLER =====
const handleRedeem = async () => {
    const code = document.getElementById('gift-code-input').value.trim().toUpperCase();
    if (!code) {
        showNotification('Please enter a gift code', true);
        return;
    }
    
    showNotification('Redeeming code...', false, false);
    
    try {
        // Simulate redemption
        setTimeout(() => {
            showNotification('Gift code redeemed successfully! ₹100 added to your wallet.', false, true);
            closeModal();
        }, 1500);
    } catch (error) {
        showNotification('Failed to redeem code: ' + error.message, true);
    }
};

// ===== TAB SWITCHING =====
const switchTab = (tabId) => { 
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.setAttribute('aria-selected', btn.dataset.tab === tabId);
    }); 
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    const panel = document.getElementById(tabId);
    if (panel) panel.classList.remove('hidden');
};

// ===== MAIN MENU =====
const openSlideMenu = () => {
    const menu = document.getElementById('slide-menu');
    const isAdmin = currentUser && currentUser.uid === ADMIN_UID;
    
    let adminItems = '';
    if (isAdmin) {
        adminItems = `
            <hr class="border-gray-200 dark:border-gray-700 my-2">
            <p class="text-xs font-semibold text-gray-400 uppercase px-4 pt-2">Admin</p>
            <button class="flex items-center w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>
                Pending Requests
            </button>`;
    }

    menu.innerHTML = `
        <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold">Menu</h3>
            <button onclick="closeSlideMenu()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        <div class="p-2 space-y-1">
            <button class="flex items-center w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                My Profile
            </button>
            <button onclick="toggleTheme()" class="flex items-center w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Toggle Theme
            </button>
            
            ${adminItems}

            <hr class="border-gray-200 dark:border-gray-700 my-2">
            
            <button onclick="handleLogout()" class="flex items-center w-full text-left p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Logout
            </button>
        </div>
    `;

    document.getElementById('menu-overlay').classList.remove('hidden');
    menu.classList.remove('translate-x-full');
};

const closeSlideMenu = () => {
    document.getElementById('slide-menu').classList.add('translate-x-full');
    document.getElementById('menu-overlay').classList.add('hidden');
};

const handleLogout = () => {
    firebase.auth().signOut().then(() => {
        showNotification('Logged out successfully', false, true);
    });
};

// ===== INITIALIZE APP =====
const initializeApp = () => {
    // Initialize theme
    const initialTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(initialTheme);
    
    // Setup event listeners
    document.getElementById('auth-form').addEventListener('submit', handleAuth);
    document.getElementById('auth-toggle').addEventListener('click', (e) => { 
        e.preventDefault(); 
        toggleAuthMode(); 
    });
    
    setupPasswordToggle();
    setupBasicHandlers();
    
    // Tab navigation
    document.getElementById('tabs-container').addEventListener('click', (e) => { 
        if (e.target.matches('.tab-button')) {
            switchTab(e.target.dataset.tab); 
        }
    });
    
    // Main menu button
    document.getElementById('main-menu-btn').addEventListener('click', openSlideMenu);
    
    console.log("Digital Wallet App Initialized");
};

// Make functions globally available
window.closeModal = closeModal;
window.closeNotification = closeNotification;
window.closeSlideMenu = closeSlideMenu;
window.toggleTheme = toggleTheme;
window.handleRedeem = handleRedeem;
window.handleLogout = handleLogout;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Add Firebase SDKs if not already loaded
if (typeof firebase === 'undefined') {
    const firebaseScript = document.createElement('script');
    firebaseScript.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
    document.head.appendChild(firebaseScript);
    
    const authScript = document.createElement('script');
    authScript.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
    document.head.appendChild(authScript);
    
    const firestoreScript = document.createElement('script');
    firestoreScript.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js';
    document.head.appendChild(firestoreScript);
    
    firebaseScript.onload = () => {
        initializeApp();
    };
}
