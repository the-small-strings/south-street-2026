#!/usr/bin/env python3
"""
PDF Renderer for Set List

Generates a PDF showing the set list with option sets side by side.
"""

import argparse
import yaml
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas


def load_config(filename: str) -> dict:
    """Load the config YAML file."""
    with open(filename, 'r') as f:
        return yaml.safe_load(f)


def get_text_width(text: str, font_name: str, font_size: float) -> float:
    """Get the width of text in points."""
    from reportlab.pdfbase.pdfmetrics import stringWidth
    return stringWidth(text, font_name, font_size)


def wrap_text(text: str, max_width: float, font_name: str, font_size: float) -> list:
    """Wrap text to fit within a maximum width."""
    words = text.split()
    if not words:
        return ['']
    
    lines = []
    current_line = []
    
    for word in words:
        test_line = ' '.join(current_line + [word])
        if get_text_width(test_line, font_name, font_size) <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                lines.append(word)
                current_line = []
    
    if current_line:
        lines.append(' '.join(current_line))
    
    return lines if lines else ['']


def draw_setlist(c: canvas.Canvas, songs: list, page_width: float, page_height: float):
    """Draw the set list on the canvas."""
    margin = 20 * mm
    y_start = page_height - margin
    y = y_start
    line_height = 7 * mm
    option_line_height = 5.5 * mm
    
    # Title
    c.setFont("Helvetica-Bold", 18)
    c.drawString(margin, y, "Set List")
    y -= 12 * mm
    
    # Column widths for option sets
    content_width = page_width - 2 * margin
    
    for item in songs:
        if 'name' in item:
            # Simple song
            c.setFont("Helvetica", 12)
            c.setFillColor(colors.black)
            c.drawString(margin, y, item['name'])
            y -= line_height
            
        elif 'optionSet' in item:
            # Option set - display side by side
            option_set = item['optionSet']
            
            # Calculate the max height needed for this option set
            max_songs_in_option = max(len(opt) for opt in option_set)
            option_box_height = max_songs_in_option * option_line_height + 4 * mm
            
            # Check if we need a new page
            if y - option_box_height < margin:
                c.showPage()
                y = y_start
            
            # Draw option boxes side by side
            num_options = len(option_set)
            box_width = (content_width - (num_options - 1) * 5 * mm) / num_options
            
            for opt_idx, option in enumerate(option_set):
                box_x = margin + opt_idx * (box_width + 5 * mm)
                box_y = y - option_box_height + 4 * mm
                
                # Draw option box background
                if opt_idx == 0:
                    c.setFillColor(colors.Color(1.0, 0.95, 0.9))  # Light orange
                else:
                    c.setFillColor(colors.Color(0.9, 0.95, 1.0))  # Light blue
                
                c.rect(box_x, box_y, box_width, option_box_height, fill=True, stroke=True)
                
                # Draw option label
                c.setFillColor(colors.gray)
                c.setFont("Helvetica-Bold", 8)
                c.drawString(box_x + 2 * mm, y - 1 * mm, f"Option {chr(65 + opt_idx)}")
                
                # Draw songs in this option
                c.setFillColor(colors.black)
                c.setFont("Helvetica", 10)
                for song_idx, song in enumerate(option):
                    song_name = song['name']
                    text_y = y - 5 * mm - song_idx * option_line_height
                    
                    # Wrap text if needed
                    wrapped = wrap_text(song_name, box_width - 4 * mm, "Helvetica", 10)
                    c.drawString(box_x + 2 * mm, text_y, wrapped[0])
                    if len(wrapped) > 1:
                        for wrap_idx, line in enumerate(wrapped[1:], 1):
                            c.drawString(box_x + 2 * mm, text_y - wrap_idx * 3 * mm, line)
            
            y -= option_box_height + 3 * mm
        
        # Check if we need a new page
        if y < margin + line_height:
            c.showPage()
            y = y_start


def render_setlist_pdf(config_file: str, output_file: str):
    """Render the set list to a PDF file."""
    config = load_config(config_file)
    songs = config.get('songs', [])
    
    page_width, page_height = A4
    c = canvas.Canvas(output_file, pagesize=A4)
    
    draw_setlist(c, songs, page_width, page_height)
    
    c.save()
    print(f"Set list PDF saved to: {output_file}")


def main():
    parser = argparse.ArgumentParser(description='Render set list to PDF')
    parser.add_argument('config', nargs='?', default='config-tss-v2.yml',
                        help='Config YAML file (default: config-tss-v2.yml)')
    parser.add_argument('-o', '--output', default='setlist.pdf',
                        help='Output PDF file (default: setlist.pdf)')
    
    args = parser.parse_args()
    render_setlist_pdf(args.config, args.output)


if __name__ == '__main__':
    main()
