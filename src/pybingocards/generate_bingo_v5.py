#!/usr/bin/env python3
import yaml
import random
import itertools
import json
from typing import List, Dict, Tuple, Set, Optional, Any


# ============================================================================
# BINGO CARD CLASSES
# ============================================================================


class BingoCard:
    """4 rows x 5 columns = 20 cells. Only rows count as wins."""

    def __init__(self, card_id: int, grid: List[List[str]], card_type: str, winning_line_idx: int = -1):
        self.id = card_id
        self.grid = grid  # 4x5 grid
        self.card_type = card_type
        self.winning_line_idx = winning_line_idx  # Index of the winning line (0-3), -1 if not set

        # Extract songs from grid
        self.songs = []
        for row in grid:
            for cell in row:
                if cell != "FREE":
                    self.songs.append(cell)

    def get_rows(self) -> List[List[str]]:
        """Get all rows (excluding FREE cells)."""
        rows = []
        for row_idx in range(4):
            row_songs = [self.grid[row_idx][c] for c in range(5)
                         if self.grid[row_idx][c] != "FREE"]
            rows.append(row_songs)
        return rows

    def check_line_win(self, played_songs: Set[str]) -> bool:
        """Check if any row is complete."""
        for row in self.get_rows():
            if row and all(song in played_songs for song in row):
                return True
        return False

    def check_full_house(self, played_songs: Set[str]) -> bool:
        """Check if all songs on card are played."""
        return all(song in played_songs for song in self.songs)

    def get_first_line_position(self, song_positions: Dict[str, int]) -> int:
        """Get the position at which first line completes."""
        min_pos = 999
        for row in self.get_rows():
            if not row:
                continue
            row_max = max(song_positions.get(s, 999) for s in row)
            min_pos = min(min_pos, row_max)
        return min_pos

    def get_house_position(self, song_positions: Dict[str, int]) -> int:
        """Get the position at which full house completes."""
        if not self.songs:
            return 999
        return max(song_positions.get(s, 999) for s in self.songs)


class TemplateBingoCard:
    """Template for generating bingo cards."""

    def __init__(self, name: str, win_type: str, winning_line: List[int], line_controls: List[int], songs_indices_to_add: List[int], options_to_permute: List[int]):
        self.name = name  # Template name
        self.win_type = win_type  # 'line' or 'house'
        self.winning_line = winning_line  # Indexes to include in the winning line
        self.line_controls = line_controls  # Values to limit when non-winning lines can win
        # Indices of songs to include in the card
        self.songs_indices_to_add = songs_indices_to_add
        # Option sets to permute for this template (by index)
        self.options_to_permute = options_to_permute

    def generate_cards(self, generator: 'BingoCardGenerator', starting_card_id: int) -> List[BingoCard]:
        """
        generates BingoCard instances based on this template.

        For each permutation of the specified option sets:
          - generate a winning row using songs at winning_line indexes
          - generate non-winning rows, each containing one song from line_controls
          - add the remaining songs specified in songs_indices_to_add
        
        For songs that are not in option sets, they are included as-is.
        For songs in option sets that are in the options_to_permute, include them based on the current permutation.
        For songs in option sets that are not in options_to_permute, ensure that we don't include songs from different options in the same set on the same card.
        """
        cards = []
        card_id = starting_card_id

        # Get distributed permutations to avoid skewing results across templates
        permutations_to_use = generator.get_distributed_permutations(self.options_to_permute)

        print(f"Generating cards for template '{self.name}' with {len(permutations_to_use)} permutations (filtered from {len(generator.all_permutations)}).")

        for perm in permutations_to_use:
            # Extract the options_to_permute subset for card naming
            perm_subset = tuple(perm[opt_idx] for opt_idx in self.options_to_permute if opt_idx < len(perm))

            # Get songs and positions for this permutation
            songs, song_positions = generator.get_songs_for_permutation(perm)
            pos_to_song = {v: k for k, v in song_positions.items()}

            # Build the grid: 4 rows x 5 columns
            grid = []

            # Get winning line songs (songs at winning_line indexes)
            winning_line_songs = []
            for pos in self.winning_line:
                song = pos_to_song.get(pos)
                if song:
                    winning_line_songs.append(song)

            # Get line control songs (one per non-winning row)
            line_control_songs = []
            for pos in self.line_controls:
                song = pos_to_song.get(pos)
                if song:
                    line_control_songs.append(song)
                else:
                    line_control_songs.append(None)

            # Get additional songs to add
            additional_songs = []
            for pos in self.songs_indices_to_add:
                song = pos_to_song.get(pos)
                if song and song not in winning_line_songs and song not in line_control_songs:
                    additional_songs.append(song)

            # Track used songs
            used_songs = set(winning_line_songs)
            used_songs.update(s for s in line_control_songs if s)
            used_songs.update(additional_songs)

            if self.win_type == 'house':
                # For house type: all 4 rows have line controls, no special winning row
                num_rows = 4
                rows = []
                for row_idx in range(num_rows):
                    row = []
                    
                    # Add line control song for this row
                    if row_idx < len(line_control_songs) and line_control_songs[row_idx]:
                        row.append(line_control_songs[row_idx])
                    
                    # Add additional songs distributed across rows
                    songs_per_row = len(additional_songs) // num_rows
                    extra = len(additional_songs) % num_rows
                    start_idx = row_idx * songs_per_row + min(row_idx, extra)
                    end_idx = start_idx + songs_per_row + (1 if row_idx < extra else 0)
                    row.extend(additional_songs[start_idx:end_idx])

                    # Add FREE cells to make 5 columns
                    while len(row) < 5:
                        row.append("FREE")

                    random.shuffle(row)
                    rows.append(row)
                
                grid = rows
                winning_idx = -1  # No winning line for house type
            else:
                # For line type: 1 winning row + 3 non-winning rows with line controls
                # Create winning row first - only include songs from winning_line
                winning_row = winning_line_songs.copy()
                # Fill winning row to 5 cells with FREE (no additional songs)
                while len(winning_row) < 5:
                    winning_row.append("FREE")
                random.shuffle(winning_row)

                # Create 3 non-winning rows, each with a line control song
                non_winning_rows = []
                for row_idx in range(3):
                    row = []
                    
                    # Add line control song for this row
                    if row_idx < len(line_control_songs) and line_control_songs[row_idx]:
                        row.append(line_control_songs[row_idx])
                    
                    # Add additional songs distributed across non-winning rows
                    songs_per_row = len(additional_songs) // 3
                    extra = len(additional_songs) % 3
                    start_idx = row_idx * songs_per_row + min(row_idx, extra)
                    end_idx = start_idx + songs_per_row + (1 if row_idx < extra else 0)
                    row.extend(additional_songs[start_idx:end_idx])

                    # Add FREE cells to make 5 columns
                    while len(row) < 5:
                        row.append("FREE")

                    random.shuffle(row)
                    non_winning_rows.append(row)

                # Place winning row at random position
                winning_idx = random.randint(0, 3)
                for i in range(4):
                    if i == winning_idx:
                        grid.append(winning_row)
                    elif non_winning_rows:
                        grid.append(non_winning_rows.pop(0))

            # Create the card with winning_line_idx
            card_type = f"{self.name}_perm{''.join(str(p) for p in perm_subset)}"
            card = BingoCard(card_id, grid, card_type, winning_line_idx=winning_idx)
            cards.append(card)
            card_id += 1

        return cards


# ============================================================================
# BINGO CARD GENERATOR
# ============================================================================


class BingoCardGenerator:
    """Generator class that stores song and template data for bingo card generation."""

    def __init__(self, fixed_songs: List[str], option_sets: List[Tuple[List[str], List[str]]],
                 song_order: List[Tuple[str, Any]], templates: List[TemplateBingoCard]):
        self.fixed_songs = fixed_songs
        self.option_sets = option_sets
        self.song_order = song_order
        self.templates = templates
        self.num_option_sets = len(option_sets)
        self.all_permutations = list(itertools.product(
            [0, 1], repeat=self.num_option_sets))
        # Track permutation selection indices per options_to_permute key to distribute across templates
        self._permutation_selection_counters: Dict[Tuple[int, ...], int] = {}

    def get_songs_for_permutation(self, perm: Tuple[int, ...]) -> Tuple[List[str], Dict[str, int]]:
        """Get the list of bingo songs and their positions for a given permutation."""
        songs = []
        song_positions = {}
        position = 1

        for item_type, item_value in self.song_order:
            if item_type == 'fixed':
                songs.append(item_value)
                song_positions[item_value] = position
                position += 1
            elif item_type == 'option':
                opt_set_idx = item_value
                chosen = perm[opt_set_idx]
                for song in self.option_sets[opt_set_idx][chosen]:
                    songs.append(song)
                    song_positions[song] = position
                    position += 1

        return songs, song_positions

    def get_song_at_position(self, perm: Tuple[int, ...], target_pos: int) -> Optional[str]:
        """Get the song at a specific position for a permutation."""
        songs, positions = self.get_songs_for_permutation(perm)
        for song, pos in positions.items():
            if pos == target_pos:
                return song
        return None

    def is_card_valid_for_permutation(self, card: BingoCard, perm: Tuple[int, ...]) -> bool:
        """Check if all songs on card are valid for this permutation."""
        songs, _ = self.get_songs_for_permutation(perm)
        songs_set = set(songs)
        return all(s in songs_set for s in card.songs)

    def get_distributed_permutations(self, options_to_permute: List[int]) -> List[Tuple[int, ...]]:
        """
        Get permutations for the given options_to_permute, distributing selections across templates.
        
        This groups all permutations by their options_to_permute key, then for each unique key,
        picks a different full permutation each time a template requests it. This ensures that
        different templates with the same options_to_permute get different underlying permutations.
        """
        # Group permutations by their options_to_permute key
        permutations_by_key: Dict[Tuple[int, ...], List[Tuple[int, ...]]] = {}
        
        for perm in self.all_permutations:
            options_key = tuple(perm[opt_idx] for opt_idx in options_to_permute if opt_idx < len(perm))
            if options_key not in permutations_by_key:
                permutations_by_key[options_key] = []
            permutations_by_key[options_key].append(perm)
        
        # For each unique options_key, pick a different permutation based on the counter
        permutations_to_use = []
        
        for options_key in sorted(permutations_by_key.keys()):
            available_perms = permutations_by_key[options_key]
            
            # Track against the full permutation to distribute across all templates
            for perm in available_perms:
                counter = self._permutation_selection_counters.get(perm, 0)
                if counter == 0:
                    # This permutation hasn't been used yet, select it
                    permutations_to_use.append(perm)
                    self._permutation_selection_counters[perm] = counter + 1
                    break
            else:
                # All permutations for this key have been used at least once,
                # pick the one with the lowest counter
                min_counter = min(self._permutation_selection_counters.get(p, 0) for p in available_perms)
                for perm in available_perms:
                    if self._permutation_selection_counters.get(perm, 0) == min_counter:
                        permutations_to_use.append(perm)
                        self._permutation_selection_counters[perm] = min_counter + 1
                        break
        
        return permutations_to_use

    @staticmethod
    def load_from_file(config_file: str) -> 'BingoCardGenerator':
        """Load a BingoCardGenerator from a config file."""
        import sys
        
        with open(config_file, 'r') as f:
            data = yaml.safe_load(f)

        fixed_songs = []
        option_sets = []
        song_order = []
        
        # Build a mapping from position to option set index
        position_to_option_set: Dict[int, int] = {}
        position = 1

        # Parse songs
        for item in data['songs']:
            if 'name' in item:
                fixed_songs.append(item['name'])
                song_order.append(('fixed', item['name']))
                position += 1
            elif 'optionSet' in item:
                option_a = [s['name'] for s in item['optionSet'][0]]
                option_b = [s['name'] for s in item['optionSet'][1]]
                option_set_idx = len(option_sets)
                option_sets.append((option_a, option_b))
                song_order.append(('option', option_set_idx))
                # Map each position in this option set to its index
                num_songs_in_option = len(option_a)  # Assume option_a and option_b have same length
                for _ in range(num_songs_in_option):
                    position_to_option_set[position] = option_set_idx
                    position += 1

        # Parse templates
        templates = []
        for t in data.get('templates', []):
            win_type = t.get('winType', 'line')  # Default to 'line' for backwards compatibility
            template = TemplateBingoCard(
                name=t.get('name', ''),
                win_type=win_type,
                winning_line=t.get('winningLine', []),
                line_controls=t.get('lineControls', []),
                songs_indices_to_add=t.get('songsToAdd', []),
                options_to_permute=[i-1 for i in t.get('optionsToPermute', [])]
            )
            
            # Validate option sets based on win type
            if win_type == 'line':
                # For line wins: validate that winning line contains a song from each option set in optionsToPermute
                option_sets_in_winning_line = set()
                for pos in template.winning_line:
                    if pos in position_to_option_set:
                        option_sets_in_winning_line.add(position_to_option_set[pos])
                
                missing_option_sets = []
                for opt_idx in template.options_to_permute:
                    if opt_idx not in option_sets_in_winning_line:
                        missing_option_sets.append(opt_idx + 1)  # Convert back to 1-based for error message
                
                if missing_option_sets:
                    print(f"Error in template '{template.name}': winningLine must contain a song from each option set in optionsToPermute.")
                    print(f"  optionsToPermute: {[i+1 for i in template.options_to_permute]} (1-based)")
                    print(f"  Option sets missing from winningLine: {missing_option_sets}")
                    sys.exit(1)
            
            elif win_type == 'house':
                # For house wins: validate that songsToAdd + lineControls contains a song from each option set in optionsToPermute
                combined_positions = template.songs_indices_to_add + template.line_controls
                option_sets_in_combined = set()
                for pos in combined_positions:
                    if pos in position_to_option_set:
                        option_sets_in_combined.add(position_to_option_set[pos])
                
                missing_option_sets = []
                for opt_idx in template.options_to_permute:
                    if opt_idx not in option_sets_in_combined:
                        missing_option_sets.append(opt_idx + 1)  # Convert back to 1-based for error message
                
                if missing_option_sets:
                    print(f"Error in template '{template.name}': songsToAdd + lineControls must contain a song from each option set in optionsToPermute.")
                    print(f"  optionsToPermute: {[i+1 for i in template.options_to_permute]} (1-based)")
                    print(f"  Option sets missing from songsToAdd + lineControls: {missing_option_sets}")
                    sys.exit(1)
                
                # For house wins: also validate that optionsToPermute includes all option sets used in songsToAdd + lineControls
                options_to_permute_set = set(template.options_to_permute)
                missing_from_permute = []
                for opt_idx in option_sets_in_combined:
                    if opt_idx not in options_to_permute_set:
                        missing_from_permute.append(opt_idx + 1)  # Convert back to 1-based for error message
                
                if missing_from_permute:
                    print(f"Error in template '{template.name}': optionsToPermute must include all option sets used in songsToAdd and lineControls.")
                    print(f"  optionsToPermute: {[i+1 for i in template.options_to_permute]} (1-based)")
                    print(f"  Option sets in songsToAdd + lineControls missing from optionsToPermute: {missing_from_permute}")
                    sys.exit(1)
            
            templates.append(template)

        generator = BingoCardGenerator(
            fixed_songs, option_sets, song_order, templates)

        print(
            f"Parsed config: {len(fixed_songs)} fixed songs, {generator.num_option_sets} option sets")
        print(f"Total permutations: {len(generator.all_permutations)}")
        print(f"Templates loaded: {len(templates)}")

        return generator


# ============================================================================
# MAIN GENERATION
# ============================================================================

def main():
    import sys
    
    # Use config file from command line argument if provided
    config_file = sys.argv[1] if len(sys.argv) > 1 else 'config.yml'
    
    # Load generator from config
    generator = BingoCardGenerator.load_from_file(config_file)

    print("\n" + "=" * 100)
    print("GENERATING BINGO CARDS WITH CONTROLLED WIN TIMING")
    print("=" * 100)

    random.seed(42)

    print("\nTemplates Loaded:")
    for template in generator.templates:
        print(f"Template: {template.name}, Winning Line: {template.winning_line}, Line Controls: {template.line_controls}, Songs to Add: {template.songs_indices_to_add}, Options to Permute: {template.options_to_permute}")

    # generate cards
    cards = []
    for template in generator.templates:
        template_cards = template.generate_cards(generator, starting_card_id=len(cards)+1)
        cards.extend(template_cards)

    # for card in cards:
    #     print(f"Generated Card ID: {card.id}, Type: {card.card_type}")
    #     for row in card.grid:
    #         print("  " + ", ".join(row))
    #     print()

    # Output to bingo_cards.json
    cards_data = []
    for card in cards:
        cards_data.append({
            "id": card.id,
            "card_type": card.card_type,
            "grid": card.grid,
            "songs": sorted(card.songs)
        })
    
    with open("bingo_cards.json", "w") as f:
        json.dump(cards_data, f, indent=2)
    
    print(f"\nGenerated {len(cards)} cards and saved to bingo_cards.json")

    # Output permutation selection counters
    print("\nPermutation Selection Counters:")
    for perm, count in sorted(generator._permutation_selection_counters.items()):
        print(f"  permutation={perm}: {count}")


if __name__ == "__main__":
    main()
