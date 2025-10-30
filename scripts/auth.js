import { auth, db, appId, ADMIN_UID } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { initializeUserListeners, initializeAdminListeners } from './wallet.js';
import { showNotification } from './ui.js';

let currentUser = null;

const handleAuth = async (e) => { 
    e.preventDefault(); 
    const email = document.getElementById('email').value; 
    const password = document.getElementById('password').value; 
    const name = document.getElementById('name').value; 
    const mobile = document.getElementById('mobile').value; 
    document.getElementById('auth-error').textContent = ''; 
    
    try { 
        if (e.target.dataset.authMode === 'login') { 
            await signInWithEmailAndPassword(auth, email, password); 
        } else { 
            if (!name || !mobile) return document.getElementById('auth-error').textContent = 'Name and Mobile Number are required.'; 
            const cred = await createUserWithEmailAndPassword(auth, email, password); 
            await setDoc(doc(db, `artifacts/${appId}/public/data/users`, cred.user.uid), { 
                uid: cred.user.uid, 
                email: cred.user.email, 
                name, 
                mobile,
                paymentMethod: '',
                paymentDetails: {},
                balance: 0, 
                createdAt: serverTimestamp() 
            }); 
        } 
    } catch (error) { 
        document.getElementById('auth-error').textContent = error.message; 
        console.error("Auth failed:", error);
    }
};

const toggleAuthMode = () => { 
    const form = document.getElementById('auth-form'); 
    const isLogin = form.dataset.authMode === 'signup'; 
    form.dataset.authMode = isLogin ? 'login' : 'signup'; 
    form.classList.toggle('signup-mode', !isLogin); 
    document.getElementById('auth-error').textContent = ''; 
    form.reset(); 
    document.getElementById('auth-title').textContent = isLogin ? 'Login to your Wallet' : 'Create a New Wallet'; 
    document.getElementById('auth-button').textContent = isLogin ? 'Login' : 'Sign Up'; 
    document.getElementById('auth-prompt').textContent = isLogin ? "Don't have an account? " : 'Already have an account? '; 
    document.getElementById('auth-toggle').textContent = isLogin ? 'Sign Up' : 'Login'; 
};

// Password toggle functionality
const setupPasswordToggle = () => {
    document.getElementById('password-toggle').addEventListener('click', () => { 
        const passInput = document.getElementById('password'); 
        const isOpen = passInput.type === 'password'; 
        passInput.type = isOpen ? 'text' : 'password'; 
        document.getElementById('eye-open').classList.toggle('hidden', isOpen); 
        document.getElementById('eye-closed').classList.toggle('hidden', !isOpen); 
    });
};

// Auth state listener
const initializeAuthListener = () => {
    onAuthStateChanged(auth, async (user) => {
        console.log("Auth state changed, user:", user ? user.uid : 'null');
        
        if (user) {
            currentUser = user;
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            
            const isAdmin = user.uid === ADMIN_UID;
            initializeUserListeners(user.uid);
            
            document.getElementById('admin-tab-button').classList.toggle('hidden', !isAdmin);
            document.getElementById('main-menu-btn').classList.remove('hidden');

            if (isAdmin) {
                console.log("User is Admin, initializing admin listeners...");
                initializeAdminListeners();
            }
        } else {
            currentUser = null;
            document.getElementById('auth-screen').classList.remove('hidden');
            document.getElementById('main-content').classlist.add('hidden');
            document.getElementById('main-menu-btn').classList.add('hidden');
        }
    });
};

const getCurrentUser = () => currentUser;

export { 
    handleAuth, 
    toggleAuthMode, 
    setupPasswordToggle, 
    initializeAuthListener, 
    getCurrentUser,
    signOut 
};
