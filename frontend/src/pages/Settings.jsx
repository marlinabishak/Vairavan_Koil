import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Settings() {
  const [options, setOptions] = useState([]);
  const [kattalaiTypes, setKattalaiTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [langTab, setLangTab] = useState('en'); // 'en' or 'ta'
  const [activeTab, setActiveTab] = useState('title');
  const [newValue, setNewValue] = useState('');

  const loadOptions = async () => {
    try {
      const [data, kTypes] = await Promise.all([
        api.getDropdownOptions(),
        api.getKattalaiTypes()
      ]);
      setOptions(data);
      setKattalaiTypes(kTypes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  // When language tab changes, adjust active sub-tab
  const handleLangChange = (lang) => {
    setLangTab(lang);
    if (lang === 'en') {
      setActiveTab('title');
    } else {
      setActiveTab('title_ta');
    }
    setNewValue('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    
    try {
      await api.addDropdownOption({ category: activeTab, value: newValue.trim() });
      setNewValue('');
      loadOptions(); // Refresh the list
    } catch (err) {
      console.error(err);
      alert('Failed to add option');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this option?')) return;
    
    try {
      await api.deleteDropdownOption(id);
      loadOptions(); // Refresh the list
    } catch (err) {
      console.error(err);
      alert('Failed to delete option');
    }
  };

  const filteredOptions = options.filter(o => o.category === activeTab);

  const handleUpdateMaxSlots = async (id, currentVal, newVal) => {
    const parsed = parseInt(newVal, 10);
    if (isNaN(parsed) || parsed < 1) return;
    if (parsed === currentVal) return;
    
    try {
      await api.updateKattalaiType(id, parsed);
      loadOptions(); // Refresh
      alert('Slot capacity updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update slot capacity');
    }
  };

  const englishTabs = [
    { id: 'title', label: 'Titles' },
    { id: 'star', label: 'Stars' },
    { id: 'place', label: 'Places' },
    { id: 'kat_type', label: 'Sponsorship Types' }
  ];

  const tamilTabs = [
    { id: 'title_ta', label: 'தலைப்புகள் (Titles)' },
    { id: 'star_ta', label: 'நட்சத்திரங்கள் (Stars)' },
    { id: 'place_ta', label: 'ஊர்கள் (Places)' }
  ];

  const currentTabs = langTab === 'en' ? englishTabs : tamilTabs;

  return (
    <div className="min-h-screen bg-[#faf8f7] p-4 sm:p-6 md:p-8 font-barlow relative z-10">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#5c292c]">System Settings</h1>
          <Link
            to="/dashboard"
            className="text-[#5c292c] hover:underline font-semibold text-xs flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-[#ebdccb] shadow-sm self-start sm:self-auto"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Staff Profiles & Roles Callout */}
        <div className="bg-[#f7f1e5] border border-[#ebdccb] rounded-[20px] p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5c292c] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[#5c292c] text-sm">Staff Profiles & Roles</h3>
              <p className="text-xs text-gray-600">Manage staff login accounts and operational role assignments.</p>
            </div>
          </div>
          <Link
            to="/profiles"
            className="bg-[#5c292c] hover:bg-[#482022] text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm shrink-0 whitespace-nowrap self-start sm:self-auto"
          >
            Manage Profiles →
          </Link>
        </div>

        {/* Manage Dropdown Options Section */}
        <div className="bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-[#ebdccb]/60 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#5c292c]">Manage Dropdown Options</h2>
              <p className="text-xs text-gray-500 mt-0.5">Customize English and Tamil dropdown choices across the registration forms.</p>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-[#f7f1e5] p-1 rounded-full border border-[#ebdccb] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleLangChange('en')}
                className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all ${
                  langTab === 'en'
                    ? 'bg-[#5c292c] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                English Options
              </button>
              <button
                type="button"
                onClick={() => handleLangChange('ta')}
                className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all ${
                  langTab === 'ta'
                    ? 'bg-[#5c292c] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                தமிழ் Options
              </button>
            </div>
          </div>
          
          {/* Sub-Category Tabs */}
          <div className="flex gap-2 border-b border-gray-100 mb-5 overflow-x-auto pb-1">
            {currentTabs.map(tab => {
              const count = options.filter(o => o.category === tab.id).length;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2 px-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive 
                      ? 'border-b-2 border-[#5c292c] text-[#5c292c]' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-[#5c292c] text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Add Option Form */}
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2.5 mb-5">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={langTab === 'en' ? `Add new ${activeTab}...` : `புதிய விருப்பத்தை சேர்க்கவும்...`}
              className="flex-1 h-[38px] px-4 rounded-full border border-[#e2d8cb] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all text-xs sm:text-sm bg-[#faf8f7] placeholder-[#9c9186]"
              required
            />
            <button
              type="submit"
              className="h-[38px] px-6 rounded-full bg-[#5c292c] hover:bg-[#482022] text-white font-semibold text-xs sm:text-sm transition-all shadow-sm shrink-0"
            >
              + Add Option
            </button>
          </form>

          {/* Options List */}
          {loading ? (
            <div className="text-center text-gray-500 py-6 text-sm">Loading options...</div>
          ) : (
            <div className="bg-[#faf8f7] rounded-[18px] p-3 sm:p-4 max-h-[380px] overflow-y-auto border border-[#ebdccb]">
              {filteredOptions.length === 0 ? (
                <div className="text-center text-gray-500 py-6 text-sm">No options found. Add one above.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredOptions.map(opt => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-gray-100 shadow-2xs hover:border-[#ebdccb] transition-all"
                    >
                      <span className="text-xs sm:text-sm text-gray-800 font-medium truncate pr-2" title={opt.value}>
                        {opt.value}
                      </span>
                      <button
                        onClick={() => handleDelete(opt.id)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors shrink-0"
                        title="Delete option"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kattalai Slot Capacities Section */}
        <div className="bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-5 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-[#5c292c] mb-1">Manage Kattalai Slot Capacities</h2>
          <p className="text-gray-500 text-xs mb-5">Set maximum daily slots for each Kattalai type. Historical bookings beyond this number remain visible.</p>
          
          {loading ? (
            <div className="text-center text-gray-500 py-6 text-sm">Loading capacities...</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {kattalaiTypes.map(kType => (
                <div
                  key={kType.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#faf8f7] rounded-[16px] border border-[#ebdccb] gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0" 
                      style={{ backgroundColor: kType.color_key === 'morning' ? '#e65100' : '#b71c1c' }}
                    />
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{kType.name}</p>
                      {kType.name_ta && <p className="text-xs text-gray-500">{kType.name_ta}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs text-gray-600 font-medium">Daily Slots:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      defaultValue={kType.max_slots || 10}
                      onBlur={(e) => handleUpdateMaxSlots(kType.id, kType.max_slots || 10, e.target.value)}
                      className="w-16 h-[34px] px-2 text-center rounded-lg border border-[#e2d8cb] bg-white text-sm font-bold text-[#5c292c] focus:outline-none focus:border-[#5c292c]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
