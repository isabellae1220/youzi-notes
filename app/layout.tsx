import type { Metadata } from "next";
import "./globals.css";

const title = "柚子 Notes | 免费课程资料库";
const description = "由学生自发维护的课程笔记、习题与复习资料库。";

export const metadata: Metadata = {
  metadataBase: new URL("https://njupt-youzi.top"),
  title,
  description,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "柚子 Notes：这些资料，不该有门槛。" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
