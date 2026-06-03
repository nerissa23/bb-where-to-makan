import csv
import os
import time
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup


BASE_URL = "https://myehalal.halal.gov.my/portal-halal/v1/index.php"
DATA_PARAM = "ZGlyZWN0b3J5L2luZGV4X2RpcmVjdG9yeTs7Ozs="

STATES = {
    "kl":       "14",
    "selangor": "10",
}


def extract_rows(page) -> list[dict]:
    """Extract all records from the current page."""
    html = page.content()
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.select("table tbody tr")

    records = []
    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 3:
            continue

        name_block = cells[1].get_text(separator="\n").strip()
        lines = [line.strip() for line in name_block.split("\n") if line.strip()]

        company_name = lines[0] if lines else ""
        brand = ""
        address_lines = []

        for line in lines[1:]:
            if line.upper().startswith("JENAMA:"):
                brand = line.split(":", 1)[1].strip()
            else:
                address_lines.append(line)

        records.append({
            "company_name": company_name,
            "brand":        brand,
            "address":      ", ".join(address_lines),
            "expiry_date":  cells[-1].get_text().strip(),
        })

    return records


def save_csv(records: list[dict], filename: str, state: str):
    os.makedirs("data", exist_ok=True)
    filepath = os.path.join("data", filename)

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["company_name", "brand", "address", "state", "expiry_date"]
        )
        writer.writeheader()
        for r in records:
            r["state"] = state
            writer.writerow(r)

    print(f"Saved {len(records)} records to {filepath}")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        for state_name, state_code in STATES.items():
            start_url = (
                f"{BASE_URL}"
                f"?data={DATA_PARAM}"
                f"&negeri={state_code}"
                f"&category="
                f"&cari="
                f"&page=1"
            )

            print(f"\n{'='*50}")
            print(f"MANUAL STEP REQUIRED for {state_name.upper()}")
            print(f"{'='*50}")
            print("1. Browser will open the JAKIM page")
            print("2. YOU manually click 'Premis Makanan' tab")
            print("3. Wait for the table to load")
            print("4. Press ENTER here to start scraping")
            print("{'='*50}")

            page.goto(start_url, timeout=30000, wait_until="networkidle")

            # Wait for manual intervention
            input("Press ENTER once you've clicked Premis Makanan and see the table...")

            # Verify we're on the right tab
            html = page.content()
            if "Premis Makanan" not in html:
                print("WARNING: Premis Makanan tab may not be active")

            all_records = []
            current_page = 1

            while True:
                records = extract_rows(page)

                if not records:
                    print(f"  No records on page {current_page}, stopping")
                    break

                all_records.extend(records)
                print(f"  Page {current_page}: {len(records)} rows (total: {len(all_records)})")

                try:
                    next_btn = page.locator("a:has-text('Next')").first
                    if not next_btn.is_visible():
                        print("  No Next button found, done")
                        break

                    next_btn.click()
                    page.wait_for_load_state("networkidle")
                    page.wait_for_selector("table tbody tr", timeout=15000)
                    current_page += 1
                    time.sleep(1.5)

                except Exception as e:
                    print(f"  Navigation error: {e}, stopping")
                    break

            save_csv(all_records, f"jakim_{state_name}.csv", state_name.upper())
            print(f"Done: {state_name} — {len(all_records)} total records")

        browser.close()
        print("\nAll states scraped successfully!")