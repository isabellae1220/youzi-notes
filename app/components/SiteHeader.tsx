import Link from "next/link";
import { PageContainer } from "./PageContainer";
import { SiteLogo } from "./SiteLogo";

type SiteHeaderProps =
  | { variant?: "home"; backHref?: never; backLabel?: never }
  | { variant: "inner"; backHref: string; backLabel: string };

export function SiteHeader(props: SiteHeaderProps) {
  if (props.variant === "inner") {
    return (
      <PageContainer as="nav" className="site-header site-header-inner" aria-label="主导航">
        <SiteLogo />
        <Link href={props.backHref} className="back-link">← {props.backLabel}</Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer as="nav" className="site-header site-header-home" aria-label="主导航">
      <SiteLogo />
      <div className="nav-center">
        <Link className="active" href="/">首页</Link>
        <Link href="/courses">课程</Link>
        <a href="#latest">最近整理</a>
        <Link href="/about">关于</Link>
      </div>
      <Link className="nav-contribute" href="/contribute">
        参与贡献 <span aria-hidden="true">→</span>
      </Link>
    </PageContainer>
  );
}
