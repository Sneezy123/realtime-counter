import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/^\/api\/og/, '') || '/';

    // Serve assets dynamically
    if (pathname.startsWith('/assets/')) {
      const assetPath = path.join(process.cwd(), 'dist', pathname);
      if (!fs.existsSync(assetPath)) return new Response('Not found', { status: 404 });

      const buffer = fs.readFileSync(assetPath);
      const mimeType = mime.lookup(assetPath);
// Force it to string, fallback if false
const contentType: string = typeof mimeType === 'string' ? mimeType : 'application/octet-stream';

return new Response(buffer, {
  headers: { 'Content-Type': contentType },
});
    }

    // Extract group name
    const groupName = pathname.split('/').filter(Boolean).pop() || 'home';

    // Fetch group data from Supabase
    const { data: group } = await supabase
      .from('counter_groups')
      .select('display_name, profile_image_url')
      .eq('name', groupName)
      .single();

    const displayName: string = group?.display_name || groupName;
    const imageUrl: string = group?.profile_image_url || 'https://vibecount.vercel.app/static/images/image.png';
    const pageUrl: string = `${url.origin}/${groupName}`;

    // Read built index.html
    const indexPath: string = path.join(process.cwd(), 'dist', 'index.html');
    let html: string = fs.readFileSync(indexPath, 'utf-8');

    // Replace OG meta tags
    html = html.replace(/<title>.*<\/title>/, `<title>${displayName} - VibeCount</title>`);
    html = html.replace(/<meta property="og:title".*?>/, `<meta property="og:title" content="${displayName} - VibeCount">`);
    html = html.replace(/<meta property="og:description".*?>/, `<meta property="og:description" content="Join ${displayName} on VibeCount to track counters in real-time.">`);
    html = html.replace(/<meta property="og:image".*?>/, `<meta property="og:image" content="${imageUrl}">`);
    html = html.replace(/<meta name="twitter:title".*?>/, `<meta name="twitter:title" content="${displayName} - VibeCount">`);
    html = html.replace(/<meta name="twitter:description".*?>/, `<meta name="twitter:description" content="Join ${displayName} on VibeCount to track counters in real-time.">`);
    html = html.replace(/<meta name="twitter:image".*?>/, `<meta name="twitter:image" content="${imageUrl}">`);

    // Dynamically include all compiled JS/CSS from dist/assets
    const assetsDir: string = path.join(process.cwd(), 'dist', 'assets');
    const jsFiles: string[] = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
    const cssFiles: string[] = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));

    const scriptTags: string = jsFiles.map(f => `<script type="module" src="/api/og/assets/${f}"></script>`).join('\n');
    const styleTags: string = cssFiles.map(f => `<link rel="stylesheet" href="/api/og/assets/${f}">`).join('\n');

    html = html.replace(/<\/head>/, `${styleTags}\n</head>`);
    html = html.replace(/<script type="module".*?><\/script>/, scriptTags);

    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    console.error(err);
    return new Response('Error generating page', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}
