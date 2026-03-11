import os
import csv
from collections import Counter

INPUT_FOLDER = "data"
OUTPUT_FILE = "top_500_3grams.txt"

global_counts = Counter()

for filename in os.listdir(INPUT_FOLDER):
    if not filename.endswith(".csv"):
        continue

    filepath = os.path.join(INPUT_FOLDER, filename)

    rewritten_rows = []

    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)

        # Skip header
        header = next(reader, None)

        for row in reader:
            if len(row) < 4:
                continue

            op1 = row[0].strip()
            op2 = row[1].strip()
            op3 = row[2].strip()
            freq = int(row[3])

            trigram = f"{op1}_{op2}_{op3}"

            # Update global frequency
            global_counts[trigram] += freq

            rewritten_rows.append([trigram, freq])

    # Rewrite file with new header
    with open(filepath, "w", newline="") as f:
        writer = csv.writer(f)

        writer.writerow(["trigram", "freq"])   # new header
        writer.writerows(rewritten_rows)

top_500 = global_counts.most_common(500)

with open(OUTPUT_FILE, "w") as f:
   for trigram, _ in top_500:
       f.write(trigram + "\n")

print("CSV files rewritten with trigram format.")
print("Top 500 3-grams saved to:", OUTPUT_FILE)
