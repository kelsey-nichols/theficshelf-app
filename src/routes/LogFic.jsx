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
      const { data: ficData } = await supabase
        .from('fics')
        .select('*')
        .eq('id', ficId)
        .single();
      setFic(ficData);

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
      const archiveShelf = shelvesData.find((s) => s.title.toLowerCase() === 'archive');
      if (!archiveShelf) {
        console.error('Archive shelf not found!');
        return;
      }
      setArchiveShelfId(archiveShelf.id);

      const { data: logData } = await supabase
        .from('reading_logs')
        .select('*')
        .eq('fic_id', ficId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (logData) {
        setReadingLog(logData);
        setStatus(logData.status || 'tbr');
        setShelves(Array.isArray(logData.shelves) ? logData.shelves.map((s) => s.toString()) : []);
        setDateStarted(logData.date_started || '');
        setDateFinished(logData.date_finished || '');
        setCurrentChapter(logData.current_chapter || '');
        setNotes(logData.notes || '');
        setRereadCount(logData.reread_dates?.length || 0);
      }
    }

    if (ficId && user?.id) fetchData();
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

    const updatedShelves = status === 'read'
      ? Array.from(new Set([...shelves, archiveShelfId.toString()]))
      : shelves;

    let reread_dates = readingLog?.reread_dates || [];
    let finalDateStarted = dateStarted || null;
    let finalDateFinished = dateFinished || null;

    if (status === 'read') {
      if (dateFinished) reread_dates.push(dateFinished);
      finalDateStarted = null;
      finalDateFinished = null;
    }

    const logPayload = {
      user_id: user.id,
      fic_id: ficId,
      status,
      shelves: updatedShelves,
      date_started: finalDateStarted,
      date_finished: finalDateFinished,
      current_chapter: status === 'currently_reading' ? currentChapter : null,
      notes: status === 'read' ? notes : null,
      reread_dates,
    };

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

    try {
      await supabase.from('shelf_fic').delete().eq('fic_id', ficId);
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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{fic.title}</h1>
      {rereadCount > 0 && (
        <p className="text-gray-600 mb-2">
          You’ve read this {rereadCount} time{rereadCount > 1 && 's'}.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="block mt-1 border">
            {READING_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <input
            type="checkbox"
            checked={shareUpdate}
            onChange={(e) => setShareUpdate(e.target.checked)}
          />{' '}
          Share this update as a post
        </label>

        <fieldset>
          <legend className="font-medium">Shelves</legend>
          {allShelves.filter((shelf) => shelf.id !== archiveShelfId).map((shelf) => (
            <label key={shelf.id} className="block">
              <input
                type="checkbox"
                value={shelf.id}
                checked={shelves.includes(shelf.id)}
                onChange={handleShelfChange}
              />{' '}
              {shelf.title}
            </label>
          ))}
        </fieldset>

        {status === 'currently_reading' && (
          <>
            <label className="block">
              <span>Date Started</span>
              <input
                type="date"
                value={dateStarted}
                onChange={(e) => setDateStarted(e.target.value)}
                className="block mt-1 border"
              />
            </label>

            <label className="block">
              <span>Current Chapter</span>
              <input
                type="text"
                value={currentChapter}
                onChange={(e) => setCurrentChapter(e.target.value)}
                className="block mt-1 border"
              />
            </label>
          </>
        )}

        {status === 'read' && (
          <>
            <label className="block">
              <span>Date Finished</span>
              <input
                type="date"
                value={dateFinished}
                onChange={(e) => setDateFinished(e.target.value)}
                className="block mt-1 border"
              />
            </label>

            <label className="block">
              <span>Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block mt-1 border w-full"
              ></textarea>
            </label>
          </>
        )}

        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Save Log
        </button>
      </form>
    </div>
  );
}