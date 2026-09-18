import { useState } from 'react'
import { Scales, CheckCircle, Sparkle, HandCoins } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatCurrency } from '../../../utils/formatters'
import { useUIStore } from '../../../store/useUIStore'

export function SettlementSummary({ trip }) {
  const [showEmptyOverride, setShowEmptyOverride] = useState(false)
  const showToast = useUIStore((s) => s.showToast)
  const settlements = trip.sampleSettlements || []

  const handleSettleUp = () => {
    showToast('Settlement algorithm and marking payments ready in Phase 2!', 'info')
  }

  if (showEmptyOverride || settlements.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmptyOverride(false)}
            className="text-xs"
          >
            Show demo settlements
          </Button>
        </div>
        <EmptyState
          icon={Scales}
          title="Nobody owes anybody... yet."
          description="Either everyone has paid exactly their fair share, or the bills haven't hit the table yet. Enjoy the temporary peace!"
          badgeText="All Settled"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
            Settlement Plan
          </h2>
          <p className="text-sm text-zinc-600">
            Smart debt simplification: minimal transactions to get everyone squared up.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmptyOverride(true)}
            className="text-xs"
          >
            Toggle Empty State
          </Button>
        </div>
      </div>

      {trip.isDemo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 rounded-2xl text-xs font-bold text-amber-900 border border-amber-300">
          <Sparkle className="w-4 h-4 text-amber-600" weight="fill" />
          <span>Showing sample UI settlement paths. Optimized graph engine activates in Phase 2.</span>
        </div>
      )}

      <div className="space-y-3">
        {settlements.map((item) => (
          <Card key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 border-2 border-zinc-900 text-teal-800 flex items-center justify-center font-black shrink-0 shadow-playful-sm">
                <HandCoins className="w-6 h-6" weight="bold" />
              </div>

              <div className="flex items-center gap-2 text-sm sm:text-base font-black text-zinc-900 flex-wrap">
                <span className="px-3 py-1 bg-zinc-100 border border-zinc-300 rounded-xl">
                  {item.from}
                </span>
                <span className="text-xs font-extrabold text-zinc-400 uppercase">owes</span>
                <span className="px-3 py-1 bg-orange-100 border border-orange-300 text-orange-950 rounded-xl">
                  {item.to}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100">
              <span className="text-xl font-black text-zinc-900">
                {formatCurrency(item.amount, trip.currency)}
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={CheckCircle}
                onClick={handleSettleUp}
              >
                Mark Paid
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
