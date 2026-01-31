// Sync Manager for offline/online data synchronization
class SyncManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.isSyncing = false;
        this.syncListeners = [];
        this.setupListeners();
    }

    setupListeners() {
        // Online/offline event listeners
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Service worker message listener
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SYNC_REQUIRED') {
                    this.syncAll();
                }
            });
        }
    }

    handleOnline() {
        console.log('[Sync] Back online');
        this.isOnline = true;
        this.updateOnlineStatus(true);
        this.syncAll();
    }

    handleOffline() {
        console.log('[Sync] Gone offline');
        this.isOnline = false;
        this.updateOnlineStatus(false);
    }

    updateOnlineStatus(isOnline) {
        const indicator = document.getElementById('onlineStatus');
        if (indicator) {
            indicator.className = `online-status ${isOnline ? 'online' : 'offline'}`;
            indicator.innerHTML = isOnline
                ? '<span class="status-dot"></span> Online'
                : '<span class="status-dot"></span> Offline';
        }
    }

    // Add a listener for sync events
    onSync(callback) {
        this.syncListeners.push(callback);
    }

    notifySyncListeners(event, data) {
        this.syncListeners.forEach(listener => listener(event, data));
    }

    // Check if we're online
    checkOnline() {
        return navigator.onLine;
    }

    // Request background sync if supported
    async requestBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.SyncManager) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('sync-expenses');
                console.log('[Sync] Background sync registered');
            } catch (error) {
                console.log('[Sync] Background sync not supported, will sync when online');
            }
        }
    }

    // Sync all data
    async syncAll() {
        if (this.isSyncing || !this.isOnline) {
            console.log('[Sync] Skip sync - already syncing or offline');
            return;
        }

        this.isSyncing = true;
        this.notifySyncListeners('sync-start');
        console.log('[Sync] Starting full sync...');

        try {
            // First, push any pending local changes
            await this.pushPendingChanges();

            // Then, pull latest data from server
            await this.pullFromServer();

            await offlineDB.setLastSyncTime(Date.now());
            console.log('[Sync] Sync completed successfully');
            this.notifySyncListeners('sync-complete');
        } catch (error) {
            console.error('[Sync] Sync failed:', error);
            this.notifySyncListeners('sync-error', error);
        } finally {
            this.isSyncing = false;
        }
    }

    // Push pending local changes to server
    async pushPendingChanges() {
        const pendingOps = await offlineDB.getPendingOperations();
        console.log(`[Sync] Processing ${pendingOps.length} pending operations`);

        for (const op of pendingOps) {
            try {
                await this.executePendingOperation(op);
                await offlineDB.clearPendingOperation(op.id);
                console.log(`[Sync] Completed operation: ${op.type} ${op.entity}`);
            } catch (error) {
                console.error(`[Sync] Failed operation: ${op.type} ${op.entity}`, error);
                // Keep the operation in queue for retry
            }
        }
    }

    // Execute a single pending operation
    async executePendingOperation(op) {
        const { type, entity, data, entityId } = op;

        let endpoint = `/api/${entity}`;
        let method = 'GET';
        let body = null;

        switch (type) {
            case 'create':
                method = 'POST';
                body = JSON.stringify(data);
                break;
            case 'update':
                endpoint = `/api/${entity}/${entityId}`;
                method = 'PUT';
                body = JSON.stringify(data);
                break;
            case 'delete':
                endpoint = `/api/${entity}/${entityId}`;
                method = 'DELETE';
                break;
        }

        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        return response.json();
    }

    // Pull latest data from server
    async pullFromServer() {
        console.log('[Sync] Pulling data from server...');

        try {
            // Fetch categories
            const categoriesResponse = await fetch('/api/categories');
            if (categoriesResponse.ok) {
                const categories = await categoriesResponse.json();
                await offlineDB.syncCategories(categories);
                console.log(`[Sync] Synced ${categories.length} categories`);
            }

            // Fetch expenses
            const expensesResponse = await fetch('/api/expenses');
            if (expensesResponse.ok) {
                const expenses = await expensesResponse.json();
                await offlineDB.syncExpenses(expenses);
                console.log(`[Sync] Synced ${expenses.length} expenses`);
            }
        } catch (error) {
            console.error('[Sync] Pull from server failed:', error);
            throw error;
        }
    }

    // Generate temporary ID for offline-created items
    generateTempId() {
        return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Queue an operation for sync
    async queueOperation(type, entity, data, entityId = null) {
        const operation = {
            type,
            entity,
            data,
            entityId,
            timestamp: Date.now()
        };

        await offlineDB.addPendingOperation(operation);
        console.log(`[Sync] Queued operation: ${type} ${entity}`);

        // Try to sync immediately if online
        if (this.isOnline) {
            this.syncAll();
        } else {
            // Request background sync for when we come back online
            this.requestBackgroundSync();
        }
    }
}

// Create singleton instance
const syncManager = new SyncManager();
