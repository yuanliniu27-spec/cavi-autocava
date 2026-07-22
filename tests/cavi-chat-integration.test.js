const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'cavi-standalone.html'),
  'utf8',
);

test('chat measures a dedicated content wrapper instead of the flex scroller', () => {
  assert.match(html, /id="standaloneMessageContent"/);
  assert.match(html, /messageContent\.scrollHeight/);
  assert.doesNotMatch(html, /messages\.scrollHeight,[\s\S]*?\);/);
});

test('chat keeps opted-in history pinned while the intro resizes', () => {
  assert.match(html, /new ResizeObserver/);
  assert.match(html, /historyFollowLatest/);
  assert.match(html, /intro\.addEventListener\('transitionend'/);
});

test('active and short mobile conversations constrain history above the input', () => {
  assert.match(html, /\.cavi-main-inner\.conversation-active\s*\{[^}]*height:\s*100dvh/s);
  assert.match(html, /@media\s*\(max-height:\s*700px\)/);
  assert.match(html, /@media\s*\(max-width:\s*768px\)[\s\S]*?conversation-active/s);
});

test('rapid messages append to one ordered content node', () => {
  assert.match(html, /messageContent\.insertAdjacentHTML\('beforeend'/);
  assert.match(html, /\+ \(\+\+standaloneTypingSequence\)/);
});

test('standalone page supplies an inline favicon without a network request', () => {
  assert.match(html, /<link rel="icon" href="data:,">/);
});

test('short conversation viewports hide the sidebar', () => {
  assert.match(
    html,
    /@media\s*\(max-height:\s*700px\)[\s\S]*?\.cavi-standalone-body\.conversation-active \.cavi-sidebar\s*\{[^}]*display:\s*none/s,
  );
});
