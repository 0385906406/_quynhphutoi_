"use client";

import { LotteryWidget } from "./LotteryWidget";
import { FootballWidget } from "./FootballWidget";
import { MovieWidget } from "./MovieWidget";
import { PriceWidget } from "./PriceWidget";
import { WeatherWidget } from "./WeatherWidget";
import { HoroscopeWidget } from "./HoroscopeWidget";

export function HomeWidgetGrid() {
  return (
    <section className="qp-home-widgets">
      <div className="container-wide">
        <div className="qp-widget-grid">
          <LotteryWidget />
          <FootballWidget />
          <MovieWidget />
          <PriceWidget />
          <WeatherWidget />
          <HoroscopeWidget />
        </div>
      </div>

      <style jsx>{`
        .qp-home-widgets {
          padding: 2rem 0;
          background: #f9fafb;
        }

        .qp-widget-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;

          /* Tablet: 2 columns */
          @media (max-width: 1024px) {
            grid-template-columns: repeat(2, 1fr);
          }

          /* Mobile: 1 column */
          @media (max-width: 768px) {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 1024px) {
          .qp-widget-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .qp-widget-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
