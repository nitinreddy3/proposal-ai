import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Sparkles, PenTool, Download } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-lg font-bold tracking-tight">ProposalAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button render={<Link href="/login" />}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Sparkles className="h-4 w-4" />
            Powered by GPT-4o
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Write winning proposals{' '}
            <span className="text-primary/70">in minutes, not hours</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter your project details, let AI craft a professional proposal,
            refine it in a rich editor, and export a polished PDF — all in one
            seamless workflow.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" render={<Link href="/login" />}>
              Start Writing Free
            </Button>
            <Button size="lg" variant="outline" render={<Link href="#features" />}>
              See How It Works
            </Button>
          </div>
        </section>

        <section id="features" className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to create standout proposals
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-primary" />}
              title="AI-Powered Generation"
              description="Provide your project context and let GPT-4o generate a comprehensive, persuasive proposal with all the right sections."
            />
            <FeatureCard
              icon={<PenTool className="h-8 w-8 text-primary" />}
              title="Rich Text Editor"
              description="Refine every word with a full-featured editor. Bold, italicize, restructure — make the proposal truly yours."
            />
            <FeatureCard
              icon={<Download className="h-8 w-8 text-primary" />}
              title="One-Click PDF Export"
              description="Export a professionally formatted PDF ready to send to your client. Clean typography, consistent branding."
            />
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ProposalAI. All rights reserved.</p>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border p-6 text-left">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
