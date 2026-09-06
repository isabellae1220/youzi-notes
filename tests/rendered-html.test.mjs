import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the 柚子 Notes homepage with its core navigation", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>柚子 Notes \| 免费课程资料库<\/title>/);
  assert.match(html, /这些资料/);
  assert.match(html, /不该有门槛/);
  assert.match(html, /数据库/);
  assert.match(html, /操作系统/);
  assert.match(html, /物理实验/);
  assert.match(html, /https:\/\/njupt-youzi\.top\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("renders the course shelf", async () => {
  const response = await render("/courses");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /课程书架/);
  assert.match(html, /计算机学院/);
  assert.match(html, /理学院/);
});

test("renders real course resources with preview and download links", async () => {
  const response = await render("/courses/operating-systems");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /操作系统笔记/);
  assert.match(html, /在线预览/);
  assert.match(html, /下载 PDF/);
  assert.match(html, /\/files\/resources\/operating-systems\//);
});

test("renders the anonymous modern Chinese history resources", async () => {
  const response = await render("/courses/modern-chinese-history");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /中国近现代史纲要/);
  assert.match(html, /中国近代史复习提纲/);
  assert.match(html, /近代史知识点整合/);
  assert.doesNotMatch(html, /项易/);
  assert.match(html, /\/files\/resources\/modern-chinese-history\//);
});

test("renders the renamed and newly added physics lab resources", async () => {
  const response = await render("/courses/physics-lab-1");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /19-20期末试卷/);
  assert.match(html, /2023-2024期末试卷/);
  assert.match(html, /扭摆法测量物体的转动惯量/);
  assert.match(html, /数字示波器的调节和使用/);
  assert.match(html, /双臂电桥测量低电阻/);
  assert.match(html, /分光计的调节与使用/);
  assert.doesNotMatch(html, /1776280225380-1cc36589-fdd3-4426-aeb2-a72af33e3a7e/);
});

test("renders only exams, the workbook, and the new notes for college physics 1", async () => {
  const response = await render("/courses/college-physics-1");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /大物上笔记/);
  assert.match(html, /大物活页/);
  assert.match(html, /2024大物上期末卷/);
  assert.doesNotMatch(html, /§1\.1 质点运动的描述/);
  assert.doesNotMatch(html, /§8\.6 位移电流/);
});

test("renders the project policy and copyright boundaries", async () => {
  const response = await render("/about");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /关于与使用说明/);
  assert.match(html, /CC BY-NC-ND 4\.0/);
  assert.match(html, /不得公开传播修改/);
  assert.match(html, /无隶属、授权或背书关系/);
});

test("renders the contribution guide", async () => {
  const response = await render("/contribute");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /提交 Issue/);
  assert.match(html, /创建 Pull Request/);
  assert.match(html, /权利声明或下架/);
  assert.match(html, /github\.com\/isabellae1220\/youzi-notes\/issues\/new\?template=01-resource-submission\.yml/);
  assert.match(html, /github\.com\/isabellae1220\/youzi-notes\/issues\/new\?template=04-rights-takedown\.yml/);
  assert.doesNotMatch(html, /仓库地址确定后/);
});
