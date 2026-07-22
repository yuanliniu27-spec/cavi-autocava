# Cavi Chat History Viewport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fixed-height primary chat viewport whose disposable welcome content is progressively pushed upward by new conversation content while message history remains scrollable above a persistent input box.

**Architecture:** Extract deterministic collapse and auto-scroll decisions into a browser/CommonJS state module, then let `cavi-standalone.html` own DOM measurement and rendering. The welcome block and message log share a clipped flex viewport; message growth reduces the welcome block until it is permanently removed.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js built-in `node:test` and `assert`.

---

## File map

- Create `cavi-chat-state.js`: pure collapse-progress and auto-follow decisions.
- Create `tests/cavi-chat-state.test.js`: state unit tests.
- Modify `cavi-standalone.html`: viewport markup, CSS, accessibility, and DOM integration.

### Task 1: Define viewport behavior with failing tests

**Files:**
- Create: `tests/cavi-chat-state.test.js`
- Create later: `cavi-chat-state.js`

- [ ] **Step 1: Write the failing tests**

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateIntroState,
  shouldFollowLatest,
  advanceIntroState
} = require('../cavi-chat-state.js');

test('keeps the full welcome area before messages exist', () => {
  assert.deepEqual(calculateIntroState(420, 0), {
    visibleHeight: 420, progress: 0, hidden: false
  });
});

test('collapses welcome area in proportion to conversation height', () => {
  assert.deepEqual(calculateIntroState(420, 168), {
    visibleHeight: 252, progress: 0.4, hidden: false
  });
});

test('permanently hides welcome area when conversation fills its height', () => {
  assert.deepEqual(calculateIntroState(420, 500), {
    visibleHeight: 0, progress: 1, hidden: true
  });
});

test('follows AI updates only while the reader is near the bottom', () => {
  assert.equal(shouldFollowLatest(1000, 600, 370), true);
  assert.equal(shouldFollowLatest(1000, 600, 200), false);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/cavi-chat-state.test.js`

Expected: FAIL with `Cannot find module '../cavi-chat-state.js'`.

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/cavi-chat-state.test.js
git commit -m "test: define chat viewport behavior"
```

### Task 2: Implement the pure state module

**Files:**
- Create: `cavi-chat-state.js`
- Test: `tests/cavi-chat-state.test.js`

- [ ] **Step 1: Add the minimal implementation**

```javascript
(function exposeChatState(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CaviChatState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createApi() {
  function calculateIntroState(introHeight, conversationHeight) {
    const safeIntroHeight = Math.max(0, Number(introHeight) || 0);
    const safeConversationHeight = Math.max(0, Number(conversationHeight) || 0);
    if (safeIntroHeight === 0) {
      return { visibleHeight: 0, progress: 1, hidden: true };
    }
    const visibleHeight = Math.max(0, safeIntroHeight - safeConversationHeight);
    const progress = Math.min(1, safeConversationHeight / safeIntroHeight);
    return { visibleHeight, progress, hidden: visibleHeight === 0 };
  }

  function shouldFollowLatest(scrollHeight, clientHeight, scrollTop, threshold = 48) {
    return scrollHeight - clientHeight - scrollTop <= threshold;
  }

  return { calculateIntroState, shouldFollowLatest };
});
```

- [ ] **Step 2: Run the tests and verify GREEN**

Run: `node --test tests/cavi-chat-state.test.js`

Expected: 4 tests pass, 0 fail.

- [ ] **Step 3: Commit**

```bash
git add cavi-chat-state.js tests/cavi-chat-state.test.js
git commit -m "feat: add deterministic chat viewport state"
```

### Task 3: Build the clipped conversation viewport

**Files:**
- Modify: `cavi-standalone.html:228-579`
- Modify: `cavi-standalone.html:1433-1535`

- [ ] **Step 1: Wrap the disposable introduction and history**

Place the existing hero, prompt, and suggestions inside `#conversationIntro`; place `#standaloneMessages` after it and close the wrapper before the input:

```html
<section class="cavi-conversation-viewport" id="conversationViewport"
         aria-label="Conversación con Cavi">
  <div class="cavi-conversation-intro" id="conversationIntro">
    <!-- existing hero, prompt heading, and suggestion chips -->
  </div>
  <div class="cavi-standalone-messages" id="standaloneMessages"
       role="log" aria-live="polite" aria-relevant="additions text" tabindex="0"></div>
</section>
```

- [ ] **Step 2: Replace the old zero-height message CSS**

```css
.cavi-main-area { overflow: hidden; }
.cavi-main-inner { height: 100%; min-height: 0; overflow: hidden; }

.cavi-conversation-viewport {
  flex: 1 1 auto;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cavi-conversation-intro {
  flex: 0 0 auto;
  max-height: var(--intro-visible-height, none);
  overflow: hidden;
  opacity: calc(1 - var(--intro-collapse-progress, 0));
  transform: translateY(calc(-24px * var(--intro-collapse-progress, 0)));
  transition: max-height 280ms ease, opacity 220ms ease, transform 280ms ease;
}

.cavi-conversation-intro.is-hidden { display: none; }

.cavi-standalone-messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  margin-bottom: 16px;
}

.cavi-standalone-messages:empty { flex: 0 0 0; margin: 0; }
.cavi-standalone-input-wrap { flex: 0 0 auto; }
.cavi-main-inner.conversation-active .cavi-trust-section { display: none; }
```

- [ ] **Step 3: Load state logic before inline page logic**

```html
<script src="cavi-chat-state.js"></script>
```

- [ ] **Step 4: Validate structure**

Run: `grep -n "conversationViewport\|conversationIntro\|role=\"log\"\|cavi-chat-state.js" cavi-standalone.html`

Expected: each integration point appears exactly once.

- [ ] **Step 5: Commit**

```bash
git add cavi-standalone.html
git commit -m "feat: add fixed chat conversation viewport"
```

### Task 4: Integrate collapse and respectful auto-scroll

**Files:**
- Modify: `cavi-standalone.html:1878-1923`
- Test: `tests/cavi-chat-state.test.js`

- [ ] **Step 1: Add a failing permanent-removal test**

```javascript
test('does not restore welcome content after it has been removed', () => {
  assert.deepEqual(advanceIntroState(true, 420, 0), {
    visibleHeight: 0, progress: 1, hidden: true
  });
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/cavi-chat-state.test.js`

Expected: FAIL with `advanceIntroState is not a function`.

- [ ] **Step 3: Add the permanent-state transition to `cavi-chat-state.js`**

```javascript
function advanceIntroState(wasHidden, introHeight, conversationHeight) {
  if (wasHidden) return { visibleHeight: 0, progress: 1, hidden: true };
  return calculateIntroState(introHeight, conversationHeight);
}
```

Add `advanceIntroState` to the returned API object.

- [ ] **Step 4: Add DOM coordination helpers before `sendStandalone`**

```javascript
let introOriginalHeight = 0;
let introPermanentlyHidden = false;

function isHistoryNearBottom(container) {
  return CaviChatState.shouldFollowLatest(
    container.scrollHeight, container.clientHeight, container.scrollTop
  );
}

function scrollHistoryToLatest(container, force) {
  if (force || isHistoryNearBottom(container)) {
    container.scrollTop = container.scrollHeight;
  }
}

function updateConversationViewport() {
  const main = document.getElementById('caviMainInner');
  const intro = document.getElementById('conversationIntro');
  const messages = document.getElementById('standaloneMessages');
  if (!main || !intro || !messages || introPermanentlyHidden) return;

  if (!introOriginalHeight) introOriginalHeight = intro.scrollHeight;
  const state = CaviChatState.advanceIntroState(
    introPermanentlyHidden, introOriginalHeight, messages.scrollHeight
  );
  main.classList.toggle('conversation-active', messages.children.length > 0);
  intro.style.setProperty('--intro-visible-height', state.visibleHeight + 'px');
  intro.style.setProperty('--intro-collapse-progress', String(state.progress));

  if (state.hidden) {
    introPermanentlyHidden = true;
    intro.classList.add('is-hidden');
    intro.setAttribute('aria-hidden', 'true');
    intro.querySelectorAll('button, a, input, [tabindex]').forEach((element) => {
      element.setAttribute('tabindex', '-1');
    });
  }
}
```

- [ ] **Step 5: Update each append point in `sendStandalone`**

After the user message, typing indicator, and final reply, call:

```javascript
updateConversationViewport();
scrollHistoryToLatest(container, forceFollow);
```

Use `forceFollow = true` for the user send. Before scheduling AI changes, capture `followAiUpdates = isHistoryNearBottom(container)` and use that Boolean for typing and reply updates.

- [ ] **Step 6: Run all tests and verify GREEN**

Run: `node --test tests/cavi-chat-state.test.js`

Expected: 5 tests pass, 0 fail.

- [ ] **Step 7: Commit**

```bash
git add cavi-standalone.html cavi-chat-state.js tests/cavi-chat-state.test.js
git commit -m "feat: collapse welcome content as chat history grows"
```

### Task 5: Verify and deploy

**Files:**
- Verify: `cavi-standalone.html`
- Verify: `cavi-chat-state.js`

- [ ] **Step 1: Run automated checks**

```bash
node --test tests/cavi-chat-state.test.js
git diff --check
```

Expected: all tests pass and whitespace validation prints nothing.

- [ ] **Step 2: Serve locally**

Run: `python3 -m http.server 8000`

Open: `http://localhost:8000/cavi-standalone.html`.

- [ ] **Step 3: Verify desktop behavior**

Confirm the welcome area is initially visible, each send pushes it upward, repeated sends remove it permanently, ten rounds remain inside the fixed viewport, the input stays visible, and scrolling reveals only message history. Send two messages quickly and confirm each user message keeps its own typing state and AI reply in chronological order; submitting an empty input must create nothing.

- [ ] **Step 4: Verify scroll ownership and narrow layout**

While an AI reply is pending, scroll upward and confirm it does not steal position. Send again and confirm the viewport returns to the latest message. Repeat at 390px width and confirm the input is not covered.

- [ ] **Step 5: Commit any verification fix**

```bash
git add cavi-standalone.html cavi-chat-state.js tests/cavi-chat-state.test.js
git commit -m "fix: finalize responsive chat viewport behavior"
```

Skip this commit if verification requires no changes.

- [ ] **Step 6: Push and verify Pages**

```bash
git push origin main
gh api repos/yuanliniu27-spec/cavi-autocava/pages/builds/latest --jq '[.status,.commit,.error.message] | @tsv'
curl -L -s -o /dev/null -w '%{http_code}\n' https://yuanliniu27-spec.github.io/cavi-autocava/cavi-standalone.html
```

Expected: Pages reports `built` for the pushed commit and the public page returns HTTP `200`.
