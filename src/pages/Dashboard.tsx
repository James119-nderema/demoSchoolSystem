"use client"

import Dashboard from '../components/school/dashboard/Dashboard'
import { useSearchParams } from 'react-router-dom'

interface DashboardFilters {
	classId: string | null
	term: string | null
}

export default function DashboardPage() {
	const [params] = useSearchParams()
	const filters: DashboardFilters = {
		classId: params.get('classId'),
		term: params.get('term'),
	}
	// Note: Dashboard component doesn't currently use filters
	// They could be passed to the Dashboard component if needed in the future
	console.log('Dashboard filters:', filters);
	return <Dashboard />
}

