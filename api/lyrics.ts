export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackName = searchParams.get('trackName');
  const artistName = searchParams.get('artistName');

  if (!trackName || !artistName) {
    return new Response(JSON.stringify({ error: 'trackName and artistName are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`;

  try {
    const apiResponse = await fetch(apiUrl, {
      headers: { 'User-Agent': 'SonoraMusicApp/1.0' },
    });

    if (!apiResponse.ok) {
        console.error(`Lrclib API failed with status: ${apiResponse.status}`);
        return new Response(JSON.stringify({ lyrics: null, message: 'Could not contact lyrics service.' }), {
            status: apiResponse.status,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    
    const data = await apiResponse.json();

    if (!Array.isArray(data) || data.length === 0) {
        return new Response(JSON.stringify({ lyrics: null, message: 'No lyrics found.' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // findS the best match, hopefully one with synced lyrics, otherwise the first one is fine i guess :P
    const bestMatch = data.find(item => item.syncedLyrics) || data[0];
    const lyrics = bestMatch.syncedLyrics || bestMatch.plainLyrics || null;

    if (!lyrics) {
         return new Response(JSON.stringify({ lyrics: null, message: 'No lyrics found.' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    
    return new Response(JSON.stringify({ lyrics }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });

  } catch (error) {
    console.error('Error fetching lyrics from lrclib:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch lyrics.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}