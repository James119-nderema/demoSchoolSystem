import { Outlet, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../components/authentication/contexts/AuthContext'
import Sidebar from '../components/sidebars/Sidebar'

export default function MainLayout() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const handleLogout = () => {
		logout();
		navigate('/');
	};

	const toggleSidebar = () => {
		setSidebarOpen(!sidebarOpen);
	};

	// Close dropdown on outside click
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsProfileOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const initials = (user?.school_name || 'SA')
		.split(' ')
		.map((n: string) => n[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

	return (
		<div className="h-screen overflow-hidden bg-gray-50 text-gray-900 flex">
			{/* Sidebar */}
			<Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

			{/* Main content column: header + scrollable content */}
			<div className="flex-1 min-w-0 flex flex-col lg:ml-0">
				{/* Top bar */}
				<header className="bg-white border-b border-gray-200 shrink-0">
					<div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
						<div className="flex items-center">
							{/* Mobile menu button */}
							<button
								onClick={toggleSidebar}
								className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 mr-3"
							>
								<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
							<h1 className="text-lg font-semibold text-slate-800">School Result Manager</h1>
						</div>

						{/* Right side — profile dropdown */}
						<div className="flex items-center gap-4">
							<span className="text-xs text-slate-400 hidden lg:block">
								{user?.school_name}
							</span>

							<div className="relative" ref={dropdownRef}>
								<button
									onClick={() => setIsProfileOpen(!isProfileOpen)}
									className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-50 transition-all duration-200 group"
								>
									<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200/60 group-hover:shadow-md transition-shadow">
										<span className="text-[11px] font-bold text-white">{initials}</span>
									</div>
									<div className="hidden sm:block text-left">
										<p className="text-[13px] font-semibold text-slate-700 leading-tight truncate max-w-[140px]">
											{user?.school_name || 'School Admin'}
										</p>
										<p className="text-[10px] text-slate-400 font-medium leading-tight">Administrator</p>
									</div>
									<svg
										className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
										fill="none" stroke="currentColor" viewBox="0 0 24 24"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
									</svg>
								</button>

								{isProfileOpen && (
									<div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl shadow-slate-200/60 border border-slate-200/80 py-1.5 z-50">
										{/* Header */}
										<div className="px-4 py-3 border-b border-slate-100">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200/50">
													<span className="text-sm font-bold text-white">{initials}</span>
												</div>
												<div className="min-w-0 flex-1">
													<p className="text-sm font-semibold text-slate-800 truncate">{user?.school_name}</p>
													<p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
												</div>
											</div>
										</div>

										{/* Items */}
										<div className="py-1.5">
											<button
												onClick={() => { navigate('/school/profile'); setIsProfileOpen(false); }}
												className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
											>
												<svg className="w-[18px] h-[18px] text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
												</svg>
												<div>
													<span>School Profile</span>
													<p className="text-[10px] text-slate-400 font-normal">Manage school information</p>
												</div>
											</button>
										</div>

										{/* Logout */}
										<div className="border-t border-slate-100 pt-1.5">
											<button
												onClick={() => { handleLogout(); setIsProfileOpen(false); }}
												className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-[13px] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
											>
												<svg className="w-[18px] h-[18px] text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
												</svg>
												<span>Logout</span>
											</button>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</header>

				<main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
					<Outlet />
				</main>
			</div>
		</div>
	)
}

