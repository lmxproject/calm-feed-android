// ==UserScript==
// @name         Calm Feed for Android
// @namespace    https://github.com/lmxproject/calm-feed-android
// @version      0.1.0
// @description  Instagram on the web with only the accounts you follow: no Reels tab, no Explore grid, no suggested posts.
// @author       lmxproject
// @license      MIT
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @run-at       document-start
// @inject-into  content
// @noframes
// @grant        GM.addStyle
// @grant        GM_addStyle
// @homepageURL  https://github.com/lmxproject/calm-feed-android
// @updateURL    https://raw.githubusercontent.com/lmxproject/calm-feed-android/main/calm-feed-android.user.js
// @downloadURL  https://raw.githubusercontent.com/lmxproject/calm-feed-android/main/calm-feed-android.user.js
// ==/UserScript==

// Calm Feed only hides and redirects things on the page you are already looking at.
// It makes no network requests and never reads your messages, password or cookies.

(function () {
  'use strict';

  // ---- Settings: change true/false to your liking ----
  const SETTINGS = {
    followingFeed: true, // open the "Following" feed instead of the algorithmic home feed
    hideReels: true, // hide the Reels tab and leave the Reels page
    hideExplore: true, // leave the Explore grid for the search page (search keeps working)
    hideSuggested: true, // hide "Suggested for you" posts and accounts in the feed
  };

  // Text Instagram shows above suggested posts and accounts (compared without case).
  // If your Instagram is not in English, add the exact text you see in your language.
  const SUGGESTED_LABELS = ['suggested for you', 'suggested posts'];

  const FOLLOWING_URL = '/?variant=following';
  const SEARCH_URL = '/explore/search/';
  const HIDDEN_ATTR = 'data-calm-feed-hidden';
  const GUARD_KEY = 'calmFeed.redirects';

  const CSS = `
    a[href="/reels/"], a[href^="/reels/"] { display: none !important; }
    [${HIDDEN_ATTR}] { display: none !important; }
  `;

  // Where should this page send you instead? Returns a URL, or null to stay.
  function redirectFor(path, search, settings) {
    if (settings.hideReels && /^\/reels(\/|$)/.test(path)) {
      return settings.followingFeed ? FOLLOWING_URL : '/';
    }
    if (settings.hideExplore && /^\/explore(\/|$)/.test(path) && !/^\/explore\/search(\/|$)/.test(path)) {
      return SEARCH_URL;
    }
    if (settings.followingFeed && path === '/' && new URLSearchParams(search).get('variant') !== 'following') {
      return FOLLOWING_URL;
    }
    return null;
  }

  // Redirect bookkeeping, kept per tab. If Instagram keeps undoing a redirect, it is
  // switched off for this tab so the page can't reload forever.
  function readLog(storage) {
    try {
      return JSON.parse(storage.getItem(GUARD_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function writeLog(storage, log) {
    try {
      storage.setItem(GUARD_KEY, JSON.stringify(log));
    } catch (e) {}
  }

  function allowRedirect(to, storage) {
    const log = readLog(storage);
    const entry = log[to] || { tries: 0, off: false };
    if (entry.off) return false;
    entry.tries += 1;
    if (entry.tries > 3) entry.off = true;
    log[to] = entry;
    writeLog(storage, log);
    return !entry.off;
  }

  // Called once a redirect target has stayed in the address bar for a while.
  function redirectWorked(to, storage) {
    const log = readLog(storage);
    if (!log[to] || log[to].off) return;
    delete log[to];
    writeLog(storage, log);
  }

  // The block to hide for a "Suggested" label: its post, or else the biggest wrapper
  // around it that sits next to the posts without containing any of them.
  function blockFor(label) {
    const article = label.closest('article');
    if (article) return article;
    let node = label;
    for (let i = 0; i < 15; i++) {
      const parent = node.parentElement;
      if (!parent || parent === label.ownerDocument.body) return null;
      if (parent.querySelector('article')) return node;
      node = parent;
    }
    return null;
  }

  function findSuggestedBlocks(root, labels) {
    const doc = root.ownerDocument || root;
    const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
    const blocks = new Set();
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      const el = text.parentElement;
      if (!el || el.closest(`[${HIDDEN_ATTR}]`)) continue;
      if (!labels.includes(text.nodeValue.trim().toLowerCase())) continue;
      const block = blockFor(el);
      if (block) blocks.add(block);
    }
    return [...blocks];
  }

  function addStyle(css) {
    try {
      if (typeof GM !== 'undefined' && GM.addStyle) return void GM.addStyle(css);
      if (typeof GM_addStyle === 'function') return void GM_addStyle(css);
    } catch (e) {}
    const style = document.createElement('style');
    style.textContent = css;
    document.documentElement.appendChild(style);
  }

  function hide(el) {
    el.setAttribute(HIDDEN_ATTR, '');
    // Inline as well, in case Instagram's security rules block the style sheet.
    el.style.setProperty('display', 'none', 'important');
  }

  function start() {
    addStyle(CSS);

    let lastHref = '';
    const checkRoute = () => {
      if (location.href === lastHref) return;
      lastHref = location.href;
      const here = location.pathname + location.search;
      if ([FOLLOWING_URL, SEARCH_URL, '/'].includes(here)) {
        setTimeout(() => {
          if (location.pathname + location.search === here) redirectWorked(here, sessionStorage);
        }, 3000);
      }
      const to = redirectFor(location.pathname, location.search, SETTINGS);
      if (to && allowRedirect(to, sessionStorage)) location.replace(to);
    };

    let scanQueued = false;
    const scan = () => {
      scanQueued = false;
      if (SETTINGS.hideReels) document.querySelectorAll('a[href^="/reels/"]').forEach(hide);
      if (SETTINGS.hideSuggested && location.pathname === '/' && document.body) {
        findSuggestedBlocks(document.body, SUGGESTED_LABELS).forEach(hide);
      }
    };

    // Instagram changes pages without reloading, so keep watching the address and the page.
    checkRoute();
    setInterval(checkRoute, 300);
    window.addEventListener('popstate', checkRoute);
    new MutationObserver(() => {
      checkRoute();
      if (!scanQueued) {
        scanQueued = true;
        setTimeout(scan, 150);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  const onInstagram = typeof location !== 'undefined' && /(^|\.)instagram\.com$/.test(location.hostname);
  if (onInstagram) start();
  else globalThis.CalmFeed = { redirectFor, allowRedirect, redirectWorked, blockFor, findSuggestedBlocks, SETTINGS, SUGGESTED_LABELS };
})();
