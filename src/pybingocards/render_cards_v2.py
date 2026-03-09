#!/usr/bin/env python3
"""
PDF Renderer for Bingo Cards

Generates a printable PDF of all bingo cards.
"""

import json
import os
import random
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def load_cards(filename: str = 'bingo_cards.json'):
    """Load the generated bingo cards."""
    with open(filename, 'r') as f:
        return json.load(f)


def load_rules(filename: str | None = None):
    """Load the rules from markdown file."""
    if filename is None:
        filename = os.path.join(SCRIPT_DIR, 'rules.md')
    try:
        with open(filename, 'r') as f:
            return f.read()
    except FileNotFoundError:
        return None


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


def draw_bingo_card(c, card, x, y, card_width, card_height, logo_path: str | None = None):
    """Draw a single bingo card at the specified position."""
    grid = card['grid']
    card_id = card['id']
    
    # Card dimensions
    margin = 5 * mm
    title_height = 10 * mm
    
    # Small logo dimensions for top corners
    logo_size = 15 * mm
    
    # Calculate cell dimensions
    num_cols = 5
    num_rows = 4
    cell_width = (card_width - 2 * margin) / num_cols
    cell_height = (card_height - 2 * margin - title_height) / num_rows
    
    # Draw card border
    c.setStrokeColor(colors.black)
    c.setLineWidth(2)
    c.rect(x, y, card_width, card_height)
    
    # Draw small logo in top-left corner if provided
    if logo_path and os.path.exists(logo_path):
        try:
            logo_x = x + 5 * mm
            logo_y = y + card_height - logo_size - 1 * mm
            c.drawImage(logo_path, logo_x, logo_y, width=logo_size, height=logo_size,
                       preserveAspectRatio=True, anchor='sw')
        except Exception as e:
            print(f"Warning: Could not load logo for card: {e}")
    
    # Draw small logo in top-right corner if provided
    if logo_path and os.path.exists(logo_path):
        try:
            logo_x = x + card_width - logo_size - 5 * mm
            logo_y = y + card_height - logo_size - 1 * mm
            c.drawImage(logo_path, logo_x, logo_y, width=logo_size, height=logo_size,
                       preserveAspectRatio=True, anchor='sw')
        except Exception as e:
            print(f"Warning: Could not load logo for card: {e}")
    
    # Draw title
    c.setFont("Helvetica-Bold", 16)
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
                # font_name = "Helvetica-Bold"
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


def draw_logo_and_rules(c, width, height, logo_path: str | None = None, rules_text: str | None = None):
    """Draw the TSS logo and rules on the page."""
    # Logo on the left side
    logo_width = 60 * mm
    logo_height = 60 * mm
    logo_x = 15 * mm
    logo_y = height - 15 * mm - logo_height
    
    if logo_path and os.path.exists(logo_path):
        try:
            c.drawImage(logo_path, logo_x, logo_y, width=logo_width, height=logo_height, 
                       preserveAspectRatio=True, anchor='nw')
        except Exception as e:
            print(f"Warning: Could not load logo: {e}")
    
    # Rules on the left side, below the logo
    if rules_text:
        rules_x = 15 * mm
        rules_y = logo_y - 10 * mm
        
        c.setFont("Helvetica-Bold", 14)
        c.drawString(rules_x, rules_y, "Rules:")
        
        c.setFont("Helvetica", 11)
        rules_y -= 16
        
        # Parse rules and draw each line
        for line in rules_text.strip().split('\n'):
            # Skip the title line
            if line.startswith('# '):
                continue
            # Handle "Rules" header
            if line.strip().lower() == 'rules':
                continue
            # Clean up the line
            line = line.strip()
            if line.startswith('- '):
                line = '• ' + line[2:]
            if line:
                # Wrap long lines
                wrapped_lines = wrap_text_to_width(line, 70 * mm, "Helvetica", 11)
                for wrapped_line in wrapped_lines:
                    c.drawString(rules_x, rules_y, wrapped_line)
                    rules_y -= 14


def draw_rules_compact(c, rules_text: str, x: float, y: float, max_width: float):
    """Draw rules in a compact horizontal format below a card."""
    # Collect all rule items into a single line
    rules_items = []
    for line in rules_text.strip().split('\n'):
        if line.startswith('# ') or line.strip().lower() == 'rules':
            continue
        line = line.strip()
        if line.startswith('- '):
            line = line[2:]
        if line:
            rules_items.append(line)
    
    if not rules_items:
        return
    
    # Draw rules as a compact line
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x, y, "Rules: ")
    rules_label_width = get_text_width("Rules: ", "Helvetica-Bold", 8)
    
    c.setFont("Helvetica", 8)
    rules_line = " • ".join(rules_items)
    
    # Wrap to fit within card width
    available_width = max_width - rules_label_width
    wrapped = wrap_text_to_width(rules_line, available_width, "Helvetica", 8)
    
    # Draw first line after "Rules:"
    if wrapped:
        c.drawString(x + rules_label_width, y, wrapped[0])
        # Draw any additional lines below
        for i, line in enumerate(wrapped[1:], 1):
            c.drawString(x, y - i * 10, line)


def render_cards_to_pdf(cards, filename: str = 'bingo_cards.pdf', 
                        cards_per_page: int = 1,
                        logo_path: str | None = None, rules_text: str | None = None):
    """Render all cards to a PDF file with A4, logo and rules.
    
    Args:
        cards: List of card dictionaries
        filename: Output PDF filename
        cards_per_page: 1 for landscape (single card), 2 for portrait (two cards)
        logo_path: Path to logo image
        rules_text: Rules text to display
    """
    
    if cards_per_page == 2:
        # Portrait orientation for 2 cards per page
        page_size = A4
        width, height = page_size
        
        page_margin = 10 * mm
        card_spacing = 5 * mm
        rules_height = 10 * mm if rules_text else 0
        rules_gap = 5 * mm if rules_text else 0  # Space between card and rules
        
        # Calculate card dimensions for 2 cards stacked vertically
        # Account for rules below each card
        available_width = width - 2 * page_margin
        total_rules_space = 2 * (rules_height + rules_gap) if rules_text else 0
        available_height = (height - 2 * page_margin - card_spacing - total_rules_space) / 2
        
        # Card dimensions - fill available space
        card_width = min(available_width, available_height * 1.5)
        card_height = available_height
        
        # Center cards horizontally
        card_x = page_margin + (available_width - card_width) / 2
        
        # Positions for top and bottom cards (with space for rules below each)
        top_card_y = height - page_margin - card_height
        bottom_card_y = page_margin + rules_height + rules_gap
        
        # Create PDF
        c = canvas.Canvas(filename, pagesize=page_size)
        
        total_cards = len(cards)
        total_pages = (total_cards + 1) // 2  # Round up
        
        for card_idx in range(0, total_cards, 2):
            # Draw top card (with logo for 2-per-page layout)
            draw_bingo_card(c, cards[card_idx], card_x, top_card_y, card_width, card_height, logo_path)
            
            # Draw rules below top card
            if rules_text:
                draw_rules_compact(c, rules_text, card_x, top_card_y - rules_gap, card_width)
            
            # Draw bottom card if it exists
            if card_idx + 1 < total_cards:
                draw_bingo_card(c, cards[card_idx + 1], card_x, bottom_card_y, card_width, card_height, logo_path)
                
                # Draw rules below bottom card
                if rules_text:
                    draw_rules_compact(c, rules_text, card_x, bottom_card_y - rules_gap, card_width)
            
            # New page if more cards remain
            if card_idx + 2 < total_cards:
                c.showPage()
        
        c.save()
        print(f"Generated {filename} with {total_cards} cards on {total_pages} pages (2 per page)")
    else:
        # Landscape orientation for 1 card per page
        page_size = landscape(A4)
        width, height = page_size
        
        # Layout: single card per page on the right, logo and rules on the left
        page_margin = 15 * mm
        
        # Left section for logo/rules - smaller to give more space to the card
        left_section_width = 80 * mm
        
        # Card area on the right
        card_spacing = 5 * mm
        card_x = page_margin + left_section_width + card_spacing
        available_card_width = width - card_x - page_margin
        available_card_height = height - 2 * page_margin
        
        # Card dimensions (maintain reasonable aspect ratio for 5x4 grid)
        card_width = min(available_card_width, available_card_height * 1.25)
        card_height = min(available_card_height, card_width / 1.25)
        
        # Center the card in its area
        card_x = card_x + (available_card_width - card_width) / 2
        card_y = page_margin + (available_card_height - card_height) / 2
        
        # Create PDF
        c = canvas.Canvas(filename, pagesize=page_size)
        
        total_cards = len(cards)
        
        for card_idx, card in enumerate(cards):
            # Draw logo and rules on the left
            draw_logo_and_rules(c, width, height, logo_path, rules_text)
            
            # Draw the bingo card on the right
            draw_bingo_card(c, card, card_x, card_y, card_width, card_height)
            
            # New page if more cards remain
            if card_idx < total_cards - 1:
                c.showPage()
        
        c.save()
        print(f"Generated {filename} with {total_cards} cards on {total_cards} pages")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Render bingo cards to PDF')
    parser.add_argument('-i', '--input', default='bingo_cards.json',
                        help='Input JSON file with card data')
    parser.add_argument('-o', '--output', default='bingo_cards_v2.pdf',
                        help='Output PDF filename')
    parser.add_argument('-c', '--cards-per-page', type=int, default=1,
                        choices=[1, 2],
                        help='Cards per page: 1 (landscape) or 2 (portrait)')
    parser.add_argument('--logo', default=None,
                        help='Path to logo image (default: tss-black-on-white-2.png)')
    parser.add_argument('--rules', default=None,
                        help='Path to rules markdown file (default: rules.md)')
    parser.add_argument('--no-logo', action='store_true',
                        help='Disable logo display')
    parser.add_argument('--no-rules', action='store_true',
                        help='Disable rules display')
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
    
    # Load logo
    logo_path = None
    if not args.no_logo:
        if args.logo:
            logo_path = args.logo
        else:
            # Default logo path
            logo_path = os.path.join(SCRIPT_DIR, 'tss-black-on-white-2.png')
        if not os.path.exists(logo_path):
            print(f"Warning: Logo file not found: {logo_path}")
            logo_path = None
    
    # Load rules
    rules_text = None
    if not args.no_rules:
        rules_path = args.rules if args.rules else os.path.join(SCRIPT_DIR, 'rules.md')
        rules_text = load_rules(rules_path)
        if rules_text is None:
            print(f"Warning: Rules file not found: {rules_path}")
    
    # Render to PDF
    orientation = "portrait, 2 cards per page" if args.cards_per_page == 2 else "landscape, 1 card per page"
    print(f"Rendering to {args.output} (A4 {orientation})...")
    render_cards_to_pdf(cards, args.output, args.cards_per_page, logo_path, rules_text)


if __name__ == '__main__':
    main()
