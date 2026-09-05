import Link from "next/link";
import { PageContainer } from "../components/PageContainer";
import { SiteHeader } from "../components/SiteHeader";
import { courses, resources } from "@/lib/content";

export default function CoursesPage() {
  const colleges = [...new Set(courses.map((course) => course.college))];
  return (
    <main className="inner-page beige-shelf">
      <SiteHeader variant="inner" backHref="/" backLabel="返回首页" />
      <PageContainer as="header" className="page-header"><span className="kicker">COURSE SHELF</span><h1>课程书架</h1><p>按学院找到你正在学的课程。只展示已经整理好的内容。</p></PageContainer>
      <PageContainer className="shelf">
        {colleges.map((college) => (
          <section key={college} className="college-group"><h2><span />{college}</h2><div className="course-grid">
            {courses.filter((course) => course.college === college).map((course, index) => (
              <Link href={`/courses/${course.id}`} className={`course-card shelf-tone-${(index % 4) + 1}`} key={course.id}><div className="course-icon">{course.icon}</div><div className="course-meta"><span>{course.college}</span><span>{resources.filter((item) => item.courseId === course.id).length} 份资料</span></div><h3>{course.name}</h3><p>{course.description}</p><span className="card-arrow">↗</span></Link>
            ))}
          </div></section>
        ))}
      </PageContainer>
    </main>
  );
}
