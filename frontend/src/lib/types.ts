export type Member = {
  id: string
  name: string
  budget: string
  dietaryRestrictions: string[]
}

export type GroupData = {
  name: string
  members: Member[]
}

export type CravingData = {
  freeText: string
  cuisineMood: string[]
  location: string
}

export type Recommendation = {
  id: string
  name: string
  cuisine: string
  priceRange: string
  distance: string
  fitScore: number
  reasoning: string
  conflicts: string[]
  votes?: number
}

export const steps = ["Group", "Members", "Cravings", "Results"]

export const dietaryOptions = [
  "Halal",
  "Vegetarian",
  "Vegan",
  "No Pork",
  "No Beef",
  "No Seafood",
  "Gluten-Free",
  "Dairy-Free",
]

export const cuisineOptions = [
  "Malaysian",
  "Chinese",
  "Japanese",
  "Korean",
  "Thai",
  "Indian",
  "Western",
  "Middle Eastern",
  "Fusion",
]

export const cravingSuggestions = [
  "Something warm and comforting",
  "Light and healthy",
  "Spicy and flavorful",
  "Sweet dessert spot",
  "Quick casual bite",
]

export const mockRecommendations: Recommendation[] = [
  {
    id: "1",
    name: "Restoran Nasi Kandar Pelita",
    cuisine: "Malaysian",
    priceRange: "RM15-25",
    distance: "0.8 km",
    fitScore: 9,
    reasoning:
      "Perfect match for your group! This halal-certified restaurant fits within everyone's budget. The casual atmosphere suits a group gathering and they have extensive options to satisfy different tastes.",
    conflicts: [],
    votes: 2,
  },
  {
    id: "2",
    name: "Rakuzen Japanese Restaurant",
    cuisine: "Japanese",
    priceRange: "RM25-45",
    distance: "1.2 km",
    fitScore: 8,
    reasoning:
      "Great option for Japanese cuisine lovers. They have a dedicated halal menu section and vegetarian options available with tofu and vegetable sets.",
    conflicts: ["Some items at upper budget limit"],
    votes: 1,
  },
  {
    id: "3",
    name: "Murni Discovery SS2",
    cuisine: "Fusion",
    priceRange: "RM18-35",
    distance: "2.1 km",
    fitScore: 7,
    reasoning:
      "A solid backup with extensive menu variety covering Malaysian, Western, and Thai cuisines. Halal-certified with many vegetarian options. Known for generous portions.",
    conflicts: ["Slightly further from meeting point", "Can be crowded on Fridays"],
  },
]
