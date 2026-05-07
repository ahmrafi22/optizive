import { NextRequest } from 'next/server';
import http from 'http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.PRICE_COMPARE_API_URL || 'http://localhost:2222';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const url = new URL(`${BACKEND_URL}/api/compare?stream=true`);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Connection': 'keep-alive',
        },
      };

      const proxyReq = http.request(options, (proxyRes) => {
        if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
          let errorBody = '';
          proxyRes.on('data', (chunk) => { errorBody += chunk.toString(); });
          proxyRes.on('end', () => {
            try {
              controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: errorBody || 'Backend error' })}\n\n`));
            } catch { /* ignored */ }
            try { controller.close(); } catch { /* ignored */ }
          });
          return;
        }

        proxyRes.on('data', (chunk: Buffer) => {
          try {
            controller.enqueue(new Uint8Array(chunk));
          } catch {
            // Stream already closed
          }
        });

        proxyRes.on('end', () => {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });

        proxyRes.on('error', (err) => {
          try {
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`));
          } catch { /* ignored */ }
          try { controller.close(); } catch { /* ignored */ }
        });
      });

      // Disable Node.js timeout so long crawls don't kill the backend connection
      proxyReq.setTimeout(0);

      proxyReq.on('error', (err) => {
        try {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`));
        } catch { /* ignored */ }
        try { controller.close(); } catch { /* ignored */ }
      });

      proxyReq.on('timeout', () => {
        console.error('[Proxy] Backend request timeout');
        proxyReq.destroy();
        try {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: 'Backend request timeout' })}\n\n`));
        } catch { /* ignored */ }
        try { controller.close(); } catch { /* ignored */ }
      });

      // Clean up if client disconnects
      req.signal.addEventListener('abort', () => {
        proxyReq.destroy();
      });

      proxyReq.write(JSON.stringify(body));
      proxyReq.end();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
