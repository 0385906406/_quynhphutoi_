// Thời tiết API - Open-Meteo (completely free, no auth needed!)

export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string; // N, NE, E, SE, S, SW, W, NW
  condition: string; // Sunny, Cloudy, Rainy, etc.
  weatherCode: number; // WMO weather code
  updatedAt: string;
}

export interface WeatherForecast extends WeatherData {
  date: string;
}

// WMO Weather Codes to Vietnamese
const WEATHER_DESCRIPTIONS: Record<number, { text: string; emoji: string }> = {
  0: { text: "Nắng", emoji: "☀️" },
  1: { text: "Hơi mây", emoji: "🌤️" },
  2: { text: "Mây rải rác", emoji: "⛅" },
  3: { text: "Mây", emoji: "☁️" },
  45: { text: "Sương mù", emoji: "🌫️" },
  48: { text: "Sương mù giá", emoji: "🌫️" },
  51: { text: "Mưa nhẹ", emoji: "🌦️" },
  53: { text: "Mưa vừa", emoji: "🌧️" },
  55: { text: "Mưa to", emoji: "⛈️" },
  61: { text: "Mưa", emoji: "🌧️" },
  63: { text: "Mưa vừa", emoji: "🌧️" },
  65: { text: "Mưa to", emoji: "⛈️" },
  80: { text: "Mưa rải rác", emoji: "🌦️" },
  81: { text: "Mưa", emoji: "🌧️" },
  82: { text: "Mưa to", emoji: "⛈️" },
  95: { text: "Giông tố", emoji: "⛈️" },
};

// Mock data - Quỳnh Phụ, Thái Bình
const MOCK_WEATHER: WeatherData = {
  location: "Quỳnh Phụ, Thái Bình",
  temperature: 28,
  feelsLike: 30,
  humidity: 65,
  windSpeed: 10,
  windDirection: "Đông",
  condition: "Hơi mây",
  weatherCode: 1,
  updatedAt: new Date().toISOString(),
};

export async function getWeather(latitude: number = 20.8, longitude: number = 106.4): Promise<WeatherData> {
  try {
    // TODO: Fetch từ Open-Meteo (completely free!)
    // const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
    // const response = await fetch(url);
    // if (!response.ok) throw new Error(`API error: ${response.status}`);
    // const data = await response.json();
    // return mapOpenMeteoData(data);

    return MOCK_WEATHER;
  } catch (error) {
    console.error("[Weather API Error]", error);
    return MOCK_WEATHER;
  }
}

export async function getWeatherForecast(latitude: number = 20.8, longitude: number = 106.4): Promise<WeatherForecast[]> {
  // 7-day forecast mock
  return Array.from({ length: 7 }, (_, i) => ({
    ...MOCK_WEATHER,
    date: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
    temperature: 28 + Math.random() * 4 - 2,
  }));
}

export function getWeatherEmoji(weatherCode: number): string {
  return WEATHER_DESCRIPTIONS[weatherCode]?.emoji || "🌤️";
}

export function getWeatherText(weatherCode: number): string {
  return WEATHER_DESCRIPTIONS[weatherCode]?.text || "Không xác định";
}
