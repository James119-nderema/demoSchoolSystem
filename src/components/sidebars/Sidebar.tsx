import { NavLink } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
	`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
		isActive
			? 'bg-blue-600 text-white'
			: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
	}`

interface SidebarProps {
	isOpen?: boolean;
	onToggle?: () => void;
}

export default function Sidebar({ isOpen = false, onToggle }: SidebarProps) {
	const handleItemClick = () => {
		if (window.innerWidth < 1024) {
			if (onToggle) onToggle();
		}
	};

	const menuItems = [
		{
			id: 'dashboard',
			name: 'Dashboard',
			icon: '📊',
			href: '/school/dashboard'
		},
		{
			id: 'profile',
			name: 'Profile',
			icon: '🏢',
			href: '/school/profile'
		},
		{
			id: 'students',
			name: 'Students',
			icon: '👨‍🎓',
			href: '/school/students'
		},
		{
			id: 'subjects',
			name: 'Subjects',
			icon: '📚',
			href: '/school/subjects'
		},
		{
			id: 'results',
			name: 'Results',
			icon: '📝',
			href: '/school/results'
		},
		{
			id: 'reports',
			name: 'Reports',
			icon: '📋',
			href: '/school/reports'
		},
		{
			id: 'classes',
			name: 'Classes',
			icon: '🏫',
			href: '/school/classes'
		},
		{
			id: 'staff',
			name: 'Staff',
			icon: '👥',
			href: '/school/staff'
		},
		{
			id: 'finance',
			name: 'Finance',
			icon: '💰',
			href: '/school/finance'
		}
	];

		return (
		<>
			{/* Mobile sidebar */}
			<div className={`fixed top-0 left-0 h-screen bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
				isOpen ? 'translate-x-0' : '-translate-x-full'
			} w-64 lg:hidden`}>
				
				{/* Header */}
				<div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
								<span className="text-lg">🎓</span>
							</div>
							<div>
								<h3 className="font-semibold text-sm">Result Admin</h3>
								<p className="text-xs text-blue-200">School Management</p>
							</div>
						</div>
						
						{/* Mobile close button */}
						<button
							onClick={onToggle}
							className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				{/* Navigation */}
				<nav className="flex-1 p-4 space-y-2 overflow-y-auto">
					{menuItems.map((item) => (
						<NavLink
							key={item.id}
							to={item.href}
							onClick={handleItemClick}
							className={({ isActive }) =>
								`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
									isActive
										? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
										: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
								}`
							}
						>
							{({ isActive }) => (
								<>
									<span className={`text-lg ${isActive ? 'text-blue-700' : 'text-gray-400'}`}>
										{item.icon}
									</span>
									<span className="font-medium">{item.name}</span>
								</>
							)}
						</NavLink>
					))}
				</nav>
				
			</div>

			{/* Mobile overlay */}
			{isOpen && (
				<div 
					className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
					onClick={onToggle}
				/>
			)}

			{/* Desktop sidebar */}
			<aside className="hidden lg:block w-64 shrink-0 border-r border-gray-200 bg-white min-h-screen sticky top-0">
				<div className="h-14 flex items-center px-4 border-b border-gray-200">
					<span className="text-base font-semibold">Result Admin</span>
				</div>
				<nav className="p-3 space-y-1">
					<NavLink to="/school/dashboard" className={navLinkClass}>
						<span>📊</span>
						<span>Dashboard</span>
					</NavLink>
					<NavLink to="/school/students" className={navLinkClass}>
						<span>👨‍🎓</span>
						<span>Students</span>
					</NavLink>
					<NavLink to="/school/classes" className={navLinkClass}>
						<span>🏫</span>
						<span>Classes</span>
					</NavLink>
					<NavLink to="/school/subjects" className={navLinkClass}>
						<span>📚</span>
						<span>Subjects</span>
					</NavLink>
					{/*<NavLink to="/school/results" className={navLinkClass}>
						<span>📝</span>
						<span>Results</span>
					</NavLink>*/}
					<NavLink to="/school/reports" className={navLinkClass}>
						<span>📋</span>
						<span>Reports</span>
					</NavLink>
					<NavLink to="/school/staff" className={navLinkClass}>
						<span>👥</span>
						<span>Staff</span>
					</NavLink>
					<NavLink to="/school/finance" className={navLinkClass}>
						<span>💰</span>
						<span>Finance</span>
					</NavLink>
					<NavLink to="/school/profile" className={navLinkClass}>
						<span>🏢</span>
						<span>Profile</span>
					</NavLink>	
				</nav>
			</aside>
		</>
	)
}

