import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import catalog from "../content/catalog.generated.json" with { type: "json" };

async function html(path) {
  return readFile(new URL(`../out/${path}`, import.meta.url), "utf8");
}

test("exports every public route as a COS-compatible directory index", async () => {
  await html("index.html");
  await html("about/index.html");
  await html("contribute/index.html");
  await html("courses/index.html");
  await html("404.html");
  for (const course of catalog.courses) await html(`courses/${course.id}/index.html`);
});

test("uses the custom domain for social metadata", async () => {
  const page = await html("index.html");
  assert.match(page, /https:\/\/njupt-youzi\.top\/og\.png/);
  assert.doesNotMatch(page, /chatgpt\.site/);
});

test("cycles all four homepage course-card colors", async () => {
  const page = await html("index.html");
  assert.match(page, /bento-course bento-4/);
  assert.ok((page.match(/bento-course bento-1/g) ?? []).length > 1);
});

test("keeps same-origin PDF preview and browser downloads", async () => {
  const page = await html("courses/operating-systems/index.html");
  assert.match(page, /href="\/files\/resources\/operating-systems\//);
  assert.match(page, /download="操作系统笔记\.pdf"/);
  assert.doesNotMatch(page, /download=1/);
});
