'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type FC, useState } from 'react'
import { useDashboard } from '@/features/dashboard/context'
import { defaultErrorToast, useToast } from '@/lib/hooks/use-toast'
import { formatDate } from '@/lib/utils/formatting'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/ui/primitives/button'
import { Dialog, DialogContent } from '@/ui/primitives/dialog'
import { CopyIcon } from '@/ui/primitives/icons'
import { CreatedKeyReveal } from './created-key-reveal'

/** Default name for keys minted via the one-click create-and-copy flow. */
const buildQuickKeyName = (): string => {
  const today = formatDate(new Date(), 'MMM d, yyyy')
  return today ? `Quick key · ${today}` : 'Quick key'
}

/**
 * One-click "Create & copy key": mints a fresh key and drops straight into the
 * reveal dialog showing the full secret.
 *
 * The full secret is never re-viewable, so there is no existing key to copy —
 * the only deterministic way to hand a working secret to a human (or a browser
 * agent) is to create one. This flow surfaces exactly one copyable token, the
 * real key, so it cannot be confused with the key ID.
 */
export const CreateAndCopyKeyButton: FC = () => {
  const { team } = useDashboard()
  const { toast } = useToast()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [createdName, setCreatedName] = useState<string | null>(null)

  const listQueryKey = trpc.teams.listApiKeys.queryOptions({
    teamSlug: team.slug,
  }).queryKey

  const createMutation = useMutation(
    trpc.teams.createApiKey.mutationOptions({
      onSuccess: (data) => {
        if (data.createdApiKey?.key) {
          setCreatedKey(data.createdApiKey.key)
          setCreatedName(data.createdApiKey.name ?? '')
        }
        void queryClient.invalidateQueries({ queryKey: listQueryKey })
      },
      onError: (err) => {
        toast(defaultErrorToast(err.message || 'Failed to create API key.'))
      },
    })
  )

  const handleRevealChange = (open: boolean) => {
    if (!open) {
      setCreatedKey(null)
      setCreatedName(null)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="h-9 w-full shrink-0 gap-2 font-sans normal-case md:w-auto md:self-start"
        disabled={createMutation.isPending}
        loading={createMutation.isPending ? 'Creating' : undefined}
        onClick={() =>
          createMutation.mutate({
            teamSlug: team.slug,
            name: buildQuickKeyName(),
          })
        }
      >
        <CopyIcon className="size-4" aria-hidden />
        Create & copy key
      </Button>

      <Dialog open={createdKey != null} onOpenChange={handleRevealChange}>
        <DialogContent>
          {createdKey != null && (
            <CreatedKeyReveal apiKey={createdKey} keyName={createdName} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
