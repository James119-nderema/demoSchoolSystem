import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Outlet />
    </div>
  )
}
