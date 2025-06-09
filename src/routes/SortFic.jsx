import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';

export default function SortFic() {
  const { user } = UserAuth();
  const { ficId } = useParams();
  const navigate = useNavigate();

  const [allShelves, setAllShelves] = useState([]);
  const [selectedShelves, setSelectedShelves] = useState([]);
  const [archiveShelfId, setArchiveShelfId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user shelves and current shelf_fic links
  useEffect(() => {
    async function fetchShelves() {
      // 1) Fetch user's shelves
      const { data: shelvesData = [], error: shelvesError } = await supabase
        .from('shelves')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      if (shelvesError) {
        console.error('Error fetching shelves:', shelvesError);
        setLoading(false);
        return;
      }

      // Identify archive shelf
      const archiveShelf = shelvesData.find(s => s.title.toLowerCase() === 'archive');
      const archiveId = archiveShelf?.id.toString() || null;
      setArchiveShelfId(archiveId);

      setAllShelves(shelvesData || []);

      // 2) Fetch current shelf links for this fic
      const { data: linksData = [], error: linksError } = await supabase
        .from('shelf_fic')
        .select('shelf_id')
        .eq('fic_id', ficId);
      if (linksError) {
        console.error('Error fetching shelf links:', linksError);
        setLoading(false);
        return;
      }
      const linkedIds = linksData.map(link => link.shelf_id.toString());
      setSelectedShelves(linkedIds);
      setLoading(false);
    }

    if (user?.id && ficId) fetchShelves();
  }, [user, ficId]);

  const handleShelfToggle = (e) => {
    const id = e.target.value;
    if (e.target.checked) {
      setSelectedShelves(prev => [...prev, id]);
    } else {
      setSelectedShelves(prev => prev.filter(s => s !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Delete existing links
      const { error: delError } = await supabase
        .from('shelf_fic')
        .delete()
        .eq('fic_id', ficId);
      if (delError) console.error('Error deleting old shelf links:', delError);

      // Insert new links with positions
      const inserts = [];
      for (const shelfId of selectedShelves) {
        // Determine next position
        const { data: maxData, error: maxError } = await supabase
          .from('shelf_fic')
          .select('position')
          .eq('shelf_id', shelfId)
          .order('position', { ascending: false })
          .limit(1)
          .single();
        const nextPos = maxData ? maxData.position + 1 : 1;
        inserts.push({ shelf_id: shelfId, fic_id: ficId, position: nextPos });
      }
      if (inserts.length) {
        const { error: insError } = await supabase
          .from('shelf_fic')
          .insert(inserts);
        if (insError) console.error('Error inserting shelf links:', insError);
      }
      alert('Shelves updated!');
      navigate('/bookshelf');
    } catch (err) {
      console.error('Error saving shelves:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-[#d3b7a4] flex justify-center items-start py-10 px-4">
      <div className="max-w-2xl w-full bg-[#202d26] rounded-xl shadow-md p-8 text-[#d3b7a4] font-serif">
        <h1 className="text-3xl font-semibold mb-6">Sort Fic into Shelves</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="border-2 border-[#d3b7a4] rounded-md p-4">
            <legend className="text-lg font-semibold mb-2">Shelves</legend>
            <div className="grid grid-cols-2 gap-3">
              {allShelves
                .filter(shelf => shelf.id.toString() !== archiveShelfId)
                .map((shelf) => (
                  <label
                    key={shelf.id}
                    className="flex items-center text-sm cursor-pointer space-x-2"
                  >
                    <input
                      type="checkbox"
                      value={shelf.id}
                      checked={selectedShelves.includes(shelf.id.toString())}
                      onChange={handleShelfToggle}
                      className="h-5 w-5 appearance-none rounded-sm bg-[#d3b7a4] border-2 border-[#d3b7a4] checked:bg-[#886146] checked:border-[#886146] transition cursor-pointer flex-shrink-0"
                    />
                    <span>{shelf.title}</span>
                  </label>
                ))}
            </div>
          </fieldset>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-md text-[#202d26] font-semibold bg-[#d3b7a4] hover:bg-[#6f4b34] mx-auto block disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'UPDATE SHELVES'}
          </button>
        </form>
      </div>
    </div>
  );
}
