const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateIntroState,
  shouldFollowLatest,
  advanceIntroState,
} = require('../cavi-chat-state.js');

test('calculateIntroState reports the fully visible intro', () => {
  assert.deepEqual(calculateIntroState(420, 0), {
    visibleHeight: 420,
    progress: 0,
    hidden: false,
  });
});

test('calculateIntroState reports partial intro progress', () => {
  assert.deepEqual(calculateIntroState(420, 168), {
    visibleHeight: 252,
    progress: 0.4,
    hidden: false,
  });
});

test('calculateIntroState clamps and hides a fully consumed intro', () => {
  assert.deepEqual(calculateIntroState(420, 500), {
    visibleHeight: 0,
    progress: 1,
    hidden: true,
  });
});

test('shouldFollowLatest detects proximity to the latest message', () => {
  assert.equal(shouldFollowLatest(1000, 600, 370), true);
  assert.equal(shouldFollowLatest(1000, 600, 200), false);
});

test('advanceIntroState keeps a hidden intro permanently hidden', () => {
  assert.deepEqual(advanceIntroState(true, 420, 0), {
    visibleHeight: 0,
    progress: 1,
    hidden: true,
  });
});

test('conversation content progressively collapses the intro', () => {
  const firstMessage = calculateIntroState(420, 72);
  const severalMessages = calculateIntroState(420, 216);

  assert.equal(firstMessage.hidden, false);
  assert.equal(firstMessage.visibleHeight, 348);
  assert.ok(severalMessages.visibleHeight < firstMessage.visibleHeight);
  assert.ok(severalMessages.visibleHeight > 0);
});
