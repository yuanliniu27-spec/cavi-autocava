(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.CaviChatState = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalizeDimension(value) {
    return Math.max(0, Number(value) || 0);
  }

  function calculateIntroState(introHeight, conversationHeight) {
    const safeIntroHeight = normalizeDimension(introHeight);
    const safeConversationHeight = normalizeDimension(conversationHeight);

    if (safeIntroHeight === 0) {
      return {
        visibleHeight: 0,
        progress: 1,
        hidden: true,
      };
    }

    const visibleHeight = Math.max(
      0,
      safeIntroHeight - safeConversationHeight,
    );

    return {
      visibleHeight,
      progress: Math.min(1, safeConversationHeight / safeIntroHeight),
      hidden: visibleHeight === 0,
    };
  }

  function shouldFollowLatest(
    scrollHeight,
    clientHeight,
    scrollTop,
    threshold = 48,
  ) {
    return scrollHeight - clientHeight - scrollTop <= threshold;
  }

  return {
    calculateIntroState,
    shouldFollowLatest,
  };
});
