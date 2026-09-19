import { Users, CheckCircle, ArrowUpRight, ArrowDownLeft } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency } from '../../../utils/formatters'

/**
 * Compact, card-based participant balance summary.
 * Displays Paid, Share (Owed), and Net balance for each squad member without
 * resembling a boring spreadsheet.
 *
 * @param {{
 *   balancesList: Array<Object>,
 *   currency: string
 * }} props
 */
export function ParticipantBalanceList({ balancesList = [], currency = 'INR' }) {
  if (balancesList.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-purple-200 border-2 border-zinc-900 text-zinc-950 flex items-center justify-center font-black shadow-playful-sm">
          <Users className="w-5 h-5" weight="bold" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
            Squad Balances
          </h3>
          <p className="text-xs text-zinc-500 font-medium">
            Complete participant breakdown: what everyone put in vs. their fair share
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
        role="list"
        aria-label="Squad participant balances"
      >
        {balancesList.map((p) => {
          const isCreditor = p.status === 'receives'
          const isDebtor = p.status === 'owes'
          const isSettled = p.status === 'settled'

          return (
            <Card
              key={p.participantId}
              className="p-4 bg-white border-2 border-zinc-900 shadow-playful flex flex-col justify-between gap-3"
            >
              {/* Header: Name and Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-2xl border-2 border-zinc-900 font-black text-xs flex items-center justify-center shrink-0 ${
                      isCreditor
                        ? 'bg-teal-200 text-teal-950'
                        : isDebtor
                          ? 'bg-rose-200 text-rose-950'
                          : 'bg-zinc-200 text-zinc-800'
                    }`}
                  >
                    {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 truncate">
                      {p.name}
                    </h4>
                    <span className="text-[11px] font-bold text-zinc-500">
                      {isCreditor && 'Gets back'}
                      {isDebtor && 'Needs to pay'}
                      {isSettled && 'All square'}
                    </span>
                  </div>
                </div>

                {isCreditor && (
                  <Badge variant="teal" icon={ArrowDownLeft} className="shrink-0 text-xs font-black">
                    Receives {formatCurrency(p.net, currency)}
                  </Badge>
                )}
                {isDebtor && (
                  <Badge variant="rose" icon={ArrowUpRight} className="shrink-0 text-xs font-black">
                    Owes {formatCurrency(Math.abs(p.net), currency)}
                  </Badge>
                )}
                {isSettled && (
                  <Badge variant="default" icon={CheckCircle} className="shrink-0 text-xs font-black">
                    Settled
                  </Badge>
                )}
              </div>

              {/* Financial Metrics Row */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-100 bg-zinc-50/70 -mx-4 -mb-4 p-3 rounded-b-2xl">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Paid
                  </span>
                  <span className="text-xs sm:text-sm font-black text-zinc-800">
                    {formatCurrency(p.paid, currency)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Share
                  </span>
                  <span className="text-xs sm:text-sm font-black text-zinc-800">
                    {formatCurrency(p.owed, currency)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Net
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-black ${
                      isCreditor
                        ? 'text-teal-700'
                        : isDebtor
                          ? 'text-rose-700'
                          : 'text-zinc-600'
                    }`}
                  >
                    {isCreditor && `+${formatCurrency(p.net, currency)}`}
                    {isDebtor && `-${formatCurrency(Math.abs(p.net), currency)}`}
                    {isSettled && formatCurrency(0, currency)}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

