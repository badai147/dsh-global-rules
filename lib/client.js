// dsh-global-rules client bundle: registers a "全局规则" settings section.
// Hand-written __ModuleLoader__ factory (no build step). The only external
// require is react, which the loader module table provides.
window.__ModuleLoader__.load({ id: "dsh-global-rules", factory: (require) => {

		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		const h = react.createElement;
		const { useState, useEffect, useCallback } = react;

		const name = "global-rules";
		const inject = ["slots"];

		// Host API methods ride Connection's /api fence (Host/Origin plus browser
		// authentication), so this endpoint lives under /api as well.
		const API_PATH = "/api/global-rules";
		const DEFAULT_PATH_LABEL = "~/.dsh/AGENTS.md";

		// ponytail: binary zh vs en dictionary; upgrade to full i18n registry when adding 3+ languages.
		const I18N = {
			zh: {
				label: "全局规则",
				desc: (path) => "编辑 " + path + " 全局规则，保存后实时生效。",
				notExists: "文件尚不存在，保存将创建它。",
				loading: "加载中…",
				placeholder: "# 全局规则\n\n在这里编写对每个会话生效的指令…",
				save: "保存",
				saving: "保存中…",
				readError: "读取失败: ",
				saved: "已保存。新会话立即生效；当前会话将在下一次文件操作后感知新规则。",
				saveError: "保存失败: ",
				unknownError: "未知错误",
				authFailed: "会话未通过鉴权，请刷新页面后重试",
			},
			en: {
				label: "Global Rules",
				desc: (path) => "Edit " + path + " global rules; takes effect immediately upon saving.",
				notExists: "File does not exist yet; saving will create it.",
				loading: "Loading…",
				placeholder: "# Global Rules\n\nWrite instructions here that take effect across every session…",
				save: "Save",
				saving: "Saving…",
				readError: "Failed to read: ",
				saved: "Saved. New sessions take effect immediately; current session will detect new rules after the next file operation.",
				saveError: "Failed to save: ",
				unknownError: "Unknown error",
				authFailed: "Session authentication failed, please refresh the page and try again",
			},
		};

		function getLang() {
			const tag = (typeof document !== "undefined" && document.documentElement.lang) ||
				(typeof navigator !== "undefined" && (navigator.languages?.[0] || navigator.language)) || "en";
			return tag.toLowerCase().startsWith("zh") ? "zh" : "en";
		}

		/** Panel-facing failure text: an expired session needs a refresh, not a status code. */
		function failureMessage(res, t) {
			if (res.status === 401 || res.status === 403) {
				return t.authFailed;
			}
			return "HTTP " + res.status;
		}

		const TEXTAREA_STYLE = {
			width: "100%",
			minHeight: "320px",
			boxSizing: "border-box",
			fontFamily: "ui-monospace, 'Cascadia Mono', Consolas, monospace",
			fontSize: "13px",
			lineHeight: 1.5,
			padding: "10px",
			background: "transparent",
			color: "inherit",
			border: "1px solid rgba(128, 128, 128, 0.35)",
			borderRadius: "6px",
			resize: "vertical",
		};

		const ROW_STYLE = {
			display: "flex",
			alignItems: "center",
			gap: "10px",
			marginTop: "10px",
		};

		const BUTTON_STYLE = {
			padding: "6px 16px",
			borderRadius: "6px",
			border: "none",
			cursor: "pointer",
			fontSize: "13px",
		};

		function GlobalRulesSection() {
			const t = I18N[getLang()] || I18N.en;
			const [content, setContent] = useState("");
			const [loaded, setLoaded] = useState(false);
			const [exists, setExists] = useState(true);
			const [pathLabel, setPathLabel] = useState(DEFAULT_PATH_LABEL);
			const [saving, setSaving] = useState(false);
			const [notice, setNotice] = useState({ kind: "idle", text: "" });

			useEffect(() => {
				let cancelled = false;
				fetch(API_PATH, { cache: "no-store" })
					.then((res) => {
						if (!res.ok) throw new Error(failureMessage(res, t));
						return res.json();
					})
					.then((data) => {
						if (cancelled) return;
						setContent(String(data.content || ""));
						setExists(Boolean(data.exists));
						setPathLabel(String(data.path || DEFAULT_PATH_LABEL));
						setLoaded(true);
					})
					.catch((error) => {
						if (cancelled) return;
						setNotice({ kind: "error", text: t.readError + error.message });
						setLoaded(true);
					});
				return () => { cancelled = true; };
			}, [t]);

			const save = useCallback(() => {
				setSaving(true);
				setNotice({ kind: "idle", text: "" });
				fetch(API_PATH, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ content }),
				})
					.then(async (res) => {
						const data = await res.json().catch(() => ({}));
						if (!res.ok) throw new Error(data.error || failureMessage(res, t));
						return data;
					})
					.then((data) => {
						if (data.ok) {
							setExists(true);
							setNotice({
								kind: "ok",
								text: t.saved,
							});
						} else {
							setNotice({ kind: "error", text: t.saveError + (data.error || t.unknownError) });
						}
					})
					.catch((error) => {
						setNotice({ kind: "error", text: t.saveError + error.message });
					})
					.finally(() => setSaving(false));
			}, [content, t]);

			return h("div", { style: { maxWidth: "720px" } },
				h("p", { style: { marginTop: 0, opacity: 0.75, fontSize: "13px" } },
					t.desc(pathLabel)),
				exists ? null : h("p", { style: { color: "inherit", opacity: 0.75, fontSize: "13px" } },
					t.notExists),
				!loaded ? h("p", { style: { opacity: 0.6 } }, t.loading) : h("textarea", {
					style: TEXTAREA_STYLE,
					value: content,
					onChange: (event) => setContent(event.target.value),
					spellCheck: false,
					placeholder: t.placeholder,
				}),
				h("div", { style: ROW_STYLE },
					h("button", {
						style: Object.assign({}, BUTTON_STYLE, {
							background: "var(--accent, #2f81f7)",
							color: "#fff",
							opacity: saving ? 0.6 : 1,
						}),
						disabled: saving,
						onClick: save,
					}, saving ? t.saving : t.save),
					notice.kind === "ok" ? h("span", { style: { fontSize: "13px", color: "inherit", opacity: 0.85 } }, notice.text)
						: notice.kind === "error" ? h("span", { style: { fontSize: "13px", color: "#e5484d" } }, notice.text)
						: null,
				),
			);
		}

		function apply(ctx) {
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "global-rules",
				order: 30,
				label: () => (I18N[getLang()] || I18N.en).label,
			}, () => h(GlobalRulesSection, null)));
		}

		exports.name = name;
		exports.inject = inject;
		exports.apply = apply;
		exports.I18N = I18N;
		exports.getLang = getLang;
		return module.exports;
	}
});
