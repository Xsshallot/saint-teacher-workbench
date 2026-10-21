/** API 客户端：统一 JSON 信封处理 */
const BASE = '';

async function req(path, options = {}) {
  const r = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!r.ok && r.status !== 404) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'api error');
  return j.data;
}

export const api = {
  stats: () => req('/api/stats'),
  students: (q = '', className = '') => req(`/api/students?q=${encodeURIComponent(q)}&class_name=${encodeURIComponent(className)}`),
  student: (id) => req(`/api/students/${id}`),
  courses: () => req('/api/courses'),
  lessons: (courseId = '') => req(`/api/lessons?course_id=${courseId}`),
  meetings: () => req('/api/meetings'),
  assignments: () => req('/api/assignments'),
  submissions: (params = {}) => {
    const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
    return req(`/api/submissions?${s}`);
  },
  feedback: (theme = '') => req(`/api/feedback?theme=${encodeURIComponent(theme)}`),
  documents: (docType = '') => req(`/api/documents?doc_type=${encodeURIComponent(docType)}`),
  activity: (params = {}) => {
    const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
    return req(`/api/activity?${s}`);
  },
  satisfaction: () => req('/api/satisfaction'),
  minutesSearch: (q = '') => req(`/api/minutes/search?q=${encodeURIComponent(q)}`),
  minuteDetail: (id) => req(`/api/minutes/${id}`),
  syncStatus: () => req('/api/sync/status'),
  syncRun: () => req('/api/sync/run', { method: 'POST', body: '{}' }),
};
