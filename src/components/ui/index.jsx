import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function PageSpinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function SectionHeader({ title, seeAllLink }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold text-lg text-gray-900">{title}</h2>
      {seeAllLink && (
        <Link to={seeAllLink} className="flex items-center gap-0.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">
          See All <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}
