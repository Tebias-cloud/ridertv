const BASE_URL = 'https://api.themoviedb.org/3'

export interface Movie {
  id: number
  title: string
  overview: string
  backdrop_path: string
  poster_path: string
  release_date: string
}

const mockMovies: Movie[] = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  title: `Mock Movie ${i + 1}`,
  overview: 'This is a mocked movie description for Rider IPTV because the TMDB API key is not ready.',
  backdrop_path: '/dummy-backdrop.jpg',
  poster_path: '/dummy-poster.jpg',
  release_date: '2026-01-01',
}))

export async function getTrendingMovies(): Promise<Movie[]> {
  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey || apiKey === 'dummy-tmdb-api-key') {
    return mockMovies
  }

  // Next.js (App Router) fetch configuration for ISR: { next: { revalidate: 3600 } }
  const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${apiKey}`, {
    next: { revalidate: 3600 }
  })

  if (!res.ok) {
    console.error('Failed to fetch from TMDB')
    return mockMovies
  }

  const data = await res.json()
  return data.results
}
