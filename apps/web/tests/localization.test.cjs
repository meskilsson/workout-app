const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const i18n = require('../src/i18n/index.ts');
const en = require('../src/i18n/locales/en.json');
const sv = require('../src/i18n/locales/sv.json');
const { validationMessage, apiFieldErrors, friendlyError } = require('../src/utils/formValidation.ts');
const { ApiRequestError } = require('../src/utils/parseJsonResponse.ts');
const { formatCompletedDate } = require('../src/utils/formatCompletedDate.ts');
afterEach(() => i18n.default.changeLanguage('en'));

test('first visit, unsupported preference, and blocked storage use English', () => {
    assert.equal(i18n.savedLanguage(), 'en');
    for (const value of [null, '', 'de', 'SV', 'en']) assert.equal(i18n.savedLanguage({ getItem: () => value }), 'en');
    assert.equal(i18n.savedLanguage({ getItem: () => 'sv' }), 'sv');
    assert.equal(i18n.savedLanguage({ getItem: () => { throw Error('Blocked'); } }), 'en');
});
test('catalogs have identical keys and interpolation parameters', () => {
    assert.deepEqual(Object.keys(en).sort(), Object.keys(sv).sort());
    for (const key of Object.keys(en)) {
        assert(sv[key].trim(), key);
        assert.deepEqual(en[key].match(/\{\{\w+\}\}/g)?.sort() ?? [], sv[key].match(/\{\{\w+\}\}/g)?.sort() ?? [], key);
    }
});
test('both languages pluralize counts and Swedish formats numbers and dates', async () => {
    assert.equal(i18n.t('common.exerciseCount', { count: 1 }), '1 exercise');
    assert.equal(i18n.t('common.exerciseCount', { count: 2 }), '2 exercises');
    await i18n.default.changeLanguage('sv');
    assert.equal(i18n.t('common.exerciseCount', { count: 1 }), '1 övning');
    assert.equal(i18n.t('common.exerciseCount', { count: 0 }), '0 övningar');
    assert.equal(i18n.t('common.exerciseCount', { count: 2 }), '2 övningar');
    assert.equal(i18n.formatNumber(12.5), '12,5');
    assert.match(formatCompletedDate(new Date(2026, 9, 11, 12)), /söndag 11 oktober/);
    assert.equal(i18n.displayValue('chest'), 'Bröst');
    assert.equal(i18n.displayValue('My custom muscle'), 'My custom muscle');
});
test('English fallback covers a missing Swedish key without exposing the key', async () => {
    i18n.default.addResource('en', 'translation', 'test.englishOnly', 'English fallback');
    await i18n.default.changeLanguage('sv');
    assert.equal(i18n.t('test.englishOnly'), 'English fallback');
});
test('validation and known API codes translate without translating arbitrary server messages', async () => {
    await i18n.default.changeLanguage('sv');
    const control = { type: 'text', value: '', required: true, labels: [{ cloneNode: () => ({ textContent: 'Namn', querySelectorAll: () => [] }) }], validity: {}, getAttribute: () => null };
    assert.equal(validationMessage(control), 'Namn är obligatoriskt.');
    assert.match(friendlyError(new ApiRequestError('private implementation detail', 401, { code: 'INVALID_CREDENTIALS' })), /Fel e-postadress/);
    assert.deepEqual(apiFieldErrors(new ApiRequestError('Invalid', 400, { errors: [{ field: 'email', code: 'EMAIL_TAKEN', message: 'internal text' }] })), { email: 'E-postadressen används redan.' });
    assert.deepEqual(apiFieldErrors(new ApiRequestError('Invalid', 400, { errors: [{ field: 'username', code: 'USERNAME_TAKEN' }] })), { username: 'Användarnamnet används redan.' });
    assert(!friendlyError(new ApiRequestError('private implementation detail', 400, {})).includes('private'));
    const serverMessage = i18n.t('parseJsonResponse.theServerCouldNotCompleteYourRequestPleaseTry');
    assert.equal(friendlyError(new ApiRequestError(serverMessage, 503, {})), serverMessage);
    assert.equal(i18n.translateMessage('My user-entered text'), 'My user-entered text');
});
