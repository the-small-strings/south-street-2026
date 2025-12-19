import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MusicNote } from '@phosphor-icons/react'

export function Home() {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-8">
			<Card className="p-8 max-w-md text-center">
				<MusicNote size={48} className="mx-auto mb-4 text-primary" />
				<h1 className="text-3xl font-bold mb-4">Welcome to<br />The Small Strings<br /> vs <br />The Audience</h1>
				<p className="text-muted-foreground mb-6">
					Audience interaction and high-energy music collide.
				</p>
				<div className="space-y-3">
					<a href="/band" target="_blank" rel="noopener noreferrer">
						<Button size="lg" className="w-full">
							Go to Band View
						</Button>
					</a>
					<a href="/audience" target="_blank" rel="noopener noreferrer">
						<Button size="lg" variant="outline" className="w-full">
							Go to Audience View
						</Button>
					</a>
				</div>
			</Card>
		</div>
	)
}
