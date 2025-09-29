import { Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../components/authentication/contexts/AuthContext'
import Sidebar from '../components/sidebars/Sidebar'

export default function MainLayout() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const handleLogout = () => {
		logout();
		navigate('/login');
	};

	const toggleSidebar = () => {
		setSidebarOpen(!sidebarOpen);
	};

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
							<h1 className="text-lg font-semibold">School Result Manager</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-600 hidden sm:block">
								{user?.school_name} • {user?.email}
							</span>
							<button
								onClick={handleLogout}
								className="text-sm text-red-600 hover:text-red-800 font-medium"
							>
								Logout
							</button>
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

