import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

// Load client bundle in a browser-like mock context
const code = readFileSync(new URL('./lib/client.js', import.meta.url), 'utf8');

function loadModule() {
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
	};
	createContext(context);
	runInContext(code, context);
	return exported;
}

const mod = loadModule();
const { DICTS, name, inject, apply } = mod;

assert.strictEqual(name, 'global-rules');
assert.deepStrictEqual([...inject], ['slots', 'locale']);
assert.ok(typeof apply === 'function');

// 1. Verify key parity between en and zh
assert.deepStrictEqual(Object.keys(DICTS.zh).sort(), Object.keys(DICTS.en).sort(), 'DICTS keys must match');
for (const key of Object.keys(DICTS.en)) {
	assert.ok(typeof DICTS.en[key] === 'string' && DICTS.en[key].length > 0, `en.${key} should not be empty`);
	assert.ok(typeof DICTS.zh[key] === 'string' && DICTS.zh[key].length > 0, `zh.${key} should not be empty`);
}

// 2. Test registration via apply(ctx)
let registeredNs, registeredDicts, slotRegistered;
const fakeCtx = {
	effect: (fn) => fn(),
	locale: {
		register: (ns, dicts) => {
			registeredNs = ns;
			registeredDicts = dicts;
		},
		bind: (ns) => (key, params) => {
			const str = registeredDicts.en[key] || key;
			return params ? str.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? _) : str;
		},
	},
	slots: {
		inject: (slot, fn) => fn(),
		register: (meta, component) => {
			slotRegistered = { meta, component };
		},
	},
};

apply(fakeCtx);
assert.strictEqual(registeredNs, 'global-rules');
assert.strictEqual(registeredDicts, DICTS);
assert.strictEqual(slotRegistered.meta.name, 'settings.section');
assert.strictEqual(slotRegistered.meta.id, 'global-rules');
assert.strictEqual(slotRegistered.meta.locale, 'global-rules');
assert.strictEqual(slotRegistered.meta.label(), 'Global Rules');

console.log('✓ All i18n & lifecycle checks passed');
