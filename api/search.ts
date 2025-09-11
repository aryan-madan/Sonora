import type { VercelRequest, VercelResponse } from '@vercel/node';
import play from 'play-dl';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const query = req.query.q;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const enhancedQuery = `${query} music`;
    const searchResults = await play.search(enhancedQuery, {
      limit: 15,
      source: { youtube: 'video' }
    });

    const formattedResults = searchResults
      .filter(video => video.id && video.title)
      .map(video => {
        const bestThumbnail = video.thumbnails.length > 0 ? video.thumbnails[video.thumbnails.length - 1] : null;
        return {
            videoId: video.id!,
            title: video.title!,
            author: video.channel?.name || 'Unknown Artist',
            lengthSeconds: video.durationInSec,
            videoThumbnails: bestThumbnail ? [{
              quality: 'maxresdefault',
              url: bestThumbnail.url
            }] : [],
        };
      });

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=60');
    return res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Error searching YouTube with play-dl:', error);
    if (error instanceof Error && (error.message.includes("Sign in to confirm you are not a robot") || error.message.includes("429"))) {
        return res.status(429).json({ error: 'YouTube search is temporarily unavailable due to rate limiting.' });
    }
    return res.status(503).json({ error: 'YouTube search service is currently unavailable.' });
  }
}
