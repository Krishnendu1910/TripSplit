import { ArrowRight, ArrowDown, CheckCircle } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { formatCurrency } from '../../../utils/formatters'
import { cn } from '../../../lib/utils'

/**
 * Renders an individual settlement transaction card with clear directional
 * indicators, status badges, and screen-reader accessibility.
 *
 * @param {{
 *   settlement: { from: string, to: string, amount: number, amountInMinorUnits: number },
 *   balances: Record<string, Object>,
 *   currency?: string,
 *   isPaid?: boolean,
 *   onMarkPaid?: (settlement: Object) => void
 * }} props
 */
export function SettlementCard({
  settlement,
  balances = {},
  currency = 'INR',
  isPaid = false,
  onMarkPaid,
}) {
  const fromName = balances[settlement.from]?.name || 'Squad member'
  const toName = balances[settlement.to]?.name || 'Squad member'
  const formattedAmount = formatCurrency(settlement.amount, currency)

  const accessibleLabel = `${fromName} pays ${toName} ${formattedAmount}${isPaid ? ' (Paid)' : ''}`

  return (
    <Card
      className={cn(
        'p-4 sm:p-5 border-2 border-zinc-900 shadow-playful hover:shadow-playful-lg transition-all',
        isPaid ? 'bg-teal-50/40 border-teal-900/60' : 'bg-white',
      )}
      aria-label={accessibleLabel}
      tabIndex={0}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Direction Flow Container */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
          {/* Payer */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full border-2 border-zinc-900 text-zinc-950 font-black text-xs flex items-center justify-center shrink-0',
                isPaid ? 'bg-zinc-200' : 'bg-rose-200',
              )}
            >
              {fromName.charAt(0).toUpperCase()}
            </div>
            <span
              className={cn(
                'px-3 py-1.5 border-2 rounded-2xl font-black text-sm sm:text-base',
                isPaid
                  ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
                  : 'bg-rose-50 border-rose-300 text-rose-950',
              )}
            >
              {fromName}
            </span>
          </div>

          {/* Direction Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 text-zinc-500">
            <span className="hidden sm:inline-block">
              <ArrowRight className="w-5 h-5 text-zinc-700" weight="bold" />
            </span>
            <span className="sm:hidden flex items-center gap-1 text-xs font-black text-zinc-600 pl-4 py-1">
              <ArrowDown className="w-4 h-4 text-zinc-700" weight="bold" />
              <span>pays</span>
            </span>
            <span className="hidden sm:inline-block text-xs font-black uppercase text-zinc-400">
              pays
            </span>
          </div>

          {/* Receiver */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full border-2 border-zinc-900 text-zinc-950 font-black text-xs flex items-center justify-center shrink-0',
                isPaid ? 'bg-teal-300' : 'bg-teal-200',
              )}
            >
              {toName.charAt(0).toUpperCase()}
            </div>
            <span className="px-3 py-1.5 bg-teal-50 border-2 border-teal-300 text-teal-950 rounded-2xl font-black text-sm sm:text-base">
              {toName}
            </span>
          </div>
        </div>

        {/* Amount & Action Container */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 shrink-0">
          <div className="text-right">
            <span
              className={cn(
                'text-lg sm:text-2xl font-black tracking-tight',
                isPaid ? 'text-zinc-600' : 'text-zinc-900',
              )}
            >
              {formattedAmount}
            </span>
          </div>

          {isPaid ? (
            <span
              role="status"
              aria-label={`Payment of ${formattedAmount} from ${fromName} to ${toName} is paid`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-teal-100 text-teal-950 border-2 border-teal-700 font-black text-xs shadow-playful-sm select-none"
            >
              <CheckCircle className="w-4 h-4 text-teal-700" weight="fill" aria-hidden="true" />
              <span>✓ Paid</span>
            </span>
          ) : (
            onMarkPaid && (
              <Button
                variant="outline"
                size="sm"
                icon={CheckCircle}
                onClick={() => onMarkPaid(settlement)}
                aria-label="Mark Paid"
                className="text-xs font-extrabold"
              >
                Mark Paid
              </Button>
            )
          )}
        </div>
      </div>
    </Card>
  )
}
