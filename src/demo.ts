import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function createDemoHtml(outDir: string): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const filePath = join(outDir, 'screenlint-demo.html');
  await writeFile(filePath, demoHtml(), 'utf8');
  return filePath;
}

function demoHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Screenlint Demo</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      color: #111;
      background: #f7f8fb;
    }
    main {
      width: 760px;
      padding: 32px;
    }
    .hero {
      background: #fff;
      border: 1px solid #dde1ea;
      padding: 24px;
    }
    .bad-button {
      display: inline-block;
      width: 126px;
      height: 22px;
      overflow: hidden;
      white-space: nowrap;
      color: #aaa;
      background: #b8b8b8;
      border: 0;
      padding: 2px 8px;
      margin-top: 16px;
    }
    .overlap-a,
    .overlap-b {
      position: absolute;
      top: 188px;
      left: 32px;
      width: 220px;
      height: 54px;
      background: rgba(20, 80, 180, 0.9);
      color: white;
      display: grid;
      place-items: center;
    }
    .overlap-b {
      left: 150px;
      background: rgba(180, 30, 80, 0.9);
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <h1>Screenlint catches rendered UI failures</h1>
      <p>This demo intentionally contains the problems AI-generated interfaces often ship with.</p>
      <button class="bad-button">This label is clipped on purpose</button>
      <img src="./missing-image.png" alt="Broken demo asset" />
    </section>
    <div class="overlap-a">Layer one</div>
    <div class="overlap-b">Layer two</div>
  </main>
  <script>
    console.error('Demo console error');
  </script>
</body>
</html>`;
}
