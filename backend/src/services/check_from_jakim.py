import pandas as pd
import re
import os
import logging

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "../../data")


class JAKIMService:
    # initialising function
    def __init__(self):
        self.df = None
        self._load()

    def _load(self):
        """Load and combine KL + Selangor JAKIM datasets at startup."""

        frames = []

        for filename in ["jakim_kl.csv", "jakim_selangor.csv"]:
            filepath = os.path.join(DATA_DIR, filename)
            if not os.path.exists(filepath):
                logger.warning(f"JAKIM dataset not found: {filepath}")
                continue

            try:
                df = pd.read_csv(filepath, encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(filepath, encoding="latin-1")

            frames.append(df)
            logger.info(f"Loaded {len(df)} records from {filename}")

        if not frames:
            logger.error("No JAKIM datasets found. Halal confirmation unavailable.")
            self.df = pd.DataFrame(columns=["company_name", "brand", "_normalised"])
            return

        self.df = pd.concat(frames, ignore_index=True)

        # build normalised name column for matching
        self.df["_normalised"] = self.df["company_name"].apply(self._normalise)

        # also normalise brand column if it exists
        if "brand" in self.df.columns:
            self.df["_normalised_brand"] = self.df["brand"].apply(self._normalise)

        logger.info(f"JAKIM total: {len(self.df)} records loaded")

    def _normalise(self, name: str) -> str:
        """Normalise a name for fuzzy matching."""

        if not isinstance(name, str):
            return ""

        # lowercase everyth and strip leading/trailing whitespaces
        name = name.lower().strip()

        # remove legal suffixes
        name = re.sub(
            r"\b(sdn bhd|plt|enterprise|holding|group|"
            r"restoran|restaurant|cafe|kedai makan|"
            r"warung|kopitiam|mamak)\b",
            "",
            name,
        )
        # Remove special characters and extra spaces
        name = re.sub(r"[^\w\s]", " ", name)
        name = re.sub(r"\s+", " ", name).strip()
        return name

    def is_confirmed_halal(self, restaurant_name: str) -> bool:
        """
        Check if restaurant name matches a JAKIM confirmed halal premise.
        Checks against both company name and brand columns.
        """

        # if dataframe failed to load/is empty, return False (can't confirm anyth)
        if self.df is None or len(self.df) == 0:
            return False

        query = self._normalise(restaurant_name)
        if not query or len(query) < 3:
            return False

        # check company_name column
        # condition 1: Does any row in _normalised contain query as a substring?
        # condition 2: Does query appear as a substring of any row?
        name_match = self.df[
            self.df["_normalised"].str.contains(query, na=False, regex=False)
        ]

        # if any rows matched, restaurant is confirmed halal
        if len(name_match) > 0:
            return True

        # if not match, we check brand column as well
        if "_normalised_brand" in self.df.columns:
            brand_match = self.df[
                self.df["_normalised_brand"].str.contains(query, na=False, regex=False)
            ]

            # match = confirmed
            if len(brand_match) > 0:
                return True

        return False


# Loaded once at startup, stays in memory
jakim_service = JAKIMService()
