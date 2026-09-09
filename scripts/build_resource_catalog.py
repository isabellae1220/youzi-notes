from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime
from pathlib import Path


SOURCE = Path(os.environ.get("YUZU_RESOURCE_SOURCE", str(Path.home() / "开源资料_处理后待确认")))
OUTPUT = Path(__file__).resolve().parents[1] / "content" / "catalog.generated.json"

COURSES = {
    "c++": ("cpp", "C++ 程序设计", "计算机学院", "C++", "rose", "语法、面向对象与期末复习资料。"),
    "操作系统": ("operating-systems", "操作系统", "计算机学院", "OS", "apricot", "进程、同步、存储与文件系统资料。"),
    "数据库基础": ("database-systems", "数据库系统", "计算机学院", "DB", "purple", "数据库笔记、试卷与实验资料。", "database-basics"),
    "数据库系统基础": ("database-systems", "数据库系统", "计算机学院", "DB", "purple", "数据库笔记、试卷与实验资料。", "database-systems"),
    "数据结构": ("data-structures", "数据结构", "计算机学院", "DS", "rose", "数据结构笔记、复习材料与历年试卷。"),
    "算法分析与设计": ("algorithm-analysis", "算法分析与设计", "计算机学院", "ALG", "apricot", "算法章节复习、实验报告与试卷。"),
    "计算机系统基础": ("computer-systems", "计算机系统基础", "计算机学院", "CS", "purple", "系统基础复习、速查表与实验报告。"),
    "大物上": ("college-physics-1", "大学物理（上）", "理学院", "PHY1", "green", "大学物理上册课件、练习与试卷。"),
    "大物下": ("college-physics-2", "大学物理（下）", "理学院", "PHY2", "rose", "大学物理下册练习与期末资料。"),
    "高数上": ("calculus-1", "高等数学（上）", "理学院", "MATH1", "apricot", "高等数学上册笔记、练习与试卷。"),
    "高数下": ("calculus-2", "高等数学（下）", "理学院", "MATH2", "purple", "高等数学下册笔记、练习与试卷。"),
    "概率论": ("probability", "概率论与数理统计", "理学院", "PROB", "green", "概率统计笔记、习题与期末复习。"),
    "离散数学": ("discrete-math", "离散数学", "理学院", "DM", "rose", "集合、图论、代数结构与数理逻辑复习。"),
    "物理实验上": ("physics-lab-1", "物理实验（上）", "理学院", "LAB1", "apricot", "物理实验上册资料。"),
    "物理实验下": ("physics-lab-2", "物理实验（下）", "理学院", "LAB2", "purple", "物理实验下册报告、题目与复习资料。"),
    "数电": ("digital-electronics", "数字电路", "电子与光学工程学院", "DE", "green", "数字电路复习、习题解答与历年试卷。"),
    "量子与固体物理": ("qm-solid-physics", "量子与固体物理", "电子与光学工程学院", "QM", "purple", "量子力学与固体物理综合课程笔记。"),
    "马原": ("marxism-principles", "马克思主义基本原理", "马克思主义学院", "MARX", "rose", "课程重点与期末复习资料。"),
    "近代史": ("modern-chinese-history", "中国近现代史纲要", "马克思主义学院", "HIS", "apricot", "中国近现代史复习提纲与知识点整理。"),
    "应用文写作": ("practical-writing", "应用文写作", "公共课程", "WRITE", "apricot", "应用文写作参考资料。"),
}

EXCLUDED_SOURCE_RELATIVE_PATHS = {
    "数据库基础/第10-12章_习题.pdf",
    "数据库基础/第8-9章_习题.pdf",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def resource_type(relative: Path) -> str:
    text = "/".join(relative.parts)
    if "实验" in text:
        return "experiment"
    if any(word in text for word in ("试卷", "期末卷", "卷子", "A卷", "B卷", "高数卷", "套试卷")):
        return "exam"
    if any(word in text for word in ("习题", "练习册", "课后习题", "题目")):
        return "exercise"
    if "笔记" in text:
        return "note"
    return "summary"


def description(kind: str) -> str:
    return {
        "experiment": "课程实验资料",
        "exam": "历年试卷与参考资料",
        "exercise": "章节习题与练习资料",
        "note": "同学整理的课程笔记",
        "summary": "课程复习与参考资料",
    }[kind]


def main() -> None:
    courses_by_id = {}
    resources = []
    for folder, values in COURSES.items():
        course_id, name, college, icon, accent, course_description, *storage_prefix = values
        courses_by_id.setdefault(
            course_id,
            {
                "id": course_id,
                "name": name,
                "college": college,
                "description": course_description,
                "icon": icon,
                "accent": accent,
            },
        )
        for path in sorted((SOURCE / folder).rglob("*.pdf")):
            source_relative = str(path.relative_to(SOURCE))
            if source_relative in EXCLUDED_SOURCE_RELATIVE_PATHS:
                continue
            relative = path.relative_to(SOURCE / folder)
            digest = sha256(path)
            kind = resource_type(relative)
            object_prefix = storage_prefix[0] if storage_prefix else course_id
            resources.append(
                {
                    "id": f"{course_id}-{digest[:16]}",
                    "courseId": course_id,
                    "title": path.stem,
                    "type": kind,
                    "description": description(kind),
                    "format": "pdf",
                    "updatedAt": datetime.fromtimestamp(path.stat().st_mtime).strftime("%m.%d"),
                    "objectKey": f"resources/{object_prefix}/{digest[:24]}.pdf",
                    "fileName": path.name,
                    "size": path.stat().st_size,
                    "sha256": digest,
                    "sourceRelativePath": source_relative,
                }
            )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps({"courses": list(courses_by_id.values()), "resources": resources}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"courses={len(courses_by_id)} resources={len(resources)} output={OUTPUT}")


if __name__ == "__main__":
    main()
