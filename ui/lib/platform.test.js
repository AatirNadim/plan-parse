import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { detectIsMac, getPlatformModifier } from "./use-platform.js";

describe("Platform OS Detection & Modifier Tests", () => {
  describe("macOS and Apple platform detection", () => {
    const macOSUserAgents = [
      {
        name: "macOS Chrome",
        ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
      {
        name: "macOS Safari",
        ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
      },
      {
        name: "macOS Firefox",
        ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0",
      },
      {
        name: "iOS Safari (iPhone)",
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      },
      {
        name: "iPadOS Safari (iPad)",
        ua: "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      },
      {
        name: "iPod Touch",
        ua: "Mozilla/5.0 (iPod touch; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
      },
      {
        name: "Legacy Mac Platform identifier",
        ua: "MacIntel",
      },
      {
        name: "Modern userAgentData platform identifier",
        ua: "macOS",
      },
    ];

    for (const { name, ua } of macOSUserAgents) {
      test(`correctly detects ${name} as Mac`, () => {
        assert.equal(detectIsMac(ua), true, `${name} should be detected as Mac`);
        const modifier = getPlatformModifier(ua);
        assert.equal(modifier.isMac, true);
        assert.equal(modifier.modKey, "⌘");
        assert.equal(modifier.paletteKey, "⌘K");
      });
    }
  });

  describe("Windows platform detection", () => {
    const windowsUserAgents = [
      {
        name: "Windows 11 Chrome",
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
      {
        name: "Windows 10 Chrome (WOW64)",
        ua: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      {
        name: "Windows Edge",
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
      },
      {
        name: "Windows Firefox",
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
      },
      {
        name: "Windows navigator.platform",
        ua: "Win32",
      },
      {
        name: "Windows userAgentData platform",
        ua: "Windows",
      },
    ];

    for (const { name, ua } of windowsUserAgents) {
      test(`correctly detects ${name} as non-Mac`, () => {
        assert.equal(detectIsMac(ua), false, `${name} should not be detected as Mac`);
        const modifier = getPlatformModifier(ua);
        assert.equal(modifier.isMac, false);
        assert.equal(modifier.modKey, "Ctrl");
        assert.equal(modifier.paletteKey, "Ctrl+K");
      });
    }
  });

  describe("Linux platform detection", () => {
    const linuxUserAgents = [
      {
        name: "Linux Ubuntu Chrome",
        ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
      {
        name: "Linux Ubuntu Firefox",
        ua: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
      },
      {
        name: "Linux Fedora Chrome",
        ua: "Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      {
        name: "Linux Fedora Firefox",
        ua: "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0",
      },
      {
        name: "Linux navigator.platform",
        ua: "Linux x86_64",
      },
      {
        name: "Linux userAgentData platform",
        ua: "Linux",
      },
    ];

    for (const { name, ua } of linuxUserAgents) {
      test(`correctly detects ${name} as non-Mac`, () => {
        assert.equal(detectIsMac(ua), false, `${name} should not be detected as Mac`);
        const modifier = getPlatformModifier(ua);
        assert.equal(modifier.isMac, false);
        assert.equal(modifier.modKey, "Ctrl");
        assert.equal(modifier.paletteKey, "Ctrl+K");
      });
    }
  });

  describe("Edge cases and graceful fallbacks", () => {
    const edgeCases = [
      { label: "null", value: null },
      { label: "undefined", value: undefined },
      { label: "empty string", value: "" },
      { label: "blank whitespace", value: "   " },
      { label: "number 0", value: 0 },
      { label: "object", value: {} },
      { label: "boolean false", value: false },
    ];

    for (const { label, value } of edgeCases) {
      test(`handles ${label} input gracefully without throwing`, () => {
        assert.equal(detectIsMac(value), false);
        const modifier = getPlatformModifier(value);
        assert.equal(modifier.isMac, false);
        assert.equal(modifier.modKey, "Ctrl");
        assert.equal(modifier.paletteKey, "Ctrl+K");
      });
    }
  });
});
