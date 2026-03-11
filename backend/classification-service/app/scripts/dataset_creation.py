import os
import csv

LABEL_FILE = "test_data_labels.csv"
TOP_TRIGRAM_FILE = "top_500_3grams.txt"
NGRAM_FOLDER = "data"
OUTPUT_FILE = "dataset.csv"


# --------------------------------------------------
# Load top 500 trigrams
# --------------------------------------------------

with open(TOP_TRIGRAM_FILE, "r") as f:
    top_trigrams = [line.strip() for line in f if line.strip()]

print("Loaded", len(top_trigrams), "top trigrams")


# --------------------------------------------------
# Read sha256 + label file
# --------------------------------------------------

rows = []

with open(LABEL_FILE, "r") as f:
    reader = csv.DictReader(f)

    for row in reader:
        sha256 = row["sha256"]
        label = row["label"]

        features = {tg: 0 for tg in top_trigrams}

        trigram_file = os.path.join(
            NGRAM_FOLDER,
            f"{sha256}_3gram.csv"
        )

        if os.path.exists(trigram_file):

            with open(trigram_file, "r") as tf:
                trigram_reader = csv.DictReader(tf)

                for trigram_row in trigram_reader:

                    trigram = trigram_row["trigram"]
                    freq = int(trigram_row["freq"])

                    if trigram in features:
                        features[trigram] = freq

        else:
            print("Missing file:", trigram_file)

        # --------------------------------------------------
        # NORMALIZATION STEP (NEW)
        # --------------------------------------------------

        total_count = sum(features.values())

        if total_count > 0:
            for tg in features:
                features[tg] = features[tg] / total_count

        # --------------------------------------------------

        row_data = {"sha256": sha256}
        row_data.update(features)
        row_data["label"] = label

        rows.append(row_data)


# --------------------------------------------------
# Write final dataset
# --------------------------------------------------

fieldnames = ["sha256"] + top_trigrams + ["label"]

with open(OUTPUT_FILE, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)

    writer.writeheader()

    for r in rows:
        writer.writerow(r)

print("Dataset written to", OUTPUT_FILE)