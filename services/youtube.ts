import { YouTubeSearchResult } from '../types';

export const searchYouTube = async (query: string): Promise<YouTubeSearchResult[]> => {
    if (!query) return [];
    
    const apiUrl = `/api/search?q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            console.error('Search API function returned an error:', errorData);
            throw new Error(`YouTube search failed with status: ${response.status}`);
        }
        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error('YouTube search API did not return an array:', data);
            return [];
        }

        const results: YouTubeSearchResult[] = data
            .filter((item: any) => item.videoId)
            .map((video: any) => ({
                id: video.videoId,
                title: video.title,
                artist: video.author,
                duration: (video.lengthSeconds || 0) * 1000,
                thumbnail: video.videoThumbnails?.[0]?.url
                           || `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`,
            }))
            .slice(0, 10);

        return results;
    } catch (error) {
        console.error('Error searching YouTube:', error);
        return [];
    }
};
