/**
 * MDX 全局组件表 —— 在 MDX 里不用 import 就能直接写。
 * 注册入口在 `[...slug].astro` 的 `<Content components={components} />`。
 */

import { Aside } from "./components/ui/aside";
import { Badge } from "./components/ui/badge";
import { Card } from "./components/ui/card";
import { CardGrid } from "./components/ui/card-grid";
import { Code } from "./components/ui/code";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible";
import { LinkButton } from "./components/ui/link-button";
import Render from "./components/Render.astro";
import { PackageManagers } from "./components/ui/package-managers";
import { Step, Steps } from "./components/ui/steps";
import { Tabs, TabItem } from "./components/ui/tabs";

export const components = {
  Aside,
  Badge,
  Card,
  CardGrid,
  Code,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  LinkButton,
  PackageManagers,
  Render,
  Step,
  Steps,
  TabItem,
  Tabs,
};
