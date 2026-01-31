// API Base URL
const API_URL = '/api';

// State
let categories = [];
let expenses = [];
let categoryChart = null;
let trendChart = null;
let dateCalendar = null;
let editDateCalendar = null;

// Toggle Category Section
function toggleCategorySection() {
    const toggle = document.querySelector('.collapsible-toggle');
    const content = document.getElementById('categorySection');
    toggle.classList.toggle('active');
    content.classList.toggle('show');
}

// Toggle Insights Section
function toggleInsightsSection() {
    const toggles = document.querySelectorAll('.collapsible-toggle');
    const toggle = toggles[1]; // Second collapsible toggle (Insights)
    const content = document.getElementById('insightsSection');
    toggle.classList.toggle('active');
    content.classList.toggle('show');
}

// All Transactions Modal
function openAllTransactionsModal() {
    const modal = document.getElementById('allTransactionsModal');
    modal.style.display = 'block';
    populateFilterOptions();
    renderAllExpenses();
}

function closeAllTransactionsModal() {
    document.getElementById('allTransactionsModal').style.display = 'none';
}

function populateFilterOptions() {
    // Populate category filter
    const categoryFilter = document.getElementById('filterCategory');
    categoryFilter.innerHTML = '<option value="">All Categories</option>' +
        categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');

    // Populate month filter
    const monthFilter = document.getElementById('filterMonth');
    const months = [...new Set(expenses.map(e => {
        const d = new Date(e.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }))].sort().reverse();

    monthFilter.innerHTML = '<option value="">All Time</option>' +
        months.map(m => {
            const [year, month] = m.split('-');
            const date = new Date(year, month - 1);
            const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return `<option value="${m}">${label}</option>`;
        }).join('');
}

function filterTransactions() {
    renderAllExpenses();
}

function renderAllExpenses() {
    const container = document.getElementById('allExpensesList');
    const searchTerm = document.getElementById('searchTransactions').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const monthFilter = document.getElementById('filterMonth').value;

    let filtered = expenses.filter(expense => {
        const category = categories.find(c => c.id === expense.categoryId);
        const matchesSearch = !searchTerm ||
            expense.description?.toLowerCase().includes(searchTerm) ||
            category?.name.toLowerCase().includes(searchTerm);

        const matchesCategory = !categoryFilter || expense.categoryId === categoryFilter;

        const expenseMonth = new Date(expense.date);
        const expenseMonthStr = `${expenseMonth.getFullYear()}-${String(expenseMonth.getMonth() + 1).padStart(2, '0')}`;
        const matchesMonth = !monthFilter || expenseMonthStr === monthFilter;

        return matchesSearch && matchesCategory && matchesMonth;
    });

    // Update summary
    document.getElementById('transactionCount').textContent = `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`;
    document.getElementById('transactionTotal').textContent = `Total: ₹${filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2)}`;

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>No transactions found</p></div>';
        return;
    }

    container.innerHTML = filtered.map(expense => {
        const category = categories.find(c => c.id === expense.categoryId) || { icon: '📦', name: 'Unknown', color: '#888' };
        const date = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const amount = parseFloat(expense.amount) || 0;

        return `
            <div class="expense-item">
                <div class="expense-info">
                    <span class="expense-icon">${category.icon}</span>
                    <div class="expense-details">
                        <h4>${expense.description || 'No description'}</h4>
                        <span style="color: ${category.color}">${category.name}</span>
                    </div>
                </div>
                <div class="expense-amount">
                    <div class="amount">-₹${amount.toFixed(2)}</div>
                    <div class="date">${date}</div>
                </div>
                <div class="expense-actions">
                    <button class="btn btn-small btn-primary" onclick="editExpense('${expense.id}'); closeAllTransactionsModal();">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteExpense('${expense.id}'); renderAllExpenses();">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeDateInput();
    loadCategories();
    loadExpenses(); // loadInsights is called inside after data is fetched
    loadSummary();
    loadPatterns();
    loadTrends();
    setupEventListeners();
});

// Set default date to today
function initializeDateInput() {
    const today = new Date();

    // Initialize main date calendar (inline)
    dateCalendar = flatpickr('#date', {
        inline: true,
        appendTo: document.getElementById('dateCalendar'),
        defaultDate: today,
        dateFormat: 'Y-m-d',
        onChange: function (selectedDates, dateStr) {
            document.getElementById('date').value = dateStr;
        }
    });

    document.getElementById('date').value = today.toISOString().split('T')[0];
}

// Event Listeners
function setupEventListeners() {
    // Expense form submission
    document.getElementById('expenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addExpense();
    });

    // Category form submission
    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addCategory();
    });

    // Edit expense form submission
    document.getElementById('editExpenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateExpense();
    });

    // Sort controls
    document.getElementById('sortBy').addEventListener('change', loadExpenses);
    document.getElementById('sortOrder').addEventListener('change', loadExpenses);

    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('editModal')) {
            closeModal();
        }
        if (e.target === document.getElementById('allTransactionsModal')) {
            closeAllTransactionsModal();
        }
        if (e.target === document.getElementById('budgetModal')) {
            closeBudgetModal();
        }
    });
}

// API Functions
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

// Categories
async function loadCategories() {
    categories = await fetchAPI('/categories') || [];
    renderCategories();
    renderCategoryOptions('categoryOptions');
    renderCategoryOptions('editCategoryOptions');
}

async function addCategory() {
    const name = document.getElementById('categoryName').value;
    const icon = document.getElementById('categoryIcon').value || '📁';
    const color = document.getElementById('categoryColor').value;

    const category = await fetchAPI('/categories', {
        method: 'POST',
        body: JSON.stringify({ name, icon, color }),
    });

    if (category) {
        categories.push(category);
        renderCategories();
        renderCategoryOptions('categoryOptions');
        renderCategoryOptions('editCategoryOptions');
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryColor').value = '#36A2EB';
    }
}

async function deleteCategory(id) {
    if (!confirm('Delete this category? Expenses in this category will remain.')) return;

    await fetchAPI(`/categories/${id}`, { method: 'DELETE' });
    categories = categories.filter(c => c.id !== id);
    renderCategories();
    renderCategoryOptions('categoryOptions');
    renderCategoryOptions('editCategoryOptions');
}

function renderCategories() {
    const container = document.getElementById('categoriesList');

    if (categories.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon">📂</div><p>No categories yet</p></div>';
        return;
    }

    container.innerHTML = categories.map(cat => `
        <div class="category-tag" style="background-color: ${cat.color}20; color: ${cat.color}; border: 2px solid ${cat.color}">
            ${cat.icon} ${cat.name}
            <span class="delete-cat" onclick="deleteCategory('${cat.id}')">&times;</span>
        </div>
    `).join('');
}

function renderCategoryOptions(containerId, selectedId = '') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (categories.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Add categories first</p>';
        return;
    }

    container.innerHTML = categories.map(cat => `
        <button type="button" 
                class="category-option ${selectedId === cat.id ? 'selected' : ''}" 
                data-category-id="${cat.id}"
                style="--category-color: ${cat.color}"
                onclick="selectCategory('${containerId}', '${cat.id}')">
            <span class="emoji">${cat.icon}</span>
            <span class="name">${cat.name}</span>
        </button>
    `).join('');
}

function selectCategory(containerId, categoryId) {
    // Update hidden input
    const inputId = containerId === 'categoryOptions' ? 'category' : 'editCategory';
    document.getElementById(inputId).value = categoryId;

    // Update UI
    const container = document.getElementById(containerId);
    container.querySelectorAll('.category-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    container.querySelector(`[data-category-id="${categoryId}"]`)?.classList.add('selected');
}

// Expenses
async function loadExpenses() {
    const sortBy = document.getElementById('sortBy')?.value || 'date';
    const sortOrder = document.getElementById('sortOrder')?.value || 'desc';
    expenses = await fetchAPI(`/expenses?sortBy=${sortBy}&sortOrder=${sortOrder}`) || [];
    renderExpenses();
    loadInsights(); // Load insights after expenses are fetched
}

async function addExpense() {
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const categoryId = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    const expense = await fetchAPI('/expenses', {
        method: 'POST',
        body: JSON.stringify({ description, amount, categoryId, date }),
    });

    if (expense) {
        expenses.unshift(expense);
        renderExpenses();
        loadSummary();
        loadPatterns();
        loadTrends();
        loadInsights();
        document.getElementById('expenseForm').reset();
        renderCategoryOptions('categoryOptions'); // Reset category selection
        initializeDateInput();
    }
}

async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;

    await fetchAPI(`/expenses/${id}`, { method: 'DELETE' });
    expenses = expenses.filter(e => e.id !== id);
    renderExpenses();
    loadSummary();
    loadPatterns();
    loadTrends();
    loadInsights();
}

function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('editDescription').value = expense.description || '';
    document.getElementById('editAmount').value = expense.amount;
    document.getElementById('editCategory').value = expense.categoryId;

    // Render category options with selection
    renderCategoryOptions('editCategoryOptions', expense.categoryId);

    const expenseDate = new Date(expense.date).toISOString().split('T')[0];
    document.getElementById('editDate').value = expenseDate;

    // Initialize or update edit date calendar
    if (editDateCalendar) {
        editDateCalendar.setDate(expenseDate);
    } else {
        editDateCalendar = flatpickr('#editDate', {
            inline: true,
            appendTo: document.getElementById('editDateCalendar'),
            defaultDate: expenseDate,
            dateFormat: 'Y-m-d',
            onChange: function (selectedDates, dateStr) {
                document.getElementById('editDate').value = dateStr;
            }
        });
    }

    document.getElementById('editModal').style.display = 'block';
}

async function updateExpense() {
    const id = document.getElementById('editExpenseId').value;
    const description = document.getElementById('editDescription').value;
    const amount = parseFloat(document.getElementById('editAmount').value);
    const categoryId = document.getElementById('editCategory').value;
    const date = document.getElementById('editDate').value;

    const updated = await fetchAPI(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ description, amount, categoryId, date }),
    });

    if (updated) {
        const index = expenses.findIndex(e => e.id === id);
        if (index !== -1) expenses[index] = updated;
        renderExpenses();
        loadSummary();
        loadPatterns();
        loadTrends();
        loadInsights();
        closeModal();
    }
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

function renderExpenses() {
    const container = document.getElementById('expensesList');

    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon">📝</div><p>No expenses recorded yet</p></div>';
        return;
    }

    container.innerHTML = expenses.slice(0, 20).map(expense => {
        const category = categories.find(c => c.id === expense.categoryId) || { icon: '📦', name: 'Unknown', color: '#888' };
        const date = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const amount = parseFloat(expense.amount) || 0;

        return `
            <div class="expense-item">
                <div class="expense-info">
                    <span class="expense-icon">${category.icon}</span>
                    <div class="expense-details">
                        <h4>${expense.description || 'No description'}</h4>
                        <span style="color: ${category.color}">${category.name}</span>
                    </div>
                </div>
                <div class="expense-amount">
                    <div class="amount">-₹${amount.toFixed(2)}</div>
                    <div class="date">${date}</div>
                </div>
                <div class="expense-actions">
                    <button class="btn btn-small btn-primary" onclick="editExpense('${expense.id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteExpense('${expense.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Summary
async function loadSummary() {
    const summary = await fetchAPI('/expenses/summary');
    if (!summary) return;

    document.getElementById('thisMonthTotal').textContent = `₹${summary.thisMonth.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `₹${summary.totalExpenses.toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = summary.totalTransactions;

    const changeEl = document.getElementById('monthlyChange');
    if (summary.monthlyChange !== 0) {
        const isPositive = summary.monthlyChange > 0;
        changeEl.textContent = `${isPositive ? '↑' : '↓'} ${Math.abs(summary.monthlyChange).toFixed(1)}% vs last month`;
        changeEl.className = `change ${isPositive ? 'negative' : 'positive'}`;
    } else {
        changeEl.textContent = 'No change';
        changeEl.className = 'change';
    }
}

// Patterns
async function loadPatterns() {
    const patterns = await fetchAPI('/expenses/patterns');
    if (!patterns) return;

    renderPatterns(patterns);
    renderCategoryChart(patterns);
}

function renderPatterns(patterns) {
    const container = document.getElementById('patternsList');

    if (patterns.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>Add expenses to see patterns</p></div>';
        return;
    }

    container.innerHTML = patterns.map(pattern => {
        const category = categories.find(c => String(c.id) === String(pattern.categoryId)) || { color: '#888' };
        return `
            <div class="pattern-item">
                <div class="pattern-bar-container">
                    <div class="pattern-info">
                        <span class="pattern-name">${pattern.categoryName}</span>
                        <span class="pattern-amount">₹${pattern.totalAmount.toFixed(2)} (${pattern.count} transactions)</span>
                    </div>
                    <div class="pattern-bar">
                        <div class="pattern-bar-fill" style="width: ${pattern.percentage}%; background-color: ${category.color}"></div>
                    </div>
                </div>
                <div class="pattern-stats">
                    <div class="pattern-percentage">${pattern.percentage.toFixed(1)}%</div>
                    <div class="pattern-count">avg ₹${pattern.averageAmount.toFixed(2)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderCategoryChart(patterns) {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    if (categoryChart) {
        categoryChart.destroy();
    }

    if (patterns.length === 0) {
        return;
    }

    const categoryColors = patterns.map(p => {
        const cat = categories.find(c => String(c.id) === String(p.categoryId));
        return cat ? cat.color : '#888';
    });

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: patterns.map(p => p.categoryName),
            datasets: [{
                data: patterns.map(p => p.totalAmount),
                backgroundColor: categoryColors,
                borderWidth: 2,
                borderColor: '#fff',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `₹${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Trends
async function loadTrends() {
    const trends = await fetchAPI('/expenses/trends?months=6');
    if (!trends) return;

    renderTrendChart(trends);
}

function renderTrendChart(trends) {
    const ctx = document.getElementById('trendChart').getContext('2d');

    if (trendChart) {
        trendChart.destroy();
    }

    if (trends.length === 0) {
        return;
    }

    trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: trends.map(t => t.month),
            datasets: [{
                label: 'Total Spending',
                data: trends.map(t => t.total),
                backgroundColor: '#4F46E5',
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `₹${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

// =============================================
// INSIGHTS FUNCTIONS
// =============================================

// Budget state (stored in localStorage)
let budgets = JSON.parse(localStorage.getItem('budgets') || '{}');

function loadInsights() {
    calculateAverages();
    calculatePeakDay();
    generateAlerts();
    renderBudgetTracking();
    renderTopExpenses();
    renderCategoryComparison();
    calculateStreaks();
}

function calculateAverages() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get this month's expenses
    const thisMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Daily average (this month)
    const dailyAvg = dayOfMonth > 0 ? totalThisMonth / dayOfMonth : 0;
    document.getElementById('dailyAverage').textContent = `₹${dailyAvg.toFixed(2)}`;

    // Weekly average
    const weeklyAvg = dailyAvg * 7;
    document.getElementById('weeklyAverage').textContent = `₹${weeklyAvg.toFixed(2)}`;

    // Predicted monthly total
    const predictedTotal = dayOfMonth > 0 ? (totalThisMonth / dayOfMonth) * daysInMonth : 0;
    document.getElementById('predictedMonthly').textContent = `₹${predictedTotal.toFixed(2)}`;
}

function calculatePeakDay() {
    if (expenses.length === 0) {
        document.getElementById('peakDay').textContent = '-';
        return;
    }

    const dayTotals = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    expenses.forEach(e => {
        const day = new Date(e.date).getDay();
        dayTotals[day] = (dayTotals[day] || 0) + e.amount;
    });

    let maxDay = 0;
    let maxAmount = 0;
    for (const [day, amount] of Object.entries(dayTotals)) {
        if (amount > maxAmount) {
            maxAmount = amount;
            maxDay = parseInt(day);
        }
    }

    document.getElementById('peakDay').textContent = days[maxDay];
}

function generateAlerts() {
    const container = document.getElementById('spendingAlerts');
    const alerts = [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Get spending by category for this month and last month
    const thisMonthByCategory = {};
    const lastMonthByCategory = {};

    expenses.forEach(e => {
        const d = new Date(e.date);
        const month = d.getMonth();
        const year = d.getFullYear();

        if (month === currentMonth && year === currentYear) {
            thisMonthByCategory[e.categoryId] = (thisMonthByCategory[e.categoryId] || 0) + e.amount;
        } else if (month === lastMonth && year === lastMonthYear) {
            lastMonthByCategory[e.categoryId] = (lastMonthByCategory[e.categoryId] || 0) + e.amount;
        }
    });

    // Check for unusual spending (>30% increase)
    for (const categoryId of Object.keys(thisMonthByCategory)) {
        const thisMonth = thisMonthByCategory[categoryId] || 0;
        const lastMonthAmt = lastMonthByCategory[categoryId] || 0;

        if (lastMonthAmt > 0) {
            const change = ((thisMonth - lastMonthAmt) / lastMonthAmt) * 100;
            if (change > 30) {
                const category = categories.find(c => c.id === categoryId);
                if (category) {
                    alerts.push({
                        type: 'warning',
                        message: `${category.icon} ${category.name} spending is up ${change.toFixed(0)}% vs last month`
                    });
                }
            }
        }
    }

    // Check budget overruns
    for (const [categoryId, budget] of Object.entries(budgets)) {
        const spent = thisMonthByCategory[categoryId] || 0;
        if (spent > budget) {
            const category = categories.find(c => c.id === categoryId);
            if (category) {
                alerts.push({
                    type: 'danger',
                    message: `${category.icon} ${category.name} is over budget by ₹${(spent - budget).toFixed(2)}`
                });
            }
        } else if (spent > budget * 0.9) {
            const category = categories.find(c => c.id === categoryId);
            if (category) {
                alerts.push({
                    type: 'warning',
                    message: `${category.icon} ${category.name} is at ${((spent / budget) * 100).toFixed(0)}% of budget`
                });
            }
        }
    }

    // Display alerts
    if (alerts.length === 0) {
        container.innerHTML = '<div class="alert-item alert-success">✓ No unusual spending detected. Keep it up!</div>';
    } else {
        container.innerHTML = alerts.map(a =>
            `<div class="alert-item alert-${a.type}">${a.message}</div>`
        ).join('');
    }
}

function renderBudgetTracking() {
    const container = document.getElementById('budgetTracking');

    if (Object.keys(budgets).length === 0) {
        container.innerHTML = '<p class="text-muted">No budgets set. Click "Set Budgets" to get started.</p>';
        return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get this month's spending by category
    const spending = {};
    expenses.forEach(e => {
        const d = new Date(e.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            spending[e.categoryId] = (spending[e.categoryId] || 0) + e.amount;
        }
    });

    const items = [];
    for (const [categoryId, budget] of Object.entries(budgets)) {
        const category = categories.find(c => c.id === categoryId);
        if (!category || budget <= 0) continue;

        const spent = spending[categoryId] || 0;
        const percentage = (spent / budget) * 100;
        const status = percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'under';

        items.push({
            category,
            spent,
            budget,
            percentage,
            status
        });
    }

    if (items.length === 0) {
        container.innerHTML = '<p class="text-muted">No budgets set. Click "Set Budgets" to get started.</p>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="budget-item">
            <div class="budget-header">
                <span class="budget-category">
                    <span>${item.category.icon}</span>
                    <span>${item.category.name}</span>
                </span>
                <span class="budget-amounts">₹${item.spent.toFixed(2)} / ₹${item.budget.toFixed(2)}</span>
            </div>
            <div class="budget-bar">
                <div class="budget-bar-fill ${item.status}" style="width: ${Math.min(item.percentage, 100)}%"></div>
            </div>
            <div class="budget-percentage" style="color: ${item.status === 'over' ? 'var(--danger)' : item.status === 'warning' ? 'var(--warning)' : 'var(--success)'}">
                ${item.percentage.toFixed(0)}%
            </div>
        </div>
    `).join('');
}

function renderTopExpenses() {
    const container = document.getElementById('topExpenses');

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get this month's expenses sorted by amount
    const thisMonthExpenses = expenses
        .filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    if (thisMonthExpenses.length === 0) {
        container.innerHTML = '<p class="text-muted">No expenses this month yet.</p>';
        return;
    }

    container.innerHTML = thisMonthExpenses.map((expense, index) => {
        const category = categories.find(c => c.id === expense.categoryId) || { icon: '📦', name: 'Unknown' };
        const date = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
            <div class="top-expense-item">
                <span class="top-expense-rank">#${index + 1}</span>
                <span class="top-expense-icon">${category.icon}</span>
                <div class="top-expense-details">
                    <h4>${expense.description || category.name}</h4>
                    <span>${date}</span>
                </div>
                <span class="top-expense-amount">₹${expense.amount.toFixed(2)}</span>
            </div>
        `;
    }).join('');
}

function renderCategoryComparison() {
    const container = document.getElementById('categoryComparison');

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Get spending by category
    const thisMonthByCategory = {};
    const lastMonthByCategory = {};

    expenses.forEach(e => {
        const d = new Date(e.date);
        const month = d.getMonth();
        const year = d.getFullYear();

        if (month === currentMonth && year === currentYear) {
            thisMonthByCategory[e.categoryId] = (thisMonthByCategory[e.categoryId] || 0) + e.amount;
        } else if (month === lastMonth && year === lastMonthYear) {
            lastMonthByCategory[e.categoryId] = (lastMonthByCategory[e.categoryId] || 0) + e.amount;
        }
    });

    // Get all categories that have expenses
    const allCategories = new Set([
        ...Object.keys(thisMonthByCategory),
        ...Object.keys(lastMonthByCategory)
    ]);

    if (allCategories.size === 0) {
        container.innerHTML = '<p class="text-muted">No data to compare yet.</p>';
        return;
    }

    const comparisons = [];
    allCategories.forEach(categoryId => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        const thisMonth = thisMonthByCategory[categoryId] || 0;
        const lastMonthAmt = lastMonthByCategory[categoryId] || 0;
        const change = lastMonthAmt > 0 ? ((thisMonth - lastMonthAmt) / lastMonthAmt) * 100 : (thisMonth > 0 ? 100 : 0);

        comparisons.push({
            category,
            thisMonth,
            lastMonth: lastMonthAmt,
            change
        });
    });

    // Sort by absolute change
    comparisons.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    container.innerHTML = comparisons.slice(0, 5).map(item => {
        const changeClass = item.change > 5 ? 'up' : item.change < -5 ? 'down' : 'same';
        const changeSymbol = item.change > 0 ? '↑' : item.change < 0 ? '↓' : '→';

        return `
            <div class="comparison-item">
                <span class="comparison-icon">${item.category.icon}</span>
                <div class="comparison-details">
                    <div class="comparison-name">${item.category.name}</div>
                    <div class="comparison-amounts">₹${item.thisMonth.toFixed(0)} vs ₹${item.lastMonth.toFixed(0)}</div>
                </div>
                <span class="comparison-change ${changeClass}">${changeSymbol} ${Math.abs(item.change).toFixed(0)}%</span>
            </div>
        `;
    }).join('');
}

function calculateStreaks() {
    if (expenses.length === 0) {
        document.getElementById('noSpendStreak').textContent = '0 days';
        document.getElementById('spendingStreak').textContent = '0 days';
        return;
    }

    // Get unique dates with expenses
    const expenseDates = new Set(
        expenses.map(e => new Date(e.date).toDateString())
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate current no-spend streak (consecutive days without spending ending today or yesterday)
    let noSpendStreak = 0;
    let checkDate = new Date(today);

    // If we spent today, no streak
    if (!expenseDates.has(checkDate.toDateString())) {
        noSpendStreak = 1;
        checkDate.setDate(checkDate.getDate() - 1);

        while (!expenseDates.has(checkDate.toDateString())) {
            noSpendStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
            if (noSpendStreak > 365) break; // Safety limit
        }
    }

    // Calculate spending streak (consecutive days with spending)
    let spendingStreak = 0;
    checkDate = new Date(today);

    // Start from the most recent spending day
    while (!expenseDates.has(checkDate.toDateString()) && spendingStreak < 30) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (expenseDates.has(checkDate.toDateString())) {
        spendingStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
        if (spendingStreak > 365) break; // Safety limit
    }

    document.getElementById('noSpendStreak').textContent = `${noSpendStreak} day${noSpendStreak !== 1 ? 's' : ''}`;
    document.getElementById('spendingStreak').textContent = `${spendingStreak} day${spendingStreak !== 1 ? 's' : ''}`;
}

// Budget Modal Functions
function openBudgetModal() {
    const modal = document.getElementById('budgetModal');
    const form = document.getElementById('budgetForm');

    form.innerHTML = categories.map(category => `
        <div class="budget-form-item">
            <div class="category-info">
                <span class="category-icon">${category.icon}</span>
                <span class="category-name">${category.name}</span>
            </div>
            <input type="number" 
                   id="budget-${category.id}" 
                   placeholder="₹0.00" 
                   min="0" 
                   step="100"
                   value="${budgets[category.id] || ''}">
        </div>
    `).join('');

    modal.style.display = 'block';
}

function closeBudgetModal() {
    document.getElementById('budgetModal').style.display = 'none';
}

function saveBudgets() {
    const newBudgets = {};

    categories.forEach(category => {
        const input = document.getElementById(`budget-${category.id}`);
        if (input && input.value) {
            const value = parseFloat(input.value);
            if (value > 0) {
                newBudgets[category.id] = value;
            }
        }
    });

    budgets = newBudgets;
    localStorage.setItem('budgets', JSON.stringify(budgets));

    closeBudgetModal();
    loadInsights();
}
