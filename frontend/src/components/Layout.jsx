import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Briefcase, Map as MapIcon, 
  History, LogOut, User as UserIcon, Bell, Menu, X
} from 'lucide-react';
import { authApi } from '../services/api';

const Layout = ({ children, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      window.location.href = '/login';
    } catch (e) {
      console.error('Logout failed', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const navItems = {
    ADMIN: [
      { path: '/admin', icon: LayoutDashboard, label: 'Overview' },
      { path: '/admin/employees', icon: Users, label: 'Employees' },
      { path: '/admin/clients', icon: Briefcase, label: 'Clients' },
      { path: '/admin/map', icon: MapIcon, label: 'Live Tracking' },
      { path: '/admin/attendance', icon: History, label: 'History' },
    ],
    EMPLOYEE: [
      { path: '/employee', icon: LayoutDashboard, label: 'My Workspace' },
      { path: '/employee/history', icon: History, label: 'Attendance' },
    ],
    CLIENT: [
       { path: '/client', icon: LayoutDashboard, label: 'Assignments' },
    ]
  };

  const currentNav = navItems[user?.role] || [];

  return (
    <div className="min-height-screen bg-slate-950 text-slate-200 flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-indigo-500 tracking-tight">FEMS<span className="text-slate-400">.pro</span></h1>
            <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {currentNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === item.path ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <item.icon size={20} className={location.pathname === item.path ? 'text-indigo-400' : 'group-hover:text-indigo-400 transition-colors'} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-40">
          <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>

          <div className="ml-auto flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-200 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-900"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
               <div className="text-right hidden sm:block">
                 <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                 <p className="text-xs text-slate-500 uppercase tracking-wider">{user?.role}</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                 {user?.name?.[0]}
               </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
