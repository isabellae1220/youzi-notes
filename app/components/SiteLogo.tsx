import Link from "next/link";

export function SiteLogo() {
  return (
    <Link href="/" className="brand" aria-label="柚子 Notes 首页">
      <span className="brand-mark" aria-hidden="true">柚</span>
      <span>柚子 <i>Notes</i></span>
    </Link>
  );
}
