import Link from "next/link";
import { PageContainer } from "../components/PageContainer";
import { SiteHeader } from "../components/SiteHeader";

const sections = [
  { number: "01", title: "项目性质", tone: "policy-pink", content: <><p>柚子 Notes 是由学生自发发起和维护的非官方、非商业学习资料项目。</p><p>本项目与学校、院系、教师及其他官方机构无隶属、授权或背书关系。网站中的课程名称仅用于资料分类和识别。</p></> },
  { number: "02", title: "原创内容授权", tone: "policy-apricot", content: <><p>除非页面另有说明，本项目发布的自有原创笔记适用 <b>CC BY-NC-ND 4.0</b> 协议。</p><ul><li>可在保留完整内容和正确署名的前提下进行非商业分享。</li><li>不得将内容用于售卖、付费群、引流资料包等商业用途。</li><li><b>不得公开传播修改、改编、拆分或二次创作版本</b>，除非事先获得原作者书面同意。</li></ul></> },
  { number: "03", title: "第三方资料", tone: "policy-purple", content: <><p>教师课件、试卷、实验材料与他人笔记的权利仍归各自权利人所有，不因被本站收录而改变。</p><p>本站只发布已确认可以公开的内容。未获授权的完整教师 PPT、教材扫描件、付费资料和内部题库不公开。</p></> },
  { number: "04", title: "隐私与脱敏", tone: "policy-green", content: <><p>资料不得包含学生姓名、学号、成绩、联系方式、账号信息、内部链接或其他可识别个人的信息。</p><p>发现未脱敏内容时，将优先停止公开并完成清理。</p></> },
  { number: "05", title: "内容仅供参考", tone: "policy-pink", content: <><p>学生整理的笔记、回忆版试卷和参考答案可能存在遗漏或错误，不构成官方教学或考试信息。</p><p>请以教师、学院及学校正式通知为准；本项目不保证使用资料后的考试成绩。</p></> },
  { number: "06", title: "考试公平", tone: "policy-apricot", content: <><p>不接收、不发布尚未举行考试的题目、通过非正当方式获得的题库，或可能损害考试公平的内容。</p></> },
  { number: "07", title: "投稿与授权", tone: "policy-purple", content: <><p>投稿者应确认自己有权提交和授权公开相关内容，并说明是否需要署名。</p><p>投稿不代表自动发布；维护者可因版权、隐私、重复、内容质量或考试公平问题拒绝收录。</p></> },
  { number: "08", title: "异议与下架", tone: "policy-green", content: <><p>如果你是相关内容的权利人，或发现资料存在版权、隐私、错误或安全问题，可通过 GitHub Issue 提交说明。</p><p>对于合理的异议，将先暂停相关内容的公开，再进行核实、更正或删除。</p></> },
];

export default function AboutPage() {
  return <main className="policy-page">
    <SiteHeader variant="inner" backHref="/" backLabel="返回首页" />
    <PageContainer as="header" className="policy-hero"><span className="kicker">ABOUT &amp; POLICY</span><h1>关于与使用说明</h1><p>免费分享不等于没有边界。这些规则用来保护原作者、贡献者和每一位使用资料的同学。</p></PageContainer>
    <PageContainer className="policy-grid">{sections.map(section=><section className={`policy-card ${section.tone}`} key={section.number}><span>{section.number}</span><h2>{section.title}</h2><div>{section.content}</div></section>)}</PageContainer>
    <PageContainer as="section" className="policy-contact"><div><span>✶</span><h2>发现问题？</h2><p>通过 GitHub Issue 提交勘误、权利声明或下架申请。</p></div><Link href="/contribute">查看提交方式 →</Link></PageContainer>
  </main>;
}
