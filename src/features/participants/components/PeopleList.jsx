import { useState } from 'react'
import { Users, UserPlus, Sparkle } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { useUIStore } from '../../../store/useUIStore'

export function PeopleList({ trip }) {
  const [showEmptyOverride, setShowEmptyOverride] = useState(false)
  const showToast = useUIStore((s) => s.showToast)
  const people = trip.people || []

  const handleAddPerson = () => {
    showToast('Inviting trip members will be available in Phase 2!', 'info')
  }

  if (showEmptyOverride || people.length <= 1) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmptyOverride(false)}
            className="text-xs"
          >
            Show demo squad
          </Button>
        </div>
        <EmptyState
          icon={Users}
          title="A trip with just you? Technically possible."
          description="Solo travel has its perks, but splitting bills with yourself is pretty boring. Add friends to share the load."
          actionLabel="Add a friend"
          onAction={handleAddPerson}
          badgeText="Solo Mode"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
            Trip Members ({people.length})
          </h2>
          <p className="text-sm text-zinc-600">
            Everyone sharing costs on this journey.
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
          <Button
            variant="primary"
            size="md"
            icon={UserPlus}
            onClick={handleAddPerson}
          >
            Invite Friend
          </Button>
        </div>
      </div>

      {trip.isDemo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 rounded-2xl text-xs font-bold text-amber-900 border border-amber-300">
          <Sparkle className="w-4 h-4 text-amber-600" weight="fill" />
          <span>Showing sample squad members. Member invites activate in Phase 2.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {people.map((person) => (
          <Card key={person.id} className="p-5 flex items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: person.avatarBg || '#f97316' }}
                className="w-12 h-12 rounded-2xl border-2 border-zinc-900 text-white flex items-center justify-center text-base font-black shadow-playful-sm"
              >
                {person.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-black text-zinc-900 flex items-center gap-1.5">
                  {person.name}
                  {person.isCurrentUser && (
                    <Badge variant="orange" className="text-[10px] py-0.5">
                      You
                    </Badge>
                  )}
                </h4>
                <p className="text-xs text-zinc-500 font-semibold">Active Member</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
