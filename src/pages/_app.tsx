import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        src="https://www.vexo.co/analytics.js"
        strategy="afterInteractive"
      />
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
