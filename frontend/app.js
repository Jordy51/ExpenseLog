// API Base URL
const API_URL = '/api';

// State
let categories = [];
let expenses = [];
let categoryChart = null;
let trendChart = null;
let dateCalendar = null;
let editDateCalendar = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeDateInput();
    loadCategories();
    loadExpenses();
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

        return `
            <div class="expense-item">
                <div class="expense-info">
                    <span class="expense-icon">${category.icon}</span>
                    <div class="expense-details">
                        <h4>${expense.description}</h4>
                        <span style="color: ${category.color}">${category.name}</span>
                    </div>
                </div>
                <div class="expense-amount">
                    <div class="amount">-₹${expense.amount.toFixed(2)}</div>
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
        const category = categories.find(c => c.id === pattern.categoryId) || { color: '#888' };
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
        const cat = categories.find(c => c.id === p.categoryId);
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
