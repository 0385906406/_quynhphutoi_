// Phim chiếu rạp API - Movie Showtimes

export interface MovieShowtime {
  id: string;
  title: string;
  rating: number; // 1-10
  duration: number; // minutes
  poster?: string;
  showtimes: Array<{
    cinema: string;
    time: string; // HH:MM
    format: string; // 2D, 3D, IMAX
  }>;
}

// Mock data
const MOCK_MOVIES: MovieShowtime[] = [
  {
    id: "1",
    title: "Phim Hành động 2024",
    rating: 8.5,
    duration: 150,
    poster: "🎬",
    showtimes: [
      { cinema: "CGV Hà Nội", time: "14:00", format: "2D" },
      { cinema: "BHD Hà Nội", time: "15:30", format: "3D" },
      { cinema: "Galaxy Hà Nội", time: "16:45", format: "IMAX" },
    ],
  },
  {
    id: "2",
    title: "Phim Tình cảm Việt Nam",
    rating: 7.2,
    duration: 120,
    poster: "🎬",
    showtimes: [
      { cinema: "CGV TP.HCM", time: "17:00", format: "2D" },
      { cinema: "Lotte TP.HCM", time: "19:00", format: "2D" },
    ],
  },
  {
    id: "3",
    title: "Phim Hoạt hình Lâu",
    rating: 9.0,
    duration: 95,
    poster: "🎬",
    showtimes: [
      { cinema: "CGV Hà Nội", time: "10:30", format: "3D" },
      { cinema: "Platinum Hà Nội", time: "12:00", format: "IMAX" },
    ],
  },
];

export async function getTodayMovies(city: string = "Hanoi"): Promise<MovieShowtime[]> {
  try {
    // TODO: Fetch từ movie-showtimes GitHub hoặc cinema APIs
    // Hiện tại mock data
    return MOCK_MOVIES;
  } catch (error) {
    console.error("[Movie API Error]", error);
    return MOCK_MOVIES;
  }
}

export function getMovieRatingColor(rating: number): string {
  if (rating >= 8) return "#10B981"; // green - excellent
  if (rating >= 7) return "#F59E0B"; // yellow - good
  return "#EF4444"; // red - ok
}
