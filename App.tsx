import React, { useState } from 'react';
import { getWeatherByCity, getWeatherByCoords } from './services/weatherService';
import { generateWeatherInsight } from './services/geminiService';
import { WeatherData, GeminiInsight } from './types';
import { Search, MapPin, Wind, Droplets, Thermometer, Loader2, Sparkles, Navigation, Cloud, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  // Directly read from Environment Variables (Vercel)
  const apiKey = process.env.OPENWEATHER_API_KEY;

  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [insight, setInsight] = useState<GeminiInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (searchCity: string) => {
    if (!apiKey) return;

    setLoading(true);
    setError(null);
    setInsight(null);
    try {
      const data = await getWeatherByCity(searchCity, apiKey);
      setWeather(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch weather");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByLocation = () => {
    if (!apiKey) return;

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);
    setInsight(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await getWeatherByCoords(position.coords.latitude, position.coords.longitude, apiKey);
          setWeather(data);
          if (data.name) setCity(data.name);
        } catch (err: any) {
          setError(err.message || "Failed to fetch weather from location");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Unable to retrieve your location");
        setLoading(false);
      }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      fetchWeather(city);
    }
  };

  const handleGetInsight = async () => {
    if (!weather) return;
    setAiLoading(true);
    try {
      const data = await generateWeatherInsight(weather);
      setInsight(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // 1. Critical Config Check: If API key is missing from Env Vars
  if (!apiKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-100 font-sans">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-red-500/20 shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
          <p className="text-slate-400 mb-6">
            The <code>OPENWEATHER_API_KEY</code> environment variable is missing.
          </p>
          <div className="bg-slate-900/50 p-4 rounded-lg text-left text-sm font-mono text-slate-300 mb-6 border border-slate-700">
            1. Go to Vercel Project Settings<br/>
            2. Click "Environment Variables"<br/>
            3. Add <strong>OPENWEATHER_API_KEY</strong><br/>
            4. Redeploy your app
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm font-medium"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // 2. Main App Interface
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      <main className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Header / Search */}
        <div className="p-6 border-b border-slate-700/50">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500 mb-6 text-center">
            SkyGen Weather
          </h1>
          
          <form onSubmit={handleSearch} className="relative flex items-center mb-4">
            <Search className="absolute left-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter city name..."
              className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-100 placeholder-slate-500 transition-all"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !city.trim()}
              className="absolute right-2 p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 rotate-90" />}
            </button>
          </form>

          <div className="flex justify-center">
            <button 
              onClick={fetchWeatherByLocation}
              disabled={loading}
              className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
            >
              <MapPin className="w-3 h-3" /> Use Current Location
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center animate-fade-in">
              {error}
            </div>
          )}
        </div>

        {/* Weather Content */}
        {weather && (
          <div className="p-6 animate-fade-in">
            <div className="flex flex-col items-center text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-1">
                {weather.name}, <span className="text-slate-400 text-xl">{weather.sys.country}</span>
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <div className="flex items-center justify-center gap-4 mb-2">
                <img 
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`} 
                  alt={weather.weather[0].description} 
                  className="w-24 h-24 drop-shadow-lg"
                />
                <div className="text-right">
                  <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                    {Math.round(weather.main.temp)}°
                  </div>
                  <div className="text-sky-400 font-medium capitalize">
                    {weather.weather[0].description}
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-900/40 p-3 rounded-xl flex flex-col items-center justify-center border border-slate-700/30">
                <Wind className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-lg font-semibold text-slate-200">{Math.round(weather.wind.speed)}</span>
                <span className="text-xs text-slate-500 uppercase">m/s Wind</span>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl flex flex-col items-center justify-center border border-slate-700/30">
                <Droplets className="w-5 h-5 text-sky-400 mb-1" />
                <span className="text-lg font-semibold text-slate-200">{weather.main.humidity}</span>
                <span className="text-xs text-slate-500 uppercase">% Humidity</span>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl flex flex-col items-center justify-center border border-slate-700/30">
                <Thermometer className="w-5 h-5 text-rose-400 mb-1" />
                <span className="text-lg font-semibold text-slate-200">{Math.round(weather.main.feels_like)}°</span>
                <span className="text-xs text-slate-500 uppercase">Feels Like</span>
              </div>
            </div>

            {/* AI Insight Section */}
            <div className="border-t border-slate-700/50 pt-6">
              {!insight ? (
                <button
                  onClick={handleGetInsight}
                  disabled={aiLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Consulting Gemini...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Get AI Insight
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-slate-900/60 rounded-xl p-4 border border-violet-500/30 animate-scale-in">
                  <div className="flex items-center gap-2 mb-3 text-violet-400 text-sm font-semibold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" /> Gemini Analysis
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed mb-3 italic">
                    "{insight.summary}"
                  </p>
                  <div className="space-y-2">
                    <div className="flex gap-2 text-sm">
                      <span className="text-slate-500 min-w-[60px]">Wear:</span>
                      <span className="text-sky-200">{insight.outfitAdvice}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-slate-500 min-w-[60px]">Fact:</span>
                      <span className="text-violet-200">{insight.funFact}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!weather && !loading && !error && (
          <div className="p-12 text-center text-slate-500">
            <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Cloud className="w-10 h-10 text-slate-600" />
            </div>
            <p>Search for a city or use your location to see the forecast.</p>
          </div>
        )}
      </main>

      <footer className="mt-8 text-slate-600 text-xs text-center">
        Powered by OpenWeather & Google Gemini
      </footer>
    </div>
  );
};

export default App;