import os
import pypdfium2 as pdfium

# Ensure the PDF name matches the file in your BLD folder
pdf_filename = "Vegas Sample BLD Packet.pdf"
output_dir = "public"

os.makedirs(output_dir, exist_ok=True)

if not os.path.exists(pdf_filename):
    print(f"Error: Could not find '{pdf_filename}' in {os.getcwd()}")
    exit(1)

pdf = pdfium.PdfDocument(pdf_filename)

page_mapping = {
    0: "front.jpg",      # Page 1: Vegas Front Cover / Raffle
    1: "standard.jpg",   # Page 2: 12-Grid Restaurant Coupons ($199 Standard)
    2: "large.jpg",      # Page 3: Mr. Burger Spotlight ($349 Large)
    3: "jumbo.jpg",      # Page 4: Lauren Law & Real Estate ($599 Jumbo)
    4: "custom.jpg",     # Page 5: Tech Takeover ($999 Custom)
    5: "repair.jpg",     # Page 6: Home & Repair Trades
    6: "games.jpg"       # Page 7: World of Vegas Maze / Sudoku
}

print("Rendering high-resolution 300 DPI digital proofs...")

for page_idx, filename in page_mapping.items():
    if page_idx < len(pdf):
        page = pdf[page_idx]
        image = page.render(scale=3.0).to_pil()
        output_path = os.path.join(output_dir, filename)
        image.save(output_path, "JPEG", quality=95)
        print(f" Saved: {output_path} (Page {page_idx + 1})")

print("\nAll digital marketing proofs successfully saved to public/!")