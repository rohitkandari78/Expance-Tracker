/**
 * User Class
 * Represents a user with budgets and expenses
 */
class User {
    constructor(uid, email, displayName, photoURL) {
        this.uid = uid;
        this.email = email;
        this.displayName = displayName;
        this.photoURL = photoURL;
        this.budgets = {}; // Object to store budgets by month key (e.g., "2026-1": 50000)
        this.expenses = [];
    }

    /**
     * Set the user's budget for a specific month
     */
    setBudget(amount, month = null, year = null) {
        const now = new Date();
        const budgetMonth = month !== null ? month : now.getMonth();
        const budgetYear = year !== null ? year : now.getFullYear();
        const monthKey = `${budgetYear}-${budgetMonth}`;
        this.budgets[monthKey] = amount;
    }

    /**
     * Get budget for a specific month
     */
    getBudget(month = null, year = null) {
        const now = new Date();
        const budgetMonth = month !== null ? month : now.getMonth();
        const budgetYear = year !== null ? year : now.getFullYear();
        const monthKey = `${budgetYear}-${budgetMonth}`;
        return this.budgets[monthKey] || 0;
    }

    /**
     * Add an expense to the user's list
     */
    addExpense(expense) {
        this.expenses.push(expense);
    }

    /**
     * Remove an expense by ID
     */
    removeExpense(expenseId) {
        this.expenses = this.expenses.filter(e => e.id !== expenseId);
    }

    /**
     * Get total amount spent
     */
    getTotalSpent() {
        return this.expenses.reduce((total, expense) => total + expense.amount, 0);
    }

    /**
     * Get remaining balance
     */
    getRemainingBalance() {
        const budget = this.getBudget();
        return budget - this.getTotalSpent();
    }

    /**
     * Get spending percentage
     */
    getSpendingPercentage() {
        const budget = this.getBudget();
        if (budget === 0) return 0;
        return (this.getTotalSpent() / budget) * 100;
    }

    /**
     * Check if over budget
     */
    isOverBudget() {
        const budget = this.getBudget();
        return this.getTotalSpent() > budget;
    }

    /**
     * Get expenses by category
     */
    getExpensesByCategory(category) {
        return this.expenses.filter(e => e.category === category);
    }

    /**
     * Get expenses for current month
     */
    getCurrentMonthExpenses() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        });
    }

    /**
     * Convert to Firebase document format
     */
    toFirestore() {
        return {
            uid: this.uid,
            email: this.email,
            displayName: this.displayName,
            photoURL: this.photoURL,
            budgets: this.budgets, // Now stores multiple budgets
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
    }

    /**
     * Create User from Firebase document
     */
    static fromFirestore(doc) {
        const data = doc.data();
        const user = new User(
            doc.id,
            data.email,
            data.displayName,
            data.photoURL
        );
        // Load all monthly budgets
        if (data.budgets) {
            user.budgets = data.budgets;
        }
        // Handle legacy single budget (if exists)
        if (data.budget && !data.budgets) {
            const now = new Date();
            user.setBudget(data.budget, now.getMonth(), now.getFullYear());
        }
        return user;
    }
}

/**
 * Budget Class
 * Represents a monthly budget with month/year tracking
 */
class Budget {
    constructor(amount, month = null, year = null) {
        this.amount = amount;
        // If no month/year provided, use current month
        const now = new Date();
        this.month = month !== null ? month : now.getMonth();
        this.year = year !== null ? year : now.getFullYear();
        this.startDate = new Date(this.year, this.month);
    }

    /**
     * Check if budget is exceeded
     */
    isExceeded(totalExpenses) {
        return totalExpenses > this.amount;
    }

    /**
     * Get percentage used
     */
    getPercentageUsed(totalExpenses) {
        if (this.amount === 0) return 0;
        return (totalExpenses / this.amount) * 100;
    }

    /**
     * Get remaining amount
     */
    getRemaining(totalExpenses) {
        return this.amount - totalExpenses;
    }

    /**
     * Check if budget is for current month
     */
    isCurrentMonth() {
        const now = new Date();
        return this.month === now.getMonth() &&
               this.year === now.getFullYear();
    }

    /**
     * Get month key (for storage)
     */
    getMonthKey() {
        return `${this.year}-${this.month}`;
    }
}

/**
 * Expense Class
 * Represents a single expense transaction
 */
class Expense {
    constructor(amount, category, description, date) {
        this.id = this.generateId();
        this.amount = parseFloat(amount);
        this.category = category;
        this.description = description;
        this.date = date;
        this.splitWith = [];
        this.createdAt = new Date();
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Split expense among people
     */
    splitBetween(people) {
        this.splitWith = people;
        return this.getAmountPerPerson();
    }

    /**
     * Get amount per person (including user)
     */
    getAmountPerPerson() {
        if (this.splitWith.length === 0) return this.amount;
        return this.amount / (this.splitWith.length + 1);
    }

    /**
     * Check if expense is split
     */
    isSplit() {
        return this.splitWith.length > 0;
    }

    /**
     * Get formatted date
     */
    getFormattedDate() {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(this.date).toLocaleDateString('en-IN', options);
    }

    /**
     * Get category emoji
     */
    getCategoryEmoji() {
        const emojiMap = {
            'Food': '🍔',
            'Transport': '🚗',
            'Shopping': '🛍️',
            'Entertainment': '🎬',
            'Bills': '💡',
            'Health': '⚕️',
            'Other': '📦'
        };
        return emojiMap[this.category] || '📦';
    }

    /**
     * Convert to Firebase document format
     */
    toFirestore() {
        return {
            id: this.id,
            amount: this.amount,
            category: this.category,
            description: this.description,
            date: this.date,
            splitWith: this.splitWith,
            createdAt: firebase.firestore.Timestamp.fromDate(this.createdAt)
        };
    }

    /**
     * Create Expense from Firebase document
     */
    static fromFirestore(doc) {
        const data = doc.data();
        const expense = new Expense(
            data.amount,
            data.category,
            data.description,
            data.date
        );
        expense.id = data.id;
        expense.splitWith = data.splitWith || [];
        expense.createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
        return expense;
    }
}

/**
 * ExpenseManager Class
 * Handles all expense-related operations and Firebase interactions
 */
class ExpenseManager {
    constructor(user) {
        this.user = user;
        this.db = firebase.firestore();
    }

    /**
     * Save budget to Firebase for specific month
     */
    async saveBudget(amount, month = null, year = null) {
        try {
            const now = new Date();
            const budgetMonth = month !== null ? month : now.getMonth();
            const budgetYear = year !== null ? year : now.getFullYear();
            const monthKey = `${budgetYear}-${budgetMonth}`;
            
            // Update budgets object
            const budgets = this.user.budgets || {};
            budgets[monthKey] = amount;
            
            await this.db.collection('users').doc(this.user.uid).set({
                budgets: budgets,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            this.user.setBudget(amount, budgetMonth, budgetYear);
            return true;
        } catch (error) {
            console.error('Error saving budget:', error);
            throw error;
        }
    }

    /**
     * Add expense to Firebase
     */
    async addExpense(expenseData) {
        try {
            const expense = new Expense(
                expenseData.amount,
                expenseData.category,
                expenseData.description,
                expenseData.date
            );

            if (expenseData.splitWith && expenseData.splitWith.length > 0) {
                expense.splitBetween(expenseData.splitWith);
            }

            await this.db
                .collection('users')
                .doc(this.user.uid)
                .collection('expenses')
                .doc(expense.id)
                .set(expense.toFirestore());

            this.user.addExpense(expense);
            return expense;
        } catch (error) {
            console.error('Error adding expense:', error);
            throw error;
        }
    }

    /**
     * Delete expense from Firebase
     */
    async deleteExpense(expenseId) {
        try {
            await this.db
                .collection('users')
                .doc(this.user.uid)
                .collection('expenses')
                .doc(expenseId)
                .delete();

            this.user.removeExpense(expenseId);
            return true;
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    }

    /**
     * Load user data from Firebase
     */
    async loadUserData() {
        try {
            // Load budgets
            const userDoc = await this.db.collection('users').doc(this.user.uid).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                // Load monthly budgets
                if (data.budgets) {
                    this.user.budgets = data.budgets;
                }
                // Handle legacy single budget
                if (data.budget && !data.budgets) {
                    const now = new Date();
                    this.user.setBudget(data.budget, now.getMonth(), now.getFullYear());
                }
            }

            // Load expenses
            const expensesSnapshot = await this.db
                .collection('users')
                .doc(this.user.uid)
                .collection('expenses')
                .orderBy('createdAt', 'desc')
                .get();

            this.user.expenses = [];
            expensesSnapshot.forEach(doc => {
                const expense = Expense.fromFirestore(doc);
                this.user.addExpense(expense);
            });

            return true;
        } catch (error) {
            console.error('Error loading user data:', error);
            throw error;
        }
    }

    /**
     * Get spending by category
     */
    getSpendingByCategory() {
        const categoryTotals = {};
        this.user.expenses.forEach(expense => {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += expense.amount;
        });
        return categoryTotals;
    }
}

// Export classes to global scope
window.User = User;
window.Budget = Budget;
window.Expense = Expense;
window.ExpenseManager = ExpenseManager;
