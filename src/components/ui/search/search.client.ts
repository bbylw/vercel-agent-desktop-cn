import { mount } from "@cloudflare/nimbus-docs/client";
import type { SearchProvider, SearchResult } from "@cloudflare/nimbus-docs/types";
import { provider } from "./providers/pagefind";

export interface SearchConfig {
  input: HTMLInputElement;
  resultsContainer: HTMLElement;
  emptyState: HTMLElement;
  provider: SearchProvider;
  onNavigate?: () => void;
}

export interface SearchInstance {
  reset(): Promise<void>;
  destroy(): void;
}

export function initSearch(config: SearchConfig): SearchInstance {
  const { input, resultsContainer, emptyState, provider, onNavigate } = config;

  let initialized = false;
  let activeIndex = -1;
  let resultIdCounter = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let activeController: AbortController | undefined;

  function getOptions(): HTMLElement[] {
    return Array.from(resultsContainer.querySelectorAll<HTMLElement>("[role='option']"));
  }

  function updateActive(newIndex: number): void {
    const options = getOptions();
    if (options.length === 0) {
      activeIndex = -1;
      input.removeAttribute("aria-activedescendant");
      return;
    }
    activeIndex = Math.max(-1, Math.min(newIndex, options.length - 1));
    options.forEach((option, index) => {
      if (index === activeIndex) {
        option.setAttribute("data-highlighted", "");
        option.setAttribute("aria-selected", "true");
        option.scrollIntoView({ block: "nearest" });
        input.setAttribute("aria-activedescendant", option.id);
      } else {
        option.removeAttribute("data-highlighted");
        option.setAttribute("aria-selected", "false");
      }
    });
    if (activeIndex < 0) input.removeAttribute("aria-activedescendant");
  }

  function clearResults(): void {
    for (const result of resultsContainer.querySelectorAll("[role='option']")) result.remove();
    resultsContainer.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }

  function resultOption(
    title: string,
    href: string,
    className: string,
    titleClass: string,
  ): HTMLAnchorElement {
    const option = document.createElement("a");
    option.href = href;
    option.id = `search-result-${resultIdCounter++}`;
    option.setAttribute("role", "option");
    option.tabIndex = -1;
    option.className = className;
    option.addEventListener("click", () => onNavigate?.());

    const titleElement = document.createElement("span");
    titleElement.className = titleClass;
    titleElement.textContent = title;
    option.appendChild(titleElement);
    return option;
  }

  function buildResult(result: SearchResult): HTMLElement[] {
    const option = resultOption(
      result.title,
      result.url,
      "mb-0.5 block rounded-lg px-2 py-2 text-foreground no-underline transition-colors cursor-pointer hover:bg-accent focus:bg-accent data-[highlighted]:bg-accent",
      "block truncate text-sm font-medium",
    );

    if (result.snippet) {
      const snippet = document.createElement("p");
      snippet.className = "mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground";
      snippet.innerHTML = result.snippet;
      option.appendChild(snippet);
    }

    const subResults = (result.subResults ?? []).slice(0, 3).map((sub) =>
      resultOption(
        sub.title,
        sub.url,
        "ms-3 mb-0.5 block truncate rounded-e-lg border-s border-border py-1 pe-2 ps-3 text-xs text-muted-foreground no-underline transition-colors cursor-pointer hover:bg-accent hover:text-foreground focus:bg-accent data-[highlighted]:bg-accent data-[highlighted]:text-foreground",
        "block truncate",
      ),
    );

    return [option, ...subResults];
  }

  async function ensureInitialized(): Promise<boolean> {
    if (initialized) return true;
    try {
      await provider.init?.();
      initialized = true;
      return true;
    } catch {
      emptyState.textContent = import.meta.env.DEV
        ? "搜索需要生产构建后才能使用。"
        : "搜索加载失败。检查网络后刷新页面；如果仍然失败，请站点维护者重新构建并部署搜索索引。";
      return false;
    }
  }

  async function runSearch(query: string): Promise<void> {
    activeController?.abort();
    activeController = new AbortController();
    const signal = activeController.signal;

    emptyState.style.display = "";
    emptyState.textContent = "搜索中…";
    clearResults();

    if (!(await ensureInitialized()) || signal.aborted) return;

    try {
      const results = await provider.search(query, { signal });
      if (signal.aborted) return;

      clearResults();
      activeIndex = -1;

      if (results.length === 0) {
        emptyState.style.display = "";
        emptyState.textContent = "没有找到匹配的页面。";
        return;
      }

      emptyState.style.display = "none";
      input.setAttribute("aria-expanded", "true");
      for (const result of results) {
        for (const option of buildResult(result)) resultsContainer.appendChild(option);
      }
      resultsContainer.hidden = false;
    } catch {
      if (signal.aborted) return;
      clearResults();
      emptyState.style.display = "";
      emptyState.textContent = "搜索暂时不可用。";
    }
  }

  function handleInput(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = input.value.trim();
      if (!query) {
        activeController?.abort();
        clearResults();
        emptyState.style.display = "";
        emptyState.textContent = "输入关键词搜索…";
        return;
      }
      void runSearch(query);
    }, 150);
  }

  function handleKeydown(event: KeyboardEvent): void {
    const options = getOptions();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      updateActive(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      updateActive(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      updateActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      updateActive(options.length - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      options[activeIndex]?.click();
    }
  }

  input.addEventListener("input", handleInput);
  input.addEventListener("keydown", handleKeydown);

  return {
    async reset() {
      activeController?.abort();
      if (debounceTimer) clearTimeout(debounceTimer);
      input.value = "";
      input.focus();
      activeIndex = -1;
      clearResults();
      emptyState.style.display = "";
      emptyState.textContent = "输入关键词搜索…";
      await ensureInitialized();
    },
    destroy() {
      activeController?.abort();
      if (debounceTimer) clearTimeout(debounceTimer);
      input.removeEventListener("input", handleInput);
      input.removeEventListener("keydown", handleKeydown);
    },
  };
}

// ---------------------------------------------------------------------------
// Bootstrap — imported for its side effects by SearchDialog.astro
// (`import "./search.client"`). Wires each dialog through mount() and binds the
// global open shortcut once.
// ---------------------------------------------------------------------------

type SearchDialogElement = HTMLDialogElement & {
  __openSearchDialog?: () => void;
};

function primaryDialog(): SearchDialogElement | null {
  return document.querySelector<SearchDialogElement>("[data-search-dialog][data-search-ready]");
}

// The open shortcut and trigger delegation live on `document`, which survives
// view transitions, so they are bound once for the page's lifetime — never
// through mount()'s per-element setup/teardown. A module-scoped boolean (not an
// <html> attribute) is the guard: ClientRouter resets <html> on every swap but
// keeps document listeners, so an attribute guard would stack a duplicate
// keydown handler each navigation (Cmd+K then toggles twice).
let globalsBound = false;

function bindGlobals() {
  if (globalsBound) return;
  globalsBound = true;

  document.addEventListener("click", (event) => {
    const trigger = (event.target as Element | null)?.closest("[data-search-trigger]");
    if (!trigger) return;
    primaryDialog()?.__openSearchDialog?.();
  });

  document.addEventListener("keydown", (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
    const dialog = primaryDialog();
    if (!dialog) return;
    event.preventDefault();
    if (dialog.open) dialog.close();
    else dialog.__openSearchDialog?.();
  });
}

// Per-element wiring: idempotent discovery now and on astro:page-load, teardown
// on astro:before-swap. Replaces the hand-rolled data-search-ready init loop;
// data-search-ready is now just the "wired" marker primaryDialog() selects on.
mount("[data-search-dialog]", (root) => {
  const dialog = root as SearchDialogElement;
  dialog.setAttribute("data-search-ready", "true");

  const input = dialog.querySelector<HTMLInputElement>("[data-search-input]");
  const resultsContainer = dialog.querySelector<HTMLElement>("[data-search-results]");
  const emptyState = dialog.querySelector<HTMLElement>("[data-search-empty]");
  if (!input || !resultsContainer || !emptyState) return () => {};

  const search = initSearch({
    input,
    resultsContainer,
    emptyState,
    provider,
    onNavigate: () => dialog.close(),
  });

  dialog.__openSearchDialog = () => {
    if (!dialog.open) dialog.showModal();
    void search.reset();
  };

  return () => search.destroy();
});

bindGlobals();
