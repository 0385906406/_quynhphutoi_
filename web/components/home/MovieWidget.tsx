"use client";

import { useEffect, useState } from "react";
import { getTodayMovies, getMovieRatingColor, type MovieShowtime } from "@/lib/movie-api";

export function MovieWidget() {
  const [movies, setMovies] = useState<MovieShowtime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getTodayMovies();
      setMovies(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="qp-widget">
      <div className="qp-widget__header" style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>
        🎬 Phim chiếu rạp
      </div>
      <div className="qp-widget__body">
        {loading ? (
          <div className="qp-widget__loading">Đang tải...</div>
        ) : (
          <div className="movies-grid">
            {movies.slice(0, 3).map((movie) => (
              <div key={movie.id} className="movie-card">
                <div className="movie-poster">🎬</div>
                <div className="movie-title">{movie.title}</div>
                <div className="movie-rating" style={{ color: getMovieRatingColor(movie.rating) }}>
                  ⭐ {movie.rating}/10 • {movie.duration}'
                </div>
                <div className="movie-showtimes">{movie.showtimes.length} suất chiếu</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .qp-widget {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .qp-widget__header {
          color: white;
          padding: 1rem;
          font-weight: 600;
          font-size: 18px;
        }

        .qp-widget__body {
          padding: 1.5rem;
          min-height: 200px;
        }

        .movies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 1rem;
        }

        .movie-card {
          text-align: center;
        }

        .movie-poster {
          font-size: 48px;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          padding: 1rem;
        }

        .movie-title {
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.3;
          margin-bottom: 0.5rem;
        }

        .movie-rating {
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .movie-showtimes {
          font-size: 11px;
          color: #9ca3af;
        }

        .qp-widget__loading {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
