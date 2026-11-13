import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import SubpageLayout from '../components/SubpageLayout';

export default function Settings() {
  const [options, setOptions] = useState([]);
  const [kattalaiTypes, setKattalaiTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [langTab, setLangTab] = useState('en'); // 'en' or 'ta'
  const [activeTab, setActiveTab] = useState('title');
  const [newValue, setNewValue] = useState('');
  const [baseAmountInput, setBaseAmountInput] = useState('3500');
  const [archanaiAmountInput, setArchanaiAmountInput] = useState('200');
  const [transferExtraFeeInput, setTransferExtraFeeInput] = useState('200');
  const [thurithaAmountInput, setThurithaAmountInput] = useState('200');
  const [feeSavedMsg, setFeeSavedMsg] = useState('');
  const [savingFee, setSavingFee] = useState(false);

  // WhatsApp Automation State
  const [waAutomationEnabled, setWaAutomationEnabled] = useState(false);
  const [waDispatchTime, setWaDispatchTime] = useState('06:00');
  const [waTamilLeadDays, setWaTamilLeadDays] = useState('5');
  const [waEnglishLeadDays, setWaEnglishLeadDays] = useState('2');
  const [savingWaAutomation, setSavingWaAutomation] = useState(false);
  const [waAutomationSavedMsg, setWaAutomationSavedMsg] = useState('');
  const [triggeringAutomation, setTriggeringAutomation] = useState(false);

  // 12-Hour AM/PM Time conversion helpers
  const parseTime12 = (time24) => {
    if (!time24 || !time24.includes(':')) return { hour: '06', minute: '00', period: 'AM' };
    const parts = time24.split(':');
    let h = parseInt(parts[0], 10);
    if (isNaN(h)) h = 6;
    let m = parseInt(parts[1], 10);
    if (isNaN(m)) m = 0;
    let p = 'AM';
    if (h >= 12) {
      p = 'PM';
      if (h > 12) h -= 12;
    } else if (h === 0) {
      h = 12;
    }
    return { hour: String(h).padStart(2, '0'), minute: String(m).padStart(2, '0'), period: p };
  };

  const formatTime24 = (h12, min, p) => {
    let h = parseInt(h12, 10);
    if (isNaN(h)) h = 6;
    if (p === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }
    let m = parseInt(min, 10);
    if (isNaN(m) || m < 0) m = 0;
    if (m > 59) m = 59;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const currentTime12 = parseTime12(waDispatchTime);

  const loadOptions = async () => {
    try {
      const [data, kTypes, sysSettings] = await Promise.all([
        api.getDropdownOptions(),
        api.getKattalaiTypes(),
        api.getSettings().catch(() => ({ kattalai_base_amount: '3500', archanai_fee: '200', transfer_extra_fee: '200', thuritha_kattalai_amount: '200' }))
      ]);
      setOptions(data);
      setKattalaiTypes(kTypes);
      if (sysSettings) {
        const base = sysSettings.kattalai_base_amount || sysSettings.transfer_base_amount || '3500';
        setBaseAmountInput(base);
        if (sysSettings.archanai_fee) setArchanaiAmountInput(sysSettings.archanai_fee);
        if (sysSettings.transfer_extra_fee) setTransferExtraFeeInput(sysSettings.transfer_extra_fee);
        if (sysSettings.thuritha_kattalai_amount || sysSettings.thani_archanai_amount) {
          setThurithaAmountInput(sysSettings.thuritha_kattalai_amount || sysSettings.thani_archanai_amount);
        }
        setWaAutomationEnabled(sysSettings.whatsapp_automation_enabled === 'true');
        if (sysSettings.whatsapp_dispatch_time) setWaDispatchTime(sysSettings.whatsapp_dispatch_time);
        if (sysSettings.whatsapp_tamil_lead_days) setWaTamilLeadDays(String(sysSettings.whatsapp_tamil_lead_days));
        if (sysSettings.whatsapp_english_lead_days) setWaEnglishLeadDays(String(sysSettings.whatsapp_english_lead_days));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFeeSettings = async (e) => {
    e.preventDefault();
    const parsedBase = parseFloat(baseAmountInput);
    const parsedArch = parseFloat(archanaiAmountInput);
    const parsedTransferExtra = parseFloat(transferExtraFeeInput);
    const parsedThuritha = parseFloat(thurithaAmountInput);
    if (isNaN(parsedBase) || parsedBase < 0 || isNaN(parsedArch) || parsedArch < 0 || isNaN(parsedTransferExtra) || parsedTransferExtra < 0 || isNaN(parsedThuritha) || parsedThuritha < 0) {
      alert('Please enter valid positive amounts');
      return;
    }
    setSavingFee(true);
    try {
      await Promise.all([
        api.updateSetting('kattalai_base_amount', parsedBase),
        api.updateSetting('transfer_base_amount', parsedBase),
        api.updateSetting('archanai_fee', parsedArch),
        api.updateSetting('transfer_extra_fee', parsedTransferExtra),
        api.updateSetting('thuritha_kattalai_amount', parsedThuritha)
      ]);
      setFeeSavedMsg('Fee settings updated successfully!');
      setTimeout(() => setFeeSavedMsg(''), 3500);
    } catch (err) {
      console.error(err);
      alert('Failed to update fee settings: ' + err.message);
    } finally {
      setSavingFee(false);
    }
  };

  const handleSaveWaAutomation = async (e) => {
    if (e) e.preventDefault();
    const tamilNum = parseInt(waTamilLeadDays, 10);
    const englishNum = parseInt(waEnglishLeadDays, 10);
    if (isNaN(tamilNum) || tamilNum < 1 || isNaN(englishNum) || englishNum < 1) {
      alert('Lead days must be a positive number (minimum 1 day)');
      return;
    }

    setSavingWaAutomation(true);
    try {
      await Promise.all([
        api.updateSetting('whatsapp_automation_enabled', waAutomationEnabled ? 'true' : 'false'),
        api.updateSetting('whatsapp_dispatch_time', waDispatchTime || '06:00'),
        api.updateSetting('whatsapp_tamil_lead_days', tamilNum),
        api.updateSetting('whatsapp_english_lead_days', englishNum)
      ]);
      setWaAutomationSavedMsg('Automation settings saved successfully!');
      setTimeout(() => setWaAutomationSavedMsg(''), 3500);
    } catch (err) {
      console.error(err);
      alert('Failed to save automation settings: ' + err.message);
    } finally {
      setSavingWaAutomation(false);
    }
  };

  const handleTriggerAutomationCheck = async () => {
    if (!window.confirm('Run the automated dispatch check now based on current date and lead times?')) return;
    setTriggeringAutomation(true);
    try {
      const res = await api.whatsappTriggerAutomation();
      if (res.status === 'disabled') {
        alert('Automation is disabled in settings. Enable it first and save to run dispatches.');
      } else {
        const t = res.results?.tamil;
        const e = res.results?.english;
        alert(`Automation check finished!\n• Tamil (${t?.leadDays}d ahead, ${t?.targetDate}): ${t?.sent} sent, ${t?.failed} failed (${t?.total} eligible)\n• English (${e?.leadDays}d ahead, ${e?.targetDate}): ${e?.sent} sent, ${e?.failed} failed (${e?.total} eligible)`);
      }
    } catch (err) {
      alert('Automation check error: ' + err.message);
    } finally {
      setTriggeringAutomation(false);
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
    <SubpageLayout activePage="settings">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs bg-[#5c292c]/10 text-[#5c292c] font-bold px-2.5 py-0.5 rounded-full capitalize">
                Administration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#5c292c] tracking-tight">System Settings</h1>
          </div>
        </div>

        {/* Staff Profiles & Roles Callout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#f7f1e5] border border-[#ebdccb] rounded-[20px] p-4 flex flex-col justify-between gap-3 shadow-sm">
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
              className="bg-[#5c292c] hover:bg-[#482022] text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm shrink-0 whitespace-nowrap self-start"
            >
              Manage Profiles →
            </Link>
          </div>

          <div className="bg-[#f7f1e5] border border-[#ebdccb] rounded-[20px] p-4 flex flex-col justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5c292c] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[#5c292c] text-sm">Bug & Issue Reports</h3>
                <p className="text-xs text-gray-600">View and update bugs and feedback submitted across all roles.</p>
              </div>
            </div>
            <Link
              to="/bug-reports"
              className="bg-[#5c292c] hover:bg-[#482022] text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm shrink-0 whitespace-nowrap self-start"
            >
              View Bug Reports →
            </Link>
          </div>
        </div>

        {/* Unified Nithiya Kattalai Fee & Endowment Settings Section */}
        <div className="bg-white rounded-[24px] shadow-sm border border-[#ebdccb] p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#ebdccb]/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold bg-[#5c292c]/10 text-[#5c292c] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Financial Administration
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#5c292c]">Nithiya Kattalai Fee & Endowment Configuration</h2>
            </div>
            {feeSavedMsg && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full animate-fade-in shrink-0">
                ✓ {feeSavedMsg}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveFeeSettings} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* CARD 1: New Registration & Account Transfer Fee Settings */}
              <div className="bg-[#faf8f7] p-4 sm:p-5 rounded-[20px] border border-[#ebdccb] shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#5c292c] text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#5c292c]"></span>
                      Registration & Transfer Fees
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#5c292c] mb-1">Base Endowment (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={baseAmountInput}
                          onChange={(e) => setBaseAmountInput(e.target.value)}
                          placeholder="3500"
                          className="w-full h-[38px] pl-7 pr-3 rounded-xl border border-[#e2d8cb] bg-white text-xs font-bold text-[#5c292c] focus:outline-none focus:border-[#5c292c]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#5c292c] mb-1">Archanai Fee (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={archanaiAmountInput}
                          onChange={(e) => setArchanaiAmountInput(e.target.value)}
                          placeholder="200"
                          className="w-full h-[38px] pl-7 pr-3 rounded-xl border border-[#e2d8cb] bg-white text-xs font-bold text-[#5c292c] focus:outline-none focus:border-[#5c292c]"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: Account Transfer Extra Fee */}
              <div className="bg-[#faf8f7] p-4 sm:p-5 rounded-[20px] border border-[#ebdccb] shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#5c292c] text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                      Account Transfer Fee
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5c292c] mb-1">
                      Transfer Extra / Archanai Fee (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={transferExtraFeeInput}
                        onChange={(e) => setTransferExtraFeeInput(e.target.value)}
                        placeholder="200"
                        className="w-full h-[38px] pl-7 pr-3 rounded-xl border border-[#e2d8cb] bg-white text-xs font-bold text-[#5c292c] focus:outline-none focus:border-[#5c292c]"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: Thuritha Kattalai (Walk-in Daily Archanai Fee) */}
              <div className="bg-[#faf8f7] p-4 sm:p-5 rounded-[20px] border border-[#ebdccb] shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#5c292c] text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fbb12f]"></span>
                      Thuritha Kattalai Fee
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5c292c] mb-1">
                      Thuritha Archanai Fee (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={thurithaAmountInput}
                        onChange={(e) => setThurithaAmountInput(e.target.value)}
                        placeholder="200"
                        className="w-full h-[38px] pl-7 pr-3 rounded-xl border border-[#e2d8cb] bg-white text-xs font-bold text-[#5c292c] focus:outline-none focus:border-[#fbb12f]"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-end pt-1">
              <button
                type="submit"
                disabled={savingFee}
                className="h-[40px] px-8 rounded-full bg-[#5c292c] hover:bg-[#482022] text-white font-bold text-xs sm:text-sm transition-all shadow-sm shrink-0 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {savingFee ? 'Saving System Fees...' : 'Save System Fees'}
              </button>
            </div>
          </form>
        </div>

        {/* WhatsApp Kattalai Reminder Automation Configuration */}
        <div className="bg-white rounded-[24px] shadow-sm border border-[#ebdccb] p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#ebdccb]/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold bg-[#5c292c]/10 text-[#5c292c] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Communication Administration
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#5c292c]">WhatsApp Kattalai Reminder Automation</h2>
            </div>

            {waAutomationSavedMsg && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full animate-fade-in shrink-0">
                ✓ {waAutomationSavedMsg}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveWaAutomation} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">

              {/* Card 1: Master Automation Toggle */}
              <div className="bg-[#faf8f7] p-3.5 sm:p-4 rounded-[20px] border border-[#ebdccb] shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#5c292c] text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#5c292c]"></span>
                      Automation Status
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5c292c] mb-1">
                      Auto Dispatch Status
                    </label>
                    <div className="flex items-center justify-between h-[38px] px-3.5 bg-white rounded-xl border border-[#e2d8cb]">
                      <span className={`text-xs font-bold ${waAutomationEnabled ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {waAutomationEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={waAutomationEnabled}
                          onChange={(e) => setWaAutomationEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5c292c]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Dispatch Timing */}
              <div className="bg-[#faf8f7] p-3.5 sm:p-4 rounded-[20px] border border-[#ebdccb] shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#5c292c] text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                      Dispatch Time (IST)
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5c292c] mb-1">
                      Daily Trigger Time
                    </label>
                    <div className="w-full h-[38px] px-1.5 bg-white rounded-xl border border-[#e2d8cb] flex items-center gap-1 overflow-hidden">
                      {/* Hour Dropdown */}
                      <select
                        value={currentTime12.hour}
                        onChange={(e) => {
                          setWaDispatchTime(formatTime24(e.target.value, currentTime12.minute, currentTime12.period));
                        }}
                        className="flex-1 min-w-0 h-[28px] px-0.5 text-center bg-[#faf8f7] rounded-lg border border-[#e2d8cb] text-xs font-bold text-[#5c292c] focus:outline-none focus:border-[#5c292c] cursor-pointer hover:bg-[#f5efe6] transition-colors"
                        title="Select Hour (1-12)"
                      >
                        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>

                      <span className="text-[#5c292c] font-black text-xs shrink-0">:</span>

                      {/* Minute Dropdown */}
                      <select
                        value={currentTime12.minute}
                        onChange={(e) => {
                          setWaDispatchTime(formatTime24(currentTime12.hour, e.target.value, currentTime12.period));
                        }}
                        className="flex-1 min-w-0 h-[28px] px-0.5 text-center bg-[#faf8f7] rounded-lg border border-[#e2d8cb] text-xs font-bold text-[#5c292c] focus:outline-none focus:border-[#5c292c] cursor-pointer hover:bg-[#f5efe6] transition-colors"
                        title="Select Minute (00-59)"
                      >
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>

                      {/* AM / PM Dropdown */}
                      <select
                        value={currentTime12.period}
                        onChange={(e) => {
                          setWaDispatchTime(formatTime24(currentTime12.hour, currentTime12.minute, e.target.value));
                        }}
                        className="flex-1 min-w-0 h-[28px] px-0.5 text-center bg-[#faf8f7] rounded-lg border border-[#e2d8cb] text-xs font-bold text-[#5c292c] focus:outline-none focus:border-[#5c292c] cursor-pointer hover:bg-[#f5efe6] transition-colors"
                        title="Select AM or PM"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Tamil Reminder Schedule */}
              <div className="bg-[#faf8f7] p-3.5 sm:p-4 rounded-[20px] border border-[#ebdccb] shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#2e7d32] text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2e7d32]"></span>
                      Tamil Schedule
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5c292c] mb-1">
                      Days Ahead of Pooja
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={waTamilLeadDays}
                      onChange={(e) => setWaTamilLeadDays(e.target.value)}
                      placeholder="5"
                      className="w-full h-[38px] px-3.5 rounded-xl border border-[#e2d8cb] bg-white text-xs font-bold text-[#5c292c] focus:outline-none focus:border-[#2e7d32]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: English Reminder Schedule */}
              <div className="bg-[#faf8f7] p-3.5 sm:p-4 rounded-[20px] border border-[#ebdccb] shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#1976d2] text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1976d2]"></span>
                      English Schedule
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5c292c] mb-1">
                      Days Ahead of Pooja
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={waEnglishLeadDays}
                      onChange={(e) => setWaEnglishLeadDays(e.target.value)}
                      placeholder="2"
                      className="w-full h-[38px] px-3.5 rounded-xl border border-[#e2d8cb] bg-white text-xs font-bold text-[#5c292c] focus:outline-none focus:border-[#1976d2]"
                      required
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-end pt-1">
              <button
                type="submit"
                disabled={savingWaAutomation}
                className="h-[40px] px-8 rounded-full bg-[#5c292c] hover:bg-[#482022] text-white font-bold text-xs sm:text-sm transition-all shadow-sm shrink-0 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {savingWaAutomation ? 'Saving Automation Settings...' : 'Save Automation Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Manage Dropdown Options Section */}
        <div className="bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-[#ebdccb]/60 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#5c292c]">Manage Dropdown Options</h2>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-[#f7f1e5] p-1 rounded-full border border-[#ebdccb] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleLangChange('en')}
                className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all ${langTab === 'en'
                  ? 'bg-[#5c292c] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                English Options
              </button>
              <button
                type="button"
                onClick={() => handleLangChange('ta')}
                className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all ${langTab === 'ta'
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
                  className={`pb-2 px-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${isActive
                    ? 'border-b-2 border-[#5c292c] text-[#5c292c]'
                    : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-[#5c292c] text-white' : 'bg-gray-100 text-gray-600'
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
              placeholder={langTab === 'en' ? `Add new ${activeTab}...` : 'புதிய விருப்பத்தை சேர்க்கவும்...'}
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
          <h2 className="text-lg sm:text-xl font-bold text-[#5c292c] mb-4">Manage Kattalai Slot Capacities</h2>

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
    </SubpageLayout>
  );
}

