# agent-desktop

面向 AI 智能体的电脑操作：通过操作系统可访问性树读取并操控桌面应用。

<p>
  <a href="https://vercel.com/labs#labs-products"><img alt="Vercel Labs Product" src="https://img.shields.io/badge/LABS-PRODUCT-0a0a0a.svg?style=for-the-badge&amp;logo=Vercel&amp;labelColor=000000" height="28"></a>
  <a href="https://www.npmjs.com/package/agent-desktop"><img alt="npm version: agent-desktop" src="https://img.shields.io/npm/v/agent-desktop.svg?style=for-the-badge&amp;labelColor=000000" height="28"></a>
  <a href="https://github.com/vercel-labs/agent-desktop/blob/main/LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/github/license/vercel-labs/agent-desktop.svg?style=for-the-badge&amp;labelColor=000000" height="28"></a>
  <a href="https://www.npmjs.com/package/agent-desktop"><img alt="npm downloads per month: agent-desktop" src="https://img.shields.io/npm/dm/agent-desktop.svg?style=for-the-badge&amp;labelColor=000000&amp;label=npm%20downloads" height="28"></a>
</p>

一个用于 macOS、Windows 和 Linux 的 CLI 与 C 库。快照（snapshot）返回 JSON，为智能体能够操作的每一个元素附带一个 ref。智能体对一个 ref 执行操作，然后再快照一次来核对，全程不做像素匹配；控制循环始终留在你自己的智能体里。

每次 CLI 调用都在独立进程中运行。无头（headless）调用依然禁止激活前台窗口和合成输入。

快照、剪贴板读取、截图、命令输出和调试产物都可能包含桌面上的私密内容。不要把它们放进公开日志或上传。可选的 [JEV 助手](https://github.com/vercel-labs/agent-desktop/blob/main/skills/jev-desktop/SKILL.md) 会把屏幕描述发送给你配置的模型服务商；它与原生 CLI 彼此独立。参见[隐私与数据处理](https://github.com/vercel-labs/agent-desktop/blob/main/docs/faq.md#what-data-can-contain-private-information)。

## 安装

在 macOS、Windows 或 Linux 上用 npm 安装：

```bash
npm install -g agent-desktop
agent-desktop version
```

Bun、Yarn 和 pnpm 都能安装同一个包。包内含 x64 与 ARM64 的原生二进制和平台辅助程序。
若要在没有 JavaScript 启动器的情况下直接运行，从
[GitHub Releases](https://github.com/vercel-labs/agent-desktop/releases) 下载对应平台的原生压缩包，并把它的辅助程序与可执行文件放在一起。

官方 Homebrew 与 Scoop 软件包正在提交审核，还无法从默认目录安装。
仓库不再维护自定义的 Homebrew tap 或 Scoop bucket。

- **macOS** 需要辅助功能（Accessibility）权限：`agent-desktop permissions --guide`。
- **Windows** 对你终端同级完整性（integrity level）的应用无需额外授权。
- **Linux** 需要用户自己的图形会话以及 `at-spi2-core`。

包管理器行为、发布压缩包与从源码构建，见[安装与权限](https://github.com/vercel-labs/agent-desktop/blob/main/docs/install.md)。

## 快速开始

先观察，对一个 ref 执行操作，再观察一次。`agent-desktop list-apps` 里的任意应用名都可以用；示例用的是 macOS 的 Finder。
每条命令打印一个 JSON 信封；下面的快照经过了裁剪。

```bash
agent-desktop snapshot --app Finder -i      # 可交互元素，每个都带一个 ref
agent-desktop click @s8f3k2p9:e8            # 对该快照中的一个 ref 执行操作
agent-desktop snapshot --app Finder -i      # 再次观察以验证
```

```json
{
  "version": "2.6",
  "ok": true,
  "command": "snapshot",
  "data": {
    "app": "Finder",
    "window": { "id": "w-204749", "title": "Downloads" },
    "snapshot_id": "s8f3k2p9",
    "ref_count": 59,
    "complete": true,
    "tree": {
      "role": "window",
      "name": "Downloads",
      "children": [
        { "role": "treeitem", "name": "Documents", "ref_id": "@s8f3k2p9:e8", "available_actions": ["Click"] }
      ]
    }
  }
}
```

- **ref 属于产生它的那次快照。** 只写 `@e8` 会被拒绝并返回 `INVALID_ARGS`。界面发生变化时，操作会
  返回 `STALE_REF` 或 `AMBIGUOUS_TARGET`：重新快照，并使用新快照里的 ref。
- **存在多个窗口**时返回 `AMBIGUOUS_TARGET`；`snapshot` 会在 `error.details` 中列出候选窗口 id，用
  `--window-id` 指定其中一个。
- **界面密集的应用：** 先用 `snapshot --skeleton --app Slack -i --compact` 摸清整体结构，再用
  `snapshot --root @s8f3k2p9:e3 -i --compact` 深入其中一块区域。
- **默认无头。** 对 ref 的操作走可访问性 API，既不移动指针，也不夺取焦点。
  全局 `--headed` 标志才允许物理输入。
- **PowerShell。** 每个 ref 都要加引号（`'@s8f3k2p9:e8'`），因为不加引号的 `@token` 是散裂（splatting）运算符。

## 面向 AI 智能体

二进制自带与自身版本匹配的文档：

```bash
agent-desktop skills get desktop      # 循环、ref、验证与重试规则
agent-desktop skills get platform     # 你所运行平台上的差异
agent-desktop <command> --help        # 单条命令的参数
```

从 [skills.sh](https://skills.sh/vercel-labs/agent-desktop/agent-desktop) 把该技能装进你的智能体运行环境：

```bash
npx skills add https://github.com/vercel-labs/agent-desktop --skill agent-desktop
```

或者把下面这段加到你的 `AGENTS.md` 里：

```markdown
使用 `agent-desktop` 来查看并操作桌面应用。首次使用前先运行
`agent-desktop skills get desktop` 和 `agent-desktop skills get platform`，并按其中的说明执行。
```

每条命令只打印一个信封，包含 `ok` 以及 `data` 或 `error`。错误带有 `code`、`disposition`，通常还有 `suggestion`；只有当 `error.disposition.retry` 为 `safe` 时才重试。契约、错误码与退出码见 [docs/json-output.md](https://github.com/vercel-labs/agent-desktop/blob/main/docs/json-output.md)。

## 命令

共发布 60 个命令名，其中 56 个是实际可执行的命令。其余 4 个（`key-down`、`key-up`、`mouse-down`、`mouse-up`）在有守护进程能够可靠释放被按住的按键或鼠标键之前会拒绝运行。

| 分组 | 命令 |
|---|---|
| 观察 | `snapshot`、`find`、`get`、`is`、`screenshot`、`list-surfaces` |
| 对 ref 执行操作 | `click`、`double-click`、`triple-click`、`right-click`、`type`、`set-value`、`clear`、`focus`、`select`、`toggle`、`check`、`uncheck`、`expand`、`collapse`、`scroll`、`scroll-to` |
| 键盘与鼠标 | `press`、`hover`、`drag`、`mouse-move`、`mouse-click`、`mouse-wheel`、`key-down`、`key-up`、`mouse-down`、`mouse-up` |
| 应用与窗口 | `launch`、`close-app`、`list-apps`、`list-windows`、`list-displays`、`focus-window`、`resize-window`、`move-window`、`minimize`、`maximize`、`restore`、`open-system-surface` |
| 通知 | `list-notifications`、`dismiss-notification`、`dismiss-all-notifications`、`notification-action` |
| 剪贴板 | `clipboard-get`、`clipboard-set`、`clipboard-clear` |
| 等待 | `wait` |
| 会话 | `session`、`trace`、`cursor-overlay` |
| 系统 | `status`、`permissions`、`version`、`batch`、`skills` |

## 平台支持

| | macOS | Windows | Linux |
|---|:---:|:---:|:---:|
| 可访问性树 | 支持 | 支持 | 支持（AT-SPI） |
| 点击 / 输入 / 键盘 | 支持 | 支持 | AT-SPI；X11 / GNOME 按键 |
| 鼠标输入 | 支持 | 支持 | X11，`--headed` |
| 截图 | 支持 | 支持 | X11 窗口；Wayland 门户 |
| 剪贴板 | 支持 | 支持 | 支持；Wayland 需要 `wl-clipboard` |
| 应用与窗口管理 | 支持 | 支持 | 启动/列出；X11 窗口控制 |
| 通知 | 支持 | 支持 | GNOME Shell |
| Shell 界面（`open-system-surface`） | Dock、菜单栏附加项 | 支持 | GNOME 托盘、操作中心 |

Windows 的界面与 `launch` 说明、Linux 的 X11 与 Wayland 说明都在 [docs/install.md](https://github.com/vercel-labs/agent-desktop/blob/main/docs/install.md#platform-notes)。

`agent-desktop skills get platform` 会输出你所运行平台的完整能力表。

## 语言绑定

每个版本同时发布 macOS、Linux 和 Windows 的 `libagent_desktop_ffi`，程序可以在进程内直接调用工具，而不必为每条命令启动一次 CLI。入口点、内存所有权和线程规则见 `agent-desktop skills get ffi`。

```python
import ctypes
lib = ctypes.CDLL("./lib/libagent_desktop_ffi.dylib")
lib.ad_adapter_create.restype = ctypes.c_void_p
lib.ad_adapter_destroy.argtypes = [ctypes.c_void_p]
assert lib.ad_init(7) == 0  # 头文件里的 AD_ABI_VERSION_MAJOR 与库匹配时返回 AD_RESULT_OK
adapter = lib.ad_adapter_create()
lib.ad_adapter_destroy(adapter)
```

## 开发

每个平台的适配器只能在它自己的操作系统上构建，所以把 cargo 的范围限制在宿主平台对应的包上。在 macOS 上：

```bash
HOST_PKGS=(-p agent-desktop-core -p agent-desktop-macos -p agent-desktop -p agent-desktop-ffi)
cargo test "${HOST_PKGS[@]}"
cargo clippy "${HOST_PKGS[@]}" --all-targets -- -D warnings
```

在 Windows 上，把上面列表里的 `agent-desktop-macos` 换成 `agent-desktop-windows`；在 Linux 上换成 `agent-desktop-linux`。
[CONTRIBUTING.md](https://github.com/vercel-labs/agent-desktop/blob/main/CONTRIBUTING.md) 列出了所有关卡。从源码构建：[docs/install.md](https://github.com/vercel-labs/agent-desktop/blob/main/docs/install.md#from-source)。

## 文档

| 我想做什么…… | 阅读 |
|---|---|
| 解决安装问题、授予权限、校验下载或从源码构建 | [docs/install.md](https://github.com/vercel-labs/agent-desktop/blob/main/docs/install.md) |
| 解析 JSON 信封、错误码和退出码 | [docs/json-output.md](https://github.com/vercel-labs/agent-desktop/blob/main/docs/json-output.md) |
| 作为 AI 智能体来驱动这个工具 | `agent-desktop skills get desktop`（[skills/agent-desktop/](https://github.com/vercel-labs/agent-desktop/tree/main/skills/agent-desktop)） |
| 了解某一个平台上的差异 | [macOS](https://github.com/vercel-labs/agent-desktop/tree/main/skills/agent-desktop-macos)、[Windows](https://github.com/vercel-labs/agent-desktop/tree/main/skills/agent-desktop-windows)、[Linux](https://github.com/vercel-labs/agent-desktop/tree/main/skills/agent-desktop-linux) |
| 调用 C 库 | [skills/agent-desktop-ffi/](https://github.com/vercel-labs/agent-desktop/tree/main/skills/agent-desktop-ffi) |
| 查术语：ref、快照、会话 | [CONCEPTS.md](https://github.com/vercel-labs/agent-desktop/blob/main/CONCEPTS.md) |
| 参与贡献并通过各项关卡 | [CONTRIBUTING.md](https://github.com/vercel-labs/agent-desktop/blob/main/CONTRIBUTING.md) |
| 阅读工程规则 | [AGENTS.md](https://github.com/vercel-labs/agent-desktop/blob/main/AGENTS.md) |
| 从过去的缺陷和经验中学习 | [docs/solutions/](https://github.com/vercel-labs/agent-desktop/tree/main/docs/solutions) |
| 查找常见问题答案 | [docs/faq.md](https://github.com/vercel-labs/agent-desktop/blob/main/docs/faq.md) |
| 报告安全漏洞 | [SECURITY.md](https://github.com/vercel-labs/agent-desktop/blob/main/SECURITY.md) |
| 获取帮助 | [SUPPORT.md](https://github.com/vercel-labs/agent-desktop/blob/main/SUPPORT.md) |

## 许可证

Apache-2.0
