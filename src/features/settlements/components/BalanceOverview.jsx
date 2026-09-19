import { ArrowUpRight, ArrowDownLeft } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency } from '../../../utils/formatters'

/**
 * Renders the high-level summary of who owes money and who receives money.
 * Does not assume any fake "you" or logged-in identity.
 *
 * @param {{
 *   balancesList: Array<Object>,
 *   currency: string
 * }} props
 */
export function BalanceOverview({ balancesList = [], currency = 'INR' }) {
  const debtors = balancesList
    .filter((b) => b.netMinor < 0)
    .sort((a, b) => a.netMinor - b.netMinor)

  const creditors = balancesList
    .filter((b) => b.netMinor > 0)
    .sort((a, b) => b.netMinor - a.netMinor)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Debtors Column */}
      <Card className="p-5 bg-white border-2 border-zinc-900 shadow-playful">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b-2 border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 border-2 border-zinc-900 flex items-center justify-center font-black shrink-0">
              <ArrowUpRight className="w-5 h-5" weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 tracking-tight">
                Who needs to pay
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Members with outstanding obligations
              </p>
            </div>
          </div>
          <Badge variant="rose" className="text-[11px] font-bold">
            {debtors.length} {debtors.length === 1 ? 'person' : 'people'}
          </Badge>
        </div>

        {debtors.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-3 text-center">
            No one owes any money.
          </p>
        ) : (
          <ul className="space-y-2.5" aria-label="Members who need to pay">
            {debtors.map((b) => (
              <li
                key={b.participantId}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-50 border border-zinc-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-rose-200 border border-zinc-900 text-zinc-900 font-black text-xs flex items-center justify-center shrink-0">
                    {b.name ? b.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <span className="font-extrabold text-sm text-zinc-900 truncate">
                    {b.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                    owes {formatCurrency(Math.abs(b.net), currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Creditors Column */}
      <Card className="p-5 bg-white border-2 border-zinc-900 shadow-playful">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b-2 border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 border-2 border-zinc-900 flex items-center justify-center font-black shrink-0">
              <ArrowDownLeft className="w-5 h-5" weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 tracking-tight">
                Who receives
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Members who paid more than their share
              </p>
            </div>
          </div>
          <Badge variant="teal" className="text-[11px] font-bold">
            {creditors.length} {creditors.length === 1 ? 'person' : 'people'}
          </Badge>
        </div>

        {creditors.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-3 text-center">
            No one is owed any money.
          </p>
        ) : (
          <ul className="space-y-2.5" aria-label="Members who receive money">
            {creditors.map((b) => (
              <li
                key={b.participantId}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-50 border border-zinc-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-teal-200 border border-zinc-900 text-zinc-900 font-black text-xs flex items-center justify-center shrink-0">
                    {b.name ? b.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <span className="font-extrabold text-sm text-zinc-900 truncate">
                    {b.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                    receives {formatCurrency(b.net, currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
