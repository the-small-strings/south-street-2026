# Planning Guide

A backstage gig management application that enables bands to navigate their setlist and track audience bingo card wins in real-time during live performances.

**Experience Qualities**: 
1. **Immediate** - Large, high-contrast elements with minimal cognitive load for quick glances during performance
2. **Confident** - Clear visual feedback for every action, eliminating uncertainty when operating under pressure
3. **Focused** - Information hierarchy that surfaces critical data (current song, what's next, bingo wins) while keeping secondary details accessible

**Complexity Level**: Light Application (multiple features with basic state)
This is a single-screen app with keyboard navigation, state tracking for song progression, and real-time bingo calculations. It has moderate interactivity but doesn't require multiple complex views.

## Essential Features

### Song Navigation System
- **Functionality**: Display current song and navigate through setlist with keyboard controls
- **Purpose**: Allow band to advance through their performance without fumbling with touch controls
- **Trigger**: Space bar (fixed songs), B/O keys (battle choices), Backspace (previous song)
- **Progression**: Show upcoming song → Press key → Animate transition → Update current song → Calculate bingo wins → Show next song preview
- **Success criteria**: Keyboard shortcuts work reliably, current position persists if page refreshes, transitions feel smooth under 300ms

### Song Battle Selection
- **Functionality**: Present two song options for audience to choose between, select winner via keyboard
- **Purpose**: Let band mark which battle option the audience voted for
- **Trigger**: Pressing 'B' for black option or 'O' for orange option when on a battle slide
- **Progression**: Display battle options → Audience votes → Band presses B or O → Selected option highlights → Progress to next item → Battle result counts toward bingo
- **Success criteria**: Visual distinction between options, selected choice clearly indicated, selection cannot be changed once made

### Bingo Card Tracking
- **Functionality**: Calculate which cards achieve line/full house as songs are revealed
- **Purpose**: Give band instant feedback on audience engagement and prize distribution
- **Trigger**: Automatically calculated when advancing to each song/battle result
- **Progression**: Song revealed → Algorithm checks all cards → Count wins → Display badge with win count → Click badge → Modal shows winning card numbers
- **Success criteria**: Win counts update instantly, no missed cards, clear visual indicator when prizes should be awarded

### Progress Visualization
- **Functionality**: Show position in setlist and completed songs
- **Purpose**: Help band maintain awareness of show timing and pacing
- **Trigger**: Automatic update on every song change
- **Progression**: Song changes → Progress bar updates → Completed songs marked → Time estimate adjusts
- **Success criteria**: Always accurate, visible at a glance, doesn't distract from current song display

## Edge Case Handling
- **Page Refresh Mid-Show**: Restore exact position in setlist and battle choices made
- **Rapid Key Presses**: Debounce keyboard input to prevent accidental double-advances
- **First Song**: Backspace does nothing, clear indication this is the start
- **Last Song**: Forward keys do nothing, visual indication show is complete
- **Modal Open During Navigation**: Close any open modals before processing navigation keys
- **No Bingo Wins**: Display "0" clearly rather than hiding the indicator

## Design Direction
Backstage rock show aesthetic—bold, high-energy, and functional under stage lighting conditions. The design should feel like professional tour equipment: rugged, purposeful, and zero-nonsense. High contrast for visibility, large touch targets even though keyboard is primary, and a color palette that evokes stage lights and equipment cases.

## Color Selection
Stage equipment aesthetic with high-contrast elements for visibility under varied lighting conditions.

- **Primary Color**: Deep charcoal black `oklch(0.2 0 0)` - Equipment case aesthetic, serious and professional
- **Secondary Colors**: 
  - Warm stage orange `oklch(0.7 0.15 55)` - One battle option, energetic and warm like stage lights
  - Cool electric blue `oklch(0.65 0.15 240)` - Other battle option, contrasts with orange for clear distinction
- **Accent Color**: Bright safety yellow `oklch(0.85 0.18 95)` - Critical information like win counts, impossible to miss
- **Foreground/Background Pairings**: 
  - Background (Off-black #1a1a1a): White text (#FFFFFF) - Ratio 17.5:1 ✓
  - Orange buttons (oklch(0.7 0.15 55)): Black text (oklch(0.2 0 0)) - Ratio 7.2:1 ✓
  - Blue buttons (oklch(0.65 0.15 240)): White text (#FFFFFF) - Ratio 5.8:1 ✓
  - Yellow badges (oklch(0.85 0.18 95)): Black text (oklch(0.2 0 0)) - Ratio 12.1:1 ✓

## Font Selection
Industrial strength typography that remains legible from across a dark stage—bold grotesque for headings and a sturdy monospace for systematic information like card numbers.

- **Typographic Hierarchy**: 
  - Current Song Display: Space Grotesk Bold/64px/tight tracking (-0.02em) - Dominant, impossible to miss
  - Section Headers (Next Up, Battle Options): Space Grotesk SemiBold/24px/normal
  - Song Names in List: Space Grotesk Medium/18px/relaxed leading
  - Card Numbers & Counts: JetBrains Mono Medium/16px/tabular figures for alignment
  - Helper Text: Space Grotesk Regular/14px/subtle weight

## Animations
Animations should feel mechanical and purposeful, like stage equipment moving into position—quick, precise, and confidence-inspiring.

- **Song Transitions**: 300ms slide with ease-out, current song exits left while next slides in from right
- **Battle Selection**: 200ms scale pulse on selected option (1.0 → 1.05 → 1.0) to confirm the choice
- **Bingo Badge Updates**: 150ms number count-up animation when wins are detected
- **Modal Entry/Exit**: 250ms fade + slight scale (0.95 → 1.0) for winning cards modal
- **Key Press Feedback**: 100ms subtle background flash on the active element to confirm input received

## Component Selection
- **Components**: 
  - Card (for song display areas and battle options)
  - Badge (for bingo win counts)
  - Dialog (for showing winning card details)
  - Progress (for setlist progress bar)
  - ScrollArea (for list of winning cards in modal)
  - Separator (to divide sections)
- **Customizations**: 
  - Large custom song display card with oversized text
  - Split-screen battle display with colored backgrounds (orange/blue)
  - Custom bingo grid visualization for card preview in modal
- **States**: 
  - Buttons/Cards: Distinct hover state with brightness increase, active state with scale reduction, disabled state with opacity 0.5
  - Battle options: Unselected (subtle), hovered (brightened), selected (full saturation + border + scale)
  - Progress bar: Gradient fill from left to right showing completion percentage
- **Icon Selection**: 
  - MusicNote for songs
  - Trophy for bingo wins
  - ArrowLeft/ArrowRight for navigation hints
  - Keyboard for control reminders
- **Spacing**: 
  - Page padding: 8 (2rem)
  - Section gaps: 6 (1.5rem)
  - Card internal padding: 6-8
  - Element gaps within cards: 3-4
  - Tight spacing for current song area to maximize text size
- **Mobile**: 
  - Stack battle options vertically instead of side-by-side
  - Reduce current song font to 48px
  - Make touch targets minimum 56px
  - Collapse progress visualization to simplified version
  - Still prioritize keyboard navigation even on mobile
