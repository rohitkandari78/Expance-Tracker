// Login Page Logic

// DOM Elements
const googleSignInBtn = document.getElementById('googleSignIn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    setupEventListeners();
});

/**
 * Initialize Firebase Auth State Observer
 */
function initializeAuth() {
    // Enable Firebase persistence
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log('Firebase persistence enabled');
        })
        .catch((error) => {
            console.error('Error enabling persistence:', error);
        });

    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in, redirect to dashboard
            console.log('User already logged in, redirecting...');
            window.location.href = '../dashboard/dashboard.html';
        }
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    googleSignInBtn.addEventListener('click', signInWithGoogle);
}

/**
 * Sign in with Google
 */
async function signInWithGoogle() {
    try {
        googleSignInBtn.disabled = true;
        googleSignInBtn.innerHTML = '<span class="loading"></span> Signing in...';
        
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        console.log('Sign in successful:', user.displayName);
        
        // Create user document in Firestore if doesn't exist
        await createUserDocument(user);
        
        // Redirect to dashboard
        window.location.href = '../dashboard/dashboard.html';
        
    } catch (error) {
        console.error('Sign in error:', error);
        
        let errorMessage = 'Sign in failed. Please try again.';
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign in cancelled.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your connection.';
        }
        
        showToast(errorMessage, 'error');
        
        googleSignInBtn.disabled = false;
        googleSignInBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20">
                <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
                <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"/>
                <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"/>
                <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"/>
            </svg>
            Continue with Google
        `;
    }
}

/**
 * Create user document in Firestore
 */
async function createUserDocument(user) {
    try {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            // Create new user document
            await userRef.set({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                budget: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('User document created');
        } else {
            // Update last login
            await userRef.update({
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('User document updated');
        }
    } catch (error) {
        console.error('Error creating user document:', error);
        // Don't throw error, just log it
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
