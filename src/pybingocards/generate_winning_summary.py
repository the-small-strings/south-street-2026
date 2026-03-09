#!/usr/bin/env python3
"""
Generate a summary of winning cards for each permutation.

Lists the card numbers for the first 10 line wins and first 5 house wins
for each of the 64 permutations.
"""

import json
import sys
import yaml
import itertools
from collections import defaultdict
from typing import List, Dict, Tuple, Set


def load_setlist(filename: str = 'config.yml'):
    """Load and parse the setlist configuration."""
    with open(filename, 'r') as f:
        data = yaml.safe_load(f)
    
    fixed_songs = []
    option_sets = []
    song_order = []
    
    for item in data['songs']:
        if 'name' in item:
            fixed_songs.append(item['name'])
            song_order.append(('fixed', item['name']))
        elif 'optionSet' in item:
            option_a = [s['name'] for s in item['optionSet'][0]]
            option_b = [s['name'] for s in item['optionSet'][1]]
            option_sets.append((option_a, option_b))
            song_order.append(('option', len(option_sets) - 1))
    
    return fixed_songs, option_sets, song_order


def get_songs_for_permutation(perm: Tuple[int, ...], option_sets, song_order) -> List[str]:
    """Get the ordered list of songs for a given permutation."""
    songs = []
    for item_type, item_value in song_order:
        if item_type == 'fixed':
            songs.append(item_value)
        elif item_type == 'option':
            opt_set_idx = item_value
            chosen = perm[opt_set_idx]
            for song in option_sets[opt_set_idx][chosen]:
                songs.append(song)
    return songs


def load_cards(filename: str = 'bingo_cards.json') -> List[Dict]:
    """Load the generated bingo cards."""
    with open(filename, 'r') as f:
        return json.load(f)


class BingoCardPlayer:
    """Plays a single bingo card."""
    
    def __init__(self, card_data: Dict):
        self.id = card_data['id']
        self.grid = card_data['grid']
        self.card_type = card_data['card_type']
        self.songs = set(card_data['songs'])
        self.marked = set()
    
    def reset(self):
        self.marked = set()
    
    def mark(self, song: str) -> bool:
        if song in self.songs:
            self.marked.add(song)
            return True
        return False
    
    def get_lines(self) -> List[Tuple[int, List[str]]]:
        """Get lines as (line_index, songs) tuples. Rows only (0-3)."""
        lines = []
        for row_idx, row in enumerate(self.grid):
            line = [cell for cell in row if cell != "FREE"]
            if line:
                lines.append((row_idx, line))
        return lines
    
    def check_line_win(self) -> Tuple[bool, int]:
        """Check if any line wins. Returns (won, line_index)."""
        for line_idx, line in self.get_lines():
            if all(song in self.marked for song in line):
                return True, line_idx
        return False, -1
    
    def check_house_win(self) -> bool:
        return self.songs <= self.marked


def get_mark_points(song_order) -> Tuple[List[Tuple[str, int]], Dict[int, str]]:
    """
    Get the list of mark points where players can mark songs.
    Returns:
        - list of (label, end_song_position) tuples
        - dict mapping song_position -> label for quick lookup
    A mark point is either a fixed song or an option set (where both songs are revealed at once).
    """
    mark_points = []
    position_to_label = {}
    song_position = 0
    fixed_count = 0
    option_count = 0
    
    for item_type, item_value in song_order:
        if item_type == 'fixed':
            song_position += 1
            fixed_count += 1
            label = f"Song{song_position}"
            mark_points.append((label, song_position))
            position_to_label[song_position] = label
        elif item_type == 'option':
            option_count += 1
            label = f"Opt{option_count}"
            # Option sets have 2 songs - map both positions to this label
            song_position += 1
            position_to_label[song_position] = label
            song_position += 1
            position_to_label[song_position] = label
            mark_points.append((label, song_position))
        elif item_type == 'excluded_fixed':
            song_position += 1
        elif item_type == 'excluded_option':
            song_position += 2

    return mark_points, position_to_label


def play_game_full(cards: List[BingoCardPlayer], song_sequence: List[str], 
                   mark_points: List[Tuple[str, int]]) -> Tuple[List[int], List[int], List[Tuple[int, int, int]], List[Tuple[int, int]]]:
    """
    Play a game once and return all needed results:
    - line_mark_point_wins: list of first line win counts at each mark point (not cumulative)
    - house_mark_point_wins: list of first house win counts at each mark point (not cumulative)
    - line_wins: [(position, card_id, line_idx), ...] ordered by position
    - house_wins: [(position, card_id), ...] ordered by position
    """
    for card in cards:
        card.reset()
    
    won_line = set()
    won_house = set()
    line_wins = []
    house_wins = []
    
    line_mark_point_wins = []
    house_mark_point_wins = []
    current_mark_idx = 0
    line_wins_at_previous_mark = 0
    house_wins_at_previous_mark = 0
    
    position = 0
    for song in song_sequence:
        if song is None:
            position += 1
        else:
            position += 1
            for card in cards:
                card.mark(song)
                
                if card.id not in won_line:
                    won, line_idx = card.check_line_win()
                    if won:
                        won_line.add(card.id)
                        line_wins.append((position, card.id, line_idx))
                
                if card.id not in won_house and card.check_house_win():
                    won_house.add(card.id)
                    house_wins.append((position, card.id))
        
        # Check if we've reached the current mark point
        while current_mark_idx < len(mark_points) and position >= mark_points[current_mark_idx][1]:
            line_wins_this_mark = len(won_line) - line_wins_at_previous_mark
            line_mark_point_wins.append(line_wins_this_mark)
            line_wins_at_previous_mark = len(won_line)
            
            house_wins_this_mark = len(won_house) - house_wins_at_previous_mark
            house_mark_point_wins.append(house_wins_this_mark)
            house_wins_at_previous_mark = len(won_house)
            
            current_mark_idx += 1
    
    # Fill in any remaining mark points
    while len(line_mark_point_wins) < len(mark_points):
        line_wins_this_mark = len(won_line) - line_wins_at_previous_mark
        line_mark_point_wins.append(line_wins_this_mark)
        line_wins_at_previous_mark = len(won_line)
        
        house_wins_this_mark = len(won_house) - house_wins_at_previous_mark
        house_mark_point_wins.append(house_wins_this_mark)
        house_wins_at_previous_mark = len(won_house)
    
    return line_mark_point_wins, house_mark_point_wins, line_wins, house_wins


def main():
    # Load setlist configuration
    config_file = sys.argv[1] if len(sys.argv) > 1 else 'config.yml'
    fixed_songs, option_sets, song_order = load_setlist(config_file)
    num_option_sets = len(option_sets)
    all_permutations = list(itertools.product([0, 1], repeat=num_option_sets))
    
    # Load cards
    cards_data = load_cards()
    cards = [BingoCardPlayer(c) for c in cards_data]
    cards_by_id = {c.id: c for c in cards}
    
    # Get mark points for the summary table
    mark_points, position_to_label = get_mark_points(song_order)
    
    # Generate summary
    line_wins_output = []
    # Generate summary table header
    line_wins_output.append("=" * 60)
    line_wins_output.append("FIRST LINE WINS SUMMARY TABLE")
    line_wins_output.append("=" * 60)
    line_wins_output.append("")
    line_wins_output.append("Number of cards getting their first row line win at each mark point")
    line_wins_output.append("(Mark points: fixed songs or option reveals)")
    line_wins_output.append("")
    
    # Build header row
    header_labels = [mp[0] for mp in mark_points]
    col_width = max(8, max(len(label) for label in header_labels) + 1)
    perm_col_width = 12 + num_option_sets  # "Permutation " + binary string
    
    header = " " * perm_col_width + "".join(f"{label:>{col_width}}" for label in header_labels)
    line_wins_output.append(header)
    line_wins_output.append("-" * len(header))
    
    # Collect data for each permutation (play each card once per permutation)
    all_results = []  # Store (line_mark_point_wins, house_mark_point_wins, line_wins, house_wins) for each permutation
    for perm_idx, perm in enumerate(all_permutations, 1):
        perm_str = ''.join(map(str, perm))
        song_sequence = get_songs_for_permutation(perm, option_sets, song_order)
        line_mark_point_wins, house_mark_point_wins, line_wins, house_wins = play_game_full(cards, song_sequence, mark_points)
        all_results.append((perm_str, line_mark_point_wins, house_mark_point_wins, line_wins, house_wins))
        
        # Build row
        row_label = f"Perm {perm_idx:3d} ({perm_str})"
        row = f"{row_label:<{perm_col_width}}" + "".join(f"{wins:>{col_width}}" for wins in line_mark_point_wins)
        line_wins_output.append(row)
    
    line_wins_output.append("")
    line_wins_output.append("=" * 60)
    

    # Generate full house wins summary table
    house_wins_output = []
    house_wins_output.append("")
    house_wins_output.append("=" * 60)
    house_wins_output.append("FULL HOUSE WINS SUMMARY TABLE")
    house_wins_output.append("=" * 60)
    house_wins_output.append("")
    house_wins_output.append("Number of cards getting their full house win at each mark point")
    house_wins_output.append("(Mark points: fixed songs or option reveals)")
    house_wins_output.append("")
    
    # Build header row (same as line wins table)
    house_wins_output.append(header)
    house_wins_output.append("-" * len(header))
    
    # Output house wins data from cached results
    for perm_idx, (perm_str, line_mark_point_wins, house_mark_point_wins, line_wins, house_wins) in enumerate(all_results, 1):
        row_label = f"Perm {perm_idx:3d} ({perm_str})"
        row = f"{row_label:<{perm_col_width}}" + "".join(f"{wins:>{col_width}}" for wins in house_mark_point_wins)
        house_wins_output.append(row)
    
    house_wins_output.append("")
    house_wins_output.append("=" * 60)
    

    permutation_details_output = []
    # Detailed per-permutation output (using cached results)
    for perm_idx, (perm_str, line_mark_point_wins, house_mark_point_wins, line_wins, house_wins) in enumerate(all_results, 1):
        
        permutation_details_output.append(f"PERMUTATION {perm_idx} ({perm_str})")
        permutation_details_output.append("-" * 40)
        
        # First 10 line wins
        permutation_details_output.append("")
        permutation_details_output.append("First 10 Line Wins:")
        if line_wins:
            for i, (pos, card_id, line_idx) in enumerate(line_wins[:10], 1):
                label = position_to_label.get(pos, f"Pos{pos}")
                permutation_details_output.append(f"  {i:2d}. {label:>6}: Card #{card_id:3d} - {cards_by_id[card_id].card_type} \t- row {line_idx+1}")
        else:
            permutation_details_output.append("  (none)")
        
        # First 5 house wins
        permutation_details_output.append("")
        permutation_details_output.append("First 5 House Wins:")
        if house_wins:
            for i, (pos, card_id) in enumerate(house_wins[:5], 1):
                label = position_to_label.get(pos, f"Pos{pos}")
                permutation_details_output.append(f"  {i:2d}. {label:>6}: Card #{card_id:3d} - {cards_by_id[card_id].card_type}")
        else:
            permutation_details_output.append("  (none)")
        
        permutation_details_output.append("")
    
    # Write to file
    output_filename = 'summary_line_wins.txt'
    with open(output_filename, 'w') as f:
        f.write('\n'.join(line_wins_output))
    print(f"Generated {output_filename}")

    output_filename = 'summary_house_wins.txt'
    with open(output_filename, 'w') as f:
        f.write('\n'.join(house_wins_output))
    print(f"Generated {output_filename}")

    output_filename = 'summary_by_permutation.txt'
    with open(output_filename, 'w') as f:
        f.write('\n'.join(permutation_details_output))
    print(f"Generated {output_filename}")

    print(f"Processed {len(all_permutations)} permutations")


if __name__ == '__main__':
    main()
