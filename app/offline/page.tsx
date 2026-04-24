export default function OfflinePage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Offline — Calibrate</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                background: #1A252F;
                color: #FFFFFF;
                font-family: 'Open Sans', system-ui, sans-serif;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
              }
              .card {
                background: #2C3E50;
                border: 1px solid rgba(255,255,255,0.10);
                border-radius: 1.25rem;
                padding: 3rem 2.5rem;
                max-width: 420px;
                width: 100%;
                text-align: center;
              }
              .logo {
                font-size: 1.75rem;
                font-weight: 600;
                color: #E8611A;
                letter-spacing: 0.025em;
                margin-bottom: 2rem;
              }
              .icon { font-size: 3rem; margin-bottom: 1.5rem; }
              h1 {
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 1rem;
                color: #FFFFFF;
              }
              p {
                color: #8A97A5;
                font-size: 0.9375rem;
                line-height: 1.6;
                margin-bottom: 2rem;
              }
              a {
                display: inline-block;
                background: #E8611A;
                color: #FFFFFF;
                font-weight: 600;
                padding: 0.75rem 2rem;
                border-radius: 0.75rem;
                text-decoration: none;
                font-size: 0.9375rem;
              }
            `,
          }}
        />
      </head>
      <body>
        <div className="card">
          <div className="logo">calibrate.</div>
          <div className="icon">📶</div>
          <h1>You&apos;re offline</h1>
          <p>
            Your progress will sync when you reconnect. Any cards you&apos;ve
            already loaded are still available for review.
          </p>
          <a href="/study/flashcards">Continue studying</a>
        </div>
      </body>
    </html>
  )
}
