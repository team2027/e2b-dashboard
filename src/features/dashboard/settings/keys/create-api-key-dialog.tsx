'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type FC, type ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { CreateApiKeySchema } from '@/core/modules/keys/schemas'
import { useDashboard } from '@/features/dashboard/context'
import { defaultErrorToast, useToast } from '@/lib/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/ui/primitives/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/primitives/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/ui/primitives/form'
import { AddIcon } from '@/ui/primitives/icons'
import { Input } from '@/ui/primitives/input'
import { Label } from '@/ui/primitives/label'
import { CreatedKeyReveal } from './created-key-reveal'

type FormValues = z.infer<typeof CreateApiKeySchema>

interface CreateApiKeyDialogProps {
  children?: ReactNode
}

export const CreateApiKeyDialog: FC<CreateApiKeyDialogProps> = ({
  children,
}) => {
  'use no memo'

  const { team } = useDashboard()
  const [open, setOpen] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [createdName, setCreatedName] = useState<string | null>(null)

  const { toast } = useToast()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const listQueryKey = trpc.teams.listApiKeys.queryOptions({
    teamSlug: team.slug,
  }).queryKey

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateApiKeySchema),
    defaultValues: {
      name: '',
    },
  })

  const nameDraft = form.watch('name')
  const canSubmit = nameDraft.trim().length > 0

  const createMutation = useMutation(
    trpc.teams.createApiKey.mutationOptions({
      onSuccess: (data) => {
        if (data.createdApiKey?.key) {
          setCreatedKey(data.createdApiKey.key)
          setCreatedName(data.createdApiKey.name ?? '')
          form.reset()
        }
        void queryClient.invalidateQueries({ queryKey: listQueryKey })
      },
      onError: (err) => {
        toast(defaultErrorToast(err.message || 'Failed to create API key.'))
      },
    })
  )

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) {
      form.reset()
      setCreatedKey(null)
      setCreatedName(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            type="button"
            className="h-9 w-full shrink-0 gap-2 font-sans normal-case md:w-auto md:self-start"
          >
            <AddIcon className="size-4" aria-hidden />
            Create a key
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        {!createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>Create new key</DialogTitle>
              <DialogDescription className="sr-only">
                Enter a name and create a new API key for this team.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => {
                  createMutation.mutate({
                    teamSlug: team.slug,
                    name: values.name,
                  })
                })}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="sr-only" htmlFor={field.name}>
                        Key name
                      </Label>
                      <div className="flex items-stretch gap-1 py-1">
                        <FormControl>
                          <Input
                            id={field.name}
                            className={cn(
                              'h-9 min-h-9 flex-1 rounded-none border-stroke bg-bg font-sans text-sm normal-case',
                              'placeholder:text-fg-tertiary'
                            )}
                            placeholder="Enter key name"
                            autoComplete="off"
                            data-1p-ignore
                            data-form-type="other"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="submit"
                          variant={canSubmit ? 'primary' : 'secondary'}
                          className="h-9 shrink-0 gap-1 px-3 font-sans normal-case"
                          disabled={!canSubmit || createMutation.isPending}
                          loading={
                            createMutation.isPending ? 'Creating' : undefined
                          }
                        >
                          <AddIcon className="size-4" aria-hidden />
                          Create
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </>
        ) : (
          <CreatedKeyReveal apiKey={createdKey} keyName={createdName} />
        )}
      </DialogContent>
    </Dialog>
  )
}
