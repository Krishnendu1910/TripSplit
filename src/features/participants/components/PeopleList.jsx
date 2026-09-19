import { useState } from 'react'
import { Users, UserPlus, PencilSimple, Trash } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { useParticipantStore } from '../../../store/useParticipantStore'
import { AddPersonModal } from './AddPersonModal'
import { EditPersonModal } from './EditPersonModal'
import { RemovePersonModal } from './RemovePersonModal'

export function PeopleList({ trip }) {
  const allParticipants = useParticipantStore((s) => s.participants)
  const participants = allParticipants.filter((p) => p.tripId === trip.id)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)
  const [removingPerson, setRemovingPerson] = useState(null)

  const count = participants.length

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight uppercase">
              {"WHO'S ON THIS TRIP?"}
            </h2>
            <Badge variant="teal">
              {count} {count === 1 ? 'person' : 'people'}
            </Badge>
          </div>
          <p className="text-sm text-zinc-600 mt-1">
            Everyone sharing costs on this journey.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={UserPlus}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Person
        </Button>
      </div>

      {/* Empty State vs Member Cards */}
      {count === 0 ? (
        <EmptyState
          icon={Users}
          title="A trip with just you? Technically possible."
          description="Solo travel has its perks, but splitting bills with yourself is pretty boring. Add friends to share the load."
          actionLabel="Add a friend"
          onAction={() => setIsAddModalOpen(true)}
          badgeText="Solo Mode"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((person) => (
            <Card
              key={person.id}
              className="p-5 flex items-center justify-between gap-3 bg-white"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div
                  style={{ backgroundColor: person.avatarBg || '#f97316' }}
                  className="w-12 h-12 rounded-2xl border-2 border-zinc-900 text-white flex items-center justify-center text-lg font-black shadow-playful-sm shrink-0"
                >
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-zinc-900 truncate">
                    {person.name}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-tight">
                    {"Add expenses to see this person's balance."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingPerson(person)}
                  aria-label={`Edit ${person.name}`}
                  className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  <PencilSimple className="w-4 h-4" weight="bold" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setRemovingPerson(person)}
                  aria-label={`Remove ${person.name}`}
                  className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <Trash className="w-4 h-4" weight="bold" aria-hidden="true" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddPersonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tripId={trip.id}
      />

      <EditPersonModal
        isOpen={Boolean(editingPerson)}
        onClose={() => setEditingPerson(null)}
        participant={editingPerson}
      />

      <RemovePersonModal
        isOpen={Boolean(removingPerson)}
        onClose={() => setRemovingPerson(null)}
        participant={removingPerson}
      />
    </div>
  )
}
