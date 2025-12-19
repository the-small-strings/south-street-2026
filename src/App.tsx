import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MusicNote, Trophy, Keyboard, ListChecks } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Song, BingoCard } from '@/lib/types'
import { calculateBingoWins } from '@/lib/bingo'
import { BingoCardDisplay } from '@/components/BingoCardDisplay'

function App() {
  const [songs] = useKV<Song[]>('songs', [])
  const [bingoCards] = useKV<BingoCard[]>('bingoCards', [])
  const [currentIndex, setCurrentIndex] = useKV<number>('currentIndex', 0)
  const [battleChoices, setBattleChoices] = useKV<Record<number, 'A' | 'B'>>('battleChoices', {})
  
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSongIndex, setSelectedSongIndex] = useState<number | null>(null)

  const _songs = songs ?? []
  const _bingoCards = bingoCards ?? []
  const _currentIndex = currentIndex ?? 0
  const _battleChoices = battleChoices ?? {}

  const currentSong = _songs[_currentIndex]
  const nextSong = _songs[_currentIndex + 1]
  const progress = _songs.length > 0 ? ((_currentIndex + 1) / _songs.length) * 100 : 0

  const songsWithBattleResults: Song[] = _songs.map((song, idx) => {
    if (!song) return song
    if (song.type === 'battle' && _battleChoices[idx]) {
      return { ...song, selected: _battleChoices[idx] }
    }
    return song
  }).filter(Boolean)

  const winsPerSong = calculateBingoWins(_bingoCards, songsWithBattleResults, _currentIndex)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalOpen) {
        if (e.key === 'Escape') {
          setModalOpen(false)
        }
        return
      }

      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        if (currentSong?.type === 'fixed' && _currentIndex < _songs.length - 1) {
          setCurrentIndex(_currentIndex + 1)
        } else if (currentSong?.type === 'battle' && _battleChoices[_currentIndex] && _currentIndex < _songs.length - 1) {
          setCurrentIndex(_currentIndex + 1)
        }
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        if (currentSong?.type === 'battle') {
          setBattleChoices((prev) => ({ ...(prev ?? {}), [_currentIndex]: 'A' }))
          if (_currentIndex < _songs.length - 1) {
            setTimeout(() => setCurrentIndex(_currentIndex + 1), 300)
          }
        }
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault()
        if (currentSong?.type === 'battle') {
          setBattleChoices((prev) => ({ ...(prev ?? {}), [_currentIndex]: 'B' }))
          if (_currentIndex < _songs.length - 1) {
            setTimeout(() => setCurrentIndex(_currentIndex + 1), 300)
          }
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        if (_currentIndex > 0) {
          setCurrentIndex(_currentIndex - 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [_currentIndex, _songs.length, currentSong, _battleChoices, modalOpen, setCurrentIndex, setBattleChoices])

  const openWinnersModal = (songIndex: number) => {
    setSelectedSongIndex(songIndex)
    setModalOpen(true)
  }

  const getRevealedSongsUpTo = (songIndex: number): Set<string> => {
    const revealed = new Set<string>()
    for (let i = 0; i <= songIndex; i++) {
      const song = songsWithBattleResults[i]
      if (!song) continue
      if (song.type === 'fixed') {
        revealed.add(song.name)
      } else if (song.type === 'battle' && song.selected) {
        revealed.add(song.selected === 'A' ? song.optionA : song.optionB)
      }
    }
    return revealed
  }

  const selectedWins = selectedSongIndex !== null ? winsPerSong.get(selectedSongIndex) : null
  const revealedSongs = selectedSongIndex !== null ? getRevealedSongsUpTo(selectedSongIndex) : new Set<string>()

  if (_songs.length === 0) {
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

  const playedSongs = _songs.slice(0, _currentIndex + 1).map((song, idx) => {
    if (song.type === 'fixed') {
      return { index: idx, name: song.name, type: 'fixed' as const }
    } else if (song.type === 'battle' && _battleChoices[idx]) {
      const selectedSong = _battleChoices[idx] === 'A' ? song.optionA : song.optionB
      return { index: idx, name: selectedSong, type: 'battle' as const }
    }
    return null
  }).filter(Boolean) as Array<{ index: number; name: string; type: 'fixed' | 'battle' }>

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MusicNote size={32} weight="fill" className="text-primary" />
            <h1 className="text-2xl font-bold">Gig Manager</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Keyboard size={20} />
            <span>Space / B / O / Backspace</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Song {_currentIndex + 1} of {_songs.length}
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={_currentIndex}
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
                  {winsPerSong.get(_currentIndex) && (
                    <div 
                      className="flex flex-col gap-2 cursor-pointer"
                      onClick={() => openWinnersModal(_currentIndex)}
                    >
                      {winsPerSong.get(_currentIndex)!.line > 0 && (
                        <Badge className="bg-accent text-accent-foreground text-lg px-4 py-2 hover:bg-accent/90 transition-colors">
                          <Trophy size={20} weight="fill" className="mr-2" />
                          {winsPerSong.get(_currentIndex)!.line} Line{winsPerSong.get(_currentIndex)!.line !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {winsPerSong.get(_currentIndex)!.fullhouse > 0 && (
                        <Badge className="bg-accent text-accent-foreground text-lg px-4 py-2 hover:bg-accent/90 transition-colors">
                          <Trophy size={20} weight="fill" className="mr-2" />
                          {winsPerSong.get(_currentIndex)!.fullhouse} Full House{winsPerSong.get(_currentIndex)!.fullhouse !== 1 ? 's' : ''}
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
                  {_battleChoices[_currentIndex] ? 'Battle Result' : 'Song Battle'}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setBattleChoices((prev) => ({ ...(prev ?? {}), [_currentIndex]: 'A' }))
                      if (_currentIndex < _songs.length - 1) {
                        setTimeout(() => setCurrentIndex(_currentIndex + 1), 300)
                      }
                    }}
                  >
                    <Card 
                      className={`p-8 cursor-pointer transition-all duration-200 relative ${
                        _battleChoices[_currentIndex] === 'A' 
                          ? 'ring-4 ring-[var(--battle-blue)] bg-[var(--battle-blue)]/10' 
                          : _battleChoices[_currentIndex] === 'B'
                          ? 'opacity-40'
                          : 'hover:bg-[var(--battle-blue)]/5'
                      }`}
                      style={{
                        borderColor: _battleChoices[_currentIndex] === 'A' ? 'var(--battle-blue)' : undefined
                      }}
                    >
                      <div className="text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--battle-blue)' }}>
                        Option B (Black)
                      </div>
                      <h3 className="text-4xl font-bold mb-4">{currentSong.optionA}</h3>
                      {!_battleChoices[_currentIndex] && (
                        <div className="text-muted-foreground text-sm">
                          Press <kbd className="px-2 py-1 bg-muted rounded">B</kbd>
                        </div>
                      )}
                      {_battleChoices[_currentIndex] === 'A' && (
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

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setBattleChoices((prev) => ({ ...(prev ?? {}), [_currentIndex]: 'B' }))
                      if (_currentIndex < _songs.length - 1) {
                        setTimeout(() => setCurrentIndex(_currentIndex + 1), 300)
                      }
                    }}
                  >
                    <Card 
                      className={`p-8 cursor-pointer transition-all duration-200 relative ${
                        _battleChoices[_currentIndex] === 'B' 
                          ? 'ring-4 ring-[var(--battle-orange)] bg-[var(--battle-orange)]/10' 
                          : _battleChoices[_currentIndex] === 'A'
                          ? 'opacity-40'
                          : 'hover:bg-[var(--battle-orange)]/5'
                      }`}
                      style={{
                        borderColor: _battleChoices[_currentIndex] === 'B' ? 'var(--battle-orange)' : undefined
                      }}
                    >
                      <div className="text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--battle-orange)' }}>
                        Option O (Orange)
                      </div>
                      <h3 className="text-4xl font-bold mb-4">{currentSong.optionB}</h3>
                      {!_battleChoices[_currentIndex] && (
                        <div className="text-muted-foreground text-sm">
                          Press <kbd className="px-2 py-1 bg-muted rounded">O</kbd>
                        </div>
                      )}
                      {_battleChoices[_currentIndex] === 'B' && (
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
                </div>
                {_battleChoices[_currentIndex] && (
                  <div className="text-center text-muted-foreground text-sm">
                    Press <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to continue
                  </div>
                )}
                {winsPerSong.get(_currentIndex) && _battleChoices[_currentIndex] && (
                  <div 
                    className="flex justify-center gap-4 cursor-pointer"
                    onClick={() => openWinnersModal(_currentIndex)}
                  >
                    {winsPerSong.get(_currentIndex)!.line > 0 && (
                      <Badge className="bg-accent text-accent-foreground text-lg px-4 py-2 hover:bg-accent/90 transition-colors">
                        <Trophy size={20} weight="fill" className="mr-2" />
                        {winsPerSong.get(_currentIndex)!.line} Line{winsPerSong.get(_currentIndex)!.line !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {winsPerSong.get(_currentIndex)!.fullhouse > 0 && (
                      <Badge className="bg-accent text-accent-foreground text-lg px-4 py-2 hover:bg-accent/90 transition-colors">
                        <Trophy size={20} weight="fill" className="mr-2" />
                        {winsPerSong.get(_currentIndex)!.fullhouse} Full House{winsPerSong.get(_currentIndex)!.fullhouse !== 1 ? 's' : ''}
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
                : `Battle: ${nextSong.optionA} vs ${nextSong.optionB}`
              }
            </div>
          </Card>
        )}

        {_currentIndex === _songs.length - 1 && (
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
                {playedSongs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No songs played yet
                  </p>
                ) : (
                  playedSongs.map((song) => (
                    <div
                      key={song.index}
                      className={`p-3 rounded-lg border transition-colors ${
                        song.index === _currentIndex
                          ? 'bg-primary/10 border-primary'
                          : 'bg-secondary/30 border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
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
                        {winsPerSong.get(song.index) && (
                          <div className="flex flex-col gap-1">
                            {winsPerSong.get(song.index)!.line > 0 && (
                              <Badge 
                                className="bg-accent/50 text-accent-foreground text-xs px-1.5 py-0 cursor-pointer hover:bg-accent/70"
                                onClick={() => openWinnersModal(song.index)}
                              >
                                <Trophy size={12} weight="fill" className="mr-1" />
                                {winsPerSong.get(song.index)!.line}L
                              </Badge>
                            )}
                            {winsPerSong.get(song.index)!.fullhouse > 0 && (
                              <Badge 
                                className="bg-accent/50 text-accent-foreground text-xs px-1.5 py-0 cursor-pointer hover:bg-accent/70"
                                onClick={() => openWinnersModal(song.index)}
                              >
                                <Trophy size={12} weight="fill" className="mr-1" />
                                {winsPerSong.get(song.index)!.fullhouse}FH
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
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
              Winning Cards
              {selectedSongIndex !== null && _songs[selectedSongIndex] && (
                <span className="text-muted-foreground font-normal">
                  — {_songs[selectedSongIndex].type === 'fixed' 
                    ? _songs[selectedSongIndex].name 
                    : `${_songs[selectedSongIndex].type === 'battle' && _battleChoices[selectedSongIndex]
                        ? (_battleChoices[selectedSongIndex] === 'A' 
                          ? _songs[selectedSongIndex].optionA 
                          : _songs[selectedSongIndex].optionB)
                        : 'Battle'
                      }`
                  }
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {selectedWins && selectedWins.line > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Badge className="bg-accent text-accent-foreground">
                      {selectedWins.line} Line Win{selectedWins.line !== 1 ? 's' : ''}
                    </Badge>
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {selectedWins.lineWinners.map(cardId => {
                      const card = _bingoCards.find(c => c.id === cardId)
                      return card ? (
                        <BingoCardDisplay key={cardId} card={card} revealedSongs={revealedSongs} />
                      ) : null
                    })}
                  </div>
                </div>
              )}
              
              {selectedWins && selectedWins.fullhouse > 0 && (
                <>
                  {selectedWins.line > 0 && <Separator />}
                  <div>
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Badge className="bg-accent text-accent-foreground">
                        {selectedWins.fullhouse} Full House{selectedWins.fullhouse !== 1 ? 's' : ''}
                      </Badge>
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {selectedWins.fullhouseWinners.map(cardId => {
                        const card = _bingoCards.find(c => c.id === cardId)
                        return card ? (
                          <BingoCardDisplay key={cardId} card={card} revealedSongs={revealedSongs} />
                        ) : null
                      })}
                    </div>
                  </div>
                </>
              )}

              {(!selectedWins || (selectedWins.line === 0 && selectedWins.fullhouse === 0)) && (
                <div className="text-center py-8 text-muted-foreground">
                  No winners at this song
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App