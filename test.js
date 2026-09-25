import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

// Load client bundle in a browser-like mock context
const code = readFileSync(new URL('./lib/client.js', import.meta.url), 'utf8');

function runWithMocks({ lang, languages, docLang } = {}) {
	let exported;
	const context = {
		window: {
			__ModuleLoader__: {
				load: ({ factory }) => {
					const require = () => ({
						createElement: () => ({}),
						useState: (v) => [v, () => {}],
						useEffect: () => {},
						useCallback: (fn) => fn,
					});
					exported = factory(require);
				},
			},
		},
		navigator: {
			language: lang,
			languages: languages,
		},
		document: {
			documentElement: {
				lang: docLang,
			},
		},
	};
	createContext(context);
	runInContext(code, context);
	return exported;
}

// 1. Verify key parity between en and zh
const mod = runWithMocks({ lang: 'en-US' });
const { I18N, getLang } = mod;
assert.deepStrictEqual(Object.keys(I18N.zh).sort(), Object.keys(I18N.en).sort(), 'I18N keys must match');
for (const key of Object.keys(I18N.en)) {
	if (typeof I18N.en[key] === 'function') {
		assert.strictEqual(typeof I18N.zh[key], 'function');
		assert.ok(I18N.en[key]('test-path').includes('test-path'));
		assert.ok(I18N.zh[key]('test-path').includes('test-path'));
	} else {
		assert.ok(I18N.en[key].length > 0, `en.${key} should not be empty`);
		assert.ok(I18N.zh[key].length > 0, `zh.${key} should not be empty`);
	}
}

// 2. Test language detection
assert.strictEqual(runWithMocks({ lang: 'zh-CN' }).getLang(), 'zh');
assert.strictEqual(runWithMocks({ lang: 'zh-TW' }).getLang(), 'zh');
assert.strictEqual(runWithMocks({ languages: ['zh-HK', 'en'] }).getLang(), 'zh');
assert.strictEqual(runWithMocks({ lang: 'en-US' }).getLang(), 'en');
assert.strictEqual(runWithMocks({ lang: 'ja-JP' }).getLang(), 'en');
assert.strictEqual(runWithMocks({ docLang: 'zh-Hans' }).getLang(), 'zh');
assert.strictEqual(runWithMocks({ docLang: 'en-US' }).getLang(), 'en');

console.log('✓ All i18n checks passed');
