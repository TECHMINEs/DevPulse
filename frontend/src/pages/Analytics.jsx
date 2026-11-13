import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import Sidebar from '../components/Sidebar';
import BenchmarkTable from '../components/BenchmarkTable';
import { getRadar, getBenchmark, getVelocity, getPredictions, getStreak } from '../api/analytics';
import { formatRadarData, formatVelocityData, formatWellnessData } from '../utils/chartHelpers';
import SkeletonBox from '../components/SkeletonBox';

const Analytics = () => {
  const { data: radarData, isLoading: radarLoading } = useQuery({ queryKey: ['radar'], queryFn: getRadar });
  const { data: benchmarkData, isLoading: benchmarkLoading } = useQuery({ queryKey: ['benchmark'], queryFn: getBenchmark });
  const { data: velocityData, isLoading: velocityLoading } = useQuery({ queryKey: ['velocity'], queryFn: () => getVelocity(12) });
  const { data: predictionsData, isLoading: predictionsLoading } = useQuery({ queryKey: ['predictions'], queryFn: getPredictions });
  const { data: streakData, isLoading: streakLoading } = useQuery({ queryKey: ['streak'], queryFn: getStreak });

  const isLoading = radarLoading || benchmarkLoading || velocityLoading || predictionsLoading || streakLoading;

  const radarChart = radarData?.radar
    ? formatRadarData(radarData.radar, { consistency: 60, volume: 50, timing: 65, diversity: 40, quality: 55, wellness: 72 })
    : [];
  const velocityChart = formatVelocityData(velocityData?.velocity || []);

  // combine actual + predicted wellness data for the chart
  const actualWellness = formatWellnessData(predictionsData?.actual || []);
  const predictedWellness = (predictionsData?.predictions || []).map(p => ({
    date: p.date,
    predicted: p.score ? parseFloat(p.score) : null,
  }));

  // merge actual and predicted into one array for the chart
  const combinedPrediction = [
    ...actualWellness.map(d => ({ date: d.date, actual: d.score, predicted: null })),
    ...predictedWellness.map(d => ({ ...d, actual: null })),
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-11 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-line px-6 py-4">
          <h1 className="text-xl font-bold">Deep Analytics</h1>
          <p className="text-xs text-surface-500">Comprehensive analysis of your development patterns</p>
        </header>

        <div className="p-6 space-y-6 animate-fade-in">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SkeletonBox h="380px" />
                <SkeletonBox h="380px" />
              </div>
              <SkeletonBox h="300px" />
              <SkeletonBox h="300px" />
            </div>
          ) : (
            <>
              {/* Radar + Benchmark */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-surface-300 mb-4">Developer Profile Radar</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarChart}>
                  <PolarGrid stroke="#FF2626" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#A3A3A3' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#a1a1aa' }} />
                  <Radar name="You" dataKey="user" stroke="#FF2626" fill="#FF2626" fillOpacity={0.3} strokeWidth={2} />
                  <Radar name="Industry Avg" dataKey="benchmark" stroke="#a1a1aa" fill="#a1a1aa" fillOpacity={0.1} strokeWidth={1} strokeDasharray="5 5" />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#A3A3A3' }}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid #FF2626', borderRadius: 0, fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Benchmark table */}
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-surface-300 mb-4">You vs Industry Average</h2>
              <BenchmarkTable user={benchmarkData?.user} industry={benchmarkData?.industry} />
            </div>
          </div>

          {/* Velocity chart */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-surface-300 mb-4">Commit Velocity (12 weeks)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={velocityChart} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid #FF2626', borderRadius: 0, fontSize: '12px' }} />
                <Bar dataKey="commits" fill="#FF2626" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Code volume */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-surface-300 mb-4">Code Volume (Lines Added vs Removed)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={velocityChart} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid #FF2626', borderRadius: 0, fontSize: '12px' }} />
                <Area type="monotone" dataKey="linesAdded" stackId="1" stroke="#39FF14" fill="#39FF14" fillOpacity={0.3} name="Added" />
                <Area type="monotone" dataKey="linesRemoved" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Removed" />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ML Predictions */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-surface-300 mb-1">ML Wellness Predictions</h2>
            <p className="text-xs text-surface-500 mb-4">7-day forecast based on your recent patterns (powered by scikit-learn)</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={combinedPrediction} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid #FF2626', borderRadius: 0, fontSize: '12px' }} />
                <Line type="monotone" dataKey="actual" stroke="#FF2626" strokeWidth={2} dot={{ r: 3 }} name="Actual" connectNulls={false} />
                <Line type="monotone" dataKey="predicted" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Predicted" connectNulls={false} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Streak info */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-surface-300 mb-4">Streak Summary</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary-400">{streakData?.current_streak || 0}</p>
                <p className="text-sm text-surface-400 mt-1">Current Streak</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white">{streakData?.longest_streak || 0}</p>
                <p className="text-sm text-surface-400 mt-1">Longest Streak</p>
              </div>
            </div>
            </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;