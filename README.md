# 柚子 Notes

柚子 Notes 是由学生发起和维护的非官方、非商业课程资料库，收集经过版权与隐私检查、可以公开分享的课程笔记、复习资料、习题、试卷回忆版和实验资料。

> 这些资料，不该有门槛。把课堂之外的笔记、习题和复习经验收集起来，免费留给后来的人。

## 在线访问

[https://njupt-youzi.top](https://njupt-youzi.top)

## 参与贡献

- 不熟悉 Git：通过 [Issue](https://github.com/isabellae1220/youzi-notes/issues/new/choose) 投稿资料、反馈错误、建议课程或申请下架。
- 熟悉 Git：Fork 仓库并提交 Pull Request。
- 投稿前请阅读 [内容录入规范](docs/content-guide.md)。

请勿提交未授权教师课件、教材扫描件、付费资料、内部题库、尚未举行考试的题目，或包含姓名、学号、成绩、联系方式等未脱敏信息的文件。

## 本地开发

```bash
npm install
npm run dev
```

验证构建与页面渲染：

```bash
npm run build
node --test tests/rendered-html.test.mjs
```

准备腾讯云 COS 静态部署目录：

```bash
npm run build:cos
npm run prepare:cos
node --test tests/static-export.test.mjs
```

生成的 `cos-deploy/` 包含静态网站和经过大小、SHA-256 校验的公开 PDF，不提交到 Git。生产域名切换前必须先在临时地址完成验证。

## 技术栈

- React、Next.js、TypeScript
- Tailwind CSS 与自有 CSS
- 腾讯云中国香港 COS 与中国境外 CDN（迁移中）
- 内容目录静态生成

## 许可与内容边界

- 网站代码采用 [MIT License](LICENSE)。
- 维护者有权授权的原创笔记按页面标注的 CC BY-NC-ND 4.0 许可处理。
- 教师课件、试卷及其他第三方材料仍归原权利人所有，不因进入本仓库或网站而改变权属。
- 本仓库不存放已发布的大型 PDF 文件，只保存网站代码和公开资料目录元数据。

本项目与学校、院系和教师不存在官方隶属、授权或背书关系。
