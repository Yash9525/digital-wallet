import React, { useState, useEffect } from 'react'; // Using standard package imports for Firebase SDKs import { initializeApp } from "firebase/app"; import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"; import { getFirestore, doc, setDoc, getDoc, collection, query, where, onSnapshot, runTransaction, addDoc, serverTimestamp } from "firebase/firestore"; // Importing necessary icons, including Eye and EyeOff import { AppWindow, Users, DollarSign, LogOut, Clock, CheckCircle, XCircle, Wallet, UserPlus, ShieldCheck, Eye, EyeOff } from 'lucide-react'; // --- Firebase Configuration --- // Your specific Firebase configuration has been added here. const firebaseConfig = { apiKey: "AIzaSyBzF1agrBFFh4cC2DkmZKePf4-gjE05OQo", authDomain: "review-world-1312e.firebaseapp.com", projectId: "review-world-1312e", storageBucket: "review-world-1312e.appspot.com", messagingSenderId: "372772434173", appId: "1:372772434173:web:bfeb08e02e0c96886ace94", measurementId: "G-X90GP8JTL8" }; // Initialize Firebase const app = initializeApp(firebaseConfig); const auth = getAuth(app); const db = getFirestore(app); // --- Helper Components --- const IconWrapper = ({ icon: Icon, className }) => (
); const StatCard = ({ title, value, icon: Icon, color = 'text-white' }) => (
{title}

{value}

); const Modal = ({ isOpen, onClose, title, children }) => { if (!isOpen) return null; return (
{title}

{children}
); }; // --- Authentication Screen --- const AuthScreen = () => { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [adminPin, setAdminPin] = useState(''); const [isSignUp, setIsSignUp] = useState(true); const [isAdminSignUp, setIsAdminSignUp] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [passwordVisible, setPasswordVisible] = useState(false); const ADMIN_REGISTRATION_PIN = '952518'; const handleAuthAction = async (e) => { e.preventDefault(); setLoading(true); setError(''); try { if (isSignUp) { if (isAdminSignUp && adminPin !== ADMIN_REGISTRATION_PIN) { setError('Incorrect Admin PIN. Registration denied.'); setLoading(false); return; } const userCredential = await createUserWithEmailAndPassword(auth, email, password); const user = userCredential.user; await setDoc(doc(db, "users", user.uid), { uid: user.uid, email: user.email, role: isAdminSignUp ? 'admin' : 'user', balance: 0, createdAt: serverTimestamp() }); } else { await signInWithEmailAndPassword(auth, email, password); } } catch (err) { setError(err.message.replace('Firebase: ', '')); } finally { setLoading(false); } }; return (
Digital Wallet
{isSignUp ? 'Create an Account' : 'Welcome Back'}
{isSignUp ? 'Sign up to manage your funds' : 'Sign in to access your wallet'}

{error &&
{error}

}
{email}
 setEmail(e.target.value)} placeholder="Email address" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
{password}
 setPassword(e.target.value)} placeholder="Password (6+ characters)" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" required /> setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"> {passwordVisible ? : }
{isSignUp && ( <>  setIsAdminSignUp(e.target.checked)} className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500" /> Sign up as Admin {isAdminSignUp && (
••••••••••
 setAdminPin(e.target.value)} placeholder="Admin Registration PIN" className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
)} )} {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
{isSignUp ? 'Already have an account?' : "Don't have an account?"} { setIsSignUp(!isSignUp); setError(''); }} className="font-semibold text-blue-400 hover:text-blue-300 ml-1"> {isSignUp ? 'Sign In' : 'Sign Up'}

© Reviews world 2022
); }; // --- User Dashboard --- const UserDashboard = ({ user, userData }) => { const [transactions, setTransactions] = useState([]); const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false); const [withdrawAmount, setWithdrawAmount] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); useEffect(() => { if (!user?.uid) return; const q = query(collection(db, "transactions"), where("uid", "==", user.uid)); const unsubscribe = onSnapshot(q, (querySnapshot) => { const userTransactions = []; querySnapshot.forEach((doc) => { userTransactions.push({ id: doc.id, ...doc.data() }); }); userTransactions.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0)); setTransactions(userTransactions); }); return () => unsubscribe(); }, [user?.uid]); const handleWithdrawRequest = async (e) => { e.preventDefault(); const amount = parseFloat(withdrawAmount); if (isNaN(amount) || amount <= 0) { setError("Please enter a valid positive amount."); return; } if (amount > userData.balance) { setError("Withdrawal amount cannot exceed your balance."); return; } setLoading(true); setError(''); try { await addDoc(collection(db, "transactions"), { uid: user.uid, email: user.email, amount: amount, type: 'withdrawal_request', status: 'pending', timestamp: serverTimestamp() }); setWithdrawModalOpen(false); setWithdrawAmount(''); } catch (err) { setError("Failed to submit request. Please try again."); console.error(err); } finally { setLoading(false); } }; const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0); const formatDate = (timestamp) => timestamp ? new Date(timestamp.toDate()).toLocaleString() : 'N/A'; return (
My Wallet
{user.email}

signOut(auth)} className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"> Logout
Current Balance

{formatCurrency(userData.balance)}

setWithdrawModalOpen(true)} className="mt-6 w-full md:w-auto bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg self-start hover:bg-blue-100 transition-transform hover:scale-105 shadow-lg"> Request Withdrawal
Transaction History
{transactions.length > 0 ? transactions.map(tx => ( )) : ( )}
Date	Type	Amount	Status
{formatDate(tx.timestamp)}	{tx.type.replace(/_/g, ' ')}	{tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}	{tx.status}
No transactions to show.
© Reviews world 2022
{ setWithdrawModalOpen(false); setError(''); }} title="Request Withdrawal">
{error &&
{error}

}
Amount to Withdraw 
 setWithdrawAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" required min="0.01" step="0.01" />
{ setWithdrawModalOpen(false); setError(''); }} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 font-semibold">Cancel {loading ? 'Submitting...' : 'Submit Request'}
); }; // --- Admin Dashboard --- const AdminDashboard = ({ user }) => { const [allUsers, setAllUsers] = useState([]); const [requests, setRequests] = useState([]); const [stats, setStats] = useState({ totalUsers: 0, totalManaged: 0, pendingRequests: 0 }); const [isFundModalOpen, setFundModalOpen] = useState(false); const [selectedUser, setSelectedUser] = useState(''); const [fundAmount, setFundAmount] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); useEffect(() => { const usersUnsubscribe = onSnapshot(query(collection(db, "users"), where("role", "==", "user")), (snapshot) => { const usersList = []; let totalManaged = 0; snapshot.forEach(doc => { const userData = doc.data(); usersList.push({ id: doc.id, ...userData }); totalManaged += userData.balance; }); setAllUsers(usersList); setStats(prev => ({...prev, totalUsers: usersList.length, totalManaged})); }); const q = query(collection(db, "transactions"), where("status", "==", "pending"), where("type", "==", "withdrawal_request")); const requestsUnsubscribe = onSnapshot(q, (snapshot) => { const requestsList = []; snapshot.forEach(doc => requestsList.push({ id: doc.id, ...doc.data() })); requestsList.sort((a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0)); setRequests(requestsList); setStats(prev => ({...prev, pendingRequests: requestsList.length})); }); return () => { usersUnsubscribe(); requestsUnsubscribe(); }; }, []); const handleRequestAction = async (requestId, targetStatus, userId, amount) => { const requestRef = doc(db, "transactions", requestId); const userRef = doc(db, "users", userId); setError(''); try { await runTransaction(db, async (transaction) => { const userDoc = await transaction.get(userRef); if (!userDoc.exists()) throw new Error("User document does not exist!"); const requestDoc = await transaction.get(requestRef); if (!requestDoc.exists() || requestDoc.data().status !== 'pending') { throw new Error("This request has already been processed."); } if (targetStatus === 'completed') { const currentBalance = userDoc.data().balance; if (currentBalance < amount) throw new Error("User has insufficient funds for this withdrawal."); const newBalance = currentBalance - amount; transaction.update(userRef, { balance: newBalance }); transaction.update(requestRef, { status: 'completed', processedBy: auth.currentUser.email }); } else { // 'rejected' transaction.update(requestRef, { status: 'rejected', processedBy: auth.currentUser.email }); } }); } catch (e) { console.error("Transaction failed: ", e); setError(`Error processing request: ${e.message}`); } }; const handleAddFunds = async (e) => { e.preventDefault(); const amount = parseFloat(fundAmount); if(!selectedUser || isNaN(amount) || amount <= 0) { setError("Please select a user and enter a valid positive amount."); return; } setLoading(true); setError(''); const userRef = doc(db, "users", selectedUser); try { await runTransaction(db, async (transaction) => { const userDoc = await transaction.get(userRef); if (!userDoc.exists()) throw new Error("Selected user does not exist."); const newBalance = userDoc.data().balance + amount; transaction.update(userRef, { balance: newBalance }); const depositTransaction = { uid: selectedUser, email: userDoc.data().email, amount, type: 'deposit', status: 'completed', timestamp: serverTimestamp(), processedBy: auth.currentUser.email, }; transaction.set(doc(collection(db, "transactions")), depositTransaction); }); setFundModalOpen(false); setSelectedUser(''); setFundAmount(''); } catch(err) { setError(`Failed to add funds: ${err.message}`); console.error(err); } finally { setLoading(false); } }; const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0); const formatDate = (timestamp) => timestamp ? new Date(timestamp.toDate()).toLocaleString() : 'N/A'; return (
Admin Panel
Welcome, {user.email}

signOut(auth)} className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"> Logout
{error &&
{error}

}
Pending Withdrawal Requests
{requests.length > 0 ? requests.map(req => ( )) : ( )}
Date	User	Amount	Action
{formatDate(req.timestamp)}	{req.email}	{formatCurrency(req.amount)}	
handleRequestAction(req.id, 'completed', req.uid, req.amount)} className="p-2 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/40 transition-colors"> handleRequestAction(req.id, 'rejected', req.uid, req.amount)} className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 transition-colors">
No pending requests at the moment.
Manage Users
setFundModalOpen(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm rounded-lg transition-colors font-semibold"> Add Funds
{allUsers.length > 0 ? allUsers.map(u => (
{u.email}

UID: {u.id.substring(0, 12)}...

{formatCurrency(u.balance)}

)) : (
No users found.
)}
© Reviews world 2022
{ setFundModalOpen(false); setError(''); }} title="Add Funds to User">
{error &&
{error}

}
Select User 
{u.email}
Amount to Add 
 setFundAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" required min="0.01" step="0.01" />
{ setFundModalOpen(false); setError(''); }} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 font-semibold">Cancel {loading ? 'Processing...' : 'Add Funds'}
); }; // --- Main App Component --- export default function App() { const [user, setUser] = useState(null); const [userData, setUserData] = useState(null); const [loading, setLoading] = useState(true); useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (currentUser) => { if (currentUser) { setUser(currentUser); const userDocRef = doc(db, 'users', currentUser.uid); const unsubDoc = onSnapshot(userDocRef, (docSnap) => { if (docSnap.exists()) { setUserData(docSnap.data()); setLoading(false); } else { console.log("Waiting for user document to be created..."); } }, (error) => { console.error("Error fetching user document:", error); setLoading(false); }); return () => unsubDoc(); } else { setUser(null); setUserData(null); setLoading(false); } }); return () => unsubscribe(); }, []); if (loading) { return (
); } if (!user) { return ; } if (userData) { if (userData.role === 'admin') { return ; } return ; } return (
); }
