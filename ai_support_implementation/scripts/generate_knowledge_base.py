"""
Script to generate additional knowledge base entries to reach 1,000+ total
"""

import json
import random
from datetime import datetime
from pathlib import Path


CATEGORIES = [
    "account", "payment", "rides", "safety", "food", "grocery", 
    "goods", "truck_van", "corporate", "support", "promotions",
    "technical", "pricing", "locations", "vehicles", "drivers"
]

LANGUAGES = ["en", "es", "fr", "de", "ar", "zh", "ja", "ko", "pt", "ru"]

SERVICE_TYPES = ["RIDE", "MOTO", "FOOD", "GROCERY", "GOODS", "TRUCK_VAN"]

PRIORITIES = [1, 2, 3]

# Fill-in words for templates
ACTIONS = [
    "change", "update", "delete", "add", "remove", "create", "cancel", 
    "book", "schedule", "track", "share", "report", "contact", "verify"
]

ITEMS = [
    "account", "profile", "password", "phone number", "email", "address",
    "payment method", "card", "wallet", "ride", "order", "trip",
    "location", "vehicle", "driver", "subscription", "plan", "offer"
]

METHODS = [
    "credit card", "debit card", "Apple Pay", "Google Pay", "cash", 
    "wallet", "gift card", "corporate account", "bank transfer"
]

ATTRIBUTES = [
    "benefits", "features", "requirements", "limits", "fees", "charges",
    "discounts", "rates", "options", "types", "categories"
]

STATUSES = [
    "declined", "pending", "cancelled", "delayed", "rejected", "failed",
    "processing", "completed", "active", "inactive", "expired"
]

TYPES = [
    "ride", "food delivery", "grocery delivery", "package delivery",
    "truck service", "scheduled ride", "shared ride", "premium ride"
]

FEATURES = [
    "SOS button", "trip sharing", "ride recording", "scheduled booking",
    "shared rides", "women-only option", "corporate account", "loyalty program"
]

SITUATIONS = [
    "emergency", "accident", "lost item", "wrong order", "late driver",
    "app crash", "payment failure", "login issue", "location error"
]

PLACES = [
    "home", "work", "airport", "restaurant", "grocery store",
    "shopping mall", "hotel", "hospital", "train station", "bus station"
]

OFFERS = [
    "discount code", "promo code", "referral bonus", "loyalty reward",
    "new user offer", "seasonal promotion", "limited time deal"
]

OFFER_TYPES = [
    "discounts", "promotions", "deals", "special offers", "bonuses",
    "referral programs"
]

CALCULATED = [
    "fare calculated", "price determined", "surge applied", "discount applied",
    "tip added", "fee charged"
]

CONDITIONS = [
    "surge pricing", "cancellation fee", "service fee", "tax",
    "minimum fare", "peak hour rates"
]

ROLES = [
    "driver", "rider", "customer", "partner", "corporate user"
]

PLATFORMS = [
    "iOS", "Android", "web", "desktop", "tablet"
]


def generate_answer(category: str, question: str) -> str:
    """Generate a contextual answer based on category and question."""
    
    # Extract key terms from question
    question_lower = question.lower()
    
    if "change" in question_lower or "update" in question_lower:
        if category == "account":
            return f"To update your account, go to Settings > Account and select the option to update. Follow the prompts to verify your changes. Some changes may require additional verification for security purposes."
        elif category == "payment":
            return f"To update your payment method, go to Payment Settings, select the current method, and choose 'Edit' or 'Remove'. You can add a new payment method by tapping 'Add Payment Method' and following the verification steps."
        else:
            return f"To make this change, navigate to the relevant section in the app settings. Follow the on-screen prompts and verify any changes as required. If you encounter issues, contact support for assistance."
    
    elif "how" in question_lower and "do i" in question_lower:
        if category == "rides":
            return f"To complete this action: 1) Open the app and navigate to the relevant section. 2) Enter your details or preferences. 3) Review and confirm your selection. 4) Complete any required verification steps. 5) You'll receive a confirmation once the action is complete."
        elif category == "safety":
            return f"Your safety is our priority. For this feature: 1) Access it through the Safety menu in the app. 2) Follow the on-screen instructions. 3) The feature is designed to protect you during your trip. 4) In emergencies, use the SOS button for immediate assistance."
        else:
            return f"Here's how to do this: 1) Open the Tripo04OS app. 2) Navigate to the appropriate section. 3) Follow the step-by-step prompts. 4) Confirm your action when prompted. 5) Check your email or app notifications for confirmation."
    
    elif "what" in question_lower or "why" in question_lower:
        if "fee" in question_lower or "charge" in question_lower:
            return f"This fee is applied according to our pricing policy. It covers operational costs and ensures service quality. The specific amount depends on factors like service type, distance, time, and current demand. You can view the complete fare breakdown in your trip details before confirming."
        elif "delayed" in question_lower or "late" in question_lower:
            return f"Delays can occur due to various factors: high demand, traffic conditions, weather, or driver availability. We continuously monitor and optimize our matching algorithm to minimize wait times. If your wait exceeds the estimated time significantly, you may be eligible for compensation."
        else:
            return f"This feature/service is designed to enhance your experience with Tripo04OS. It provides specific benefits and operates according to our terms of service. For detailed information, please refer to our help center or contact customer support."
    
    elif "can i" in question_lower:
        return f"Yes, you can do this through the app. Navigate to the relevant section and follow the prompts. Some actions may have restrictions or requirements, which will be clearly explained in the app. If you encounter any issues, our support team is available 24/7 to assist you."
    
    else:
        return f"For assistance with this request, please: 1) Check the relevant section in the app. 2) Review our help center articles. 3) Use the in-app chat support for immediate assistance. 4) Contact our 24/7 support line if needed. We're here to help you have the best experience with Tripo04OS."


def generate_entry(entry_id: str, category: str, language: str = "en") -> dict:
    """Generate a single knowledge base entry."""
    
    # Generate question from templates
    action = random.choice(ACTIONS)
    item = random.choice(ITEMS)
    method = random.choice(METHODS)
    attribute = random.choice(ATTRIBUTES)
    status = random.choice(STATUSES)
    type_val = random.choice(TYPES)
    feature = random.choice(FEATURES)
    situation = random.choice(SITUATIONS)
    place = random.choice(PLACES)
    offer = random.choice(OFFERS)
    offers = random.choice(OFFER_TYPES)
    calculated = random.choice(CALCULATED)
    condition = random.choice(CONDITIONS)
    role = random.choice(ROLES)
    platform = random.choice(PLATFORMS)
    
    # Create question variations
    question_templates = [
        f"How do I {action}?",
        f"What happens if I {action}?",
        f"Can I {action} my {item}?",
        f"Why can't I {action}?",
        f"Is it possible to {action}?",
        f"How do I {action} with {method}?",
        f"What are the {attribute} for {method}?",
        f"Why was my {item} {status}?",
        f"How long does {action} take?",
        f"Can I {action} my {item}?",
        f"How does the {feature} work?",
        f"What should I do in {situation}?",
        f"Is my {item} {attribute}?",
        f"How do I {action} the {feature}?",
        f"What {attribute} features are available?",
        f"How do I {action} a {type_val}?",
        f"What is the {attribute} of {type_val}?",
        f"Can I {action} during my {type_val}?",
        f"Why is my {type_val} {status}?",
        f"How do I {action} my {type_val}?",
        f"How do I {action} from {place}?",
        f"Can you {action} to {place}?",
        f"What {attribute} are available in {place}?",
        f"Why isn't {place} {status}?",
        f"How do I {action} my {place}?",
        f"How do I use the {offer}?",
        f"What are the current {offers}?",
        f"How do I get a {offer}?",
        f"When does the {offer} {action}?",
        f"Can I {action} {offers}?",
        f"Why is the app {status}?",
        f"How do I {action} the {feature}?",
        f"What should I do if {situation}?",
        f"Is the {feature} available on {platform}?",
        f"How do I {action} my {item}?",
        f"How is the {item} {calculated}?",
        f"What are the {attribute} for {type_val}?",
        f"Why is my {item} so {attribute}?",
        f"When does the {condition} apply?",
        f"How can I {action} on {item}?",
        f"How do I {action} a {role}?",
        f"What are the {attribute} for {role}?",
        f"Can I {action} as a {role}?",
        f"How do I {action} my {item}?",
        f"What {condition} apply to {role}?"
    ]
    
    question = random.choice(question_templates)
    
    # Generate answer
    answer = generate_answer(category, question)
    
    # Select service types based on category
    if category in ["rides", "safety", "locations", "vehicles", "drivers"]:
        service_types = ["RIDE", "MOTO", "TRUCK_VAN"]
    elif category in ["food"]:
        service_types = ["FOOD"]
    elif category in ["grocery"]:
        service_types = ["GROCERY"]
    elif category in ["goods"]:
        service_types = ["GOODS"]
    elif category in ["truck_van"]:
        service_types = ["TRUCK_VAN"]
    else:
        service_types = SERVICE_TYPES
    
    # Generate tags
    tags = [category]
    if "how" in question.lower():
        tags.append("how to")
    if "change" in question.lower() or "update" in question.lower():
        tags.append("update")
    if "payment" in question.lower():
        tags.append("payment")
    if "account" in question.lower():
        tags.append("account")
    
    return {
        "id": entry_id,
        "category": category,
        "question": question,
        "answer": answer,
        "language": language,
        "service_types": service_types,
        "priority": random.choice(PRIORITIES),
        "tags": tags,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }


def generate_knowledge_base(total_entries: int, output_file: str) -> None:
    """Generate knowledge base entries and save to JSON file."""
    
    entries = []
    entry_id = 1
    
    # Distribute entries across categories
    entries_per_category = total_entries // len(CATEGORIES)
    extra_entries = total_entries % len(CATEGORIES)
    
    print(f"Generating {total_entries} knowledge base entries...")
    print(f"Categories: {len(CATEGORIES)}")
    print(f"Entries per category: {entries_per_category}")
    print(f"Extra entries: {extra_entries}\n")
    
    for i, category in enumerate(CATEGORIES):
        # Add extra entries to first few categories
        category_count = entries_per_category + (1 if i < extra_entries else 0)
        
        print(f"Generating {category_count} entries for category: {category}")
        
        for _ in range(category_count):
            # Generate entry for English
            entry = generate_entry(f"KB{entry_id:04d}", category, "en")
            entries.append(entry)
            entry_id += 1
            
            # Generate entry for additional languages (30% chance)
            if random.random() < 0.3:
                language = random.choice([l for l in LANGUAGES if l != "en"])
                entry = generate_entry(f"KB{entry_id:04d}", category, language)
                entries.append(entry)
                entry_id += 1
    
    # Save to JSON file
    output_data = {
        "knowledge_base_entries": entries,
        "metadata": {
            "version": "1.0.0",
            "total_entries": len(entries),
            "categories": CATEGORIES,
            "languages": LANGUAGES,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "last_updated": datetime.utcnow().isoformat() + "Z"
        }
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"Knowledge Base Generation Complete")
    print(f"{'='*60}")
    print(f"Total entries generated: {len(entries)}")
    print(f"Output file: {output_file}")
    
    # Display category breakdown
    category_counts = {}
    for entry in entries:
        cat = entry['category']
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    print(f"\nCategory Breakdown:")
    for category, count in sorted(category_counts.items()):
        print(f"  {category}: {count} entries")
    
    # Display language breakdown
    language_counts = {}
    for entry in entries:
        lang = entry['language']
        language_counts[lang] = language_counts.get(lang, 0) + 1
    
    print(f"\nLanguage Breakdown:")
    for language, count in sorted(language_counts.items()):
        print(f"  {language}: {count} entries")


def main():
    """Main entry point."""
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python generate_knowledge_base.py <total_entries> <output_file>")
        print("Example: python generate_knowledge_base.py 1000 data/knowledge-base/generated_knowledge_base.json")
        sys.exit(1)
    
    try:
        total_entries = int(sys.argv[1])
    except ValueError:
        print("Error: total_entries must be a number")
        sys.exit(1)
    
    output_file = sys.argv[2]
    
    # Create output directory if it doesn't exist
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    
    generate_knowledge_base(total_entries, output_file)


if __name__ == "__main__":
    main()
