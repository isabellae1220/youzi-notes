import Link from "next/link";
import { PageContainer } from "./components/PageContainer";
import { SiteHeader } from "./components/SiteHeader";
import { SiteLogo } from "./components/SiteLogo";
import { courses, resources } from "@/lib/content";

const typeLabels = { note: "笔记", exam: "试卷", exercise: "习题", summary: "总结", experiment: "实验" } as const;

export default function Home() {
  return (
    <main className="home-v2 beige-home">
      <SiteHeader />

      <PageContainer as="section" className="new-hero">
        <div className="hero-copy-panel">
          <span className="mini-label"><i /> FOR EVERY STUDENT</span>
          <h1>这些资料，<br /><em>不该有门槛。</em></h1>
          <p>把课堂之外的笔记、习题和复习经验收集起来，免费留给后来的人。</p>
          <div className="hero-cta"><Link href="/courses">打开课程书架 <span>→</span></Link><small>已整理<br /><b>{courses.length}</b> 门课程</small></div>
          <div className="tiny-promise"><span>✓</span> 永久免费 <span>✓</span> 学生维护 <span>✓</span> 尊重原创</div>
        </div>
        <div className="hero-dashboard" aria-hidden="true">
          <div className="dash-head"><div><span>柚子的书桌</span><small>2026 · 夏</small></div><b>柚</b></div>
          <div className="dash-search">⌕&nbsp;&nbsp; 搜索课程、笔记或试卷 <kbd>⌘ K</kbd></div>
          <div className="dash-grid"><div className="dash-feature"><span className="dash-tag">NEW PAGES</span><h3>数据库<br />期末整理</h3><p>SQL · 关系模型 · 习题</p><button>继续阅读 →</button><i className="orbit"><i /></i></div><div className="dash-small purple"><span>OS</span><b>02</b><small>份资料</small></div><div className="dash-small pink"><span>PHY</span><b>01</b><small>份资料</small></div></div>
          <div className="dash-foot"><span><i className="avatar">Y</i> 最近更新</span><b>07.12</b></div><div className="fruit-sticker">柚<span>✶</span></div>
        </div>
      </PageContainer>

      <PageContainer as="section" className="course-v2"><div className="v2-heading"><div><span>COURSE LIBRARY</span><h2>从一门课开始</h2></div><p>按学院浏览已经整理好的资料<br />没有的分类，就不会出现。</p><Link href="/courses">全部课程 →</Link></div>
        <div className="bento-courses">{courses.map((course,index)=>{const count=resources.filter(item=>item.courseId===course.id).length;return <Link href={`/courses/${course.id}`} className={`bento-course bento-${index+1}`} key={course.id}><div className="bento-top"><span>{course.icon}</span><i>0{index+1}</i></div><small>{course.college}</small><h3>{course.name}</h3><p>{course.description}</p><div className="bento-bottom"><b>{count} 份资料</b><span>↗</span></div></Link>})}</div>
      </PageContainer>

      <PageContainer as="section" id="latest" className="latest-v2"><div className="latest-title"><span>✶</span><div><small>JUST UPDATED</small><h2>刚整理好的页</h2></div></div><div className="latest-board">{resources.slice(0,4).map((resource,index)=>{const course=courses.find(item=>item.id===resource.courseId)!;return <Link href={`/courses/${course.id}`} className="latest-item" key={resource.id}><span className="item-index">0{index+1}</span><span className="item-file">{resource.format.toUpperCase()}</span><span className="item-copy"><b>{resource.title}</b><small>{course.name} · {typeLabels[resource.type]}</small></span><span className="item-date">{resource.updatedAt}</span><span className="item-arrow">→</span></Link>})}</div></PageContainer>
      <section id="about" className="about-v2"><PageContainer><span className="about-spark">✶</span><p>用心整理过的知识，<br /><em>不该被锁在某个人的文件夹里。</em></p><small>柚子 Notes 由本校学生自发维护，与学校及各院系无官方关联。</small></PageContainer></section>
      <PageContainer as="footer" className="footer-v2"><SiteLogo /><p>免费 · 非商业 · 尊重原创</p><span>© 2026</span></PageContainer>
    </main>
  );
}
