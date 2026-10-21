import React, { useEffect, useState } from 'react';
import { Category, Profile2User, Teacher, TaskSquare, MessageText, Setting2, Menu } from 'iconsax-react';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import StudentDetail from './pages/StudentDetail.jsx';
import Courses from './pages/Courses.jsx';
import Assignments from './pages/Assignments.jsx';
import Feedback from './pages/Feedback.jsx';
import Settings from './pages/Settings.jsx';

/** 极简 hash 路由 */
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || '#/');
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash.replace(/^#/, '');
}

const NAV = [
  { path: '/', label: '总览', icon: Category, match: (p) => p === '/' },
  { path: '/students', label: '学员', icon: Profile2User, match: (p) => p.startsWith('/students') },
  { path: '/courses', label: '课程与会议', icon: Teacher, match: (p) => p.startsWith('/courses') },
  { path: '/assignments', label: '作业任务', icon: TaskSquare, match: (p) => p.startsWith('/assignments') },
  { path: '/feedback', label: '反馈墙', icon: MessageText, match: (p) => p.startsWith('/feedback') },
  { path: '/settings', label: '设置', icon: Setting2, match: (p) => p.startsWith('/settings') },
];

export default function App() {
  const route = useHashRoute();
  const [menuOpen, setMenuOpen] = useState(false);

  let page;
  if (route.startsWith('/students/')) {
    page = <StudentDetail id={route.split('/')[2]} />;
  } else if (route.startsWith('/students')) page = <Students />;
  else if (route.startsWith('/courses')) page = <Courses />;
  else if (route.startsWith('/assignments')) page = <Assignments />;
  else if (route.startsWith('/feedback')) page = <Feedback />;
  else if (route.startsWith('/settings')) page = <Settings />;
  else page = <Dashboard />;

  const title = NAV.find((n) => n.match(route))?.label || '总览';

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* 侧边栏 */}
      <aside className={`fixed lg:sticky top-0 z-40 h-screen w-60 bg-slate-900 text-slate-300 flex flex-col transition-transform ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold">S</div>
          <div>
            <div className="text-white font-bold leading-tight">SAINT</div>
            <div className="text-[11px] text-slate-400">超级教师工作台</div>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV.map((n) => {
            const active = n.match(route);
            return (
              <a
                key={n.path}
                href={`#${n.path}`}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-primary-500/90 text-white font-medium' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center justify-center">
                  <n.icon variant="Linear" size={19} color={active ? '#ffffff' : '#94a3b8'} />
                </span>
                {n.label}
              </a>
            );
          })}
        </nav>
        <div className="px-5 py-4 text-[11px] text-slate-500 border-t border-slate-800">
          开源模板 · 数据本地存储
          <br />
          v0.1 · MIT License
        </div>
      </aside>
      {menuOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMenuOpen(false)} />}

      {/* 主区域 */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 h-16 flex items-center gap-4 px-4 lg:px-8">
          <button className="lg:hidden text-slate-500 flex items-center" onClick={() => setMenuOpen(true)} aria-label="打开菜单">
            <Menu variant="Linear" size={22} color="#64748b" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">{title}</h1>
          <div className="ml-auto text-xs text-slate-400 hidden sm:block">
            数据由问卷 / 会议连接器每日自动同步
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 max-w-[1400px] w-full mx-auto">{page}</main>
      </div>
    </div>
  );
}
