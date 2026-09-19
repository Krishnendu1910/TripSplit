import { Compass, House, AirplaneTilt } from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <Card className="max-w-md w-full text-center p-8 sm:p-10 bg-white border-3 border-zinc-900 shadow-playful-lg">
        {/* Playful compass badge */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-100 border-2 border-zinc-900 rounded-3xl shadow-playful flex items-center justify-center text-orange-600 mx-auto mb-6 animate-float">
          <AirplaneTilt className="w-10 h-10 sm:w-12 sm:h-12" weight="duotone" />
        </div>

        <span className="text-xs font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 inline-block mb-3">
          Error 404
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight mb-2">
          Looks like this page went on a trip without us.
        </h1>

        <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
          The destination you&apos;re looking for doesn&apos;t exist on our map. Either it took a wrong turn at Goa or was never packed in the first place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button to="/" variant="primary" size="md" icon={House} className="w-full sm:w-auto">
            Back to Safety
          </Button>
          <Button to="/trips" variant="outline" size="md" icon={Compass} className="w-full sm:w-auto">
            Explore Trips
          </Button>
        </div>
      </Card>
    </div>
  )
}
