/**
 * 落地页交互：复制按钮 + 四步循环探索器。
 * 服务端已经把第一步渲染成选中态，脚本只负责把它变成可交互的。
 */

function initCopy(): void {
  document.querySelectorAll<HTMLElement>("[data-ad-copy]").forEach((btn) => {
    if (btn.dataset.adCopyBound) return;
    btn.dataset.adCopyBound = "1";
    btn.addEventListener("click", async () => {
      const src = btn.closest(".ad-install")?.querySelector("[data-ad-copy-src]");
      const text = src?.textContent?.trim();
      if (!text) return;
      const label = btn.lastChild;
      try {
        await navigator.clipboard.writeText(text);
        btn.dataset.state = "ok";
        if (label?.nodeType === Node.TEXT_NODE) label.textContent = "已复制";
      } catch {
        if (label?.nodeType === Node.TEXT_NODE) label.textContent = "复制失败";
      }
      window.setTimeout(() => {
        delete btn.dataset.state;
        if (label?.nodeType === Node.TEXT_NODE) label.textContent = "复制";
      }, 1600);
    });
  });
}

function initLoop(): void {
  document.querySelectorAll<HTMLElement>("[data-ad-loop]").forEach((root) => {
    if (root.dataset.adLoopBound) return;
    root.dataset.adLoopBound = "1";

    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-ad-loop-tab]"));
    const panels = Array.from(root.querySelectorAll<HTMLElement>("[role='tabpanel']"));
    if (!tabs.length || tabs.length !== panels.length) return;

    function select(index: number, focusTab = false): void {
      tabs.forEach((tab, i) => {
        const selected = i === index;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((panel, i) => {
        panel.hidden = i !== index;
      });
      if (focusTab) tabs[index]?.focus();
    }

    // Roving tabindex：只有选中的标签在 Tab 序里，方向键负责移动。
    select(0);

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i));
      tab.addEventListener("keydown", (e) => {
        const last = tabs.length - 1;
        let next: number | undefined;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = last;
        if (next === undefined) return;
        e.preventDefault();
        select(next, true);
      });
    });
  });
}

export default function initHome(): void {
  const run = () => {
    initCopy();
    initLoop();
  };
  run();
  // 全站使用 Astro 的 ClientRouter，落地页重新插入 DOM 后要再绑定一次。
  document.addEventListener("astro:page-load", run);
}
