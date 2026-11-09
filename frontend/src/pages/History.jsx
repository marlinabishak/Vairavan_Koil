import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Color helper for badges
function getBadgeClasses(color = 'gray') {
  switch (color) {
    case 'emerald':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'amber':
      return 'bg-amber-50 text-amber-900 border-amber-300';
    case 'purple':
      return 'bg-purple-50 text-purple-900 border-purple-300';
    case 'blue':
      return 'bg-blue-50 text-blue-800 border-blue-300';
    case 'rose':
    case 'red':
      return 'bg-rose-50 text-rose-800 border-rose-300';
    case 'green':
      return 'bg-green-50 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

/**
 * Universal dynamic parser for all history log types:
 * Generates:
 * - tableBadge: { text, color }
 * - tableSummary: compact, clever, human-readable 1-line JSX
 * - modal: rich breakdown cards for inspection modal
 */
function analyzeHistoryLog(log) {
  if (!log) return null;
  const action = (log.action || '').trim();
  const details = (log.details || '').trim();
  const userName = log.user_name || (log.user_role ? log.user_role.toUpperCase() : 'System');
  const userRole = (log.user_role || 'staff').toLowerCase();
  const userLogin = log.user_username ? `@${log.user_username}` : log.user_email || '';
  const devoteeName = log.booking_name || '';
  const devoteeCode = log.booking_code || '';

  // 1. PRINT LOGS
  if (action === 'Printed Labels' || action.toLowerCase().includes('print')) {
    const printMatch = details.match(/^(\d+(?:st|nd|rd|th))\s+time\s+printed\s+by\s+([^[]+)\[([^\]]+)\]/i);
    const dateMatch = details.match(/for Date:\s*([^.(]+?)(?:\s*\(|\s*\.|$)/i);
    const countMatch = details.match(/\((\d+)\s+Prasatham letters\)/i) || details.match(/printed\s+(\d+)\s+Prasatham letters/i);
    const devoteesMatch = details.match(/Devotees:\s*([^.]+)\./i);

    let priorTrail = null;
    let priorSummary = null;
    const firstTimeMatch = details.match(/1st time printed by\s+([^.]+)\./i);
    const prevTimesMatch = details.match(/Previously printed\s+([^.]+)\./i);
    if (firstTimeMatch) {
      priorTrail = `1st print was by ${firstTimeMatch[1]}`;
      priorSummary = `1st was by ${firstTimeMatch[1].replace(/\s*\[.*\]/, '')}`;
    } else if (prevTimesMatch) {
      priorTrail = `Previously printed ${prevTimesMatch[1]}`;
      const timesNum = prevTimesMatch[1].match(/^(\d+)\s+times/i)?.[1];
      const firstBy = prevTimesMatch[1].match(/1st:\s*([^,\]]+)/i)?.[1];
      priorSummary = timesNum ? `${timesNum} prints (1st: ${firstBy || 'Admin'})` : prevTimesMatch[1];
    }

    const ordinal = printMatch ? printMatch[1] : (details.match(/(\d+(?:st|nd|rd|th))/i)?.[1] || '1st');
    const isReprint = ordinal !== '1st';
    const targetDate = dateMatch ? dateMatch[1].trim() : (devoteeName || 'Kattalai Date');
    const count = countMatch ? countMatch[1] : (details.match(/(\d+)\s+Prasatham/i)?.[1] || '2');
    const devotees = devoteesMatch ? devoteesMatch[1].trim() : '';

    return {
      category: 'printing',
      tableBadge: {
        text: isReprint ? `${ordinal} Print (Reprint)` : '1st Print',
        color: isReprint ? (ordinal === '2nd' ? 'amber' : 'purple') : 'emerald',
      },
      tableSummary: (
        <span className="truncate">
          <strong className="text-gray-900 font-semibold">{count} letters</strong> for{' '}
          <span className="text-[#5c292c] font-bold">{targetDate}</span>
          {priorSummary ? (
            <span className="text-gray-500 font-normal"> • Prior: {priorSummary}</span>
          ) : (
            <span className="text-gray-500 font-normal"> • Initial print by {userName}</span>
          )}
        </span>
      ),
      modal: {
        actor: { name: userName, role: userRole, username: userLogin },
        target: { name: `Target Date: ${targetDate}`, code: `${count} Prasatham Letters`, isDate: true },
        changeInfo: {
          type: 'sequence',
          title: 'Print Sequence & Reprints',
          badge: isReprint ? `${ordinal} Print (Reprint)` : '1st Print',
          badgeColor: isReprint ? (ordinal === '2nd' ? 'amber' : 'purple') : 'emerald',
          mainText: `${count} Prasatham letters printed for Kattalai date: ${targetDate}.`,
          priorTrail: priorTrail,
        },
        extraContext: devotees ? { title: 'Letter Recipients (Absentees)', content: devotees } : null,
      }
    };
  }

  // 2. ATTENDANCE LOGS
  if (action.includes('Present') || action.includes('Absent') || action.includes('Attendance')) {
    const isPresent = action.includes('Present') || details.includes('"Present"');
    const yearMatch = details.match(/\((\d{4})\)/) || details.match(/for (\d{4})/i);
    const year = yearMatch ? yearMatch[1] : new Date().getFullYear();
    const devoteeMatch = details.match(/devotee\s+"([^"]+)"/i);
    const targetDevotee = devoteeMatch ? devoteeMatch[1] : (devoteeName || 'Devotee');
    const byMatch = details.match(/by\s+([^.]+?)$/i);
    const recordedBy = byMatch ? byMatch[1].trim() : userName;

    return {
      category: 'attendance',
      tableBadge: {
        text: isPresent ? 'Present' : 'Absent',
        color: isPresent ? 'emerald' : 'rose',
      },
      tableSummary: (
        <span className="truncate">
          Marked <strong className={isPresent ? 'text-emerald-800' : 'text-rose-800'}>{isPresent ? 'Present' : 'Absent'}</strong> for year {year}
          {recordedBy ? <span className="text-gray-500 font-normal"> by {recordedBy}</span> : ''}
          <span className="text-gray-400 font-normal"> (Prior: {isPresent ? 'Absent' : 'Present'})</span>
        </span>
      ),
      modal: {
        actor: { name: recordedBy, role: userRole, username: userLogin },
        target: { name: targetDevotee, code: devoteeCode || `Year: ${year}` },
        changeInfo: {
          type: 'transition',
          title: 'Attendance Status Transition',
          from: isPresent ? 'Absent' : 'Present',
          fromColor: isPresent ? 'rose' : 'emerald',
          to: isPresent ? 'Present' : 'Absent',
          toColor: isPresent ? 'emerald' : 'rose',
          note: `Attendance verified and recorded for Kattalai year ${year}.`,
        },
        extraContext: null,
      }
    };
  }

  // 3. BUG REPORTS / ISSUE TRACKING
  if (action === 'Reported Issue/Bug' || action.includes('Bug Report') || action.includes('Issue')) {
    const isReported = action === 'Reported Issue/Bug';
    const titleMatch = details.match(/issue:\s*"([^"]+)"/i) || details.match(/report\s*"([^"]+)"/i) || details.match(/"([^"]+)"/i);
    const bugTitle = titleMatch ? titleMatch[1] : 'Reported Issue';
    const statusMatch = details.match(/marked as\s*"([^"]+)"/i);
    const newStatus = statusMatch ? statusMatch[1] : 'open';
    const screenshotsMatch = details.match(/(\d+)\s+screenshot/i);
    const screenshotsCount = screenshotsMatch ? screenshotsMatch[1] : '0';

    if (isReported) {
      return {
        category: 'bugs',
        tableBadge: { text: 'Bug Reported', color: 'rose' },
        tableSummary: (
          <span className="truncate">
            Reported issue: <strong className="text-gray-900 font-semibold">"{bugTitle}"</strong>
            {parseInt(screenshotsCount, 10) > 0 ? <span className="text-gray-500 font-normal"> ({screenshotsCount} screenshots)</span> : ''}
          </span>
        ),
        modal: {
          actor: { name: userName, role: userRole, username: userLogin },
          target: { name: `Issue: "${bugTitle}"`, code: `Status: Open` },
          changeInfo: {
            type: 'info',
            title: 'Bug Report Submitted',
            badge: 'Open',
            badgeColor: 'rose',
            mainText: `User ${userName} submitted issue: "${bugTitle}".`,
            priorTrail: null,
          },
          extraContext: { title: 'Attachments & Context', content: `${screenshotsCount} screenshot(s) attached by reporter.` },
        }
      };
    } else {
      return {
        category: 'bugs',
        tableBadge: { text: `Status → ${newStatus.replace('_', ' ')}`, color: newStatus === 'resolved' ? 'emerald' : 'blue' },
        tableSummary: (
          <span className="truncate">
            "{bugTitle}" marked as <strong className="text-[#5c292c] capitalize">{newStatus.replace('_', ' ')}</strong> by {userName}
          </span>
        ),
        modal: {
          actor: { name: userName, role: userRole, username: userLogin },
          target: { name: `Issue: "${bugTitle}"`, code: `New Status: ${newStatus}` },
          changeInfo: {
            type: 'transition',
            title: 'Status Progression',
            from: newStatus === 'resolved' ? 'in_progress' : 'open',
            fromColor: 'amber',
            to: newStatus,
            toColor: newStatus === 'resolved' ? 'emerald' : 'blue',
            note: `Bug ticket was updated and changed to "${newStatus}" by ${userName}.`,
          },
          extraContext: null,
        }
      };
    }
  }

  // 4. DEVOTEE UPDATES WITH DIFFS
  if (action === 'Updated Devotee' || action.includes('Kattalai')) {
    const changesMatch = details.match(/Changes:\s*(.+)$/i);
    const rawChanges = changesMatch ? changesMatch[1] : '';
    const diffItems = [];
    if (rawChanges) {
      const parts = rawChanges.split(';');
      for (const p of parts) {
        const arrow = p.split('→');
        if (arrow.length === 2) {
          const left = arrow[0].trim();
          const right = arrow[1].trim().replace(/^"/, '').replace(/"$/, '');
          const colonIdx = left.indexOf(':');
          if (colonIdx > -1) {
            const field = left.slice(0, colonIdx).trim();
            const oldVal = left.slice(colonIdx + 1).trim().replace(/^"/, '').replace(/"$/, '');
            diffItems.push({ field, oldVal, newVal: right });
          }
        }
      }
    }

    const fieldsSummary = diffItems.length > 0 
      ? diffItems.map(d => d.field.replace(/_/g, ' ')).slice(0, 3).join(', ') + (diffItems.length > 3 ? ` +${diffItems.length - 3} more` : '')
      : 'details updated';

    return {
      category: 'updates',
      tableBadge: { text: 'Edited', color: 'blue' },
      tableSummary: (
        <span className="truncate">
          Updated {diffItems.length || ''} field(s): <strong className="text-gray-900 font-semibold">{fieldsSummary}</strong>
          {devoteeName ? <span className="text-gray-500 font-normal"> for {devoteeName}</span> : ''}
        </span>
      ),
      modal: {
        actor: { name: userName, role: userRole, username: userLogin },
        target: { name: devoteeName || 'Devotee Record', code: devoteeCode || 'Kattalai' },
        changeInfo: {
          type: 'diff',
          title: 'Field-Level Modifications (Previous vs Changed)',
          diffItems: diffItems.length > 0 ? diffItems : [{ field: 'Details', oldVal: 'Prior values', newVal: 'Updated values' }],
        },
        extraContext: null,
      }
    };
  }

  // 5. ACCOUNT TRANSFER
  if (action === 'ACCOUNT_TRANSFER' || action.includes('TRANSFER')) {
    const fromMatch = details.match(/from\s+([^.]+?)\s+to\s+([^.]+?)\./i);
    const fromName = fromMatch ? fromMatch[1].trim() : 'Previous Owner';
    const toName = fromMatch ? fromMatch[2].trim() : 'New Owner';
    const rateMatch = details.match(/Base rate:\s*(₹?\d+)/i);
    const diffMatch = details.match(/Difference collected:\s*(₹?\d+)/i);

    return {
      category: 'transfers_requests',
      tableBadge: { text: 'Ownership Transfer', color: 'purple' },
      tableSummary: (
        <span className="truncate">
          Transfer: <strong className="text-gray-800">{fromName}</strong> → <strong className="text-[#5c292c]">{toName}</strong>
          {diffMatch ? <span className="text-gray-500 font-normal"> (Diff: {diffMatch[1]})</span> : ''}
        </span>
      ),
      modal: {
        actor: { name: userName, role: userRole, username: userLogin },
        target: { name: devoteeName || `Transfer to ${toName}`, code: devoteeCode || 'Transfer' },
        changeInfo: {
          type: 'transition',
          title: 'Account Ownership Transfer',
          from: fromName,
          fromColor: 'gray',
          to: toName,
          toColor: 'purple',
          note: `Permanent kattalai ownership reassigned. Base rate: ${rateMatch ? rateMatch[1] : '₹3500'}. Difference collected: ${diffMatch ? diffMatch[1] : '₹0'}.`,
        },
        extraContext: null,
      }
    };
  }

  // 6. DELETION & OTP REQUESTS
  if (action.includes('Deletion') || action.includes('Deleted')) {
    const isRequest = action.includes('Requested') || details.includes('initiated');
    const targetMatch = details.match(/Kattalai\s*"([^"]+)"\s*\(([^)]+)\)/i);
    const targetKattalai = targetMatch ? `${targetMatch[1]} (${targetMatch[2]})` : (devoteeName || 'Kattalai');

    return {
      category: 'staff',
      tableBadge: { text: isRequest ? 'OTP Request' : 'Permanent Delete', color: 'red' },
      tableSummary: (
        <span className="truncate">
          {isRequest ? 'Initiated 3-OTP deletion authorization' : 'Permanently deleted after 3 OTPs verified'} for <strong className="text-gray-900 font-semibold">{targetKattalai}</strong>
        </span>
      ),
      modal: {
        actor: { name: userName, role: userRole, username: userLogin },
        target: { name: targetKattalai, code: 'Deletion Security Protocol' },
        changeInfo: {
          type: 'info',
          title: isRequest ? '3-OTP Deletion Request Dispatched' : 'Kattalai Permanently Deleted',
          badge: isRequest ? 'Pending OTPs' : 'Deleted',
          badgeColor: 'red',
          mainText: details,
          priorTrail: isRequest ? 'Authorized by 3 Power User OTPs valid for 1 hour.' : 'Verified all 3 OTPs before irreversible purge.',
        },
        extraContext: { title: 'Security Stakeholders', content: 'President, Treasurer, and Secretary multi-party authorization required.' },
      }
    };
  }

  // 7. WHATSAPP REMINDERS
  if (action.includes('WhatsApp')) {
    const statsMatch = details.match(/Sent\s+([^.]+?)\s+reminders\s*\(([^)]+)\)\s+for date\s+([^.]+?)\./i);
    const stats = statsMatch ? statsMatch[1].trim() : 'reminders';
    const lang = statsMatch ? statsMatch[2].trim() : 'EN';
    const targetDate = statsMatch ? statsMatch[3].trim() : 'Scheduled Date';

    return {
      category: 'whatsapp',
      tableBadge: { text: 'WhatsApp Sent', color: 'green' },
      tableSummary: (
        <span className="truncate">
          Dispatched <strong className="text-green-800 font-semibold">{stats} reminders</strong> ({lang}) for date <strong className="text-[#5c292c]">{targetDate}</strong>
        </span>
      ),
      modal: {
        actor: { name: userName, role: userRole, username: userLogin },
        target: { name: `Date: ${targetDate}`, code: `${lang} Reminders` },
        changeInfo: {
          type: 'info',
          title: 'WhatsApp Automation Dispatch',
          badge: `${lang} • Success`,
          badgeColor: 'green',
          mainText: `Successfully sent ${stats} WhatsApp kattalai reminders for date ${targetDate}.`,
          priorTrail: null,
        },
        extraContext: null,
      }
    };
  }

  // 8. STAFF & POWER USERS
  if (action.includes('Staff') || action.includes('Power User')) {
    const isPower = action.includes('Power User');
    const profileMatch = details.match(/profile\s+(?:for\s+)?"([^"]+)"/i) || details.match(/for\s+"([^"]+)"/i);
    const profileName = profileMatch ? profileMatch[1] : 'Staff Profile';

    return {
      category: 'staff',
      tableBadge: { text: isPower ? 'Power User' : 'Staff Profile', color: 'purple' },
      tableSummary: (
        <span className="truncate">
          Updated {isPower ? 'Power User' : 'staff'} profile for <strong className="text-gray-900 font-semibold">{profileName}</strong>
        </span>
      ),
      modal: {
        actor: { name: userName, role: userRole, username: userLogin },
        target: { name: profileName, code: isPower ? 'Power User' : 'Staff Management' },
        changeInfo: {
          type: 'info',
          title: 'Profile Updated',
          badge: isPower ? 'Officer Profile' : 'Staff Role',
          badgeColor: 'purple',
          mainText: details,
          priorTrail: null,
        },
        extraContext: null,
      }
    };
  }

  // 9. LOGINS & PASSWORDS
  if (action.includes('Login') || action.includes('Password')) {
    const isPass = action.includes('Password');
    return {
      category: 'general',
      tableBadge: { text: isPass ? 'Password' : 'Login', color: 'gray' },
      tableSummary: (
        <span className="text-gray-700 truncate">
          {details}
        </span>
      ),
      modal: {
        actor: { name: userName, role: userRole, username: userLogin },
        target: { name: devoteeName || userName, code: devoteeCode || (isPass ? 'Password Security' : 'User Session') },
        changeInfo: {
          type: 'info',
          title: isPass ? 'Security Credential Changed' : 'Authentication Session',
          badge: isPass ? 'Password Updated' : 'Signed In',
          badgeColor: 'gray',
          mainText: details,
          priorTrail: null,
        },
        extraContext: null,
      }
    };
  }

  // 10. EDIT REQUESTS
  if (action.includes('Edit Request') || action === 'REQUESTED_EDIT') {
    const isRequest = action === 'REQUESTED_EDIT';
    return {
      category: 'transfers_requests',
      tableBadge: { text: isRequest ? 'Edit Request' : 'Request Decision', color: isRequest ? 'amber' : 'blue' },
      tableSummary: (
        <span className="text-gray-800 truncate">
          {details}
        </span>
      ),
      modal: {
        actor: { name: userName, role: userRole, username: userLogin },
        target: { name: devoteeName || 'Devotee', code: devoteeCode || 'Edit Permission' },
        changeInfo: {
          type: 'info',
          title: isRequest ? 'Devotee Requested Edit Permission' : 'Staff Decision on Edit Request',
          badge: isRequest ? 'Pending Staff Approval' : action,
          badgeColor: 'amber',
          mainText: details,
          priorTrail: null,
        },
        extraContext: null,
      }
    };
  }

  // 11. REGISTRATIONS
  if (action === 'Created Booking' || action.includes('Register') || action.includes('Sign Up')) {
    return {
      category: 'registrations',
      tableBadge: { text: 'New Nithiya Kattalai', color: 'emerald' },
      tableSummary: (
        <span className="truncate">
          Registered Nithiya Kattalai for <strong className="text-gray-900 font-semibold">{devoteeName || 'Devotee'}</strong> ({devoteeCode || 'New'})
        </span>
      ),
      modal: {
        actor: { name: userName, role: userRole, username: userLogin },
        target: { name: devoteeName || 'New Devotee', code: devoteeCode || 'New Nithiya Kattalai' },
        changeInfo: {
          type: 'info',
          title: 'Nithiya Kattalai Registration Created',
          badge: 'Registered',
          badgeColor: 'emerald',
          mainText: details,
          priorTrail: null,
        },
        extraContext: null,
      }
    };
  }

  // DEFAULT / FALLBACK
  return {
    category: 'general',
    tableBadge: { text: action, color: 'gray' },
    tableSummary: (
      <span className="text-gray-700 truncate" title={details}>
        {details}
      </span>
    ),
    modal: {
      actor: { name: userName, role: userRole, username: userLogin },
      target: { name: devoteeName || userName || 'System', code: devoteeCode || action },
      changeInfo: {
        type: 'info',
        title: action,
        badge: action,
        badgeColor: 'gray',
        mainText: details,
        priorTrail: null,
      },
      extraContext: null,
    }
  };
}

export default function History() {
  const { user } = useAuth();

  // State
  const [logs, setLogs] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({
    all: 0,
    registrations: 0,
    updates: 0,
    attendance: 0,
    whatsapp: 0,
    printing: 0,
    transfers_requests: 0,
    staff: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [category, setCategory] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch logs from backend
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        booking_id: user?.role === 'user' ? user.id : undefined,
        category: category,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        search: debouncedSearch || undefined,
        page: pagination.page,
        limit: pagination.limit,
      };

      const res = await api.getHistory(params);

      if (res && res.logs && res.pagination) {
        setLogs(res.logs);
        setPagination(res.pagination);
        if (res.categoryCounts) {
          setCategoryCounts(res.categoryCounts);
        }
      } else if (Array.isArray(res)) {
        setLogs(res);
        setPagination((prev) => ({
          ...prev,
          total: res.length,
          totalPages: Math.ceil(res.length / prev.limit) || 1,
        }));
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Failed to load activity history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, category, fromDate, toDate, debouncedSearch, pagination.page, pagination.limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Category tabs matching Settings / WhatsApp tabs
  const categories = [
    { id: 'all', label: 'All Activities' },
    { id: 'registrations', label: 'Registrations' },
    { id: 'updates', label: 'Updates & Edits' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'whatsapp', label: 'WhatsApp Reminders' },
    { id: 'printing', label: 'Prasatham Printing' },
    { id: 'transfers_requests', label: 'Transfers & Requests' },
    { id: 'staff', label: 'Staff & System' },
  ];

  // Quick preset dates
  const handleQuickPreset = (type) => {
    const today = new Date();
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayStr = fmt(today);

    if (type === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (type === '7days') {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      setFromDate(fmt(past));
      setToDate(todayStr);
    } else if (type === 'month') {
      const firstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      setFromDate(firstDay);
      setToDate(todayStr);
    } else if (type === 'clear') {
      setFromDate('');
      setToDate('');
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Badge styling adhering strictly to the system's warm palette
  const getActionBadge = (action = '') => {
    if (action.includes('Delete') || action.includes('Deleted')) {
      return 'bg-red-50 text-red-800 border-red-200 font-bold';
    }
    if (action.includes('Power User')) {
      return 'bg-purple-50 text-purple-900 border-purple-200 font-bold';
    }
    if (action.includes('Present') || action.includes('Approved')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (action.includes('Absent') || action.includes('Rejected')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (action.includes('WhatsApp')) {
      return 'bg-green-50 text-green-800 border-green-200';
    }
    return 'bg-[#f7f1e5] text-[#5c292c] border-[#ebdccb]';
  };

  const getRoleBadge = (role = '') => {
    const r = (role || '').toLowerCase();
    if (r === 'superadmin') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (r === 'admin') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (r === 'ulthurai') return 'bg-amber-100 text-amber-900 border-amber-200';
    return 'bg-[#5c292c]/10 text-[#5c292c] border-[#5c292c]/20';
  };

  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  const getPageNumbers = () => {
    const totalPages = pagination.totalPages;
    const current = pagination.page;
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (current >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', current - 1, current, current + 1, '...', totalPages];
  };

  return (
    <div className="min-h-screen bg-[#faf8f7] p-4 sm:p-6 md:p-8 font-barlow relative z-10 text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Header - Matches System Settings & Profiles Exactly */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                to="/dashboard"
                className="text-[#5c292c] hover:underline font-semibold text-xs flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-[#ebdccb] shadow-sm self-start"
              >
                ← Back to Dashboard
              </Link>
              {user && (
                <span className="text-xs bg-[#5c292c]/10 text-[#5c292c] font-bold px-2.5 py-0.5 rounded-full capitalize">
                  {user.role}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#5c292c] tracking-tight">
              Activity & Audit History Log
            </h1>
          </div>
        </div>

        {/* Main Card Container - Matches System Settings rounded-[22px] */}
        <div className="bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-5 sm:p-6 mb-6">
          
          {/* Category Tabs - Clean underline tabs with count badges */}
          <div className="flex gap-2 border-b border-[#ebdccb]/60 mb-5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((tab) => {
              const count = categoryCounts[tab.id] ?? 0;
              const isActive = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setCategory(tab.id);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`pb-2.5 px-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'border-b-2 border-[#5c292c] text-[#5c292c] font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-[#5c292c] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filter Toolbar - Matches Settings Inner Box bg-[#faf8f7] rounded-[18px] */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#faf8f7] p-4 rounded-[18px] border border-[#ebdccb] mb-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold text-[#5c292c]">Filter by Date:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500 font-semibold">FROM</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="h-[34px] px-2.5 rounded-full border border-[#e2d8cb] bg-white text-xs text-[#5c292c] font-medium focus:outline-none focus:border-[#5c292c]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500 font-semibold">TO</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="h-[34px] px-2.5 rounded-full border border-[#e2d8cb] bg-white text-xs text-[#5c292c] font-medium focus:outline-none focus:border-[#5c292c]"
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('today')}
                  className="text-xs px-2.5 py-1 rounded-full bg-white hover:bg-gray-50 border border-[#e2d8cb] text-gray-700 font-medium cursor-pointer transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('7days')}
                  className="text-xs px-2.5 py-1 rounded-full bg-white hover:bg-gray-50 border border-[#e2d8cb] text-gray-700 font-medium cursor-pointer transition-colors"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('month')}
                  className="text-xs px-2.5 py-1 rounded-full bg-white hover:bg-gray-50 border border-[#e2d8cb] text-gray-700 font-medium cursor-pointer transition-colors"
                >
                  This Month
                </button>
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('clear')}
                    className="text-xs px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Search Input styled like System Settings search */}
            <div className="relative w-full lg:w-64">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-[36px] pl-8 pr-4 rounded-full border border-[#e2d8cb] bg-white text-xs text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c]"
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9c9186]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="p-14 text-center">
              <div className="inline-block w-7 h-7 border-2 border-[#5c292c] border-t-transparent rounded-full animate-spin mb-2" />
              <div className="text-[#5c292c] font-semibold text-xs">Loading activity history...</div>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-[18px] text-center text-xs">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-medium text-xs">
              No activity logs found for the selected category or date range.
            </div>
          ) : (
            <div className="rounded-[18px] border border-[#ebdccb] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f7f1e5] border-b border-[#ebdccb] text-[#5c292c] text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">S.No</th>
                      <th className="py-3 px-4 whitespace-nowrap">Date & Time</th>
                      <th className="py-3 px-4 whitespace-nowrap">User & Login</th>
                      <th className="py-3 px-4 whitespace-nowrap">Category / Action</th>
                      <th className="py-3 px-4 whitespace-nowrap">Devotee / Target</th>
                      <th className="py-3 px-5">What Was Changed (Details)</th>
                      <th className="py-3 px-4 text-center w-16">Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0e6dc] text-xs">
                    {logs.map((log, index) => {
                      const sNo = (pagination.page - 1) * pagination.limit + index + 1;
                      const d = new Date(log.created_at);
                      const dateFormatted = d.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      });
                      const timeFormatted = d.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });

                      const analysis = analyzeHistoryLog(log);

                      return (
                        <tr key={log.id} className="hover:bg-[#faf6f0] transition-colors border-b border-[#f0e6dc]">
                          {/* S.No */}
                          <td className="py-2.5 sm:py-3 px-3.5 text-center font-medium text-gray-600 text-xs">
                            {sNo}
                          </td>

                          {/* Date & Time */}
                          <td className="py-2.5 sm:py-3 px-3.5 whitespace-nowrap">
                            <div className="font-semibold text-gray-900 text-xs">{dateFormatted}</div>
                            <div className="text-[10px] text-gray-500">{timeFormatted}</div>
                          </td>

                          {/* User & Login */}
                          <td className="py-2.5 sm:py-3 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#5c292c] text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs">
                                {(log.user_name || log.user_role || 'S').slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 leading-tight text-xs">
                                  {log.user_name || (log.user_role ? log.user_role : 'Online Devotee')}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {log.user_role && (
                                    <span className="text-[9px] bg-[#5c292c]/10 text-[#5c292c] font-bold px-1.5 py-0.1 rounded-full uppercase">
                                      {log.user_role}
                                    </span>
                                  )}
                                  {log.user_username && (
                                    <span className="text-[10px] text-gray-500 truncate max-w-[100px]" title={log.user_username}>
                                      @{log.user_username}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category / Action */}
                          <td className="py-2.5 sm:py-3 px-3.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold inline-block border ${getActionBadge(
                                log.action
                              )}`}
                            >
                              {log.action}
                            </span>
                          </td>

                          {/* Devotee / Target */}
                          <td className="py-2.5 sm:py-3 px-3.5 whitespace-nowrap">
                            {analysis.category === 'printing' ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#5c292c] text-xs">
                                  {analysis.modal.target.name.replace('Target Date: ', '')}
                                </span>
                                <span className="text-[10px] bg-[#f7f1e5] text-[#5c292c] px-1.5 py-0.1 rounded font-semibold border border-[#ebdccb]">
                                  {analysis.modal.target.code}
                                </span>
                              </div>
                            ) : log.booking_name ? (
                              <div>
                                <div className="font-bold text-[#5c292c] text-xs">{log.booking_name}</div>
                                {log.booking_code && (
                                  <span className="text-[10px] bg-[#f7f1e5] text-[#5c292c] px-1.5 py-0.1 rounded font-bold border border-[#ebdccb]">
                                    {log.booking_code}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="font-bold text-[#5c292c] text-xs">
                                  {log.user_name || (log.user_role ? log.user_role.toUpperCase() : 'System Action')}
                                </div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.1 rounded uppercase tracking-wider inline-block mt-0.5 ${getRoleBadge(
                                  log.user_role
                                )}`}>
                                  {log.user_role || 'SYSTEM'}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Details - Compact & Space-Saving */}
                          <td className="py-2.5 sm:py-3 px-3.5 text-gray-700 max-w-lg">
                            <div className="flex items-center gap-1.5 text-xs truncate">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 ${getBadgeClasses(analysis.tableBadge.color)}`}>
                                {analysis.tableBadge.text}
                              </span>
                              <div className="truncate text-xs">
                                {analysis.tableSummary}
                              </div>
                            </div>
                          </td>

                          {/* Trigger view icon */}
                          <td className="py-2.5 sm:py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedLog(log)}
                              className="w-7 h-7 rounded-full bg-[#f7f1e5] hover:bg-[#5c292c] text-[#5c292c] hover:text-white border border-[#ebdccb] flex items-center justify-center transition-all cursor-pointer shadow-2xs mx-auto"
                              title="View Full Details"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar - Matches Reference Image layout */}
              <div className="px-5 py-3.5 bg-[#f7f1e5]/60 border-t border-[#ebdccb] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-gray-600 font-medium">
                  Showing <span className="font-bold text-[#5c292c]">{startItem}</span> to{' '}
                  <span className="font-bold text-[#5c292c]">{endItem}</span> of{' '}
                  <span className="font-bold text-[#5c292c]">{pagination.total}</span> activity logs
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Previous Button */}
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className={`w-7 h-7 rounded-md flex items-center justify-center font-bold transition-all cursor-pointer ${
                      pagination.page <= 1
                        ? 'text-gray-300 bg-transparent cursor-not-allowed'
                        : 'text-gray-700 hover:bg-[#ebdccb] bg-white border border-[#cdb9ab]'
                    }`}
                    title="Previous Page"
                  >
                    ‹
                  </button>

                  {/* Page Number Pills */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((num, idx) => {
                      if (num === '...') {
                        return (
                          <span key={`dots-${idx}`} className="px-1 text-gray-400 font-bold">
                            ...
                          </span>
                        );
                      }
                      const isActive = pagination.page === num;
                      return (
                        <button
                          key={`page-${num}`}
                          type="button"
                          onClick={() => setPagination((prev) => ({ ...prev, page: num }))}
                          className={`w-7 h-7 rounded-md font-bold text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#5c292c] text-white shadow-xs'
                              : 'bg-white text-gray-700 hover:bg-[#f7f1e5] border border-[#cdb9ab]'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className={`w-7 h-7 rounded-md flex items-center justify-center font-bold transition-all cursor-pointer ${
                      pagination.page >= pagination.totalPages
                        ? 'text-gray-300 bg-transparent cursor-not-allowed'
                        : 'text-gray-700 hover:bg-[#ebdccb] bg-white border border-[#cdb9ab]'
                    }`}
                    title="Next Page"
                  >
                    ›
                  </button>

                  {/* Page Size Selector */}
                  <select
                    value={pagination.limit}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value, 10);
                      setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                    }}
                    className="border border-[#cdb9ab] rounded-md px-2 py-1 text-xs bg-white text-gray-700 font-medium focus:outline-none focus:border-[#5c292c] cursor-pointer"
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Details Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-[22px] border border-[#ebdccb] shadow-2xl max-w-xl w-full p-6 text-xs font-barlow relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#ebdccb]/60 mb-4">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getActionBadge(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
                <span className="text-gray-500 font-semibold">
                  {new Date(selectedLog.created_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-black font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const analysis = analyzeHistoryLog(selectedLog);
              const m = analysis?.modal;

              return (
                <div className="space-y-3 mb-4">
                  {/* Top Grid: Actor & Target Cards */}
                  <div className="grid grid-cols-2 gap-3 bg-[#faf8f7] p-3.5 rounded-[16px] border border-[#ebdccb]">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                        {analysis.category === 'printing' ? 'Print Sequence & Staff:' : 'Performed By / Actor:'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {m?.changeInfo?.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${getBadgeClasses(m.changeInfo.badgeColor || 'gray')}`}>
                            {m.changeInfo.badge}
                          </span>
                        )}
                        <span className="font-bold text-gray-900 text-sm">
                          {m?.actor?.name || selectedLog.user_name || 'System'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500">
                        <span className="uppercase font-semibold text-[10px] bg-[#5c292c]/10 text-[#5c292c] px-1.5 py-0.1 rounded">
                          {m?.actor?.role || selectedLog.user_role || 'STAFF'}
                        </span>
                        {m?.actor?.username && <span>{m.actor.username}</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                        {m?.target?.isDate ? 'Target Kattalai Date:' : 'Devotee / Target Entity:'}
                      </span>
                      <span className="font-bold text-[#5c292c] text-sm block mt-0.5">
                        {m?.target?.name || selectedLog.booking_name || 'System Target'}
                      </span>
                      {m?.target?.code && (
                        <span className="text-gray-600 block text-[11px] mt-0.5 font-medium">
                          {m.target.code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Field-level Modifications Diff Table */}
                  {m?.changeInfo?.type === 'diff' && m.changeInfo.diffItems?.length > 0 && (
                    <div className="bg-[#faf8f7] rounded-[16px] border border-[#ebdccb] p-3">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-2">
                        {m.changeInfo.title || 'Modifications (Previous vs Changed)'}:
                      </span>
                      <div className="rounded-xl border border-[#ebdccb]/80 bg-white overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-[#f7f1e5] text-[#5c292c] font-bold border-b border-[#ebdccb]/80 text-[10px] uppercase">
                              <th className="py-1.5 px-3">Field</th>
                              <th className="py-1.5 px-3">Previous Value</th>
                              <th className="py-1.5 px-3">New Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f0e6dc]">
                            {m.changeInfo.diffItems.map((item, idx) => (
                              <tr key={idx} className="hover:bg-[#faf6f0]">
                                <td className="py-1.5 px-3 font-semibold text-[#5c292c] capitalize">
                                  {item.field.replace(/_/g, ' ')}
                                </td>
                                <td className="py-1.5 px-3 text-rose-700 bg-rose-50/40 line-through">
                                  {item.oldVal || '(empty)'}
                                </td>
                                <td className="py-1.5 px-3 text-emerald-800 bg-emerald-50/40 font-semibold">
                                  {item.newVal || '(empty)'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* State Transition (Previous → New) */}
                  {m?.changeInfo?.type === 'transition' && (
                    <div className="bg-[#faf8f7] rounded-[16px] border border-[#ebdccb] p-3">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-2">
                        {m.changeInfo.title || 'State Transition (Previous → New)'}:
                      </span>
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-[#ebdccb]/80">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">Previous State</span>
                          <span className={`font-bold text-xs ${m.changeInfo.fromColor === 'rose' ? 'text-rose-700' : 'text-gray-700'}`}>
                            {m.changeInfo.from}
                          </span>
                        </div>
                        <div className="text-gray-400 font-bold text-sm">→</div>
                        <div className="flex-1 bg-[#5c292c]/5 border border-[#5c292c]/20 rounded-lg p-2 text-center">
                          <span className="text-[10px] text-[#5c292c] font-bold uppercase block">New State</span>
                          <span className={`font-bold text-xs ${m.changeInfo.toColor === 'emerald' ? 'text-emerald-700' : 'text-[#5c292c]'}`}>
                            {m.changeInfo.to}
                          </span>
                        </div>
                      </div>
                      {m.changeInfo.note && (
                        <p className="text-[11px] text-gray-600 mt-2 font-medium">{m.changeInfo.note}</p>
                      )}
                    </div>
                  )}

                  {/* Prior Print History Trail if present */}
                  {m?.changeInfo?.priorTrail && (
                    <div className="bg-amber-50/80 border border-amber-200/90 rounded-[14px] p-2.5 text-xs text-amber-900">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-950 block mb-0.5">
                        Previous Print History:
                      </span>
                      <span className="font-medium">{m.changeInfo.priorTrail}</span>
                    </div>
                  )}

                  {/* Extra Context Card (e.g. Absentees list, screenshots, OTP stakeholders) */}
                  {m?.extraContext && (
                    <div className="bg-[#fcf9f4] rounded-[14px] p-2.5 border border-[#ebdccb]">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">
                        {m.extraContext.title}:
                      </span>
                      <span className="text-gray-800 font-medium text-xs leading-relaxed block">
                        {m.extraContext.content}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mb-4">
              <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Full Log Description & Details:</span>
              <div className="bg-[#fcf9f4] rounded-[16px] p-3 border border-[#ebdccb] text-gray-800 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedLog.details}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#ebdccb]/60">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="bg-[#5c292c] hover:bg-[#482022] text-white px-5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
