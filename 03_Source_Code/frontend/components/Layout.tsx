import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, Calendar, Menu, X, University, UserCircle, LogOut, ChevronDown, User, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
      return <>{children}</>;
  }

  // Sharpened link styles: removed opacity, added solid hover
  const isActive = (path: string) => location.pathname === path 
    ? "text-ipb-accent font-bold relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-ipb-accent" 
    : "text-white font-medium hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors";

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-slate-50">
      {/* Navbar: Sharpened border and reduced translucency for clearer text */}
      <nav className="bg-ipb-blue shadow-lg sticky top-0 z-50 border-b border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 items-center py-3">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
                <div className="bg-white p-2 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300 border border-blue-100">
                    <University className="h-6 w-6 text-ipb-blue" />
                </div>
                <div className="hidden md:block">
                    <span className="text-white font-extrabold text-xl tracking-tight block leading-none group-hover:text-ipb-accent transition-colors">TLS IPB</span>
                    <span className="text-blue-200 text-xs font-semibold tracking-wider block leading-none mt-1">TOOLS LAB SHARING</span>
                </div>
              </Link>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-2">
              <Link to="/" className={isActive('/')}>Beranda</Link>
              <Link to="/facilities" className={isActive('/facilities')}>Daftar Fasilitas</Link>
              
              {isAuthenticated && user?.role === 'admin' ? (
                 <>
                    <Link to="/admin/dashboard" className={isActive('/admin/dashboard')}>
                        Admin Dashboard
                    </Link>
                    <Link to="/admin/users" className={isActive('/admin/users')}>
                        Users
                    </Link>
                 </>
              ) : isAuthenticated && user?.role === 'staff' ? (
                 <Link to="/tendik/dashboard" className={isActive('/tendik/dashboard')}>
                    Kelola Pengajuan
                 </Link>
              ) : isAuthenticated ? (
                 <Link to="/my-bookings" className={isActive('/my-bookings')}>
                    Peminjaman Saya
                 </Link>
              ) : null}
              
              <div className="ml-6 pl-6 border-l border-blue-800/50 flex items-center gap-4">
                  {isAuthenticated ? (
                    <div className="flex items-center gap-4">
                      <NotificationCenter />
                      <div className="flex items-center gap-3 group relative cursor-pointer p-1 rounded-full hover:bg-blue-800/50 transition-all pr-3 group border border-transparent hover:border-blue-700">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-ipb-accent to-yellow-600 flex items-center justify-center text-white font-bold shadow-md border-2 border-blue-800">
                             {user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-right hidden lg:block">
                            <span className="block text-white text-sm font-semibold leading-tight">{user?.name.split(' ')[0]}</span>
                            <span className="block text-blue-200 text-[10px] uppercase tracking-wider font-bold">{user?.role}</span>
                        </div>
                        
                        {/* Dropdown for Profile/Logout */}
                        <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                             <Link to="/profile" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-ipb-blue border-b border-slate-100">
                                <UserCircle className="h-4 w-4 mr-2" /> Profil Saya
                             </Link>
                             <button 
                                onClick={handleLogout} 
                                className="w-full text-left flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="h-4 w-4 mr-2" /> Keluar
                            </button>
                        </div>
                        
                        <ChevronDown className="h-4 w-4 text-white/80 ml-1" />
                    </div>
                  </div>
                  ) : (
                    <div className="flex items-center gap-3">
                        <Link to="/login" className="text-white hover:text-blue-100 text-sm font-bold px-4 py-2">Masuk</Link>
                        <Link to="/register" className="bg-white text-ipb-blue px-5 py-2.5 rounded-full text-sm font-bold hover:bg-blue-50 transition-all shadow-md hover:shadow-lg border border-blue-100">Daftar</Link>
                    </div>
                  )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-gray-200 focus:outline-none p-2 rounded-lg hover:bg-white/10"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-ipb-dark border-t border-blue-800 animate-fade-in shadow-xl">
            <div className="px-4 pt-4 pb-6 space-y-2 sm:px-3">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-white block px-4 py-3 rounded-xl text-base font-bold hover:bg-white/10 transition-colors">Beranda</Link>
              <Link to="/facilities" onClick={() => setIsMenuOpen(false)} className="text-white block px-4 py-3 rounded-xl text-base font-bold hover:bg-white/10 transition-colors">Daftar Fasilitas</Link>
              
              {isAuthenticated && user?.role === 'admin' ? (
                <>
                    <Link to="/admin/dashboard" onClick={() => setIsMenuOpen(false)} className="text-white block px-4 py-3 rounded-xl text-base font-bold hover:bg-white/10 transition-colors">
                        Admin Dashboard
                    </Link>
                    <Link to="/admin/users" onClick={() => setIsMenuOpen(false)} className="text-white block px-4 py-3 rounded-xl text-base font-bold hover:bg-white/10 transition-colors">
                        Manajemen User
                    </Link>
                </>
              ) : isAuthenticated && user?.role === 'staff' ? (
                <Link to="/tendik/dashboard" onClick={() => setIsMenuOpen(false)} className="text-white block px-4 py-3 rounded-xl text-base font-bold hover:bg-white/10 transition-colors">
                    Kelola Pengajuan
                </Link>
              ) : isAuthenticated ? (
                <Link to="/my-bookings" onClick={() => setIsMenuOpen(false)} className="text-white block px-4 py-3 rounded-xl text-base font-bold hover:bg-white/10 transition-colors">
                    Peminjaman Saya
                </Link>
              ) : null}

              <div className="border-t border-blue-800 my-2 pt-2">
                {!isAuthenticated ? (
                   <div className="grid grid-cols-2 gap-3 mt-2">
                      <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-center text-white block px-4 py-3 rounded-xl text-base font-bold hover:bg-white/10 border border-white/20">Masuk</Link>
                      <Link to="/register" onClick={() => setIsMenuOpen(false)} className="text-center bg-ipb-accent text-ipb-dark block px-4 py-3 rounded-xl text-base font-extrabold hover:bg-yellow-500 shadow-md">Daftar</Link>
                   </div>
                ) : (
                    <>
                        <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="text-white block px-4 py-3 rounded-xl text-base font-bold hover:bg-white/10 flex items-center gap-2">
                            <UserCircle className="h-5 w-5" /> Profil Saya
                        </Link>
                        <button onClick={handleLogout} className="w-full text-left text-red-300 block px-4 py-3 rounded-xl text-base font-bold hover:bg-white/10 flex items-center gap-2">
                            <LogOut className="h-5 w-5" /> Keluar
                        </button>
                    </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-16 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                        <University className="h-8 w-8 text-ipb-blue" />
                        <span className="text-xl font-bold tracking-tight">TLS IPB</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6 font-medium">
                        Platform Tools Lab Sharing (TLS) Terintegrasi IPB University.
                        Mendukung kegiatan akademik, riset, dan kemahasiswaan dengan akses fasilitas yang mudah.
                    </p>
                    <div className="flex gap-4">
                        {/* Social Placeholders */}
                        <div className="w-8 h-8 bg-slate-800 rounded-full hover:bg-ipb-blue transition-colors cursor-pointer flex items-center justify-center border border-slate-700">
                            <span className="font-bold text-xs">IG</span>
                        </div>
                        <div className="w-8 h-8 bg-slate-800 rounded-full hover:bg-ipb-blue transition-colors cursor-pointer flex items-center justify-center border border-slate-700">
                            <span className="font-bold text-xs">X</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-white font-bold mb-6">Direktorat</h3>
                    <ul className="space-y-4 text-sm text-slate-400 font-medium">
                        <li>Gedung Andi Hakim Nasoetion, Lt. 1</li>
                        <li>Kampus IPB Dramaga, Bogor 16680</li>
                        <li>Jawa Barat, Indonesia</li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-white font-bold mb-6">Kontak</h3>
                    <ul className="space-y-4 text-sm text-slate-400 font-medium">
                        <li className="flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-ipb-accent rounded-full"></span>
                             sarpras@apps.ipb.ac.id
                        </li>
                        <li className="flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-ipb-accent rounded-full"></span>
                             +62 251 8622642
                        </li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-slate-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm font-medium">
                <p>&copy; {new Date().getFullYear()} TLS IPB University. All rights reserved.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};