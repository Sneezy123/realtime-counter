import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const groupName = url.pathname.split('/').pop() || 'home';

    try {
        const { data: group } = await supabase
            .from('counter_groups')
            .select('display_name, profile_image_url')
            .eq('name', groupName)
            .single();

        const displayName = group?.display_name || groupName;
        const imageUrl =
            group?.profile_image_url ||
            'https://vibecount.vercel.app/static/images/image.png';
        const pageUrl = `${url.origin}/${groupName}`;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${displayName} - VibeCount</title>
<meta name="description" content="Join ${displayName} on VibeCount to track counters in real-time.">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${displayName} - VibeCount">
<meta property="og:description" content="Join ${displayName} on VibeCount to track counters in real-time.">
<meta property="og:image" content="${imageUrl}">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="${pageUrl}">
<meta name="twitter:title" content="${displayName} - VibeCount">
<meta name="twitter:description" content="Join ${displayName} on VibeCount to track counters in real-time.">
<meta name="twitter:image" content="${imageUrl}">

<!-- Vite Assets -->
<link rel="stylesheet" href="/assets/index-Db-e1ijz.css">
</head>
<body>
<div id="root"></div>
<script type="module" src="/assets/index-BhK3kama.js"></script>
</body>
</html>`;

        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    } catch (err) {
        console.error(err);
        return new Response('Error generating page', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}
