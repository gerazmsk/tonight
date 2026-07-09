import { Link } from 'react-router-dom'
import { Moon, Shield, MapPinOff, Heart } from 'lucide-react'
import { Button } from '../components/Button'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-tonight-bg text-white">
      <header className="mx-auto flex max-w-lg items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <Moon className="text-tonight-accent" size={22} />
          Tonight
        </div>
        <Link to="/login" className="text-sm text-tonight-muted hover:text-white">Log in</Link>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-12">
        <section className="py-10 text-center">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Meet people who are actually open to meeting tonight.
          </h1>
          <p className="mt-4 text-tonight-muted leading-relaxed">
            A dating app built for real life. Browse, match, and discover people going out near you — with privacy-first live visibility.
          </p>
          <Link to="/signup" className="mt-8 block">
            <Button fullWidth className="!text-base">Join Tonight</Button>
          </Link>
        </section>

        <section className="mt-8 space-y-4">
          <FeatureCard
            icon={<Heart className="text-tonight-accent" size={22} />}
            title="Dating that does not stop at chatting"
            text="Most dating apps create endless conversations. Tonight helps people connect when they are actually out and open to meeting."
          />
          <FeatureCard
            icon={<Shield className="text-tonight-accent" size={22} />}
            title="Women control visibility"
            text="Women are private by default and decide who can see their live presence."
          />
          <FeatureCard
            icon={<MapPinOff className="text-tonight-accent" size={22} />}
            title="No exact location sharing"
            text="The app shows venues and approximate presence, never a precise live location."
          />
        </section>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-tonight-border bg-tonight-card p-5">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-tonight-muted leading-relaxed">{text}</p>
    </div>
  )
}
