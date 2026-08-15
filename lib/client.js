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
			const [content, setContent] = useState("");
			const [loaded, setLoaded] = useState(false);
			const [exists, setExists] = useState(true);
			const [saving, setSaving] = useState(false);
			const [notice, setNotice] = useState({ kind: "idle", text: "" });

			useEffect(() => {
				let cancelled = false;
				fetch("/global-rules", { cache: "no-store" })
					.then((res) => {
						if (!res.ok) throw new Error("HTTP " + res.status);
						return res.json();
					})
					.then((data) => {
						if (cancelled) return;
						setContent(String(data.content || ""));
						setExists(Boolean(data.exists));
						setLoaded(true);
					})
					.catch((error) => {
						if (cancelled) return;
						setNotice({ kind: "error", text: "读取失败: " + error.message });
						setLoaded(true);
					});
				return () => { cancelled = true; };
			}, []);

			const save = useCallback(() => {
				setSaving(true);
				setNotice({ kind: "idle", text: "" });
				fetch("/global-rules", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ content }),
				})
					.then((res) => {
						if (!res.ok) throw new Error("HTTP " + res.status);
						return res.json();
					})
					.then((data) => {
						if (data.ok) {
							setExists(true);
							setNotice({
								kind: "ok",
								text: "已保存。新会话立即生效；当前会话将在下一次文件操作后感知新规则。",
							});
						} else {
							setNotice({ kind: "error", text: "保存失败: " + (data.error || "未知错误") });
						}
					})
					.catch((error) => {
						setNotice({ kind: "error", text: "保存失败: " + error.message });
					})
					.finally(() => setSaving(false));
			}, [content]);

			return h("div", { style: { maxWidth: "720px" } },
				h("p", { style: { marginTop: 0, opacity: 0.75, fontSize: "13px" } },
					"编辑 ~/.dsh/AGENTS.md 全局规则，保存后实时生效。"),
				exists ? null : h("p", { style: { color: "inherit", opacity: 0.75, fontSize: "13px" } },
					"文件尚不存在，保存将创建它。"),
				!loaded ? h("p", { style: { opacity: 0.6 } }, "加载中…") : h("textarea", {
					style: TEXTAREA_STYLE,
					value: content,
					onChange: (event) => setContent(event.target.value),
					spellCheck: false,
					placeholder: "# 全局规则\n\n在这里编写对每个会话生效的指令…",
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
					}, saving ? "保存中…" : "保存"),
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
				label: () => "全局规则",
			}, () => h(GlobalRulesSection, null)));
		}

		exports.name = name;
		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	}
});
