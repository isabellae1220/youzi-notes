import { notFound } from "next/navigation";
import { PageContainer } from "../../components/PageContainer";
import { SiteHeader } from "../../components/SiteHeader";
import { courses, resourceFileUrl, resources } from "@/lib/content";

const labels = { note: "整理笔记", exam: "历年试卷", exercise: "习题资料", summary: "复习总结", experiment: "实验资料" };

export function generateStaticParams() { return courses.map((course) => ({ id: course.id })); }

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = courses.find((item) => item.id === id);
  if (!course) notFound();
  const items = resources.filter((item) => item.courseId === id);
  return (
    <main className="inner-page beige-detail">
      <SiteHeader variant="inner" backHref="/courses" backLabel="课程书架" />
      <PageContainer as="header" className="course-header"><span className="course-big-icon">{course.icon}</span><div><span className="kicker">{course.college}</span><h1>{course.name}</h1><p>{course.description}</p></div></PageContainer>
      <PageContainer as="section" className="course-resources"><div className="section-heading compact"><div><span className="kicker">RESOURCES</span><h2>已整理资料</h2></div><span className="count-tag">{items.length} 份</span></div>
        <div className="resource-list detail-resource-grid">{items.map((item, index) => <article className={`resource-row detail-tone-${(index % 4) + 1}`} key={item.id}><span className="file-mark">{item.format.toUpperCase()}</span><span className="resource-main"><strong>{item.title}</strong><small>{labels[item.type]} · {item.description}</small></span><span className="resource-date">{item.updatedAt}</span><span className="resource-actions"><a className="download-button" href={resourceFileUrl(item)} target="_blank" rel="noreferrer">在线预览</a><a className="download-button download-button-primary" href={resourceFileUrl(item)} download={item.fileName}>下载 PDF</a></span></article>)}</div>
        <p className="placeholder-note">※ 资料仅供学习交流；如有权利或隐私问题，请通过参与贡献页申请下架。</p>
      </PageContainer>
    </main>
  );
}
