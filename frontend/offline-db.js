// IndexedDB wrapper for offline data storage
const DB_NAME = 'ExpenseTrackerDB';
const DB_VERSION = 1;

class OfflineDB {
    constructor() {
        this.db = null;
        this.isReady = false;
    }

    // Initialize the database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('[OfflineDB] Failed to open database');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                console.log('[OfflineDB] Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('[OfflineDB] Upgrading database...');

                // Categories store
                if (!db.objectStoreNames.contains('categories')) {
                    const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
                    categoriesStore.createIndex('name', 'name', { unique: false });
                }

                // Expenses store
                if (!db.objectStoreNames.contains('expenses')) {
                    const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' });
                    expensesStore.createIndex('date', 'date', { unique: false });
                    expensesStore.createIndex('categoryId', 'categoryId', { unique: false });
                    expensesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
                }

                // Pending operations store (for sync queue)
                if (!db.objectStoreNames.contains('pendingOperations')) {
                    const pendingStore = db.createObjectStore('pendingOperations', { keyPath: 'id', autoIncrement: true });
                    pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
                    pendingStore.createIndex('type', 'type', { unique: false });
                }

                // Metadata store (for sync timestamps, etc.)
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };
        });
    }

    // Generic get all from store
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic get by ID
    async getById(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic put (add or update)
    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic delete
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Bulk put
    async bulkPut(storeName, items) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            items.forEach(item => store.put(item));

            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Clear store
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // === Categories ===
    async getCategories() {
        return this.getAll('categories');
    }

    async saveCategory(category) {
        return this.put('categories', category);
    }

    async deleteCategory(id) {
        return this.delete('categories', id);
    }

    async syncCategories(serverCategories) {
        await this.clear('categories');
        await this.bulkPut('categories', serverCategories);
    }

    // === Expenses ===
    async getExpenses() {
        const expenses = await this.getAll('expenses');
        // Sort by date descending
        return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async saveExpense(expense) {
        return this.put('expenses', expense);
    }

    async deleteExpense(id) {
        return this.delete('expenses', id);
    }

    async syncExpenses(serverExpenses) {
        // Get local expenses that haven't been synced
        const localExpenses = await this.getAll('expenses');
        const pendingExpenses = localExpenses.filter(e => e.syncStatus === 'pending');

        // Clear and add server expenses
        await this.clear('expenses');

        // Mark server expenses as synced
        const syncedExpenses = serverExpenses.map(e => ({ ...e, syncStatus: 'synced' }));
        await this.bulkPut('expenses', syncedExpenses);

        return pendingExpenses;
    }

    // === Pending Operations (Sync Queue) ===
    async addPendingOperation(operation) {
        const op = {
            ...operation,
            timestamp: Date.now()
        };
        return this.put('pendingOperations', op);
    }

    async getPendingOperations() {
        return this.getAll('pendingOperations');
    }

    async clearPendingOperation(id) {
        return this.delete('pendingOperations', id);
    }

    async clearAllPendingOperations() {
        return this.clear('pendingOperations');
    }

    // === Metadata ===
    async getMetadata(key) {
        const result = await this.getById('metadata', key);
        return result ? result.value : null;
    }

    async setMetadata(key, value) {
        return this.put('metadata', { key, value });
    }

    // Get last sync timestamp
    async getLastSyncTime() {
        return this.getMetadata('lastSyncTime');
    }

    async setLastSyncTime(timestamp) {
        return this.setMetadata('lastSyncTime', timestamp);
    }
}

// Create and export singleton instance
const offlineDB = new OfflineDB();
