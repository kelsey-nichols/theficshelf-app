import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserAuth } from "../context/AuthContext";

const READING_STATUS_OPTIONS = ['tbr', 'currently_reading', 'read'];

export default function LogFic() {
  const { user } = UserAuth();
  const { ficId } = useParams();
  const navigate = useNavigate();

  const [fic, setFic] = useState(null);
  const [readingLog, setReadingLog] = useState(null);
  const [status, setStatus] = useState('tbr');
  const [shelves, setShelves] = useState([]);
  const [dateStarted, setDateStarted] = useState('');
  const [dateFinished, setDateFinished] = useState('');
  const [currentChapter, setCurrentChapter] = useState('');
  const [notes, setNotes] = useState('');
  const [rereadCount, setRereadCount] = useState(0);
  const [allShelves, setAllShelves] = useState([]);
  const [archiveShelfId, setArchiveShelfId] = useState(null);
  const [shareUpdate, setShareUpdate] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // 1) Fetch fic metadata
      const { data: ficData } = await supabase
        .from('fics')
        .select('*')
        .eq('id', ficId)
        .single();
      setFic(ficData);

      // 2) Fetch this user's shelves
      const { data: shelvesData, error: shelvesError } = await supabase
        .from('shelves')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (shelvesError) {
        console.error('Error fetching shelves:', shelvesError);
        return;
      }
      setAllShelves(shelvesData);

      // 3) Find the “Archive” shelf ID
      const archiveShelf = shelvesData.find((s) => s.title.toLowerCase() === 'archive');
      if (!archiveShelf) {
        console.error('Archive shelf not found!');
        return;
      }
      setArchiveShelfId(archiveShelf.id);

      // 4) Fetch this user's existing reading_log (if any)
      const { data: logData } = await supabase
        .from('reading_logs')
        .select('*')
        .eq('fic_id', ficId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (logData) {
        setReadingLog(logData);
        setStatus(logData.status || 'tbr');

        // Convert shelf UUIDs to strings
        setShelves(
          Array.isArray(logData.shelves)
            ? logData.shelves.map((s) => s.toString())
            : []
        );

        // If the log was “currently_reading,” restore the date_started + current_chapter
        setDateStarted(logData.date_started || '');
        setCurrentChapter(logData.current_chapter || '');

        // If the log was “read,” we don't populate dateStarted/dateFinished here,
        // because date_started/date_finished are nulled once a read is complete.
        setDateFinished(logData.date_finished || '');

        // Restore notes if status was “read”
        setNotes(logData.notes || '');

        // Count how many ranges exist in read_ranges (an array of daterange). 
        // logData.read_ranges might be undefined or null on first save.
        const ranges = logData.read_ranges || [];
        setRereadCount(Array.isArray(ranges) ? ranges.length : 0);
      }
    }

    if (ficId && user?.id) {
      fetchData();
    }
  }, [ficId, user]);

  const handleShelfChange = (e) => {
    const shelfId = e.target.value;
    if (e.target.checked) {
      setShelves((prev) => [...prev, shelfId]);
    } else {
      setShelves((prev) => prev.filter((id) => id !== shelfId));
    }
  };

  const generatePostText = () => {
    if (!fic?.id) return '';
    if (status === 'tbr') return 'wants to read [fic]';
    if (status === 'currently_reading') return 'is currently reading [fic]';
    if (status === 'read') return 'read [fic]';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archiveShelfId) {
      alert("Couldn't find Archive shelf.");
      return;
    }

    // 1) Always ensure that “read” items also get the Archive shelf
    const updatedShelves =
      status === 'read'
        ? Array.from(new Set([...shelves, archiveShelfId.toString()]))
        : shelves;

    // 2) We will build or append to the `read_ranges` array (Postgres daterange[])
    let existingRanges = readingLog?.read_ranges || []; // e.g. ["[2025-03-01,2025-03-21]", …]
    // In Supabase JS, we'll pass read_ranges: existingRanges

    // 3) Compute date_started and date_finished for the “current read”
    let finalDateStarted = dateStarted || null;
    let finalDateFinished = dateFinished || null;

    if (status === 'read') {
      // Validate that both start & finish are provided
      if (!dateStarted || !dateFinished) {
        alert("Please supply both a Start and a Finish date before marking as Read.");
        return;
      }
      // Ensure start ≤ finish
      if (new Date(dateStarted) > new Date(dateFinished)) {
        alert("Date Started cannot be after Date Finished.");
        return;
      }

      // Build a PG daterange literal: inclusive-inclusive "[start,finish]"
      const newRangeLiteral = `[${dateStarted},${dateFinished}]`;

      existingRanges = [...existingRanges, newRangeLiteral];

      // Once “read” is done, we no longer store date_started/date_finished in those columns
      finalDateStarted = null;
      finalDateFinished = null;
    }

    // 4) Build payload
    const logPayload = {
      user_id: user.id,
      fic_id: ficId,
      status,
      shelves: updatedShelves,
      date_started: finalDateStarted,
      date_finished: finalDateFinished,
      current_chapter:
        status === 'currently_reading' ? currentChapter : null,
      notes: status === 'read' ? notes : null,
      read_ranges: existingRanges, // ← write to your new daterange[] column
    };

    // 5) Upsert (insert or update) the reading_logs row
    let response;
    if (readingLog) {
      response = await supabase
        .from('reading_logs')
        .update({ ...logPayload, updated_at: new Date().toISOString() })
        .eq('id', readingLog.id);
    } else {
      response = await supabase
        .from('reading_logs')
        .insert({ ...logPayload, created_at: new Date().toISOString() });
    }

    if (response.error) {
      console.error('Error saving log:', response.error);
      return;
    }

    // 6) Tidy up shelf_fic join‐table
    try {
      // Remove any existing shelf→fic link
      await supabase.from('shelf_fic').delete().eq('fic_id', ficId);

      // Re‐insert each updatedShelf at the next position
      const inserts = [];
      for (const shelfId of updatedShelves) {
        const { data: maxPosData, error: maxPosError } = await supabase
          .from('shelf_fic')
          .select('position')
          .eq('shelf_id', shelfId)
          .order('position', { ascending: false })
          .limit(1)
          .single();

        if (maxPosError && maxPosError.code !== 'PGRST116') {
          console.error('Error fetching max position:', maxPosError);
          continue;
        }
        const nextPosition = maxPosData ? maxPosData.position + 1 : 1;
        inserts.push({ shelf_id: shelfId, fic_id: ficId, position: nextPosition });
      }
      const { error } = await supabase.from('shelf_fic').insert(inserts);
      if (error) console.error('Error updating shelf_fic links:', error);

      // 7) Optionally create a “post” if shareUpdate is on
      if (shareUpdate) {
        const postText = generatePostText();
        const { error: postError } = await supabase.from('posts').insert({
          user_id: user.id,
          fic_id: ficId,
          shelf_id: null,
          text: postText,
          created_at: new Date().toISOString(),
        });
        if (postError) console.error('Error creating post:', postError);
      }

      alert('Reading log and shelf links saved!');
      navigate('/bookshelf');
    } catch (err) {
      console.error('Error syncing shelf_fic:', err);
    }
  };

  if (!fic || !archiveShelfId) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-[#d3b7a4] flex justify-center items-start py-10 px-4">
      <div className="max-w-2xl w-full bg-[#202d26] rounded-xl shadow-md p-8 text-[#d3b7a4] font-serif">
        <h1 className="text-3xl font-semibold mb-6">{fic.title}</h1>

        {/** Show how many times this was read (i.e. length of read_ranges) */}
        {rereadCount > 0 && (
          <p className="mb-6 text-[#886146]">
            You’ve read this {rereadCount} time{rereadCount > 1 && "s"}.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/** Status Select */}
          <label className="block">
            <span className="block font-semibold mb-2">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#dfdad6] text-[#202d26] rounded-full px-3 py-2 border-2 border-[#886146] focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
            >
              {READING_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          {/** Share Update Checkbox */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={shareUpdate}
              onChange={(e) => setShareUpdate(e.target.checked)}
              className="h-5 w-5 border-2 border-[#d3b7a4] rounded-sm checked:bg-[#886146] transition cursor-pointer"
            />
            <span>Share this update as a post</span>
          </label>

          {/** Shelves Multi‐Select */}
          <fieldset className="border-2 border-[#d3b7a4] rounded-md p-4">
            <legend className="text-lg font-semibold mb-2">Shelves</legend>
            <div className="grid grid-cols-2 gap-3">
              {allShelves
                .filter((shelf) => shelf.id !== archiveShelfId)
                .map((shelf) => (
                  <label
                    key={shelf.id}
                    className="flex items-center text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={shelf.id}
                      checked={shelves.includes(shelf.id)}
                      onChange={handleShelfChange}
                      className="h-5 w-5 border-2 border-[#d3b7a4] rounded-sm mr-2 checked:bg-[#886146] transition"
                    />
                    {shelf.title}
                  </label>
                ))}
            </div>
          </fieldset>

          {/** Currently Reading Inputs */}
          {status === "currently_reading" && (
            <>
              <label className="block">
                <span className="block font-semibold mb-2">Date Started</span>
                <input
                  type="date"
                  value={dateStarted}
                  onChange={(e) => setDateStarted(e.target.value)}
                  className="w-full bg-[#dfdad6] text-[#202d26] rounded-full px-3 py-2 border-2 border-[#886146] focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
                />
              </label>

              <label className="block">
                <span className="block font-semibold mb-2">Current Chapter</span>
                <input
                  type="text"
                  value={currentChapter}
                  onChange={(e) => setCurrentChapter(e.target.value)}
                  className="w-full bg-[#dfdad6] text-[#202d26] rounded-full px-3 py-2 border-2 border-[#886146] focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
                />
              </label>
            </>
          )}

          {/** Read Inputs (now ask for both Start & Finish) */}
          {status === "read" && (
            <>
              <label className="block">
                <span className="block font-semibold mb-2">Date Started</span>
                <input
                  type="date"
                  value={dateStarted}
                  onChange={(e) => setDateStarted(e.target.value)}
                  className="w-full bg-[#dfdad6] text-[#202d26] rounded-full px-3 py-2 border-2 border-[#886146] focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
                />
              </label>

              <label className="block mt-4">
                <span className="block font-semibold mb-2">Date Finished</span>
                <input
                  type="date"
                  value={dateFinished}
                  onChange={(e) => setDateFinished(e.target.value)}
                  className="w-full bg-[#dfdad6] text-[#202d26] rounded-full px-3 py-2 border-2 border-[#886146] focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
                />
              </label>

              <label className="block mt-4">
                <span className="block font-semibold mb-2">Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#dfdad6] text-[#202d26] rounded-lg px-3 py-2 border-2 border-[#886146] h-28 resize-none focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
                />
              </label>
            </>
          )}

          {/** Submit Button */}
          <button
            type="submit"
            className="px-6 py-2 rounded-md text-[#202d26] font-semibold bg-[#d3b7a4] hover:bg-[#6f4b34] mx-auto block"
          >
            LOG FIC
          </button>
        </form>
      </div>
    </div>
  );
}
