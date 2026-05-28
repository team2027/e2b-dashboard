'use client'

import { usePostHog } from 'posthog-js/react'
import { type FC, useEffect, useRef } from 'react'
import { useClipboard } from '@/lib/hooks/use-clipboard'
import { Button } from '@/ui/primitives/button'
import {
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/primitives/dialog'
import { CheckIcon, CopyIcon, WarningIcon } from '@/ui/primitives/icons'
import { Input } from '@/ui/primitives/input'
import { Label } from '@/ui/primitives/label'

interface CreatedKeyRevealProps {
  /** The full, unmasked secret API key — shown once. */
  apiKey: string
  /** Optional key name, used to title the reveal. */
  keyName?: string | null
}

/**
 * The one-time reveal of a freshly created secret API key.
 *
 * Built to be unambiguous for both humans and browser agents extracting the
 * key: the field carries the full unmasked value (clipboard- and DOM-readable),
 * is auto-selected on mount, and is labelled explicitly as the secret — never
 * the key ID. Render inside a `DialogContent`.
 */
export const CreatedKeyReveal: FC<CreatedKeyRevealProps> = ({
  apiKey,
  keyName,
}) => {
  const posthog = usePostHog()
  const [copied, copy] = useClipboard()
  const inputRef = useRef<HTMLInputElement>(null)

  // Select the secret on reveal so a single Cmd/Ctrl+C — or a browser agent
  // reading the DOM value — lands on the full key, not the ID.
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.select()
  }, [])

  const title =
    keyName != null && keyName.length > 0
      ? `${keyName.toUpperCase()} KEY CREATED`
      : 'API KEY CREATED'

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Your new API key is shown once. Copy it before closing.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label className="sr-only" htmlFor="created-api-key-value">
          Your new API key — copy this value
        </Label>
        <div className="flex gap-1">
          <Input
            ref={inputRef}
            id="created-api-key-value"
            readOnly
            aria-label="Your new API key — copy this value"
            value={apiKey}
            onFocus={(e) => e.currentTarget.select()}
            className="border-stroke h-9 min-h-0 flex-1 rounded-none border font-mono text-sm"
          />
          <Button
            type="button"
            variant="primary"
            aria-label="Copy API key"
            className="h-9 shrink-0 gap-1.5 px-3 font-sans normal-case active:translate-y-0"
            onClick={() => {
              void copy(apiKey)
              posthog.capture('copied API key')
            }}
          >
            <span
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center"
              aria-hidden
            >
              {copied ? (
                <CheckIcon className="size-5" />
              ) : (
                <CopyIcon className="size-4" />
              )}
            </span>
            Copy
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="bg-accent-warning-bg/90 flex w-fit items-center gap-0.5 py-0.5 pr-1.5 pl-0.5">
            <WarningIcon
              className="text-accent-warning-highlight size-3 shrink-0"
              aria-hidden
            />
            <span className="text-accent-warning-highlight prose-label uppercase">
              Important
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <p className="text-fg prose-body min-w-0 flex-1">
              Copy the key now. You won&apos;t be able to view it again. This is
              your secret API key — not the key ID shown in the table.
            </p>
            <DialogClose asChild>
              <Button
                type="button"
                variant="tertiary"
                className="text-fg-tertiary hover:text-fg shrink-0 font-sans text-sm font-medium normal-case"
              >
                Close
              </Button>
            </DialogClose>
          </div>
        </div>
      </div>
    </>
  )
}
