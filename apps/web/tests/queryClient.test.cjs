const { test } = require('node:test');
const assert = require('node:assert/strict');
const { QueryObserver, MutationObserver } = require('@tanstack/react-query');
const { createQueryClient, clearAccountCache, authKey, templateKeys, exerciseKeys, sessionKeys, draftKeys, adminKeys, cacheSavedDraft } = require('../src/query/queryClient.ts');

test('account changes remove private results and notify the existing auth observer', async () => {
    const client = createQueryClient();
    client.setQueryData(authKey, { _id: 'alice' });
    client.setQueryData(templateKeys.mine('alice'), [{ _id: 'private' }]);
    const auth = new QueryObserver(client, { queryKey: authKey, staleTime: Infinity });
    const unsubscribe = auth.subscribe(() => {});
    clearAccountCache(client);
    client.setQueryData(authKey, { _id: 'bob' });
    assert.equal(auth.getCurrentResult().data._id, 'bob');
    assert.equal(client.getQueryData(templateKeys.mine('alice')), undefined);
    assert.equal(client.getQueryData(templateKeys.mine('bob')), undefined);
    unsubscribe(); client.clear();
});

test('logout cancels an old-account read so its late result cannot return to the cache', async () => {
    const client = createQueryClient();
    let resolve, signal;
    const pending = client.fetchQuery({ queryKey: templateKeys.mine('alice'), queryFn: context => {
        signal = context.signal;
        return new Promise(done => { resolve = done; });
    } }).catch(() => {});
    clearAccountCache(client);
    client.setQueryData(authKey, null);
    resolve([{ _id: 'private' }]);
    await pending;
    assert.equal(signal.aborted, true);
    assert.equal(client.getQueryData(templateKeys.mine('alice')), undefined);
    assert.equal(client.getQueryData(authKey), null);
    client.clear();
});

test('a failed write is submitted once, with no automatic mutation retry', async () => {
    const client = createQueryClient();
    let attempts = 0;
    const mutation = new MutationObserver(client, { mutationFn: async () => { attempts++; throw new Error('lost response'); } });
    await assert.rejects(mutation.mutate(), /lost response/);
    assert.equal(attempts, 1);
    client.clear();
});

test('background query failure keeps previously loaded templates visible', async () => {
    const client = createQueryClient();
    const key = templateKeys.public;
    const templates = [{ _id: 'template' }];
    client.setQueryData(key, templates);
    await assert.rejects(client.fetchQuery({ queryKey: key, queryFn: async () => { throw new Error('offline'); } }));
    assert.deepEqual(client.getQueryData(key), templates);
    client.clear();
});

test('exercise cache separates users, public browsing, pagination, search and sorting', () => {
    const client = createQueryClient();
    const params = { page: 1, limit: 12, search: '', sort: 'popular' };
    const key = exerciseKeys.list('alice', params);
    client.setQueryData(key, { exercises: [{ _id: 'private' }] });
    for (const other of [
        exerciseKeys.list('bob', params), exerciseKeys.list(undefined, params),
        exerciseKeys.list('alice', { ...params, page: 2 }),
        exerciseKeys.list('alice', { ...params, search: 'row' }),
        exerciseKeys.list('alice', { ...params, sort: 'mostUsed' }),
    ]) assert.equal(client.getQueryData(other), undefined);
    client.clear();
});

test('exercise invalidation reaches lists and details without invalidating auth or sessions', async () => {
    const client = createQueryClient();
    const list = exerciseKeys.list('alice', { page: 1 });
    const detail = exerciseKeys.detail('alice', 'exercise');
    const session = sessionKeys.detail('alice', 'session');
    for (const key of [list, detail, session, authKey]) client.setQueryData(key, {});
    await client.invalidateQueries({ queryKey: ['exercises'] });
    assert.equal(client.getQueryState(list).isInvalidated, true);
    assert.equal(client.getQueryState(detail).isInvalidated, true);
    assert.equal(client.getQueryState(session).isInvalidated, false);
    assert.equal(client.getQueryState(authKey).isInvalidated, false);
    client.clear();
});

test('session history and detail caches are isolated and cleared on account change', () => {
    const client = createQueryClient();
    client.setQueryData(sessionKeys.list('alice'), [{ _id: 'session' }]);
    client.setQueryData(sessionKeys.detail('alice', 'session'), { _id: 'session' });
    assert.equal(client.getQueryData(sessionKeys.detail('bob', 'session')), undefined);
    clearAccountCache(client);
    assert.equal(client.getQueryData(sessionKeys.list('alice')), undefined);
    assert.equal(client.getQueryData(sessionKeys.detail('alice', 'session')), undefined);
    client.clear();
});

test('template detail keys isolate source and account, and private invalidation includes details', async () => {
    const client = createQueryClient();
    const alice = templateKeys.detail('my', 'alice', 'same');
    const bob = templateKeys.detail('my', 'bob', 'same');
    const publicKey = templateKeys.detail('public', 'alice', 'same');
    client.setQueryData(alice, { name: 'Private' });
    client.setQueryData(bob, { name: 'Other' });
    client.setQueryData(publicKey, { name: 'Public' });
    await client.invalidateQueries({ queryKey: templateKeys.mine('alice') });
    assert.equal(client.getQueryState(alice).isInvalidated, true);
    assert.equal(client.getQueryState(bob).isInvalidated, false);
    assert.equal(client.getQueryState(publicKey).isInvalidated, false);
    clearAccountCache(client);
    assert.equal(client.getQueryData(alice), undefined);
    client.clear();
});

test('draft verification reads the server despite a cached active result', async () => {
    const client = createQueryClient();
    const key = draftKeys.detail('alice', 'draft');
    client.setQueryData(key, { status: 'active' });
    let reads = 0;
    const result = await client.fetchQuery({ queryKey: key, staleTime: 0, queryFn: async () => { reads++; return { status: 'completed' }; } });
    assert.equal(reads, 1);
    assert.equal(result.status, 'completed');
    assert.notDeepEqual(key, draftKeys.detail('bob', 'draft'));
    assert.notDeepEqual(draftKeys.restoration('alice'), draftKeys.restoration('bob'));
    client.clear();
});
test('admin filters, pages and details are scoped and removed on logout', () => {
    const client = createQueryClient();
    const key = adminKeys.list('alice', 'exercises', 'bench', 1, 'shared');
    client.setQueryData(key, { items: [{ _id: 'private' }] });
    assert.notDeepEqual(key, adminKeys.list('alice', 'exercises', 'bench', 2, 'shared'));
    assert.notDeepEqual(key, adminKeys.list('bob', 'exercises', 'bench', 1, 'shared'));
    client.setQueryData(adminKeys.detail('alice', 'users', 'person'), { email: 'private' });
    clearAccountCache(client);
    assert.equal(client.getQueryData(key), undefined);
    assert.equal(client.getQueryData(adminKeys.detail('alice', 'users', 'person')), undefined);
    client.clear();
});

test('saved selections seed the first summary observer from the write response', async () => {
    const client = createQueryClient();
    const key = draftKeys.detail('alice', 'draft');
    client.setQueryData(authKey, { _id: 'alice' });
    client.setQueryData(key, { exercises: [] });
    const saved = { exercises: [{ exerciseId: 'bench', sets: [{ id: 'stable-set', weight: 40, reps: 8 }] }] };
    await cacheSavedDraft(client, 'alice', 'draft', saved);
    const summary = new QueryObserver(client, { queryKey: key, enabled: false });
    assert.deepEqual(summary.getCurrentResult().data, saved);
    client.clear();
});

test('a pre-save read cannot overwrite selected exercises after navigation', async () => {
    const client = createQueryClient();
    const key = draftKeys.detail('alice', 'draft');
    client.setQueryData(authKey, { _id: 'alice' });
    let resolve;
    const read = client.fetchQuery({ queryKey: key, queryFn: () => new Promise(done => { resolve = done; }) }).catch(() => {});
    const saved = { exercises: [{ exerciseId: 'bench' }] };
    await cacheSavedDraft(client, 'alice', 'draft', saved);
    resolve({ exercises: [] });
    await read;
    assert.deepEqual(client.getQueryData(key), saved);
    client.clear();
});

test('a selection saved by the previous account cannot repopulate its cache', async () => {
    const client = createQueryClient();
    client.setQueryData(authKey, { _id: 'bob' });
    await cacheSavedDraft(client, 'alice', 'draft', { exercises: ['private'] });
    assert.equal(client.getQueryData(draftKeys.detail('alice', 'draft')), undefined);
    client.clear();
});
