import { HandCoins, CheckCircle } from '@phosphor-icons/react'
import { Badge } from '../../../components/ui/Badge'
import { SettlementCard } from './SettlementCard'

/**
 * Container rendering the ordered lists of pending and completed settlements.
 *
 * @param {{
 *   settlements?: Array<Object>,
 *   pendingSettlements?: Array<Object>,
 *   completedSettlements?: Array<Object>,
 *   balances: Record<string, Object>,
 *   currency?: string,
 *   onMarkPaid?: (settlement: Object) => void
 * }} props
 */
export function SettlementList({
  settlements = [],
  pendingSettlements,
  completedSettlements = [],
  balances = {},
  currency = 'INR',
  onMarkPaid,
}) {
  // If pendingSettlements is not explicitly passed, fallback to settlements
  const pending = pendingSettlements !== undefined ? pendingSettlements : settlements
  const completed = completedSettlements || []

  if (pending.length === 0 && completed.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 1. Pending Payments Section */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-300 border-2 border-zinc-900 text-zinc-950 flex items-center justify-center font-black shadow-playful-sm">
                <HandCoins className="w-5 h-5" weight="bold" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
                  Pending Payments
                </h3>
                <span className="text-xs text-zinc-500 font-bold block -mt-0.5">
                  Optimized Settlements
                </span>
              </div>
            </div>

            <Badge variant="yellow" className="text-xs font-black self-start sm:self-auto">
              {pending.length} {pending.length === 1 ? 'payment' : 'payments'} to settle this trip
            </Badge>
          </div>

          <div className="space-y-3" role="list" aria-label="Pending settlement payments list">
            {pending.map((settlement, index) => (
              <SettlementCard
                key={`pending-${settlement.from}-${settlement.to}-${index}`}
                settlement={settlement}
                balances={balances}
                currency={currency}
                isPaid={false}
                onMarkPaid={onMarkPaid}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. Completed Payments Section */}
      {completed.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-200 border-2 border-zinc-900 text-zinc-950 flex items-center justify-center font-black shadow-playful-sm">
                <CheckCircle className="w-5 h-5" weight="bold" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
                Completed Payments
              </h3>
            </div>

            <Badge variant="teal" className="text-xs font-black self-start sm:self-auto">
              {completed.length} {completed.length === 1 ? 'payment' : 'payments'} completed
            </Badge>
          </div>

          <div className="space-y-3" role="list" aria-label="Completed settlement payments list">
            {completed.map((settlement, index) => (
              <SettlementCard
                key={`completed-${settlement.from}-${settlement.to}-${index}`}
                settlement={settlement}
                balances={balances}
                currency={currency}
                isPaid={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
