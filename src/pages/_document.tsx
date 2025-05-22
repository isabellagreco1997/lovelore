import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Character set */}
        <meta charSet="utf-8" />
        
        {/* Favicon - already set in layout but added here for completeness */}
        <link rel="icon" href="/images/favicon.png" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/images/favicon.png" />
        
        {/* Mobile viewport optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Preconnect to important domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Theme color for browsers */}
        <meta name="theme-color" content="#4f46e5" />
        
        {/* Browser compatibility -->*/}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* Preload critical assets */}
        <link rel="preload" as="image" href="/images/logo.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 