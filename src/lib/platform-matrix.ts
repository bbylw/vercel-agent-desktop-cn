/**
 * The platform capability matrix, in one place.
 *
 * It feeds both the docs tables (`<PlatformCapabilities />` in
 * `start/index.mdx` and `platforms/index.mdx`) and the landing page's table,
 * so a capability that differs on one platform gets edited once instead of
 * three times. `tone` picks the landing page's icon: `yes` = supported,
 * `part` = supported with a condition the cell text spells out.
 */

export type CapabilityTone = "yes" | "part";

export interface CapabilityCell {
  /** Cell text. Backticks mark inline code, e.g. "X11，`--headed`". */
  text: string;
  tone: CapabilityTone;
}

export interface CapabilityRow {
  name: string;
  mac: CapabilityCell;
  win: CapabilityCell;
  linux: CapabilityCell;
}

export const capabilityRows: CapabilityRow[] = [
  {
    name: "可访问性树",
    mac: { text: "支持", tone: "yes" },
    win: { text: "支持", tone: "yes" },
    linux: { text: "支持（AT-SPI）", tone: "yes" },
  },
  {
    name: "点击 / 输入 / 键盘",
    mac: { text: "支持", tone: "yes" },
    win: { text: "支持", tone: "yes" },
    linux: { text: "AT-SPI；X11 / GNOME 按键", tone: "part" },
  },
  {
    name: "鼠标输入",
    mac: { text: "支持", tone: "yes" },
    win: { text: "支持", tone: "yes" },
    linux: { text: "X11，`--headed`", tone: "part" },
  },
  {
    name: "截图",
    mac: { text: "支持，需要「屏幕录制」", tone: "part" },
    win: { text: "支持", tone: "yes" },
    linux: { text: "X11 窗口；Wayland 门户", tone: "part" },
  },
  {
    name: "剪贴板",
    mac: { text: "支持", tone: "yes" },
    win: { text: "支持", tone: "yes" },
    linux: { text: "支持；Wayland 需要 `wl-clipboard`", tone: "part" },
  },
  {
    name: "应用与窗口管理",
    mac: { text: "支持", tone: "yes" },
    win: { text: "支持", tone: "yes" },
    linux: { text: "启动/列出；X11 窗口控制", tone: "part" },
  },
  {
    name: "通知",
    mac: { text: "支持；通知中心需要 System Events 的自动化权限", tone: "part" },
    win: { text: "支持", tone: "yes" },
    linux: { text: "GNOME Shell", tone: "part" },
  },
  {
    name: "外壳界面",
    mac: { text: "Dock、菜单栏附加项", tone: "part" },
    win: { text: "任务栏、系统托盘、开始菜单、操作中心", tone: "yes" },
    linux: { text: "仅 `system-tray` 与 `action-center` 可用", tone: "part" },
  },
];
