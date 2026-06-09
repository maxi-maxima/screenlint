<div align="center">

# Screenlint

**检查浏览器真实渲染出来的页面。**

一个基于 Playwright 的 UI 质量守门 CLI，专门面向 AI 生成的前端页面。

[English](README.md)

</div>

AI 编程助手很擅长快速生成 React、Vue、HTML 和 Tailwind 页面，但它们也经常生成“能编译、但实际页面坏了”的界面：

- 水合失败后的空白路由
- 移动端页面横向溢出
- 按钮文字被裁切
- 绝对定位面板互相重叠
- 文字对比度太低
- 远程图片损坏
- 浏览器控制台运行时报错

`screenlint` 会用 Chromium 打开页面，检查真实渲染后的 DOM，保存截图，并输出 JSON、Markdown、HTML 三种报告。

不需要 API key。不需要云账号。不需要先建立视觉基线。

## 30 秒演示

```bash
npx screenlint demo
```

演示命令会生成一个故意带问题的本地页面，并写出：

```text
reports/demo/screenlint.json
reports/demo/screenlint.md
reports/demo/screenlint.html
reports/demo/screenshots/desktop.png
reports/demo/screenshots/mobile.png
```

## 扫描页面

```bash
npx screenlint scan http://localhost:3000 --out reports/screenlint
```

扫描本地 HTML 文件：

```bash
npx screenlint scan ./dist/index.html --viewport mobile
```

作为 CI 守门：

```bash
npx screenlint scan http://localhost:3000 --fail-on error
```

退出码：

| 退出码 | 含义 |
| ---: | --- |
| `0` | 扫描完成，且没有触发配置的失败级别 |
| `1` | UI 问题触发了 `--fail-on` |
| `2` | CLI 参数或配置错误 |

## 检查规则

| 规则 | 级别 | 检查内容 |
| --- | --- | --- |
| `blank-page` | error | 页面几乎没有可见内容 |
| `console-error` | error | 加载期间出现浏览器 console error |
| `page-error` | error | 页面运行时未捕获异常 |
| `broken-image` | error | 图片加载失败 |
| `horizontal-overflow` | error | 移动端或桌面端页面宽度超过视口 |
| `text-clipped` | warning | 文字内容大于可见容器 |
| `element-overlap` | warning | 定位元素疑似互相覆盖 |
| `low-contrast` | warning | 文字对比度低于实用阈值 |

这些规则是工程实用型规则。`screenlint` 不是完整无障碍测试、单元测试或视觉回归测试的替代品。它的定位是：用很低成本抓住 AI 生成页面最容易漏掉的渲染级问题。

## GitHub Actions

把 `templates/github-action.yml` 复制到 `.github/workflows/screenlint.yml`。

```yaml
- name: Scan rendered UI
  run: npx screenlint scan http://127.0.0.1:3000 --out reports/screenlint --fail-on error
```

上传报告：

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: screenlint-report
    path: reports/screenlint
```

## 为什么做这个

AI Agent 写前端之后，失败模式变了。很多时候代码能构建成功，真正的问题是浏览器渲染出来的页面到底能不能用。

静态工具看到源码。`screenlint` 看到用户实际会看到的页面。

## 本地开发

```bash
npm install
npm run check
npm run demo
```

## 调研背景

这个项目来自三个正在变强的趋势：

- AI coding agent 和仓库指令文件正在成为常规开发表面。
- Playwright 这样的浏览器自动化工具已经足够稳定，可以作为本地质量守门。
- 团队需要小而直接的工具，在代码评审前抓住 AI 生成代码的明显问题。

## License

MIT
