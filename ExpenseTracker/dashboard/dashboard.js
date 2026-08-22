// Main Application Logic

// Global state
let currentUser = null;
let expenseManager = null;

// DOM Elements
const signOutBtn = document.getElementById('signOutBtn');
const userPhoto = document.getElementById('userPhoto');
const userName = document.getElementById('userName');

// Budget elements
const budgetDisplay = document.getElementById('budgetDisplay');
const totalSpentEl = document.getElementById('totalSpent');
const remainingEl = document.getElementById('remaining');
const progressFill = document.getElementById('progressFill');
const budgetMonthIndicator = document.getElementById('budgetMonthIndicator');
const editBudgetBtn = document.getElementById('editBudgetBtn');
const budgetModal = document.getElementById('budgetModal');
const budgetInput = document.getElementById('budgetInput');
const saveBudgetBtn = document.getElementById('saveBudgetBtn');

// Expense elements
const addExpenseBtn = document.getElementById('addExpenseBtn');
const expenseModal = document.getElementById('expenseModal');
const expensesList = document.getElementById('expensesList');
const emptyState = document.getElementById('emptyState');
const currentMonthBadge = document.getElementById('currentMonthBadge');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const todayBtn = document.getElementById('todayBtn');
const saveExpenseBtn = document.getElementById('saveExpenseBtn');
const expenseAmount = document.getElementById('expenseAmount');
const expenseCategory = document.getElementById('expenseCategory');
const expenseDescription = document.getElementById('expenseDescription');
const expenseDate = document.getElementById('expenseDate');
const splitExpenseCheckbox = document.getElementById('splitExpenseCheckbox');
const splitSection = document.getElementById('splitSection');
const splitPeople = document.getElementById('splitPeople');
const splitPreview = document.getElementById('splitPreview');

// Month navigation state
let viewingMonth = new Date().getMonth();
let viewingYear = new Date().getFullYear();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Enable Firebase persistence
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log('Firebase persistence enabled');
            initializeApp();
            setupEventListeners();
            setTodayDate();
        })
        .catch((error) => {
            console.error('Error enabling persistence:', error);
            // Still initialize app even if persistence fails
            initializeApp();
            setupEventListeners();
            setTodayDate();
        });
});

/**
 * Initialize Firebase Auth State Observer
 */
function initializeApp() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in
            await handleUserSignIn(user);
        } else {
            // User is signed out - redirect to login
            console.log('No user logged in, redirecting to login...');
            window.location.href = '../login/login.html';
        }
    });
}

/**
 * Handle user sign in
 */
async function handleUserSignIn(firebaseUser) {
    try {
        // Create User object
        currentUser = new User(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.displayName,
            firebaseUser.photoURL
        );

        // Create ExpenseManager
        expenseManager = new ExpenseManager(currentUser);

        // Load user data from Firebase
        await expenseManager.loadUserData();

        // Update UI
        updateUserProfile();
        updateDashboard();
        renderExpenses();

        showToast('Welcome back, ' + currentUser.displayName + '!', 'success');
    } catch (error) {
        console.error('Error during sign in:', error);
        showToast('Error loading your data. Please try again.', 'error');
    }
}

/**
 * Handle user sign out
 */
function handleUserSignOut() {
    currentUser = null;
    expenseManager = null;
    
    // Hide app screen
    appScreen.classList.remove('active');
    
    // Show login screen
    loginScreen.classList.add('active');
}

/**
 * Update user profile in header
 */
function updateUserProfile() {
    userPhoto.src = currentUser.photoURL || 'https://via.placeholder.com/40';
    userName.textContent = currentUser.displayName;
}

/**
 * Update dashboard for specific month
 */
function updateDashboardForMonth(month, year) {
    const budget = currentUser.getBudget(month, year);
    
    // Calculate totals for the viewing month
    const monthExpenses = getExpensesForMonth(month, year);
    const spent = monthExpenses.reduce((total, expense) => total + expense.amount, 0);
    const remaining = budget - spent;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;

    budgetDisplay.textContent = formatCurrency(budget);
    totalSpentEl.textContent = formatCurrency(spent);
    remainingEl.textContent = formatCurrency(remaining);
    
    // Update month indicator
    const viewingDate = new Date(year, month);
    const monthName = viewingDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const now = new Date();
    const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();
    
    if (isCurrentMonth) {
        budgetMonthIndicator.textContent = '(Current Month)';
        budgetMonthIndicator.style.color = 'var(--primary)';
    } else {
        budgetMonthIndicator.textContent = `(Viewing: ${monthName})`;
        budgetMonthIndicator.style.color = 'var(--gray-500)';
    }
    
    // Update progress bar
    progressFill.style.width = Math.min(percentage, 100) + '%';
    
    // Change color if over budget
    if (spent > budget && budget > 0) {
        progressFill.style.background = 'linear-gradient(90deg, #f56565 0%, #e53e3e 100%)';
        remainingEl.style.color = '#f56565';
    } else {
        progressFill.style.background = 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)';
        remainingEl.style.color = '#48bb78';
    }
}

/**
 * Update dashboard (budget, spending, progress) for current month
 */
function updateDashboard() {
    const now = new Date();
    updateDashboardForMonth(now.getMonth(), now.getFullYear());
}

/**
 * Get expenses for a specific month/year
 */
function getExpensesForMonth(month, year) {
    return currentUser.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month && 
               expenseDate.getFullYear() === year;
    });
}

/**
 * Render expenses for the viewing month
 */
function renderExpensesForViewingMonth() {
    expensesList.innerHTML = '';
    
    // Update dashboard for viewing month
    updateDashboardForMonth(viewingMonth, viewingYear);
    
    // Update current month badge
    const viewingDate = new Date(viewingYear, viewingMonth);
    const monthName = viewingDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    currentMonthBadge.textContent = monthName;
    
    // Check if viewing current month
    const now = new Date();
    const isCurrentMonth = viewingMonth === now.getMonth() && viewingYear === now.getFullYear();
    
    // Show/hide "Today" button
    todayBtn.style.display = isCurrentMonth ? 'none' : 'inline-flex';
    
    // Get expenses for viewing month
    const monthExpenses = getExpensesForMonth(viewingMonth, viewingYear);
    
    if (monthExpenses.length === 0) {
        emptyState.style.display = 'block';
        const emptyText = emptyState.querySelector('p');
        if (emptyText) {
            emptyText.textContent = `No expenses for ${monthName}`;
        }
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort by date (newest first)
    const sortedExpenses = [...monthExpenses].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedExpenses.forEach(expense => {
        const expenseCard = createExpenseCard(expense);
        expensesList.appendChild(expenseCard);
    });
}

/**
 * Render expenses list (reset to current month)
 */
function renderExpenses() {
    // Reset to current month when refreshing
    const now = new Date();
    viewingMonth = now.getMonth();
    viewingYear = now.getFullYear();
    renderExpensesForViewingMonth();
}

/**
 * Navigate to previous month
 */
function goToPrevMonth() {
    viewingMonth--;
    if (viewingMonth < 0) {
        viewingMonth = 11;
        viewingYear--;
    }
    renderExpensesForViewingMonth();
}

/**
 * Navigate to next month
 */
function goToNextMonth() {
    viewingMonth++;
    if (viewingMonth > 11) {
        viewingMonth = 0;
        viewingYear++;
    }
    renderExpensesForViewingMonth();
}

/**
 * Go back to current month
 */
function goToToday() {
    const now = new Date();
    viewingMonth = now.getMonth();
    viewingYear = now.getFullYear();
    renderExpensesForViewingMonth();
}

/**
 * Create expense card element
 */
function createExpenseCard(expense) {
    const card = document.createElement('div');
    card.className = 'expense-item';
    
    const amountPerPerson = expense.isSplit() ? expense.getAmountPerPerson() : expense.amount;
    
    card.innerHTML = `
        <div class="expense-info">
            <div class="expense-header">
                <span class="expense-category">${expense.getCategoryEmoji()}</span>
                <span class="expense-description">${expense.description}</span>
            </div>
            <div class="expense-meta">
                <span class="expense-date">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M4 1a1 1 0 011-1h4a1 1 0 011 1v1h2a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V4a2 2 0 012-2h2V1z"/>
                    </svg>
                    ${expense.getFormattedDate()}
                </span>
                <span class="expense-category-text">${expense.category}</span>
            </div>
        </div>
        <div class="expense-amount-section">
            <div>
                <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                ${expense.isSplit() ? `
                    <div class="split-badge">
                        Split: ${formatCurrency(amountPerPerson)}/person
                    </div>
                ` : ''}
            </div>
            <div class="expense-actions">
                <button class="btn-delete" onclick="deleteExpense('${expense.id}')">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Authentication
    // googleSignInBtn.addEventListener('click', signInWithGoogle);
    signOutBtn.addEventListener('click', signOut);
    
    // Budget
    editBudgetBtn.addEventListener('click', openBudgetModal);
    saveBudgetBtn.addEventListener('click', saveBudget);
    
    // Expenses
    addExpenseBtn.addEventListener('click', openExpenseModal);
    saveExpenseBtn.addEventListener('click', saveExpense);
    
    // Split expense
    splitExpenseCheckbox.addEventListener('change', toggleSplitSection);
    splitPeople.addEventListener('input', updateSplitPreview);
    expenseAmount.addEventListener('input', updateSplitPreview);
    
    // Month navigation
    prevMonthBtn.addEventListener('click', goToPrevMonth);
    nextMonthBtn.addEventListener('click', goToNextMonth);
    todayBtn.addEventListener('click', goToToday);
    
    // Modal controls
    setupModalControls();
}

/**
 * Sign in with Google
 */
async function signInWithGoogle() {
    try {
        googleSignInBtn.disabled = true;
        googleSignInBtn.innerHTML = '<span class="loading"></span> Signing in...';
        
        await auth.signInWithPopup(googleProvider);
    } catch (error) {
        console.error('Sign in error:', error);
        showToast('Sign in failed. Please try again.', 'error');
        
        googleSignInBtn.disabled = false;
        googleSignInBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20">...</svg>
            Continue with Google
        `;
    }
}

/**
 * Sign out
 */
async function signOut() {
    // Confirm before signing out
    if (!confirm('Are you sure you want to sign out?')) {
        return;
    }
    
    try {
        await auth.signOut();
        showToast('Signed out successfully', 'success');
    } catch (error) {
        console.error('Sign out error:', error);
        showToast('Error signing out', 'error');
    }
}

/**
 * Open budget modal
 */
function openBudgetModal() {
    // Load budget for the currently viewing month
    const currentBudget = currentUser.getBudget(viewingMonth, viewingYear);
    budgetInput.value = currentBudget || '';
    
    // Update modal title to show which month
    const viewingDate = new Date(viewingYear, viewingMonth);
    const monthName = viewingDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const modalTitle = document.querySelector('#budgetModal .modal-header h3');
    modalTitle.textContent = `Set Budget for ${monthName}`;
    
    budgetModal.classList.add('active');
    budgetInput.focus();
}

/**
 * Save budget
 */
async function saveBudget() {
    const amount = parseFloat(budgetInput.value);
    
    if (!amount || amount <= 0) {
        showToast('Please enter a valid budget amount', 'error');
        return;
    }
    
    try {
        saveBudgetBtn.disabled = true;
        saveBudgetBtn.innerHTML = '<span class="loading"></span> Saving...';
        
        // Save budget for the currently viewing month
        await expenseManager.saveBudget(amount, viewingMonth, viewingYear);
        
        // Update dashboard for the viewing month
        updateDashboardForMonth(viewingMonth, viewingYear);
        closeBudgetModal();
        
        const viewingDate = new Date(viewingYear, viewingMonth);
        const monthName = viewingDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        showToast(`Budget for ${monthName} saved successfully!`, 'success');
    } catch (error) {
        console.error('Error saving budget:', error);
        showToast('Error saving budget. Please try again.', 'error');
    } finally {
        saveBudgetBtn.disabled = false;
        saveBudgetBtn.textContent = 'Save Budget';
        
        // Reset modal title
        const modalTitle = document.querySelector('#budgetModal .modal-header h3');
        modalTitle.textContent = 'Set Monthly Budget';
    }
}

/**
 * Open expense modal
 */
function openExpenseModal() {
    expenseModal.classList.add('active');
    resetExpenseForm();
}

/**
 * Save expense
 */
async function saveExpense() {
    const amount = parseFloat(expenseAmount.value);
    const category = expenseCategory.value;
    const description = expenseDescription.value.trim();
    const date = expenseDate.value;
    
    // Validation
    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }
    
    if (!category) {
        showToast('Please select a category', 'error');
        return;
    }
    
    if (!description) {
        showToast('Please enter a description', 'error');
        return;
    }
    
    if (!date) {
        showToast('Please select a date', 'error');
        return;
    }
    
    try {
        saveExpenseBtn.disabled = true;
        saveExpenseBtn.innerHTML = '<span class="loading"></span> Saving...';
        
        const expenseData = {
            amount,
            category,
            description,
            date,
            splitWith: []
        };
        
        // Handle split expense
        if (splitExpenseCheckbox.checked && splitPeople.value.trim()) {
            expenseData.splitWith = splitPeople.value
                .split(',')
                .map(name => name.trim())
                .filter(name => name.length > 0);
        }
        
        await expenseManager.addExpense(expenseData);
        updateDashboard();
        renderExpenses();
        closeExpenseModal();
        
        showToast('Expense added successfully!', 'success');
    } catch (error) {
        console.error('Error saving expense:', error);
        showToast('Error saving expense. Please try again.', 'error');
    } finally {
        saveExpenseBtn.disabled = false;
        saveExpenseBtn.textContent = 'Save Expense';
    }
}

/**
 * Delete expense
 */
async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        await expenseManager.deleteExpense(expenseId);
        updateDashboard();
        renderExpenses();
        
        showToast('Expense deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting expense:', error);
        showToast('Error deleting expense. Please try again.', 'error');
    }
}

/**
 * Toggle split section
 */
function toggleSplitSection() {
    if (splitExpenseCheckbox.checked) {
        splitSection.style.display = 'block';
        splitPeople.focus();
    } else {
        splitSection.style.display = 'none';
        splitPeople.value = '';
        splitPreview.innerHTML = '';
    }
}

/**
 * Update split preview
 */
function updateSplitPreview() {
    if (!splitExpenseCheckbox.checked || !splitPeople.value.trim()) {
        splitPreview.innerHTML = '';
        return;
    }
    
    const amount = parseFloat(expenseAmount.value) || 0;
    const people = splitPeople.value
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);
    
    if (people.length === 0 || amount === 0) {
        splitPreview.innerHTML = '';
        return;
    }
    
    const perPerson = amount / (people.length + 1);
    
    splitPreview.innerHTML = `
        <p><strong>Total people:</strong> ${people.length + 1} (you + ${people.length} others)</p>
        <p><strong>Amount per person:</strong> ${formatCurrency(perPerson)}</p>
        <p><strong>Your share:</strong> ${formatCurrency(perPerson)}</p>
    `;
}

/**
 * Setup modal controls (close buttons)
 */
function setupModalControls() {
    document.querySelectorAll('.modal-close, [data-close-modal]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.classList.remove('active');
        });
    });
    
    // Close modal on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}

/**
 * Close budget modal
 */
function closeBudgetModal() {
    budgetModal.classList.remove('active');
}

/**
 * Close expense modal
 */
function closeExpenseModal() {
    expenseModal.classList.remove('active');
    resetExpenseForm();
}

/**
 * Reset expense form
 */
function resetExpenseForm() {
    expenseAmount.value = '';
    expenseCategory.value = '';
    expenseDescription.value = '';
    expenseDate.value = getTodayDate();
    splitExpenseCheckbox.checked = false;
    splitPeople.value = '';
    splitSection.style.display = 'none';
    splitPreview.innerHTML = '';
}

/**
 * Set today's date as default
 */
function setTodayDate() {
    expenseDate.value = getTodayDate();
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
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

// Make deleteExpense available globally
window.deleteExpense = deleteExpense;
