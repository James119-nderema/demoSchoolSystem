import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
	`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
		isActive
			? 'bg-blue-600 text-white'
			: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
	}`

export default function Sidebar() {
	const navigate = useNavigate()
	const [classId, setClassId] = useState('')
	const [term, setTerm] = useState('')

	const applyFilters = () => {
		const params = new URLSearchParams()
		if (classId) params.set('classId', classId)
		if (term) params.set('term', term)
		const qs = params.toString()
		navigate(qs ? `/dashboard?${qs}` : '/dashboard')
	}

	return (
		<aside className="w-64 shrink-0 border-r border-gray-200 bg-white min-h-screen sticky top-0">
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
				<NavLink to="/school/subjects" className={navLinkClass}>
					<span>📚</span>
					<span>Subjects</span>
				</NavLink>
				<NavLink to="/school/results" className={navLinkClass}>
					<span>📝</span>
					<span>Results</span>
				</NavLink>
				<NavLink to="/school/classes" className={navLinkClass}>
					<span>🏫</span>
					<span>Classes</span>
				</NavLink>
				<NavLink to="/school/staff" className={navLinkClass}>
					<span>👥</span>
					<span>Staff</span>
				</NavLink>
				<NavLink to="/school/finance" className={navLinkClass}>
					<span>👥</span>
					<span>Finance</span>
				</NavLink>	
			</nav>

			{/* Quick Filters for Dashboard (use query params) */}
			<div className="px-3 pb-4">
				<div className="mt-4 rounded-md border border-gray-200 p-3 bg-gray-50">
					<div className="text-xs font-semibold text-gray-600 mb-2">Quick Filters</div>
					<label className="block text-xs text-gray-600 mb-1" htmlFor="classId">Class</label>
					<select
						id="classId"
						className="w-full mb-2 rounded-md border-gray-300 text-sm"
						value={classId}
						onChange={(e) => setClassId(e.target.value)}
					>
						<option value="">All</option>
						<option value="SS2A">SS2A</option>
						<option value="SS2B">SS2B</option>
						<option value="SS2C">SS2C</option>
					</select>

					<label className="block text-xs text-gray-600 mb-1" htmlFor="term">Term</label>
					<input
						id="term"
						placeholder="e.g. 2024/2025 - Term 3"
						className="w-full mb-3 rounded-md border-gray-300 text-sm"
						value={term}
						onChange={(e) => setTerm(e.target.value)}
					/>

					<button
						onClick={applyFilters}
						className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 text-white text-sm font-medium h-9 hover:bg-blue-700"
					>
						Apply to Dashboard
					</button>
				</div>
			</div>
		</aside>
	)
}

