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

    function select(index: number): void {
      tabs.forEach((tab, i) => tab.setAttribute("aria-selected", String(i === index)));
      panels.forEach((panel, i) => {
        panel.hidden = i !== index;
      });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i));
      // 横向/纵向排列都支持：左右键沿列表移动，并把焦点交给选中的标签。
      tab.addEventListener("keydown", (e) => {
        const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const next = (i + step + tabs.length) % tabs.length;
        tabs[next]?.focus();
        select(next);
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
