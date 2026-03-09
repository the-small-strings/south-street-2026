#!/usr/bin/env python3
"""
PDF Renderer for Bingo Cards

Generates a printable PDF of all bingo cards.
"""

import json
import random
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


def load_cards(filename: str = 'bingo_cards.json'):
    """Load the generated bingo cards."""
    with open(filename, 'r') as f:
        return json.load(f)


def get_text_width(text: str, font_name: str, font_size: float) -> float:
    """Get the width of text in points."""
    from reportlab.pdfbase.pdfmetrics import stringWidth
    return stringWidth(text, font_name, font_size)


def wrap_text_to_width(text: str, max_width: float, font_name: str, font_size: float) -> list:
    """Wrap text to fit within a maximum width. Returns list of lines."""
    words = text.split()
    if not words:
        return ['']
    
    lines = []
    current_line = []
    
    for word in words:
        # Try adding the word to current line
        test_line = ' '.join(current_line + [word])
        if get_text_width(test_line, font_name, font_size) <= max_width:
            current_line.append(word)
        else:
            # Word doesn't fit - save current line and start new one
            if current_line:
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                # Single word is too long - just add it anyway
                lines.append(word)
                current_line = []
    
    if current_line:
        lines.append(' '.join(current_line))
    
    return lines if lines else ['']


def draw_bingo_card(c, card, x, y, card_width, card_height):
    """Draw a single bingo card at the specified position."""
    grid = card['grid']
    card_id = card['id']
    
    # Card dimensions
    margin = 5 * mm
    title_height = 8 * mm
    
    # Calculate cell dimensions
    num_cols = 5
    num_rows = 4
    cell_width = (card_width - 2 * margin) / num_cols
    cell_height = (card_height - 2 * margin - title_height) / num_rows
    
    # Draw card border
    c.setStrokeColor(colors.black)
    c.setLineWidth(2)
    c.rect(x, y, card_width, card_height)
    
    # Draw title
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(x + card_width / 2, y + card_height - title_height + 2 * mm, 
                        f"BINGO - Card #{card_id}")
    
    # Draw grid
    grid_top = y + card_height - title_height - margin
    grid_left = x + margin
    
    c.setLineWidth(1)
    
    for row_idx, row in enumerate(grid):
        for col_idx, cell in enumerate(row):
            cell_x = grid_left + col_idx * cell_width
            cell_y = grid_top - (row_idx + 1) * cell_height
            
            # Draw cell border
            c.rect(cell_x, cell_y, cell_width, cell_height)
            
            # Fill FREE cells with a different color
            if cell == "FREE":
                c.setFillColor(colors.lightgrey)
                c.rect(cell_x, cell_y, cell_width, cell_height, fill=1)
                c.setFillColor(colors.black)
                c.setFont("Helvetica-Bold", 12)
                c.drawCentredString(cell_x + cell_width / 2, cell_y + cell_height / 2 - 4, "FREE")
            else:
                # Draw song name
                c.setFillColor(colors.black)
                
                # Available width for text (with small padding)
                text_padding = 2 * mm
                available_text_width = cell_width - 2 * text_padding
                
                # Try different font sizes until text fits
                font_name = "Helvetica"
                font_size = 13
                lines = []
                line_height = 13
                total_text_height = 0
                
                for fs in [13,12, 11, 10, 9, 8, 7, 6]:
                    font_size = fs
                    lines = wrap_text_to_width(cell, available_text_width, font_name, font_size)
                    line_height = font_size + 2
                    total_text_height = len(lines) * line_height
                    
                    # Check if all lines fit within cell height (with padding)
                    available_text_height = cell_height - 2 * text_padding
                    if total_text_height <= available_text_height:
                        break
                
                c.setFont(font_name, font_size)
                
                # Calculate vertical positioning to center text block
                start_y = cell_y + cell_height / 2 + (total_text_height / 2) - line_height + 3
                
                for i, line in enumerate(lines):
                    text_y = start_y - i * line_height
                    c.drawCentredString(cell_x + cell_width / 2, text_y, line)


def render_cards_to_pdf(cards, filename: str = 'bingo_cards.pdf', 
                        cards_per_page: int = 2, page_size=A4):
    """Render all cards to a PDF file."""
    
    width, height = page_size
    
    # Calculate card dimensions based on layout
    if cards_per_page == 1:
        cols, rows = 1, 1
    elif cards_per_page == 2:
        cols, rows = 1, 2
    elif cards_per_page == 4:
        cols, rows = 2, 2
    elif cards_per_page == 6:
        cols, rows = 2, 3
    else:
        cols, rows = 2, 2
        cards_per_page = 4
    
    # Page margins
    page_margin = 15 * mm
    
    # Available space
    available_width = width - 2 * page_margin
    available_height = height - 2 * page_margin
    
    # Card dimensions with spacing
    card_spacing = 5 * mm
    card_width = (available_width - (cols - 1) * card_spacing) / cols
    card_height = (available_height - (rows - 1) * card_spacing) / rows
    
    # Create PDF
    c = canvas.Canvas(filename, pagesize=page_size)
    
    card_idx = 0
    total_cards = len(cards)
    total_pages = (total_cards + cards_per_page - 1) // cards_per_page
    
    while card_idx < total_cards:
        # Draw cards on current page
        for row in range(rows):
            for col in range(cols):
                if card_idx >= total_cards:
                    break
                
                # Calculate position (top-left origin for cards)
                x = page_margin + col * (card_width + card_spacing)
                y = height - page_margin - (row + 1) * card_height - row * card_spacing
                
                draw_bingo_card(c, cards[card_idx], x, y, card_width, card_height)
                card_idx += 1
        
        # New page if more cards remain
        if card_idx < total_cards:
            c.showPage()
    
    c.save()
    print(f"Generated {filename} with {total_cards} cards on {total_pages} pages")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Render bingo cards to PDF')
    parser.add_argument('-i', '--input', default='bingo_cards.json',
                        help='Input JSON file with card data')
    parser.add_argument('-o', '--output', default='bingo_cards.pdf',
                        help='Output PDF filename')
    parser.add_argument('-n', '--cards-per-page', type=int, default=2,
                        choices=[1, 2, 4, 6],
                        help='Number of cards per page (1, 2, 4, or 6)')
    parser.add_argument('-s', '--page-size', default='A4',
                        choices=['A4', 'letter'],
                        help='Page size (A4 or letter)')
    parser.add_argument('--no-randomise', action='store_true',
                        help='Disable randomisation of card order')
    
    args = parser.parse_args()
    
    # Load cards
    print(f"Loading cards from {args.input}...")
    cards = load_cards(args.input)
    print(f"Loaded {len(cards)} cards")
    
    # Randomise card order unless disabled
    if not args.no_randomise:
        random.shuffle(cards)
        print("Card order randomised")
    
    # Set page size
    page_size = A4 if args.page_size == 'A4' else letter
    
    # Render to PDF
    print(f"Rendering to {args.output} ({args.cards_per_page} cards per page, {args.page_size})...")
    render_cards_to_pdf(cards, args.output, args.cards_per_page, page_size)


if __name__ == '__main__':
    main()
