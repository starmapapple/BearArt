import "./globals.css";

export const metadata = {
  title: "印尼落地页工厂",
  description: "面向印尼电商投放的单品落地页系统。"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
