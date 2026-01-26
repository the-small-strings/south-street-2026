import { useEffect, useState, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MusicNote, Trophy, Keyboard, ListChecks, ArrowCounterClockwise, Star, House } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BingoCard, GameState, GigState, SongPage } from '@/lib/types'
import { BingoCardDisplay } from '@/components/BingoCardDisplay'
import { useSocket } from '@/hooks/use-socket'
import * as api from '@/lib/api'

export function Band() {
	const [gameState, setGameState] = useState<GameState | null>(null)
	const [currentInfo, setCurrentInfo] = useState<GigState | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [songRevealed, setSongRevealed] = useState(false)
	const [testPressedKeys, setTestPressedKeys] = useState<string[]>([])

	const [modalOpen, setModalOpen] = useState(false)
	const [selectedSongIndex, setSelectedSongIndex] = useState<number | null>(null)
	const [selectedWinType, setSelectedWinType] = useState<'line' | 'fullhouse' | 'all'>('all')
	const [winningCards, setWinningCards] = useState<{
		lineWinners: BingoCard[]
		fullhouseWinners: BingoCard[]
		revealedSongs: string[]
	} | null>(null)

	const currentSongRef = useRef<HTMLDivElement>(null)

	// Handle test key presses from socket - display locally
	const handleTestKeyPress = useCallback((key: string) => {
		setTestPressedKeys((prev) => [...prev, key])
		setTimeout(() => {
			setTestPressedKeys((prev) => prev.slice(1))
		}, 1000)
	}, [])

	// Handle skip reveal from socket
	const handleSkipReveal = useCallback(() => {
		setSongRevealed(true)
	}, [])

	// Handle game state updates from socket - refresh full state to stay in sync
	const handleGameStateUpdate = useCallback(async (info: GigState) => {
		setCurrentInfo(info)
		setSongRevealed(false)
		// Also refresh full game state to get updated wins, played songs, etc.
		try {
			// TODO update the game state update to send all the needed info to avoid this extra call?
			const fullState = await api.getFullGameState()
			setGameState(fullState)
		} catch (err) {
			console.error('Failed to refresh full state after socket update:', err)
		}
	}, [])
	
	// Socket for emitting skip reveal and test events, and receiving game state updates
	const { emitSkipReveal, emitTestKeyPress } = useSocket({
		onGameStateUpdate: handleGameStateUpdate,
		onSkipReveal: handleSkipReveal,
		onTestKeyPress: handleTestKeyPress,
	})

	// Auto-reveal song after delay (matching FixedSongDisplay's REVEAL_DELAY_MS)
	useEffect(() => {
		const pageType = currentInfo?.currentPage.type
		const currentSong = pageType === 'song' ? (currentInfo?.currentPage as SongPage).song : null
		if (pageType === 'song' && currentSong?.type === 'fixed' && !songRevealed) {
			const timer = setTimeout(() => {
				setSongRevealed(true)
			}, 5000)
			return () => clearTimeout(timer)
		}
	}, [currentInfo?.currentPage, songRevealed])

	// Load initial state
	useEffect(() => {
		const loadInitialState = async () => {
			try {
				setLoading(true)
				const [fullState, current] = await Promise.all([
					api.getFullGameState(),
					api.getCurrentGigState()
				])
				setGameState(fullState)
				setCurrentInfo(current)
				setError(null)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load game state')
			} finally {
				setLoading(false)
			}
		}
		loadInitialState()
	}, [])

	const handleAdvance = useCallback(async () => {
		try {
			await api.advanceToNextSong()
			// State updates handled by socket event
		} catch (err) {
			console.error('Failed to advance:', err)
		}
	}, [])

	const handleGoBack = useCallback(async () => {
		try {
			await api.goToPreviousSong()
			// State updates handled by socket event
		} catch (err) {
			console.error('Failed to go back:', err)
		}
	}, [])

	const handleBattleChoice = useCallback(async (choice: 'A' | 'B') => {
		if (!currentInfo || currentInfo.currentPage.type !== 'song') return
		try {
			await api.setBattleChoice(choice)
			// State updates handled by socket event
		} catch (err) {
			console.error('Failed to set battle choice:', err)
		}
	}, [currentInfo])

	const handleClearBattleChoice = useCallback(async () => {
		if (!currentInfo || currentInfo.currentPage.type !== 'song') return
		try {
			await api.clearBattleChoice()
			// State updates handled by socket event
		} catch (err) {
			console.error('Failed to clear battle choice:', err)
		}
	}, [currentInfo])

	const handleReset = useCallback(async () => {
		try {
			await api.resetGame()
			// State updates handled by socket event
		} catch (err) {
			console.error('Failed to reset:', err)
		}
	}, [])

	// Keyboard handlers
	useEffect(() => {
		const handleKeyDown = async (e: KeyboardEvent) => {
			if (modalOpen) {
				if (e.key === 'Escape') {
					setModalOpen(false)
				}
				return
			}

			if (!currentInfo) return

			const pageType = currentInfo.currentPage.type
			const currentSong = pageType === 'song' ? (currentInfo.currentPage as SongPage).song : null

			// Handle test page keyboard input
			if (pageType === 'test') {
				if (e.key === ' ' || e.key === 'Spacebar') {
					e.preventDefault()
					await handleAdvance()
				} else {
					e.preventDefault()
					const keyLabel = e.key.length === 1 ? e.key.toUpperCase() : e.code
					emitTestKeyPress(keyLabel)
					// Display handled by socket event
				}
				return
			}

			if (e.key === ' ' || e.key === 'Spacebar') {
				e.preventDefault()
				
				// Handle special pages - always allow advancing
				if (pageType === 'welcome' || pageType === 'intro' || pageType === 'setBreak') {
					await handleAdvance()
					return
				}
				
				// Can't advance from end page
				if (pageType === 'end') {
					return
				}
				
				// Song page - check if we can advance
				if (currentSong?.type === 'fixed') {
					// First press: skip reveal delay, second press: advance
					if (!songRevealed) {
						emitSkipReveal()
						// Reveal handled by socket event
					} else {
						await handleAdvance()
					}
				} else if (currentSong?.type === 'battle' && currentSong.selected) {
					await handleAdvance()
				}
			} else if (e.key === 'b' || e.key === 'B') {
				e.preventDefault()
				if (currentSong?.type === 'battle') {
					await handleBattleChoice('B')
				}
			} else if (e.key === 'o' || e.key === 'O') {
				e.preventDefault()
				if (currentSong?.type === 'battle') {
					await handleBattleChoice('A')
				}
			} else if (e.key === 'c' || e.key === 'C') {
				e.preventDefault()
				if (currentSong?.type === 'battle' && currentSong.selected) {
					await handleClearBattleChoice()
				}
			} else if (e.key === 'Backspace') {
				e.preventDefault()
				await handleGoBack()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [currentInfo, modalOpen, handleAdvance, handleGoBack, handleBattleChoice, handleClearBattleChoice, songRevealed, emitSkipReveal, emitTestKeyPress])

	// Scroll current song into view
	useEffect(() => {
		// Use setTimeout to ensure the DOM has updated after state changes
		const timeoutId = setTimeout(() => {
			if (currentSongRef.current) {
				currentSongRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
			}
		}, 100)
		return () => clearTimeout(timeoutId)
	}, [currentInfo?.currentPage.type === 'song' ? (currentInfo.currentPage as SongPage).songNumber : 0, gameState?.playedSongs.length])

	const openWinnersModal = async (songIndex: number, winType: 'line' | 'fullhouse' | 'all' = 'all') => {
		setSelectedSongIndex(songIndex)
		setSelectedWinType(winType)
		try {
			const winners = await api.getWinningCardsForSong(songIndex)
			setWinningCards(winners)
			setModalOpen(true)
		} catch (err) {
			console.error('Failed to load winners:', err)
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-8">
				<Card className="p-8 max-w-md text-center">
					<MusicNote size={48} className="mx-auto mb-4 text-muted-foreground animate-pulse" />
					<h2 className="text-2xl font-semibold mb-2">Loading...</h2>
				</Card>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-8">
				<Card className="p-8 max-w-md text-center">
					<MusicNote size={48} className="mx-auto mb-4 text-destructive" />
					<h2 className="text-2xl font-semibold mb-2">Error</h2>
					<p className="text-muted-foreground">{error}</p>
					<Button onClick={() => window.location.reload()} className="mt-4">
						Retry
					</Button>
				</Card>
			</div>
		)
	}

	if (!gameState || !currentInfo || gameState.songs.length === 0) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-8">
				<Card className="p-8 max-w-md text-center">
					<MusicNote size={48} className="mx-auto mb-4 text-muted-foreground" />
					<h2 className="text-2xl font-semibold mb-2">No Setlist Loaded</h2>
					<p className="text-muted-foreground">
						Configure your songs and bingo cards to get started.
					</p>
				</Card>
			</div>
		)
	}

	const { currentPage, nextPage, actualTotalSongs, progress, isComplete } = currentInfo
	const pageType = currentPage.type
	const isSongPage = pageType === 'song'
	const currentSong = isSongPage ? (currentPage as SongPage).song : null
	const songNumber = isSongPage ? (currentPage as SongPage).songNumber : 0
	const actualSongNumber = isSongPage ? (currentPage as SongPage).actualSongNumber : 0
	// const wins = isSongPage ? (currentPage as SongPage).wins : null
	const wins = isSongPage ? (gameState.winsPerSong[songNumber - 1] ?? null) : null
	const nextSong = nextPage?.type === 'song' ? (nextPage as SongPage).song : null
	const songIndex = songNumber - 1

	const revealedSongs = new Set(winningCards?.revealedSongs ?? [])

	// Helper to get page label for progress display
	const getPageLabel = () => {
		switch (pageType) {
			case 'test': return 'Test Screen'
			case 'welcome': return 'Welcome Screen'
			case 'intro': return 'Intro'
			case 'setBreak': return 'Set Break'
			case 'end': return 'End Screen'
			case 'song': return `Song ${actualSongNumber} of ${actualTotalSongs}`
		}
	}

	return (
		<div className="min-h-screen bg-background text-foreground p-8 pb-24">
			<div className="mx-auto grid lg:grid-cols-[3fr_1fr] gap-6">
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<img src="/logo/black with orange.png" alt="The Small Strings Logo" className="h-8 w-8 object-contain" />
							<h1 className="text-2xl font-bold">The Small Strings vs The Audience</h1>
						</div>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Keyboard size={20} />
								<span>Space / B / O / Backspace</span>
							</div>
							<Button
								onClick={handleReset}
								variant="outline"
								size="sm"
								className="gap-2"
							>
								<ArrowCounterClockwise size={16} />
								Reset
							</Button>
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								{getPageLabel()}
							</span>
							<span className="text-muted-foreground">{Math.round(progress)}%</span>
						</div>
						<Progress value={progress} className="h-2" />
					</div>

					<AnimatePresence mode="wait">
						<motion.div
						key={pageType === 'song' ? `song-${songIndex}` : pageType}
							initial={{ opacity: 0, x: 50 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -50 }}
							transition={{ duration: 0.3, ease: 'easeOut' }}
						>
							{pageType === 'test' ? (
								<Card className="p-8 relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-black/20 border-orange-500/50">
									<div className="flex flex-col items-center justify-center gap-6">
										<img 
											src="/logo/black with orange.png" 
											alt="The Small Strings Logo" 
											className="h-32 w-32 object-contain"
										/>
										<div className="text-center">
											<div className="text-sm text-orange-500 mb-2 uppercase tracking-wide font-semibold">
												Test Mode
											</div>
											<h2 className="text-3xl font-bold tracking-tight text-foreground">
												Keyboard Test Screen
											</h2>
											<p className="text-lg text-muted-foreground mt-2">
												Testing keyboard connection
											</p>
										</div>
										
										{/* Key press display */}
										<div className="flex gap-4 items-center justify-center min-h-[60px] mt-4">
											<AnimatePresence>
												{testPressedKeys.map((key, index) => (
													<motion.div
														key={`${key}-${index}-${Date.now()}`}
														initial={{ scale: 0, opacity: 0, y: 20 }}
														animate={{ scale: 1, opacity: 1, y: 0 }}
														exit={{ scale: 0.5, opacity: 0, y: -20 }}
														transition={{ type: "spring", stiffness: 300, damping: 20 }}
														className="bg-orange-500 text-black text-2xl font-bold px-5 py-2 rounded-lg shadow-lg border-2 border-orange-400"
													>
														{key}
													</motion.div>
												))}
											</AnimatePresence>
											{testPressedKeys.length === 0 && (
												<span className="text-muted-foreground text-sm italic">
													Waiting for key presses...
												</span>
											)}
										</div>
									</div>
									<div className="absolute bottom-4 right-8 text-muted-foreground text-sm">
										Press <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to continue
									</div>
								</Card>
							) : pageType === 'welcome' ? (
								<Card className="p-8 relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-black/10 border-orange-500/30">
									<div className="flex items-center justify-center gap-6">
										<img 
											src="/logo/black with orange.png" 
											alt="The Small Strings Logo" 
											className="h-24 w-24 object-contain"
										/>
										<div className="text-center">
											<div className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
												Audience View
											</div>
											<h2 className="text-4xl font-bold tracking-tight">
												<span className="text-orange-500">The Small Strings</span>
												<span className="text-muted-foreground mx-3">vs</span>
												<span className="text-foreground">The Audience</span>
											</h2>
											<p className="text-lg text-muted-foreground mt-2">
												Welcome screen is being displayed
											</p>
										</div>
									</div>
									<div className="absolute bottom-4 right-8 text-muted-foreground text-sm">
										Press <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to continue
									</div>
								</Card>
							) : pageType === 'intro' ? (
								<Card className="p-8 relative overflow-hidden bg-gradient-to-br from-orange-500/5 to-transparent border-orange-500/20">
									<div className="flex items-center justify-center gap-6">
										<div className="text-6xl">🎸</div>
										<div className="text-center">
											<div className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
												Audience View
											</div>
											<h2 className="text-4xl font-bold tracking-tight">
												Get Ready!
											</h2>
											<p className="text-lg text-orange-500 mt-2">
												Walk-on music is playing
											</p>
										</div>
									</div>
									<div className="absolute bottom-4 right-8 text-muted-foreground text-sm">
										Press <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to start first song
									</div>
								</Card>
							) : pageType === 'setBreak' ? (
								<Card className="p-8 relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30">
									<div className="flex items-center justify-center gap-6">
										<div className="text-6xl">☕</div>
										<div className="text-center">
											<div className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
												Audience View
											</div>
											<h2 className="text-4xl font-bold tracking-tight">
												Set Break
											</h2>
											<p className="text-lg text-orange-500 mt-2">
												Take a short break!
											</p>
										</div>
									</div>
									<div className="absolute bottom-4 right-8 text-muted-foreground text-sm">
										Press <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to continue
									</div>
								</Card>
							) : pageType === 'end' ? (
								<Card className="p-8 relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30">
									<div className="flex items-center justify-center gap-6">
										<div className="text-6xl">🍻</div>
										<div className="text-center">
											<div className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
												Audience View
											</div>
											<h2 className="text-4xl font-bold tracking-tight">
												Logo
											</h2>
											<p className="text-lg text-orange-500 mt-2">
												End of the Gig!
											</p>
										</div>
									</div>
									<div className="absolute bottom-4 right-8 text-muted-foreground text-sm">
										Show complete! Press <kbd className="px-2 py-1 bg-muted rounded">Backspace</kbd> to go back
									</div>
								</Card>
							) : currentSong?.type === 'fixed' ? (
								<Card className="p-8 relative overflow-hidden">
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1">
											<div className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
												Current Song
											</div>
											<h2 className="text-6xl font-bold tracking-tight mb-1">
												{currentSong.name}
											</h2>
										</div>
										{wins && (wins.line > 0 || wins.fullhouse > 0) && (
												<div className="flex flex-col gap-2">
													{wins.line > 0 && (
														<Badge
															className="bg-accent text-accent-foreground text-lg px-4 py-2 hover:bg-accent/90 transition-colors cursor-pointer"
															onClick={() => openWinnersModal(songIndex, 'line')}
														>
															<Trophy size={20} weight="fill" className="mr-2" />
															{wins.line} Line{wins.line !== 1 ? 's' : ''}
														</Badge>
													)}
													{wins.fullhouse > 0 && (
														<Badge
															className="bg-accent text-accent-foreground text-lg px-4 py-2 hover:bg-accent/90 transition-colors cursor-pointer"
															onClick={() => openWinnersModal(songIndex, 'fullhouse')}
														>
														<Trophy size={20} weight="fill" className="mr-2" />
														{wins.fullhouse} Full House{wins.fullhouse !== 1 ? 's' : ''}
													</Badge>
												)}
											</div>
										)}
									</div>
									<div className="absolute bottom-4 right-8 text-muted-foreground text-sm">
										Press <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to continue
									</div>
								</Card>
							) : currentSong?.type === 'battle' ? (
								<div className="space-y-4">
									<div className="text-sm text-muted-foreground uppercase tracking-wide text-center">
										{currentSong.selected ? 'Battle Result' : 'Song Battle'}
									</div>
									<div className="grid md:grid-cols-2 gap-4">
										<motion.div
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											onClick={() => handleBattleChoice('A')}
										>
											<Card
												className={`p-8 cursor-pointer transition-all duration-200 relative ${currentSong.selected === 'A'
														? 'ring-4 ring-[var(--battle-orange)] bg-[var(--battle-orange)]/10'
														: currentSong.selected === 'B'
															? 'opacity-40'
															: 'hover:bg-[var(--battle-orange)]/5'
													}`}
												style={{
													borderColor: currentSong.selected === 'A' ? 'var(--battle-orange)' : undefined
												}}
											>
												<div className="text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--battle-orange)' }}>
													Option O (Orange)
												</div>
												<div className="space-y-2 mb-4">
													{(Array.isArray(currentSong.optionA) ? currentSong.optionA : [currentSong.optionA]).map((songName, idx) => (
														<h3 key={idx} className="text-3xl font-bold">{songName}</h3>
													))}
												</div>
												{!currentSong.selected && (
													<div className="text-muted-foreground text-sm">
														Press <kbd className="px-2 py-1 bg-muted rounded">O</kbd>
													</div>
												)}
												{currentSong.selected === 'A' && (
													<motion.div
														initial={{ scale: 0 }}
														animate={{ scale: 1 }}
														className="absolute top-4 right-4"
													>
														<Trophy size={32} weight="fill" style={{ color: 'var(--battle-orange)' }} />
													</motion.div>
												)}
											</Card>
										</motion.div>
										<motion.div
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											onClick={() => handleBattleChoice('B')}
										>
											<Card
												className={`p-8 cursor-pointer transition-all duration-200 relative ${currentSong.selected === 'B'
														? 'ring-4 ring-[var(--battle-blue)] bg-[var(--battle-blue)]/10'
														: currentSong.selected === 'A'
															? 'opacity-40'
															: 'hover:bg-[var(--battle-blue)]/5'
													}`}
												style={{
													borderColor: currentSong.selected === 'A' ? 'var(--battle-blue)' : undefined
												}}
											>
												<div className="text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--battle-blue)' }}>
													Option B (Black)
												</div>
												<div className="space-y-2 mb-4">
													{(Array.isArray(currentSong.optionB) ? currentSong.optionB : [currentSong.optionB]).map((songName, idx) => (
														<h3 key={idx} className="text-3xl font-bold">{songName}</h3>
													))}
												</div>
												{!currentSong.selected && (
													<div className="text-muted-foreground text-sm">
														Press <kbd className="px-2 py-1 bg-muted rounded">B</kbd>
													</div>
												)}
												{currentSong.selected === 'B' && (
													<motion.div
														initial={{ scale: 0 }}
														animate={{ scale: 1 }}
														className="absolute top-4 right-4"
													>
														<Trophy size={32} weight="fill" style={{ color: 'var(--battle-blue)' }} />
													</motion.div>
												)}
											</Card>
										</motion.div>


									</div>
									{currentSong.selected && (
										<div className="flex flex-col items-center gap-3">
											<Button
												variant="outline"
												size="lg"
												onClick={handleClearBattleChoice}
												className="touch-manipulation active:scale-95 transition-transform"
											>
												<ArrowCounterClockwise size={20} className="mr-2" />
												Clear Choice
											</Button>
											<div className="text-muted-foreground text-sm">
												Press <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to continue
											</div>
										</div>
									)}
									{wins && currentSong.selected && (wins.line > 0 || wins.fullhouse > 0) && (
										<div className="flex justify-center gap-4">
											{wins.line > 0 && (
												<Badge
													className={`bg-accent text-accent-foreground text-lg px-4 py-2 ${wins.lineWinners.length > 2 ? 'hover:bg-accent/90 transition-colors cursor-pointer' : ''}`}
												onClick={() => openWinnersModal(songIndex, 'line')}
												>
													<Trophy size={20} weight="fill" className="mr-2" />
													{wins.lineWinners.length <= 2
														? `Line: Card${wins.lineWinners.length > 1 ? 's' : ''} ${wins.lineWinners.join(', ')}`
														: `${wins.line} Line${wins.line !== 1 ? 's' : ''}`}
												</Badge>
											)}
											{wins.fullhouse > 0 && (
												<Badge
													className={`bg-accent text-accent-foreground text-lg px-4 py-2 ${wins.fullhouseWinners.length > 2 ? 'hover:bg-accent/90 transition-colors cursor-pointer' : ''}`}
												onClick={() => openWinnersModal(songIndex, 'fullhouse')}
												>
												<Trophy size={20} weight="fill" className="mr-2" />
												{wins.fullhouseWinners.length <= 2
													? `Full House: Card${wins.fullhouseWinners.length > 1 ? 's' : ''} ${wins.fullhouseWinners.join(', ')}`
													: `${wins.fullhouse} Full House${wins.fullhouse !== 1 ? 's' : ''}`}
												</Badge>
											)}
										</div>
									)}
								</div>
							) : null}
						</motion.div>
					</AnimatePresence>

					{nextSong && (
						<Card className="p-4 bg-secondary/50">
							<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
								Next Up
							</div>
							<div className="text-lg font-medium">
								{nextSong.type === 'fixed'
									? nextSong.name
									: <>
										<div>{(Array.isArray(nextSong.optionA) ? nextSong.optionA : [nextSong.optionA]).join(' + ')} </div>
										<div>vs <div>
										</div>{(Array.isArray(nextSong.optionB) ? nextSong.optionB : [nextSong.optionB]).join(' + ')}</div>
									</>
								}
							</div>
						</Card>
					)}

					{isComplete && (
						<Card className="p-6 text-center bg-accent/10 border-accent">
							<Trophy size={48} weight="fill" className="mx-auto mb-3 text-accent" />
							<h3 className="text-xl font-bold text-accent">Show Complete!</h3>
						</Card>
					)}
				</div>

				<div className="space-y-4">
					<Card className="p-4 sticky top-8">
						<div className="flex items-center gap-2 mb-4">
							<ListChecks size={24} weight="fill" className="text-primary" />
							<h3 className="text-lg font-semibold">Songs Played</h3>
						</div>
						<ScrollArea className="h-[calc(100vh-200px)]">
							<div className="space-y-2 pr-4">
								{gameState.playedSongs.length === 0 ? (
									<p className="text-sm text-muted-foreground text-center py-4">
										No songs played yet
									</p>
								) : (
									gameState.playedSongs.map((song) => {
										const songWins = gameState.winsPerSong[song.index]
										const isCurrentSong = song.index === songIndex
										return (
											<div
												key={song.index}
												ref={isCurrentSong ? currentSongRef : null}
												className={`p-3 rounded-lg border transition-colors ${isCurrentSong
														? 'bg-primary/10 border-primary'
														: 'bg-secondary/30 border-border'
													}`}
											>
												<div className="xflex items-start justify-between gap-2">
													<div className="flex-1 min-w-0">
														<div className="text-sm font-medium truncate">
															{song.name}
														</div>
														<div className="flex items-center gap-2 mt-1">
															<span className="text-xs text-muted-foreground">
																#{song.index + 1}
															</span>
															{song.type === 'battle' && (
																<Badge variant="outline" className="text-xs px-1.5 py-0">
																	Battle
																</Badge>
															)}
														</div>
													</div>
													{songWins && (songWins.line > 0 || songWins.fullhouse > 0) && (
														<div className="flex flex-col gap-1">
															{songWins.line > 0 && (
																<Badge
																	className={`bg-accent/50 text-accent-foreground text-xs px-1.5 py-0 ${songWins.lineWinners.length > 2 ? 'cursor-pointer hover:bg-accent/70' : ''}`}
																	onClick={() => openWinnersModal(song.index, 'line')}
																>
																	<Trophy size={12} weight="fill" className="mr-1" />
																	{songWins.lineWinners.length <= 2
																		? `L: ${songWins.lineWinners.join(', ')}`
																		: `${songWins.line}L`}
																</Badge>
															)}
															{songWins.fullhouse > 0 && (
																<Badge
																	className={`bg-accent/50 text-accent-foreground text-xs px-1.5 py-0 ${songWins.fullhouseWinners.length > 2 ? 'cursor-pointer hover:bg-accent/70' : ''}`}
																	onClick={() => openWinnersModal(song.index, 'fullhouse')}
																>
																	<Trophy size={12} weight="fill" className="mr-1" />
																	{songWins.fullhouseWinners.length <= 2
																		? `FH: ${songWins.fullhouseWinners.join(', ')}`
																		: `${songWins.fullhouse}FH`}
																</Badge>
															)}
														</div>
													)}
												</div>
											</div>
										)
									})
								)}
							</div>
						</ScrollArea>
					</Card>
				</div>
			</div>

			{/* Fixed Wins Summary Panel */}
			<div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border shadow-lg z-50">
				<div className="px-6 py-3">
					<div className="flex items-center gap-6 overflow-x-auto">
						<div className="flex items-center gap-2 text-sm font-semibold shrink-0">
							<Trophy size={18} weight="fill" className="text-accent" />
							<span>Wins</span>
						</div>
						<div className="flex items-center gap-4 overflow-x-auto pb-1">
							{gameState.songs.map((song, index) => {
								const songWins = gameState.winsPerSong[index]
								const hasLineWin = songWins && songWins.line > 0
								const hasHouseWin = songWins && songWins.fullhouse > 0
								
								if (!hasLineWin && !hasHouseWin) return null
								
								const songName = song.type === 'fixed' 
									? song.name 
									: song.selected 
										? (song.selected === 'A' 
											? (Array.isArray(song.optionA) ? song.optionA.join(' + ') : song.optionA)
											: (Array.isArray(song.optionB) ? song.optionB.join(' + ') : song.optionB))
										: `Battle ${index + 1}`
								
								return (
									<div 
										key={index} 
										className="flex items-center gap-2 shrink-0 bg-secondary/50 rounded-lg px-3 py-2 border border-border"
									>
										<div className="text-xs text-muted-foreground font-medium max-w-[120px] truncate" title={songName}>
											#{index + 1}: {songName}
										</div>
										<div className="flex items-center gap-1.5">
											{hasLineWin && (
												<div 
													className="flex items-center gap-1 bg-orange-500/20 text-orange-500 px-2 py-1 rounded text-xs font-bold cursor-pointer hover:bg-orange-500/30 transition-colors"
													onClick={() => openWinnersModal(index, 'line')}
													title={`Line wins: Cards ${songWins.lineWinners.join(', ')}`}
												>
													<Star size={14} weight="fill" />
													<span>L</span>
													<span className="text-orange-400">({songWins.lineWinners.join(', ')})</span>
												</div>
											)}
											{hasHouseWin && (
												<div 
													className="flex items-center gap-1 bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-bold cursor-pointer hover:bg-green-500/30 transition-colors"
													onClick={() => openWinnersModal(index, 'fullhouse')}
													title={`Full House wins: Cards ${songWins.fullhouseWinners.join(', ')}`}
												>
													<House size={14} weight="fill" />
													<span>FH</span>
													<span className="text-green-400">({songWins.fullhouseWinners.join(', ')})</span>
												</div>
											)}
										</div>
									</div>
								)
							})}
							{Object.values(gameState.winsPerSong).every(w => !w || (w.line === 0 && w.fullhouse === 0)) && (
								<span className="text-xs text-muted-foreground italic">No wins yet</span>
							)}
						</div>
					</div>
				</div>
			</div>

			<Dialog open={modalOpen} onOpenChange={setModalOpen}>
				<DialogContent className="max-w-4xl max-h-[80vh]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Trophy size={24} weight="fill" className="text-accent" />
						{selectedWinType === 'line' ? 'Line Wins' : selectedWinType === 'fullhouse' ? 'Full House Wins' : 'Winning Cards'}
							{selectedSongIndex !== null && gameState.songs[selectedSongIndex] && (
								<span className="text-muted-foreground font-normal">
									— {gameState.songs[selectedSongIndex].type === 'fixed'
										? gameState.songs[selectedSongIndex].name
										: `${gameState.songs[selectedSongIndex].type === 'battle' && gameState.songs[selectedSongIndex].selected
											? (gameState.songs[selectedSongIndex].selected === 'A'
												? (Array.isArray((gameState.songs[selectedSongIndex] as any).optionA) ? (gameState.songs[selectedSongIndex] as any).optionA : [(gameState.songs[selectedSongIndex] as any).optionA]).join(' + ')
												: (Array.isArray((gameState.songs[selectedSongIndex] as any).optionB) ? (gameState.songs[selectedSongIndex] as any).optionB : [(gameState.songs[selectedSongIndex] as any).optionB]).join(' + '))
											: 'Battle'
										}`
									}
								</span>
							)}
						</DialogTitle>
					</DialogHeader>
					<ScrollArea className="max-h-[60vh] pr-4">
						<div className="space-y-6">
							{winningCards && winningCards.lineWinners.length > 0 && (selectedWinType === 'line' || selectedWinType === 'all') && (
								<div>
									<h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
										<Badge className="bg-accent text-accent-foreground">
											{winningCards.lineWinners.length} Line Win{winningCards.lineWinners.length !== 1 ? 's' : ''}
										</Badge>
									</h4>
									<div className="grid sm:grid-cols-2 gap-4">
										{winningCards.lineWinners.map(card => (
											<BingoCardDisplay key={card.id} card={card} revealedSongs={revealedSongs} />
										))}
									</div>
								</div>
							)}

							{winningCards && winningCards.fullhouseWinners.length > 0 && (selectedWinType === 'fullhouse' || selectedWinType === 'all') && (
								<>
									{winningCards.lineWinners.length > 0 && selectedWinType === 'all' && <Separator />}
									<div>
										<h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
											<Badge className="bg-accent text-accent-foreground">
												{winningCards.fullhouseWinners.length} Full House{winningCards.fullhouseWinners.length !== 1 ? 's' : ''}
											</Badge>
										</h4>
										<div className="grid sm:grid-cols-2 gap-4">
											{winningCards.fullhouseWinners.map(card => (
												<BingoCardDisplay key={card.id} card={card} revealedSongs={revealedSongs} />
											))}
										</div>
									</div>
								</>
							)}

							{(!winningCards || 
								(selectedWinType === 'line' && winningCards.lineWinners.length === 0) ||
								(selectedWinType === 'fullhouse' && winningCards.fullhouseWinners.length === 0) ||
								(selectedWinType === 'all' && winningCards.lineWinners.length === 0 && winningCards.fullhouseWinners.length === 0)) && (
								<div className="text-center py-8 text-muted-foreground">
									No winners at this song
								</div>
							)}
						</div>
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</div >
	)
}
