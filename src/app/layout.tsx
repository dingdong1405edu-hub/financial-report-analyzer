import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Phân Tích Báo Cáo Tài Chính AI',
  description: 'Upload báo cáo tài chính và nhận phân tích chuyên sâu bằng AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
