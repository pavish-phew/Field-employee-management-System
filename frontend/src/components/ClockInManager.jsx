import React, { useState } from 'react';
import { attendanceApi } from '../services/api';
import AttendanceMap from './AttendanceMap';
import { MapPin, LogIn, LogOut } from 'lucide-react';

const ClockInManager = () => {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, CLOCKED_IN
  const [loading, setLoading] = useState(false);

  const handleClockIn = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });

        try {
          await attendanceApi.clockIn(latitude, longitude);
          setStatus('CLOCKED_IN');
          alert("Clocked in successfully!");
        } catch (error) {
          console.error("Clock-in failed", error);
          alert("Failed to clock in. " + (error.response?.data || ""));
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        console.error("Error getting location", error);
        alert("Please enable location services to clock in.");
      }
    );
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await attendanceApi.clockOut();
      setStatus('IDLE');
      alert("Clocked out successfully!");
    } catch (error) {
      console.error("Clock-out failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <MapPin className="text-blue-500" /> Attendance Management
        </h2>

        <div className="flex gap-4 mb-8">
          <button
            onClick={handleClockIn}
            disabled={loading || status === 'CLOCKED_IN'}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn size={20} /> Clock In
          </button>

          <button
            onClick={handleClockOut}
            disabled={loading || status === 'IDLE'}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={20} /> Clock Out
          </button>
        </div>

        {location && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Live Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>
            <AttendanceMap location={location} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockInManager;
