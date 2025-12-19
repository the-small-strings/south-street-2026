import { useEffect, useState, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MusicNote, Trophy, Keyboard, ListChecks, ArrowCounterClockwise } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BingoCard, GameState, CurrentSongInfo } from '@/lib/types'
import { BingoCardDisplay } from '@/components/BingoCardDisplay'
import * as api from '@/lib/api'

export function Band() {
	const [gameState, setGameState] = useState<GameState | null>(null)
	const [currentInfo, setCurrentInfo] = useState<CurrentSongInfo | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const [modalOpen, setModalOpen] = useState(false)
	const [selectedSongIndex, setSelectedSongIndex] = useState<number | null>(null)
	const [selectedWinType, setSelectedWinType] = useState<'line' | 'fullhouse' | 'all'>('all')
	const [winningCards, setWinningCards] = useState<{
		lineWinners: BingoCard[]
		fullhouseWinners: BingoCard[]
		revealedSongs: string[]
	} | null>(null)

	const currentSongRef = useRef<HTMLDivElement>(null)

	// Load initial state
	useEffect(() => {
		const loadInitialState = async () => {
			try {
				setLoading(true)
				const [fullState, current] = await Promise.all([
					api.getFullGameState(),
					api.getCurrentSongInfo()
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

	const refreshState = useCallback(async () => {
		try {
			const fullState = await api.getFullGameState()
			setGameState(fullState)
		} catch (err) {
			console.error('Failed to refresh state:', err)
		}
	}, [])

	const handleAdvance = useCallback(async () => {
		try {
			const newInfo = await api.advanceToNextSong()
			setCurrentInfo(newInfo)
			await refreshState()
		} catch (err) {
			console.error('Failed to advance:', err)
		}
	}, [refreshState])

	const handleGoBack = useCallback(async () => {
		try {
			const newInfo = await api.goToPreviousSong()
			setCurrentInfo(newInfo)
			await refreshState()
		} catch (err) {
			console.error('Failed to go back:', err)
		}
	}, [refreshState])

	const handleBattleChoice = useCallback(async (choice: 'A' | 'B') => {
		if (!currentInfo) return
		try {
			const newInfo = await api.setBattleChoice(currentInfo.songNumber - 1, choice)
			setCurrentInfo(newInfo)
			await refreshState()
		} catch (err) {
			console.error('Failed to set battle choice:', err)
		}
	}, [currentInfo, refreshState])

	const handleReset = useCallback(async () => {
		try {
			const newState = await api.resetGame()
			setGameState(newState)
			const newInfo = await api.getCurrentSongInfo()
			setCurrentInfo(newInfo)
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

			if (e.key === ' ' || e.key === 'Spacebar') {
				e.preventDefault()
				const currentSong = currentInfo.currentSong
				if (currentSong?.type === 'fixed' && currentInfo.songNumber < currentInfo.totalSongs) {
					await handleAdvance()
				} else if (currentSong?.type === 'battle' && currentSong.selected && currentInfo.songNumber < currentInfo.totalSongs) {
					await handleAdvance()
				}
			} else if (e.key === 'b' || e.key === 'B') {
				e.preventDefault()
				if (currentInfo.currentSong?.type === 'battle') {
					await handleBattleChoice('B')
				}
			} else if (e.key === 'o' || e.key === 'O') {
				e.preventDefault()
				if (currentInfo.currentSong?.type === 'battle') {
					await handleBattleChoice('A')
				}
			} else if (e.key === 'Backspace') {
				e.preventDefault()
				await handleGoBack()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [currentInfo, modalOpen, handleAdvance, handleGoBack, handleBattleChoice])

	// Scroll current song into view
	useEffect(() => {
		// Use setTimeout to ensure the DOM has updated after state changes
		const timeoutId = setTimeout(() => {
			if (currentSongRef.current) {
				currentSongRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
			}
		}, 100)
		return () => clearTimeout(timeoutId)
	}, [currentInfo?.songNumber, gameState?.playedSongs.length])

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

	const { currentSong, nextSong, songNumber, totalSongs, actualSongNumber, actualTotalSongs, progress, isComplete, wins } = currentInfo
	const currentIndex = songNumber - 1

	const revealedSongs = new Set(winningCards?.revealedSongs ?? [])

	return (
		<div className="min-h-screen bg-background text-foreground p-8">
			<div className="mx-auto grid lg:grid-cols-[3fr_1fr] gap-6">
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<MusicNote size={32} weight="fill" className="text-primary" />
							<h1 className="text-2xl font-bold">Small Strings vs The Audience</h1>
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
								Song {actualSongNumber} of {actualTotalSongs}
							</span>
							<span className="text-muted-foreground">{Math.round(progress)}%</span>
						</div>
						<Progress value={progress} className="h-2" />
					</div>

					<AnimatePresence mode="wait">
						<motion.div
							key={currentIndex}
							initial={{ opacity: 0, x: 50 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -50 }}
							transition={{ duration: 0.3, ease: 'easeOut' }}
						>
							{currentSong?.type === 'fixed' ? (
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
															onClick={() => openWinnersModal(currentIndex, 'line')}
														>
															<Trophy size={20} weight="fill" className="mr-2" />
															{wins.line} Line{wins.line !== 1 ? 's' : ''}
														</Badge>
													)}
													{wins.fullhouse > 0 && (
														<Badge
															className="bg-accent text-accent-foreground text-lg px-4 py-2 hover:bg-accent/90 transition-colors cursor-pointer"
															onClick={() => openWinnersModal(currentIndex, 'fullhouse')}
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
										<div className="text-center text-muted-foreground text-sm">
											Press <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to continue
										</div>
									)}
									{wins && currentSong.selected && (wins.line > 0 || wins.fullhouse > 0) && (
										<div className="flex justify-center gap-4">
											{wins.line > 0 && (
												<Badge
													className={`bg-accent text-accent-foreground text-lg px-4 py-2 ${wins.lineWinners.length > 2 ? 'hover:bg-accent/90 transition-colors cursor-pointer' : ''}`}
													onClick={() => openWinnersModal(currentIndex, 'line')}
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
													onClick={() => openWinnersModal(currentIndex, 'fullhouse')}
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
										const isCurrentSong = song.index === currentIndex
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
										: `${gameState.songs[selectedSongIndex].type === 'battle' && gameState.battleChoices[selectedSongIndex]
											? (gameState.battleChoices[selectedSongIndex] === 'A'
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
