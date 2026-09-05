export type ResourceType = "note" | "exam" | "exercise" | "summary" | "experiment";

export interface Course {
  id: string;
  name: string;
  college: string;
  description: string;
  icon: string;
  accent: string;
}

export interface Resource {
  id: string;
  courseId: string;
  title: string;
  type: ResourceType;
  description: string;
  format: "pdf" | "md";
  updatedAt: string;
}

export const courses: Course[] = [
  { id: "database", name: "数据库", college: "计算机学院", description: "从关系模型到 SQL，记录一条更清晰的复习路径。", icon: "DB", accent: "sage" },
  { id: "operating-systems", name: "操作系统", college: "计算机学院", description: "进程、内存和文件系统的章节笔记与复习总结。", icon: "OS", accent: "apricot" },
  { id: "physics-lab", name: "物理实验", college: "理学院", description: "实验原理、数据处理方法和课后整理。", icon: "PHY", accent: "rose" },
];

export const resources: Resource[] = [
  { id: "db-review", courseId: "database", title: "数据库期末复习整理", type: "summary", description: "核心概念与常见题型整理。", format: "pdf", updatedAt: "07.12" },
  { id: "os-process", courseId: "operating-systems", title: "进程与线程章节笔记", type: "note", description: "进程状态、调度与同步。", format: "pdf", updatedAt: "07.10" },
  { id: "physics-data", courseId: "physics-lab", title: "实验数据处理方法", type: "experiment", description: "不确定度与数据处理。", format: "pdf", updatedAt: "07.08" },
  { id: "db-exercises", courseId: "database", title: "SQL 练习题整理", type: "exercise", description: "常用查询与综合练习。", format: "pdf", updatedAt: "07.05" },
  { id: "os-memory", courseId: "operating-systems", title: "内存管理复习提纲", type: "summary", description: "分页、分段和虚拟内存。", format: "md", updatedAt: "07.02" },
];
