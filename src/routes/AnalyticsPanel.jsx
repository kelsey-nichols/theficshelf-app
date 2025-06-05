// src/components/AnalyticsPanel.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import PropTypes from 'prop-types';

/**
 * AnalyticsPanel: shows a set of monthly stats for a given user.
 *
 * Props:
 *   - userId:      string (UUID of the user)
 *   - monthOffset: number (0 = current month, 1 = last month, etc)
 */
const AnalyticsPanel = ({ userId, monthOffset }) => {
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
        // ─── 1) Compute the first & last day of the “target” month ─────────────────
        const now = new Date();
        // “This month” (e.g., June 5, 2025 → June 1, 2025)
        const thisMonthFirst = new Date(now.getFullYear(), now.getMonth(), 1);

        // Subtract exactly monthOffset months:
        //   monthOffset=0 → June 1, 2025
        //   monthOffset=1 → May 1, 2025
        const targetMonthFirst = new Date(
          thisMonthFirst.getFullYear(),
          thisMonthFirst.getMonth() - monthOffset,
          1
        );

        // First day of the next calendar month
        const nextMonthFirst = new Date(
          targetMonthFirst.getFullYear(),
          targetMonthFirst.getMonth() + 1,
          1
        );

        // Last instant of target month = 1 ms before nextMonthFirst
        const targetMonthLast = new Date(nextMonthFirst.getTime() - 1);

        // Format “YYYY‐MM‐DD” for SQL‐style comparisons
        const yyyy_mm_dd = (d) => d.toISOString().slice(0, 10);
        const monthStartStr = yyyy_mm_dd(targetMonthFirst); // e.g. “2025-06-01”
        const monthEndStr = yyyy_mm_dd(targetMonthLast);    // e.g. “2025-06-30”

        // ─── 2) Fetch this user’s reading_logs ─────────────────
        const { data: logs, error: logsError } = await supabase
          .from('reading_logs')
          .select('read_ranges, fic_id')
          .eq('user_id', userId);
        if (logsError) throw logsError;

        // ─── 3) Parse each range, adjusting for half‐open “)” at the end ─────────────────
        const allIntervals = [];
        logs.forEach((rl) => {
          (rl.read_ranges || []).forEach((rangeStr) => {
            const match = rangeStr.match(/([\[\(])(.+),(.+)([\]\)])/);
            if (!match) return;
            const [, , startStr, endStr, endBracket] = match;

            // Create Date at midnight for start, end at 23:59:59
            const startDate = new Date(startStr + 'T00:00:00');
            let endDate = new Date(endStr + 'T23:59:59');

            // If the range ends with “)”, it’s exclusive, so subtract one day
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

        // ─── 4) Build monthStart / monthEnd as actual Date objects ─────────────────
        const monthStart = new Date(monthStartStr + 'T00:00:00');
        const monthEnd = new Date(monthEndStr + 'T23:59:59');

        // ─── 5) Which intervals overlap this calendar month at all? ─────────────────
        const overlappingThisMonth = allIntervals.filter(
          (entry) => entry.start <= monthEnd && entry.end >= monthStart
        );

        // Build the heatmap
        const daysInMonth = targetMonthLast.getDate(); // e.g. 30 for June
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

        console.log('🔍 frData (relationships):', frData);

        const relCounts = {};
        frData.forEach((row) => {
            const name = row.relationships.name.trim(); // 🛠️ trim leading/trailing whitespace
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
    <div className="bg-white p-6 rounded-2xl shadow-md mb-6 w-full">
      <h2 className="font-semibold text-xl mb-4">{monthLabel} Analytics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-100 p-4 rounded-xl shadow-sm text-center">
            <div className="text-gray-500 text-xs mb-1">Words Read</div>
            <div className="text-lg font-semibold">{wordsRead.toLocaleString()}</div>
        </div>
        <div className="bg-gray-100 p-4 rounded-xl shadow-sm text-center">
            <div className="text-gray-500 text-xs mb-1">Fics Read</div>
            <div className="text-lg font-semibold">{ficsReadCount}</div>
        </div>
        </div>


      <div className="mb-4">
        <h3 className="text-sm font-medium">Reading Activity</h3>
        {renderHeatmap()}
      </div>

      

      {/* 4) Top fandom / relationship / character */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 text-sm">
        <div className="bg-gray-100 p-4 rounded-xl shadow-sm">
            <div className="text-gray-500 text-xs mb-1">Top Fandom</div>
            <div className="text-base font-semibold">{topFandom}</div>
        </div>
        <div className="bg-gray-100 p-4 rounded-xl shadow-sm">
            <div className="text-gray-500 text-xs mb-1">Top Relationship</div>
            <div className="text-base font-semibold">{topRelationship}</div>
        </div>
        <div className="bg-gray-100 p-4 rounded-xl shadow-sm">
            <div className="text-gray-500 text-xs mb-1">Top Character</div>
            <div className="text-base font-semibold">{topCharacter}</div>
        </div>
        </div>
    </div>
  );
};

AnalyticsPanel.propTypes = {
  userId: PropTypes.string.isRequired,
  monthOffset: PropTypes.number, // 0 = current month, 1 = last month, etc
};
AnalyticsPanel.defaultProps = {
  monthOffset: 0,
};

export default AnalyticsPanel;
