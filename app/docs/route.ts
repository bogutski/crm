import { NextResponse } from 'next/server';

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API Documentation - CRM Proto</title>
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <script
    id="api-reference"
    data-url="/api/openapi"
    data-configuration='${JSON.stringify({
      theme: 'kepler',
      layout: 'modern',
      darkMode: true,
      hiddenClients: ['c', 'clojure', 'csharp', 'http', 'java', 'kotlin', 'objc', 'ocaml', 'powershell', 'r', 'swift'],
      showSidebar: true,
      searchHotKey: 'k',
    })}'
  ></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
