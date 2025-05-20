/**
 * Income Expense Calculator
 * A complete application for tracking income and expenses with CRUD operations
 * and local storage persistence.
 */

// Global variables
let transactions = [];
let editIndex = -1;

// DOM Elements
const transactionForm = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const incomeTypeInput = document.getElementById('income-type');
const expenseTypeInput = document.getElementById('expense-type');
const editIdInput = document.getElementById('edit-id');
const submitBtn = document.getElementById('submit-btn');
const resetBtn = document.getElementById('reset-btn');
const transactionList = document.getElementById('transaction-list');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const netBalanceEl = document.getElementById('net-balance');
const emptyStateEl = document.getElementById('empty-state');

// Filter elements
const filterAll = document.getElementById('filter-all');
const filterIncome = document.getElementById('filter-income');
const filterExpense = document.getElementById('filter-expense');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    displayTransactions();
    updateSummary();
    
    // Event listeners
    transactionForm.addEventListener('submit', handleFormSubmit);
    resetBtn.addEventListener('click', resetForm);
    
    // Filter event listeners
    filterAll.addEventListener('change', displayTransactions);
    filterIncome.addEventListener('change', displayTransactions);
    filterExpense.addEventListener('change', displayTransactions);
});

/**
 * Loads transactions from local storage
 */
function loadTransactions() {
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    }
}

/**
 * Saves transactions to local storage
 */
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

/**
 * Handles form submission for adding/editing transactions
 * @param {Event} e - The form submit event
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate inputs
    if (!descriptionInput.value.trim() || !amountInput.value || parseFloat(amountInput.value) <= 0) {
        alert('Please enter a valid description and amount');
        return;
    }
    
    const transaction = {
        id: Date.now().toString(), // Unique ID based on timestamp
        description: descriptionInput.value.trim(),
        amount: parseFloat(amountInput.value),
        type: incomeTypeInput.checked ? 'income' : 'expense',
        date: new Date().toISOString()
    };
    
    // Check if we're editing or adding
    if (editIndex !== -1) {
        // Update existing transaction, preserving its ID
        transaction.id = editIdInput.value;
        transactions[editIndex] = transaction;
        editIndex = -1; // Reset edit mode
    } else {
        // Add new transaction
        transactions.push(transaction);
    }
    
    // Save to local storage
    saveTransactions();
    
    // Update UI
    resetForm();
    displayTransactions();
    updateSummary();
}

/**
 * Resets the form to its initial state
 */
function resetForm() {
    transactionForm.reset();
    editIndex = -1;
    editIdInput.value = '';
    submitBtn.textContent = 'Add Transaction';
    submitBtn.classList.remove('btn-info');
    submitBtn.classList.add('btn-primary');
}

/**
 * Displays transactions based on the selected filter
 */
function displayTransactions() {
    // Clear the transaction list
    transactionList.innerHTML = '';
    
    // Get the selected filter
    let filterType = 'all';
    if (filterIncome.checked) filterType = 'income';
    if (filterExpense.checked) filterType = 'expense';
    
    // Filter transactions
    let filteredTransactions = [...transactions];
    if (filterType !== 'all') {
        filteredTransactions = transactions.filter(t => t.type === filterType);
    }
    
    // Sort transactions by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Check if there are any transactions
    if (filteredTransactions.length === 0) {
        emptyStateEl.classList.remove('d-none');
    } else {
        emptyStateEl.classList.add('d-none');
        
        // Display each transaction
        filteredTransactions.forEach((transaction, index) => {
            const row = document.createElement('tr');
            row.className = `transaction-${transaction.type}`;
            
            // Format the amount with currency symbol
            const formattedAmount = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 2
            }).format(transaction.amount);
            
            row.innerHTML = `
                <td>${transaction.description}</td>
                <td>${formattedAmount}</td>
                <td>
                    <span class="badge ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}">
                        ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                </td>
                <td>
                    <i class="fas fa-edit action-btn edit-btn" title="Edit" data-id="${transaction.id}"></i>
                    <i class="fas fa-trash-alt action-btn delete-btn" title="Delete" data-id="${transaction.id}"></i>
                </td>
            `;
            
            // Add event listeners to the edit and delete buttons
            row.querySelector('.edit-btn').addEventListener('click', () => editTransaction(transaction.id));
            row.querySelector('.delete-btn').addEventListener('click', () => deleteTransaction(transaction.id));
            
            transactionList.appendChild(row);
        });
    }
}

/**
 * Updates the summary display (total income, total expense, net balance)
 */
function updateSummary() {
    // Calculate totals
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const netBalance = totalIncome - totalExpense;
    
    // Format values with currency symbol
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };
    
    // Update UI
    totalIncomeEl.textContent = formatCurrency(totalIncome);
    totalExpenseEl.textContent = formatCurrency(totalExpense);
    netBalanceEl.textContent = formatCurrency(netBalance);
    
    // Add class based on net balance
    if (netBalance > 0) {
        netBalanceEl.className = 'fs-4 positive';
    } else if (netBalance < 0) {
        netBalanceEl.className = 'fs-4 negative';
    } else {
        netBalanceEl.className = 'fs-4';
    }
}

/**
 * Prepares the form for editing a transaction
 * @param {string} id - The ID of the transaction to edit
 */
function editTransaction(id) {
    // Find the transaction and its index
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) return;
    
    const transaction = transactions[index];
    
    // Populate form
    descriptionInput.value = transaction.description;
    amountInput.value = transaction.amount;
    if (transaction.type === 'income') {
        incomeTypeInput.checked = true;
    } else {
        expenseTypeInput.checked = true;
    }
    
    // Set edit mode
    editIndex = index;
    editIdInput.value = id;
    submitBtn.textContent = 'Update Transaction';
    submitBtn.classList.remove('btn-primary');
    submitBtn.classList.add('btn-info');
    
    // Scroll to form
    transactionForm.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Deletes a transaction
 * @param {string} id - The ID of the transaction to delete
 */
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions.splice(index, 1);
            saveTransactions();
            displayTransactions();
            updateSummary();
        }
    }
}