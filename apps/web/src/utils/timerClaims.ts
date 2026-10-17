// IndexedDB transactions serialize claims across windows and the service worker.
// If storage is unavailable, fail closed rather than ring in every tab.
export async function claimTimerEvent(id: string): Promise<boolean> {
    try {
        return await new Promise<boolean>((resolve) => {
            const open = indexedDB.open('workout-timer-alerts', 1);
            open.onupgradeneeded = () => open.result.createObjectStore('claims');
            open.onerror = () => resolve(false);
            open.onsuccess = () => {
                const db = open.result;
                const tx = db.transaction('claims', 'readwrite');
                const store = tx.objectStore('claims');
                let won = false;
                const request = store.get(id);
                request.onsuccess = () => {
                    if (request.result === undefined) { store.put(Date.now(), id); won = true; }
                };
                // Bound retention without making an event claim expire during a run.
                const cursor = store.openCursor();
                cursor.onsuccess = () => {
                    const entry = cursor.result;
                    if (entry) { if ((typeof entry.value === 'number' ? entry.value : entry.value.updatedAt) < Date.now() - 86400000 * 2) entry.delete(); entry.continue(); }
                };
                tx.oncomplete = () => { db.close(); resolve(won); };
                tx.onabort = tx.onerror = () => { db.close(); resolve(false); };
            };
        });
    } catch { return false; }
}

export async function recordTimerAuthority(scope: string, revision: number, active: boolean): Promise<void> {
    try {
        await new Promise<void>(resolve => {
            const open = indexedDB.open('workout-timer-alerts', 1);
            open.onupgradeneeded = () => open.result.createObjectStore('claims');
            open.onerror = () => resolve();
            open.onsuccess = () => {
                const db = open.result, tx = db.transaction('claims', 'readwrite'), store = tx.objectStore('claims');
                const key = `scope:${scope}`, request = store.get(key);
                request.onsuccess = () => {
                    if (!request.result || request.result.revision <= revision) store.put({ revision, active, updatedAt: Date.now() }, key);
                };
                tx.oncomplete = tx.onabort = tx.onerror = () => { db.close(); resolve(); };
            };
        });
    } catch { /* Push remains best effort when IndexedDB is unavailable. */ }
}
