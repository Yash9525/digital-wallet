import { db, appId, ADMIN_UID } from './firebase.js';
import { getCurrentUser } from './auth.js';
import { showNotification, showPage, hidePage, formatCurrency, formatDate, formatDateDDMMYY, renderModal } from './ui.js';
import { 
    doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, 
    serverTimestamp, where, arrayUnion, updateDoc, getDocs, runTransaction,
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let currentUserData = null;
let allUsersCache = [];
let allFundRequestsCache = [];
let unifiedHistoryCache = [];
const unsubscribers = [];

// Initialize user listeners
const initializeUserListeners = (userId) => {
    console.log(`Initializing user listeners for ${userId}`);
    const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, userId);
    
    unsubscribers.push(onSnapshot(userDocRef, (doc) => { 
        if (doc.exists()) { 
            console.log("User data snapshot received:", doc.data());
            const data = doc.data(); 
            document.getElementById('user-balance').textContent = formatCurrency(data.balance); 
            currentUserData = data; 
            if (userId === ADMIN_UID) {
                document.getElementById('admin-wallet-balance').textContent = formatCurrency(data.balance); 
            }
        } else {
            console.warn(`User document not found for ${userId} (snapshot listener)`);
        }
    }, (error) => console.error("Error listening to user doc:", error)));

    let transactions = []; 
    let pendingRequests = [];
    let pendingLoans = [];
    
    const renderUnifiedHistory = (limit) => { 
        let combined = [ 
            ...transactions.map(t => ({...t, key: `tx-${t.timestamp?.toMillis()}`, ...t})), 
            ...pendingRequests.map(p => ({...p, key: `req-${p.requestedAt?.toMillis()}`, type: 'withdrawal', comment: 'Withdrawal Request', timestamp: p.requestedAt, status: 'pending', ...p})),
            ...pendingLoans.map(l => ({...l, key: `loan-${l.requestedAt?.toMillis()}`, type: 'loan', comment: 'Loan Request', timestamp: l.requestedAt, status: 'pending', ...l}))
        ]; 
        combined.sort((a,b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0)); 
        unifiedHistoryCache = combined; 

        const listElement = document.getElementById('transactions-list');
        const limitedList = limit ? combined.slice(0, limit) : combined;

        listElement.innerHTML = limitedList.length === 0 
            ? `<p class="text-gray-500 dark:text-gray-400">No transactions yet.</p>` 
            : limitedList.map(item => renderTransactionItem(item)).join('');
    };

    const transactionsQuery = query(collection(db, `artifacts/${appId}/public/data/users`, userId, 'transactions'), orderBy('timestamp', 'desc'));
    unsubscribers.push(onSnapshot(transactionsQuery, (snap) => { 
        transactions = snap.docs.map(d => d.data()); 
        renderUnifiedHistory(5); 
    }, (error) => console.error("Error listening to transactions:", error)));

    const requestsQuery = query(collection(db, `artifacts/${appId}/public/data/fund_requests`), where("userId", "==", userId), where("status", "==", "pending"));
    unsubscribers.push(onSnapshot(requestsQuery, (snap) => { 
        pendingRequests = snap.docs.map(d => ({id: d.id, ...d.data()})); 
        renderUnifiedHistory(5); 
    }, (error) => console.error("Error listening to fund requests:", error)));

    const loansQuery = query(collection(db, `artifacts/${appId}/public/data/loan_requests`), where("userId", "==", userId), where("status", "==", "pending"));
    unsubscribers.push(onSnapshot(loansQuery, (snap) => { 
        pendingLoans = snap.docs.map(d => ({id: d.id, ...d.data()})); 
        renderUnifiedHistory(5); 
    }, (error) => console.error("Error listening to loan requests:", error)));
};

// Initialize admin listeners
const initializeAdminListeners = () => {
    console.log("Initializing admin listeners...");
    
    const usersQuery = query(collection(db, `artifacts/${appId}/public/data/users`));
    unsubscribers.push(onSnapshot(usersQuery, (snap) => { 
        console.log(`Admin listener: ${snap.docs.length} users fetched.`);
        allUsersCache = snap.docs.map(d => ({ id: d.id, ...d.data() })); 
        console.log("All users:", allUsersCache);
        
        let totalFunds = 0; 
        allUsersCache.forEach(u => { 
            if(u.id !== ADMIN_UID) totalFunds += u.balance || 0; 
        }); 
        
        document.getElementById('analytics-total-users').textContent = allUsersCache.length > 0 ? allUsersCache.length - 1 : 0; 
        document.getElementById('analytics-total-funds').textContent = formatCurrency(totalFunds); 
        
        if(document.getElementById('admin-users-list-page')) {
            const usersToRender = allUsersCache
                .filter(u => u.id !== ADMIN_UID)
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            renderAdminUsersList(usersToRender);
        }
    }, (error) => console.error("Admin: Error listening to users collection:", error)));

    const codesQuery = query(collection(db, `artifacts/${appId}/public/data/gift_codes`));
    unsubscribers.push(onSnapshot(codesQuery, (snap) => { 
        console.log(`Admin listener: ${snap.docs.length} gift codes fetched.`);
        const totalRedeemed = snap.docs.reduce((acc, doc) => acc + (doc.data().timesUsed || 0), 0);
        document.getElementById('analytics-gift-cards').textContent = totalRedeemed; 
        
        if(document.getElementById('gift-codes-list-page')) {
           renderAdminGiftCodesList(snap.docs);
        }
    }, (error) => console.error("Admin: Error listening to gift codes:", error)));

    const allFundRequestsQuery = query(collection(db, `artifacts/${appId}/public/data/fund_requests`));
    unsubscribers.push(onSnapshot(allFundRequestsQuery, (snap) => {
        console.log(`Admin listener: ${snap.docs.length} fund requests fetched.`);
        const allRequests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allFundRequestsCache = allRequests.filter(req => req.status === 'pending');
        
        document.getElementById('analytics-pending-reqs').textContent = allFundRequestsCache.length;
        
        if(document.getElementById('admin-fund-requests-list-page')) {
            renderAdminFundRequests(allFundRequestsCache);
        }
    }, (error) => console.error("Admin: Error listening to all fund requests:", error)));
};

// Transaction item renderer
const renderTransactionItem = (item, isFullPage = false) => {
    const clickableClass = item.status !== 'pending' ? 'tx-item-clickable' : '';
    const dataKey = item.status !== 'pending' ? `data-key="${item.key}"` : '';

    if(item.status === 'pending') {
        return `
            <div class="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                <div class="flex-1">
                    <p class="font-semibold capitalize">${item.type === 'loan' ? 'Loan Request' : 'Withdrawal Request'}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${formatDate(item.timestamp)}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-yellow-600">${formatCurrency(item.amount)}</p>
                    <p class="text-xs font-semibold text-yellow-600">Pending</p>
                </div>
            </div>`;
    }
    const isCredit = ['credit', 'gift_card', 'wallet_transfer', 'loan_approved'].includes(item.type);
    const sign = isCredit ? '+' : '-';
    const colorClass = isCredit ? 'text-green-500' : 'text-red-500';
    
    return `
        <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm ${clickableClass}" ${dataKey}>
            <div class="flex-1">
                <p class="font-semibold capitalize">${item.comment.replace(/_/g, ' ')}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${formatDateDDMMYY(item.timestamp)}</p>
            </div>
            <p class="font-bold ${colorClass}">
                ${sign}${formatCurrency(item.amount)}
            </p>
        </div>`;
};

// Export functions and variables
export {
    initializeUserListeners,
    initializeAdminListeners,
    currentUserData,
    allUsersCache,
    allFundRequestsCache,
    unifiedHistoryCache,
    unsubscribers,
    renderTransactionItem
};
