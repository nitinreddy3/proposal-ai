import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileX } from 'lucide-react'

export default function ProposalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <FileX className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h2 className="text-xl font-bold mb-2">Proposal Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The proposal you are looking for does not exist or has been deleted.
      </p>
      <Button render={<Link href="/dashboard" />}>
        Back to Dashboard
      </Button>
    </div>
  )
}
