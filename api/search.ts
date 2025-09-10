export const config = {
  runtime: 'edge',
};

// A list of public Invidious instances to cycle through.
const INVIDIOUS_INSTANCES = [
  'https://yewtu.be',
  'https://vid.puffyan.us',
  'https://invidious.projectsegfau.lt',
  'https://invidious.kavin.rocks',
  'https://iv.ggtyler.dev',
  'https://inv.n8pjl.ca',
  'https://invidious.lunar.icu',
];

// Shuffle the array to distribute load and not always hit the first instance.
const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter "q" is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const shuffledInstances = shuffleArray([...INVIDIOUS_INSTANCES]);
  
  // Enhance the query to prioritize music content
  const enhancedQuery = `${query} music`;

  for (const instance of shuffledInstances) {
    const apiUrl = `${instance}/api/v1/search?q=${encodeURIComponent(enhancedQuery)}&type=video`;
    
    try {
      const apiResponse = await fetch(apiUrl, {
        headers: { 'User-Agent': 'SonoraMusicApp/1.0' },
      });

      if (apiResponse.ok) {
        try {
          const data = await apiResponse.json();
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
            },
          });
        } catch (e) {
            console.warn(`Instance ${instance} returned a non-JSON response for an OK status.`);
            // Continue to the next instance
        }
      } else {
        console.warn(`Instance ${instance} failed with status: ${apiResponse.status}`);
      }

    } catch (error) {
      console.warn(`Instance ${instance} failed with a network error:`, error);
    }
  }

  console.error('All Invidious instances failed for query:', query);
  return new Response(JSON.stringify({ error: 'All upstream YouTube services are currently unavailable.' }), {
    status: 503, // Service Unavailable
    headers: { 'Content-Type': 'application/json' },
  });
}