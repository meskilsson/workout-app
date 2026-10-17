// This worker handles incoming Web Push; it does not schedule timers locally.
self.addEventListener('push', event => {
    event.waitUntil((async () => {
        let data;
        try { data = event.data.json(); } catch { return; }
        if (!data || typeof data.id !== 'string' || typeof data.title !== 'string') return;
        const authority = await readAuthority(data.scope).catch(() => null);
        const fresh = Number.isFinite(data.expiresAt) && Date.now() < data.expiresAt &&
            (!authority || (authority.active && authority.revision <= data.revision));
        const won = await claim(data.id).catch(() => false);
        // Apple requires a visible notification for every push. A delayed or
        // already acknowledged message is silent and never replays an old cue.
        await self.registration.showNotification(data.title, {
            body: fresh ? data.body : data.expiredBody,
            tag: `timer:${data.id}`, silent: !fresh || !won,
            data: { url: /^\/workout\/[a-f\d]{24}$/i.test(data.url) ? data.url : '/' },
        });
    })());
});
function readAuthority(scope) {
    return new Promise(resolve => {
        const open = indexedDB.open('workout-timer-alerts', 1);
        open.onupgradeneeded = () => open.result.createObjectStore('claims');
        open.onerror = () => resolve(null);
        open.onsuccess = () => {
            const db = open.result, tx = db.transaction('claims', 'readonly');
            const request = tx.objectStore('claims').get(`scope:${scope}`);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
            tx.oncomplete = tx.onabort = () => db.close();
        };
    });
}
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil((async () => {
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
        const url = event.notification.data?.url || '/';
        if (existing) { await existing.focus(); await existing.navigate(url); }
        else await self.clients.openWindow(url);
    })());
});
function claim(id) {
    return new Promise(resolve => {
        const open = indexedDB.open('workout-timer-alerts', 1);
        open.onupgradeneeded = () => open.result.createObjectStore('claims');
        open.onerror = () => resolve(false);
        open.onsuccess = () => {
            const db = open.result, tx = db.transaction('claims', 'readwrite'), store = tx.objectStore('claims');
            let won = false;
            const request = store.get(id);
            request.onsuccess = () => { if (request.result === undefined) { store.put(Date.now(), id); won = true; } };
            tx.oncomplete = () => { db.close(); resolve(won); };
            tx.onabort = tx.onerror = () => { db.close(); resolve(false); };
        };
    });
}
