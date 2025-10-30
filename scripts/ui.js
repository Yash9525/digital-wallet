import { toggleTheme } from './app.js';

// Theme functions
const applyTheme = (theme) => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    
    const lightIcon = document.getElementById('settings-theme-icon-light');
    const darkIcon = document.getElementById('settings-theme-icon-dark');
    
    if (lightIcon && darkIcon) {
        if (theme === 'dark') {
            lightIcon.classList.add('hidden');
            darkIcon.classList.remove('hidden');
        } else {
            lightIcon.classList.remove('hidden');
            darkIcon.classList.add('hidden');
        }
    }
};

// Notification functions
let notificationTimeout;

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
    
    notificationTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

// Modal functions
const renderModal = (title, content, actions, size = 'max-w-md', colorfulBorder = false) => { 
    const borderClass = colorfulBorder ? 'colorful-border' : '';
    document.getElementById('modal-container').innerHTML = `
        <div id="app-modal" class="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div class="fixed inset-0 modal-backdrop" onclick="window.closeModal()"></div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 w-full ${size} p-6 transform transition-all scale-95 opacity-0 animate-modal-in ${borderClass}">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">${title}</h3>
                    <button onclick="window.closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl">&times;</button>
                </div>
                <div>${content}</div>
                <div class="mt-6 flex justify-end space-x-3">${actions}</div>
            </div>
        </div>`; 
};

const closeModal = () => { 
    document.getElementById('modal-container').innerHTML = ''; 
};

// Page navigation
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

// Utility functions
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

// Make functions globally available
window.closeModal = closeModal;
window.closeNotification = closeNotification;

export {
    applyTheme,
    showNotification,
    renderModal,
    closeModal,
    showPage,
    hidePage,
    formatCurrency,
    formatDate,
    formatDateDDMMYY
};
