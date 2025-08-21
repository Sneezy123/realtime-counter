import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {

    console.log('Incoming request:', request.url);
  console.log('User-Agent:', request.headers.get('user-agent'));

  const url = new URL(request.url);
  const groupName = url.pathname.split('/').pop();

  if (!groupName) {
    return new Response('Group name is required', { status: 400 });
  }

  try {
    // Fetch group data from Supabase
    const { data: group, error } = await supabase
      .from('counter_groups')
      .select('id, display_name, profile_image_url, created_at')
      .eq('name', groupName)
      .single();

    if (error || !group) {
      // Return default meta tags for non-existent groups
      const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VibeCount - Group Not Found</title>
    <meta name="description" content="This group does not exist or has been removed.">
    <meta property="og:title" content="VibeCount - Group Not Found">
    <meta property="og:description" content="This group does not exist or has been removed.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url.origin}/${groupName}">
    <meta property="og:image" content="https://vibecount.vercel.app/static/images/image.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="VibeCount - Group Not Found">
    <meta name="twitter:description" content="This group does not exist or has been removed.">
    <meta name="twitter:image" content="https://vibecount.vercel.app/static/images/image.png">
</head>
<body>
<div id="root"></div>
        <script
            type="module"
            src="/src/main.tsx"
            crossorigin="anonymous"
        ></script>
</body>
</html>`;
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Generate dynamic OpenGraph meta tags
    const displayName = group.display_name || groupName;
    const imageUrl =
      group.profile_image_url ||
      'https://vibecount.vercel.app/static/images/image.png';
    const pageUrl = `${url.origin}/${groupName}`;

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${displayName} - VibeCount</title>
    <meta name="description" content="Join ${displayName} on VibeCount to track counters in real-time.">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="${displayName} - VibeCount">
    <meta property="og:description" content="Join ${displayName} on VibeCount to track counters in real-time.">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${displayName} on VibeCount">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${pageUrl}">
    <meta name="twitter:title" content="${displayName} - VibeCount">
    <meta name="twitter:description" content="Join ${displayName} on VibeCount to track counters in real-time.">
    <meta name="twitter:image" content="${imageUrl}">
    <meta name="twitter:image:alt" content="${displayName} on VibeCount">
    
</head>
<body>
    <div id="root"></div>
        <script
            type="module"
            src="/src/main.tsx"
            crossorigin="anonymous"
        ></script>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error generating OpenGraph tags:', error);
    return new Response('Error generating page', { status: 500 });
  }
}
