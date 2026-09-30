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

		const NS = "global-rules";
		const inject = ["slots", "locale"];

		// Host API methods ride Connection's /api fence (Host/Origin plus browser
		// authentication), so this endpoint lives under /api as well.
		const API_PATH = "/api/global-rules";
		const DEFAULT_PATH_LABEL = "~/.dsh/AGENTS.md";

		const DICTS = {
			zh: {
				label: "全局规则",
				desc: "编辑 {path} 全局规则，保存后实时生效。",
				notExists: "文件尚不存在，保存将创建它。",
				loading: "加载中…",
				placeholder: "# 全局规则\n\n在这里编写对每个会话生效的指令…",
				save: "保存",
				saving: "保存中…",
				readError: "读取失败: {error}",
				saved: "已保存。新会话立即生效；当前会话将在下一次文件操作后感知新规则。",
				saveError: "保存失败: {error}",
				unknownError: "未知错误",
				authFailed: "会话未通过鉴权，请刷新页面后重试",
			},
			en: {
				label: "Global Rules",
				desc: "Edit {path} global rules; takes effect immediately upon saving.",
				notExists: "File does not exist yet; saving will create it.",
				loading: "Loading…",
				placeholder: "# Global Rules\n\nWrite instructions here that take effect across every session…",
				save: "Save",
				saving: "Saving…",
				readError: "Failed to read: {error}",
				saved: "Saved. New sessions take effect immediately; current session will detect new rules after the next file operation.",
				saveError: "Failed to save: {error}",
				unknownError: "Unknown error",
				authFailed: "Session authentication failed, please refresh the page and try again",
			},
		};

		/** Panel-facing failure text: an expired session needs a refresh, not a status code. */
		function failureCode(res) {
			return (res.status === 401 || res.status === 403) ? "authFailed" : ("HTTP " + res.status);
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
			border: "0.5px solid var(--dsw-alias-border-l4)",
			borderRadius: "var(--dsw-radius-md)",
			resize: "vertical",
		};

		const ROW_STYLE = {
			display: "flex",
			alignItems: "center",
			gap: "10px",
			marginTop: "10px",
		};

		// Save button, styled after the host's Button primitive (variant primary,
		// size sm). The rules below are copied from
		// @deepseek-ai/dsh-client-ui-primitives' Button.module.css and reference
		// --dsw-alias-* tokens only, as the plugin-development practices require.
		// Hover and disabled states need real CSS, so the class rides the <style>
		// element the section renders below.
		const BUTTON_CSS = [
			".dgr-save {",
			"  box-sizing: border-box;",
			"  display: inline-flex;",
			"  align-items: center;",
			"  justify-content: center;",
			"  gap: 4px;",
			"  height: 28px;",
			"  padding: 0 10px;",
			"  border: none;",
			"  border-radius: var(--dsw-radius-sm);",
			"  cursor: pointer;",
			"  font-size: 12px;",
			"  line-height: 18px;",
			"  background: var(--dsw-alias-button-primary-fill);",
			"  color: var(--dsw-alias-label-primary-foreground);",
			"}",
			".dgr-save:hover:not(:disabled) {",
			"  background: var(--dsw-alias-button-primary-hover);",
			"}",
			".dgr-save:disabled {",
			"  cursor: not-allowed;",
			"  opacity: 0.4;",
			"}",
		].join("\n");

		function GlobalRulesSection(props) {
			const t = props.t;
			const [content, setContent] = useState("");
			const [loaded, setLoaded] = useState(false);
			const [exists, setExists] = useState(true);
			const [pathLabel, setPathLabel] = useState(DEFAULT_PATH_LABEL);
			const [saving, setSaving] = useState(false);
			const [notice, setNotice] = useState({ kind: "idle" });

			useEffect(() => {
				let cancelled = false;
				fetch(API_PATH, { cache: "no-store" })
					.then((res) => {
						if (!res.ok) throw new Error(failureCode(res));
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
						const msg = error.message;
						setNotice({ kind: "error", key: "readError", errorParam: msg });
						setLoaded(true);
					});
				return () => { cancelled = true; };
			}, []);

			const save = useCallback(() => {
				setSaving(true);
				setNotice({ kind: "idle" });
				fetch(API_PATH, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ content }),
				})
					.then(async (res) => {
						const data = await res.json().catch(() => ({}));
						if (!res.ok) throw new Error(data.error || failureCode(res));
						return data;
					})
					.then((data) => {
						if (data.ok) {
							setExists(true);
							setNotice({ kind: "ok", key: "saved" });
						} else {
							setNotice({ kind: "error", key: "saveError", errorParam: data.error });
						}
					})
					.catch((error) => {
						setNotice({ kind: "error", key: "saveError", errorParam: error.message });
					})
					.finally(() => setSaving(false));
			}, [content]);

			const resolveErrorText = (param) => {
				if (!param) return t("unknownError");
				return param === "authFailed" ? t("authFailed") : param;
			};

			return h("div", { style: { maxWidth: "720px" } },
				h("style", null, BUTTON_CSS),
				h("p", { style: { marginTop: 0, opacity: 0.75, fontSize: "13px" } },
					t("desc", { path: pathLabel })),
				exists ? null : h("p", { style: { color: "inherit", opacity: 0.75, fontSize: "13px" } },
					t("notExists")),
				!loaded ? h("p", { style: { opacity: 0.6 } }, t("loading")) : h("textarea", {
					style: TEXTAREA_STYLE,
					value: content,
					onChange: (event) => setContent(event.target.value),
					spellCheck: false,
					placeholder: t("placeholder"),
				}),
				h("div", { style: ROW_STYLE },
					h("button", {
						className: "dgr-save",
						disabled: saving,
						onClick: save,
					}, saving ? t("saving") : t("save")),
					notice.kind === "ok" ? h("span", { style: { fontSize: "13px", color: "inherit", opacity: 0.85 } }, t(notice.key))
						: notice.kind === "error" ? h("span", { style: { fontSize: "13px", color: "var(--dsw-alias-state-error-primary)" } }, t(notice.key, { error: resolveErrorText(notice.errorParam) }))
						: null,
				),
			);
		}

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, DICTS), "global-rules: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "global-rules",
				order: 30,
				locale: NS,
				label: () => t("label"),
			}, GlobalRulesSection));
		}

		exports.name = NS;
		exports.inject = inject;
		exports.apply = apply;
		exports.DICTS = DICTS;
		return module.exports;
	}
});
