const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ApiRequestError, parseJsonResponse } = require('../src/utils/parseJsonResponse.ts');
const { apiFieldErrors, friendlyError, validationMessage } = require('../src/utils/formValidation.ts');
const { UserFacingError } = require('../src/utils/UserFacingError.ts');

function control(options = {}) {
    return { type: 'text', name: 'name', value: '', required: false, minLength: -1, maxLength: -1,
        labels: [{ cloneNode: () => ({ textContent: 'Name *', querySelectorAll: () => [] }) }],
        getAttribute: () => null, dataset: {}, validity: { valid: true }, ...options };
}
test('required and length constraints also catch whitespace and programmatically populated values', () => {
    assert.equal(validationMessage(control({ required: true, value: '  ' })), 'Name is required.');
    assert.match(validationMessage(control({ value: 'A', minLength: 2 })), /at least 2/);
    assert.match(validationMessage(control({ value: 'abcdef', maxLength: 5 })), /no more than 5/);
    assert.equal(validationMessage(control({ value: 'Alex', minLength: 2 })), '');
});
test('email, number bounds, patterns and compound duration constraints provide corrective messages', () => {
    assert.match(validationMessage(control({ type: 'email', validity: { typeMismatch: true } })), /valid email/);
    assert.match(validationMessage(control({ min: '0', validity: { rangeUnderflow: true } })), /0 or more/);
    assert.match(validationMessage(control({ max: '59', validity: { rangeOverflow: true } })), /59 or less/);
    assert.equal(validationMessage(control({ validity: { patternMismatch: true }, dataset: { validationHint: 'Use letters only.' } })), 'Use letters only.');
    assert.equal(validationMessage(control({ dataset: { validationError: 'Choose at least 1 second.' } })), 'Choose at least 1 second.');
});
test('field errors accept dotted fields and array paths, safely ignoring malformed errors', () => {
    const error = new ApiRequestError('Invalid', 400, { errors: [null, 'Invalid', {}, { path: ['exercises', 0, 'sets', 1, 'reps'], message: 'Enter whole reps.' }, { field: 'email', message: 'Email is taken.' }] });
    assert.deepEqual(apiFieldErrors(error), { 'exercises.0.sets.1.reps': 'Enter whole reps.', email: 'Email is taken.' });
    assert.deepEqual(apiFieldErrors(new ApiRequestError('Error', 400, { errors: {} })), {});
    assert.deepEqual(apiFieldErrors(new ApiRequestError('Error', 500, error.data)), {});
});
test('API parser preserves status/data for authentication and field mapping, without leaking server HTML or diagnostics', async () => {
    for (const [status, body] of [[500, { message: 'MongoServerError: private collection' }], [502, '<html>proxy stacktrace</html>'], [200, '<html>proxy stacktrace</html>'], [400, { errors: [null, {}, 7, { field: 'private.path' }] }], [400, { errors: {} }]]) {
        await assert.rejects(parseJsonResponse(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }), 'Unable to save. Please try again.'), error => {
            assert.equal(error.status, status);
            assert(!/Mongo|html|stacktrace/.test(error.message));
            return error instanceof ApiRequestError;
        });
    }
    const data = { message: 'Please log in again.' };
    await assert.rejects(parseJsonResponse(new Response(JSON.stringify(data), { status: 401 }), 'Error'), error => {
        assert.equal(error.status, 401); assert.deepEqual(error.data, data); assert.equal(error.message, data.message); return true;
    });
    assert.equal(await parseJsonResponse(new Response(null, { status: 204 }), 'Error'), null);
});
test('network and unexpected exceptions get friendly fallbacks', () => {
    assert.match(friendlyError(new TypeError('Failed to fetch')), /Check your connection/);
    assert.equal(friendlyError(new Error('private implementation detail'), 'Unable to save.'), 'Unable to save.');
    assert.equal(friendlyError(new ApiRequestError('Email is taken.', 409, {})), 'Email is taken.');
    const message = 'Could not confirm whether the workout finished. Your progress has been kept.';
    assert.equal(friendlyError(new UserFacingError(message)), message);
});
