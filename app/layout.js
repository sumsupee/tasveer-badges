import './globals.css'
import { Inter, Bebas_Neue } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const bebasNeue = Bebas_Neue({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
})

export const metadata = {
  title: 'Tasveer Badge Printer',
  description: 'Generate personalized badges for Tasveer Film Festival',
  icons: {
    icon: '/tasveer-20yrs.webp',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${bebasNeue.variable}`}>{children}</body>
    </html>
  )
}

