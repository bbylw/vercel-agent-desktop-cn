import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import nimbus, {
  defineConfig as defineNimbusConfig,
} from "@cloudflare/nimbus-docs";
import { tableScroll } from "@cloudflare/nimbus-docs/markdown";

// 部署前把 site 换成正式域名（或设置 SITE_URL）：canonical URL、OG 图、robots.txt、
// sitemap 和 /llms.txt 里的链接都由它推导。
const site = process.env.SITE_URL ?? "https://agent-desktop.dev";

const nimbusConfig = defineNimbusConfig({
  site,
  title: "agent-desktop",
  description:
    "面向 AI 智能体的电脑操作：读取操作系统可访问性树，把它变成带 ref 的 JSON，再对 ref 执行动作。macOS、Windows、Linux 通用。",
  locale: "zh-CN",
  github: "https://github.com/vercel-labs/agent-desktop",
  socialImageAlt: "agent-desktop 文档预览",
  sidebar: {
    indexDisplay: "overview-leaf",
    overviewLabel: "概览",
    defaultCollapsed: true,
    items: [
      { label: "开始使用", icon: "ph:rocket-launch", autogenerate: { directory: "start" } },
      { label: "核心概念", icon: "ph:aperture", autogenerate: { directory: "concepts" } },
      { label: "输出契约", icon: "ph:brackets-curly", autogenerate: { directory: "output" } },
      { label: "命令参考", icon: "ph:terminal-window", autogenerate: { directory: "reference" } },
      { label: "平台支持", icon: "ph:monitor", autogenerate: { directory: "platforms" } },
      { label: "C 库与语言绑定", icon: "ph:link", autogenerate: { directory: "c-library" } },
      { label: "常见问题", link: "/faq/" },
      { label: "隐私与数据处理", link: "/privacy/" },
    ],
  },
});

export default defineConfig({
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [
    nimbus(nimbusConfig, {
      rules: {
        "nimbus/frontmatter-shape": "error",
        "nimbus/internal-link": "error",
      },
      markdown: {
        hastPlugins: [tableScroll()],
        features: { headingAttributes: true },
      },
    }),
  ],
});
