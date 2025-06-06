// src/components/AnalyticsPanel.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import PropTypes from "prop-types";
import {
  BookOpen,        // for “Words Read”
  LibraryBig,      // for “Fics Read”
  CalendarDays,    // for “Reading Activity” (heatmap)
  Star,            // for “Top Fandom”
  Heart,           // for “Top Relationship”
  User,            // for “Top Character”
} from "lucide-react";

const AnalyticsPanel = ({ userId, monthOffset = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState([]); // array of booleans for each day
  const [wordsRead, setWordsRead] = useState(0);
  const [ficsReadCount, setFicsReadCount] = useState(0);
  const [topFandom, setTopFandom] = useState('—');
  const [topRelationship, setTopRelationship] = useState('—');
  const [topCharacter, setTopCharacter] = useState('—');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // ─── 1) Compute first & last day of target month ─────────────────
        const now = new Date();
        const thisMonthFirst = new Date(now.getFullYear(), now.getMonth(), 1);
        const targetMonthFirst = new Date(
          thisMonthFirst.getFullYear(),
          thisMonthFirst.getMonth() - monthOffset,
          1
        );
        const nextMonthFirst = new Date(
          targetMonthFirst.getFullYear(),
          targetMonthFirst.getMonth() + 1,
          1
        );
        const targetMonthLast = new Date(nextMonthFirst.getTime() - 1);

        // Format “YYYY-MM-DD” for SQL
        const yyyy_mm_dd = (d) => d.toISOString().slice(0, 10);
        const monthStartStr = yyyy_mm_dd(targetMonthFirst);
        const monthEndStr = yyyy_mm_dd(targetMonthLast);

        // ─── 2) Fetch this user’s reading_logs ─────────────────
        const { data: logs, error: logsError } = await supabase
          .from('reading_logs')
          .select('read_ranges, fic_id')
          .eq('user_id', userId);
        if (logsError) throw logsError;

        // ─── 3) Parse each range (handle half-open “)” at end) ─────────────────
        const allIntervals = [];
        logs.forEach((rl) => {
          (rl.read_ranges || []).forEach((rangeStr) => {
            const match = rangeStr.match(/^([\[\(])(.+),(.+)([\]\)])$/);
            if (!match) return;
            const [, , startStr, endStr, endBracket] = match;

            const startDate = new Date(startStr + 'T00:00:00');
            let endDate = new Date(endStr + 'T23:59:59');
            if (endBracket === ')') {
              endDate.setDate(endDate.getDate() - 1);
            }

            allIntervals.push({
              start: startDate,
              end: endDate,
              fic_id: rl.fic_id,
            });
          });
        });

        // ─── 4) Build monthStart / monthEnd Date objects ─────────────────
        const monthStart = new Date(monthStartStr + 'T00:00:00');
        const monthEnd = new Date(monthEndStr + 'T23:59:59');

        // ─── 5) Which intervals overlap this calendar month? ─────────────────
        const overlappingThisMonth = allIntervals.filter(
          (entry) => entry.start <= monthEnd && entry.end >= monthStart
        );

        // Build the heatmap array
        const daysInMonth = targetMonthLast.getDate();
        const wasReadingDay = Array(daysInMonth).fill(false);
        overlappingThisMonth.forEach((entry) => {
          const intervalStart =
            entry.start < monthStart ? monthStart : entry.start;
          const intervalEnd =
            entry.end > monthEnd ? monthEnd : entry.end;

          for (
            let d = new Date(intervalStart);
            d <= intervalEnd;
            d.setDate(d.getDate() + 1)
          ) {
            wasReadingDay[d.getDate() - 1] = true;
          }
        });
        setHeatmapData(wasReadingDay);

        // ─── 6) Which intervals actually finish in this month? ─────────────────
        const finishedThisMonth = allIntervals.filter(
          (entry) => entry.end >= monthStart && entry.end <= monthEnd
        );
        const finishedFicIds = [
          ...new Set(finishedThisMonth.map((e) => e.fic_id)),
        ];
        setFicsReadCount(finishedFicIds.length);

        // ─── 7) Sum words for those distinct fics ─────────────────
        let totalWords = 0;
        if (finishedFicIds.length > 0) {
          const { data: ficsData, error: ficsError } = await supabase
            .from('fics')
            .select('words')
            .in('id', finishedFicIds);
          if (ficsError) throw ficsError;
          totalWords = ficsData.reduce((sum, f) => sum + (f.words || 0), 0);
        }
        setWordsRead(totalWords);

        // ─── 8) Top Fandom ─────────────────
        let topFandomName = '—';
        if (finishedFicIds.length > 0) {
          const { data: ffData, error: ffError } = await supabase
            .from('fic_fandoms')
            .select('fandoms(name)')
            .in('fic_id', finishedFicIds);
          if (ffError) throw ffError;
          const fandomCounts = {};
          ffData.forEach((row) => {
            const name = row.fandoms.name;
            fandomCounts[name] = (fandomCounts[name] || 0) + 1;
          });
          const sortedFandoms = Object.entries(fandomCounts).sort(
            (a, b) => b[1] - a[1]
          );
          if (sortedFandoms.length) topFandomName = sortedFandoms[0][0];
        }
        setTopFandom(topFandomName);

        // ─── 9) Top Relationship ─────────────────
        let topRelName = '—';
        if (finishedFicIds.length > 0) {
          const { data: frData, error: frError } = await supabase
            .from('fic_relationships')
            .select('relationships(name)')
            .in('fic_id', finishedFicIds);
          if (frError) throw frError;

          const relCounts = {};
          frData.forEach((row) => {
            const name = row.relationships.name.trim();
            relCounts[name] = (relCounts[name] || 0) + 1;
          });
          const sortedRels = Object.entries(relCounts).sort((a, b) => b[1] - a[1]);
          if (sortedRels.length > 0) {
            topRelName = sortedRels[0][0];
          }
        }
        setTopRelationship(topRelName);

        // ─── 10) Top Character ─────────────────
        let topCharName = '—';
        if (finishedFicIds.length > 0) {
          const { data: fcData, error: fcError } = await supabase
            .from('fic_characters')
            .select('characters(name)')
            .in('fic_id', finishedFicIds);
          if (fcError) throw fcError;
          const charCounts = {};
          fcData.forEach((row) => {
            const name = row.characters.name;
            charCounts[name] = (charCounts[name] || 0) + 1;
          });
          const sortedChars = Object.entries(charCounts).sort(
            (a, b) => b[1] - a[1]
          );
          if (sortedChars.length) topCharName = sortedChars[0][0];
        }
        setTopCharacter(topCharName);

        setLoading(false);
      } catch (err) {
        console.error('AnalyticsPanel error:', err);
        setError(err.message || 'Unknown error');
        setLoading(false);
      }
    })();
  }, [userId, monthOffset]);

  // ─── Compute the “Month Year” label (e.g. “June 2025”) ─────────────────
  const monthLabel = (() => {
    const now = new Date();
    const thisMonthFirst = new Date(now.getFullYear(), now.getMonth(), 1);
    const targetMonthFirst = new Date(
      thisMonthFirst.getFullYear(),
      thisMonthFirst.getMonth() - monthOffset,
      1
    );
    return targetMonthFirst.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  })();

  if (loading) {
    return (
      <div className="bg-white p-4 rounded shadow-md mb-6">
        <h2 className="font-semibold text-lg">{monthLabel} Analytics</h2>
        <p>Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded mb-6">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  // ─── Render a simple 7-column grid of small squares for each day ─────────────────
  const renderHeatmap = () => (
    <div className="mx-auto max-w-[250px] sm:max-w-[300px] md:max-w-[350px]">
      <div className="grid grid-cols-7 gap-[2px]">
        {heatmapData.map((didRead, idx) => (
          <div
            key={idx}
            className={`aspect-square w-full rounded-sm ${
              didRead ? 'bg-green-600' : 'bg-gray-300'
            }`}
            title={`Day ${idx + 1}: ${didRead ? 'Read' : 'No reading'}`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-[#f5f1eb] p-6 rounded-3xl shadow-lg w-full">
      {/* Title */}
      <div className="flex items-center mb-6">
        <CalendarDays className="w-6 h-6 text-[#202d26]" />
        <h2 className="ml-2 font-serif text-2xl text-[#202d26]">
          {monthLabel} Analytics
        </h2>
      </div>

      {/* Top Row: Words Read & Fics Read */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Words Read Card */}
        <div className="relative bg-[#d3b8a7] rounded-2xl shadow-md hover:shadow-lg transition-shadow group">
          <div className="absolute left-0 top-0 h-full w-1 bg-[#202d26] rounded-l-2xl"></div>
          <div className="p-5 flex flex-col items-center">
            <BookOpen className="w-8 h-8 text-[#202d26] mb-2" />
            <div className="text-[#494f4b] text-xs uppercase tracking-wide mb-1">
              Words Read
            </div>
            <div className="text-3xl font-semibold text-[#2d261e]">
              {wordsRead.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Fics Read Card */}
        <div className="relative bg-[#d3b8a7] rounded-2xl shadow-md hover:shadow-lg transition-shadow group">
          <div className="absolute left-0 top-0 h-full w-1 bg-[#9a5643] rounded-l-2xl"></div>
          <div className="p-5 flex flex-col items-center">
            <LibraryBig className="w-8 h-8 text-[#9a5643] mb-2" />
            <div className="text-[#494f4b] text-xs uppercase tracking-wide mb-1">
              Fics Read
            </div>
            <div className="text-3xl font-semibold text-[#2d261e]">
              {ficsReadCount}
            </div>
          </div>
        </div>
      </div>

      {/* Reading Activity (Heatmap) */}
      <div className="mb-10">
        <div className="flex items-center mb-3">
          <CalendarDays className="w-5 h-5 text-[#2d261e]" />
          <h3 className="ml-1 font-serif text-lg text-[#2d261e]">
            Reading Activity
          </h3>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          {renderHeatmap()}
        </div>
      </div>

      {/* Bottom Row: Top Fandom / Relationship / Character */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Fandom */}
        <div className="relative bg-[#fdf8f4] border border-[#986341] rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
          <div className="absolute left-0 top-0 h-1 w-full bg-[#986341] rounded-t-2xl"></div>
          <div className="p-5 flex flex-col items-center">
            <Star className="w-6 h-6 text-[#986341] mb-2" />
            <div className="text-[#494f4b] text-xs tracking-wide mb-1">
              Top Fandom
            </div>
            <div className="text-base font-medium text-[#2d261e]">
              {topFandom}
            </div>
          </div>
        </div>

        {/* Top Relationship */}
        <div className="relative bg-[#fdf8f4] border border-[#9a5643] rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
          <div className="absolute left-0 top-0 h-1 w-full bg-[#9a5643] rounded-t-2xl"></div>
          <div className="p-5 flex flex-col items-center">
            <Heart className="w-6 h-6 text-[#9a5643] mb-2" />
            <div className="text-[#494f4b] text-xs tracking-wide mb-1">
              Top Relationship
            </div>
            <div className="text-base font-medium text-[#2d261e]">
              {topRelationship}
            </div>
          </div>
        </div>

        {/* Top Character */}
        <div className="relative bg-[#fdf8f4] border border-[#202d26] rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
          <div className="absolute left-0 top-0 h-1 w-full bg-[#202d26] rounded-t-2xl"></div>
          <div className="p-5 flex flex-col items-center">
            <User className="w-6 h-6 text-[#202d26] mb-2" />
            <div className="text-[#494f4b] text-xs tracking-wide mb-1">
              Top Character
            </div>
            <div className="text-base font-medium text-[#2d261e]">
              {topCharacter}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AnalyticsPanel.propTypes = {
  userId: PropTypes.string.isRequired,
  monthOffset: PropTypes.number, // default is handled in the signature
};

export default AnalyticsPanel;
