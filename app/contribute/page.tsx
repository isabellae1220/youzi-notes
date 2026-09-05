import { PageContainer } from "../components/PageContainer";
import { SiteHeader } from "../components/SiteHeader";

const issueTypes = [
  {
    number: "01",
    title: "投稿资料",
    description: "提交你有权公开的原创笔记、复习总结、习题或实验资料。",
    tone: "tone-pink",
  },
  {
    number: "02",
    title: "错误反馈",
    description: "报告页面、课程信息或资料内容中的错误，也可以反馈网站 Bug。",
    tone: "tone-apricot",
  },
  {
    number: "03",
    title: "新增课程",
    description: "建议收录一门课程，并说明目前真实存在且可以公开的资料。",
    tone: "tone-purple",
  },
  {
    number: "04",
    title: "权利声明或下架",
    description: "权利人可提交版权、隐私或下架申请，相关内容会被优先暂停公开并核实。",
    tone: "tone-green",
  },
];

export default function ContributePage() {
  return (
    <main className="contribute-page">
      <SiteHeader variant="inner" backHref="/" backLabel="返回首页" />

      <PageContainer as="header" className="contribute-hero">
        <span className="kicker">CONTRIBUTE</span>
        <h1>把你的这一份，<br />留给后来的人。</h1>
        <p>不需要会写代码。选择适合你的方式，我们会在公开前完成版权、隐私和内容检查。</p>
      </PageContainer>

      <PageContainer as="section" className="contribute-paths" aria-labelledby="contribute-paths-title">
        <h2 id="contribute-paths-title" className="sr-only">参与方式</h2>
        <article className="contribute-path contribute-path-primary">
          <span className="path-label">不熟悉 GitHub</span>
          <h3>提交 Issue</h3>
          <p>填写表单告诉维护者你想投稿、反馈或申请什么，无需修改网站代码。</p>
          <a href="#issue-types">选择 Issue 类型 <span aria-hidden="true">↓</span></a>
        </article>
        <article className="contribute-path contribute-path-secondary">
          <span className="path-label">熟悉 Git</span>
          <h3>创建 Pull Request</h3>
          <p>直接添加课程数据、Markdown 笔记，或修复资料信息、网站代码与文档。</p>
          <a href="#pull-request">查看提交步骤 <span aria-hidden="true">↓</span></a>
        </article>
      </PageContainer>

      <PageContainer as="section" id="issue-types" className="issue-section">
        <div className="section-heading">
          <div><span className="kicker">ISSUE TEMPLATES</span><h2>你想提交什么？</h2></div>
          <p>仓库地址确定后，这里会连接到对应的 GitHub 表单。</p>
        </div>
        <div className="issue-grid">
          {issueTypes.map((item) => (
            <article className={`issue-card ${item.tone}`} key={item.number}>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <small>Issue 模板已准备</small>
            </article>
          ))}
        </div>
      </PageContainer>

      <PageContainer as="section" id="pull-request" className="pr-section">
        <div>
          <span className="kicker">PULL REQUEST</span>
          <h2>直接参与整理</h2>
          <p>适合愿意使用 Git 的贡献者。请保持页面与内容数据分离，并只提交真实存在且确认可以公开的资料。</p>
        </div>
        <ol>
          <li><span>01</span><p><b>Fork 并新建分支</b><small>让每次修改保持单一、清晰。</small></p></li>
          <li><span>02</span><p><b>按内容规范修改</b><small>课程数据、笔记、文档或代码都可以。</small></p></li>
          <li><span>03</span><p><b>完成公开前检查</b><small>确认版权、隐私、来源和文件信息。</small></p></li>
          <li><span>04</span><p><b>提交 Pull Request</b><small>说明修改内容和验证方式，等待审核。</small></p></li>
        </ol>
      </PageContainer>

      <PageContainer as="aside" className="contribute-notice">
        <span aria-hidden="true">✶</span>
        <div><h2>公开之前，请先确认</h2><p>不提交未授权教师课件、教材扫描件、付费资料、内部题库、未举行考试的题目，以及包含姓名、学号或成绩的文件。</p></div>
      </PageContainer>
    </main>
  );
}
