import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const groupName = url.pathname.split('/').pop();
  if (!groupName) return new Response('Group name required', { status: 400 });

  try {
    const { data: group } = await supabase
      .from('counter_groups')
      .select('display_name, profile_image_url')
      .eq('name', groupName)
      .single();

    const displayName = group?.display_name || groupName;
    const imageUrl = group?.profile_image_url || 'https://vibecount.vercel.app/static/images/image.png';
    const pageUrl = `${url.origin}/${groupName}`;

    // Read index.html template
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf-8');

    // Dynamically detect built JS file(s)
    const assetsPath = path.join(process.cwd(), 'dist', 'assets');
    const jsFiles = fs.readdirSync(assetsPath).filter(f => f.endsWith('.js'));
    const scriptTags = jsFiles.map(f => `<script type="module" src="/assets/${f}"></script>`).join('\n');

    // Replace head meta tags
    html = html.replace(/<title>.*<\/title>/, `<title>${displayName} - VibeCount</title>`);
    html = html.replace(/<meta property="og:title".*?>/, `<meta property="og:title" content="${displayName} - VibeCount">`);
    html = html.replace(/<meta property="og:description".*?>/, `<meta property="og:description" content="Join ${displayName} on VibeCount to track counters in real-time.">`);
    html = html.replace(/<meta property="og:image".*?>/, `<meta property="og:image" content="${imageUrl}">`);
    html = html.replace(/<meta name="twitter:title".*?>/, `<meta name="twitter:title" content="${displayName} - VibeCount">`);
    html = html.replace(/<meta name="twitter:description".*?>/, `<meta name="twitter:description" content="Join ${displayName} on VibeCount to track counters in real-time.">`);
    html = html.replace(/<meta name="twitter:image".*?>/, `<meta name="twitter:image" content="${imageUrl}">`);

    // Replace body script with detected JS files
    html = html.replace(/<script type="module" src=".*"><\/script>/, scriptTags);

    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    console.error(err);
    return new Response('Error generating page', { status: 500 });
  }
}
