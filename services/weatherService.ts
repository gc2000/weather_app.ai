import { WeatherData } from '../types';

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export const getWeatherByCity = async (city: string, apiKey: string): Promise<WeatherData> => {
  if (!apiKey) {
    throw new Error("OpenWeather API Key is missing.");
  }

  const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("City not found. Please try again.");
    }
    if (response.status === 401) {
      throw new Error("Invalid OpenWeather API Key.");
    }
    throw new Error(`Weather API Error: ${response.statusText}`);
  }

  return response.json();
};

export const getWeatherByCoords = async (lat: number, lon: number, apiKey: string): Promise<WeatherData> => {
  if (!apiKey) {
    throw new Error("OpenWeather API Key is missing.");
  }

  const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);

  if (!response.ok) {
     if (response.status === 401) {
      throw new Error("Invalid OpenWeather API Key.");
    }
    throw new Error(`Weather API Error: ${response.statusText}`);
  }

  return response.json();
};