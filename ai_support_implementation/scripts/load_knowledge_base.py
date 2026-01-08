"""
Script to load knowledge base from JSON file into database
"""

import asyncio
import json
import sys
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import Settings
from database import init_database, get_db_session
from core_models import AIKnowledgeBase


async def load_knowledge_base(file_path: str) -> int:
    """
    Load knowledge base entries from JSON file into database.
    
    Args:
        file_path: Path to JSON file containing knowledge base entries.
        
    Returns:
        Number of entries loaded.
    """
    # Initialize database
    await init_database()
    
    # Load JSON file
    with open(file_path, 'r', encoding='utf-8') as json_file:
        data = json.load(json_file)
    
    entries = data.get('knowledge_base_entries', [])
    
    if not entries:
        print("No knowledge base entries found in JSON file.")
        return 0
    
    # Get database session
    async with get_db_session() as session:
        loaded_count = 0
        updated_count = 0
        skipped_count = 0
        
        for entry_data in entries:
            # Check if entry already exists
            result = await session.execute(
                select(AIKnowledgeBase).where(
                    AIKnowledgeBase.kb_id == entry_data['id']
                )
            )
            existing_entry = result.scalar_one_or_none()
            
            if existing_entry:
                # Update existing entry
                existing_entry.category = entry_data['category']
                existing_entry.question = entry_data['question']
                existing_entry.answer = entry_data['answer']
                existing_entry.language = entry_data['language']
                existing_entry.service_types = entry_data['service_types']
                existing_entry.priority = entry_data['priority']
                existing_entry.tags = entry_data['tags']
                updated_count += 1
                print(f"✓ Updated: {entry_data['id']} - {entry_data['question'][:50]}...")
            else:
                # Create new entry
                kb_entry = AIKnowledgeBase(
                    kb_id=entry_data['id'],
                    category=entry_data['category'],
                    question=entry_data['question'],
                    answer=entry_data['answer'],
                    language=entry_data['language'],
                    service_types=entry_data['service_types'],
                    priority=entry_data['priority'],
                    tags=entry_data['tags'],
                    is_active=True
                )
                session.add(kb_entry)
                loaded_count += 1
                print(f"✓ Loaded: {entry_data['id']} - {entry_data['question'][:50]}...")
        
        # Commit changes
        await session.commit()
        
        print(f"\n{'='*60}")
        print(f"Knowledge Base Loading Complete")
        print(f"{'='*60}")
        print(f"Total entries in file: {len(entries)}")
        print(f"New entries loaded: {loaded_count}")
        print(f"Existing entries updated: {updated_count}")
        print(f"Skipped entries: {skipped_count}")
        print(f"Total entries in database: {loaded_count + updated_count}")
        
        # Display category breakdown
        print(f"\n{'='*60}")
        print(f"Category Breakdown:")
        print(f"{'='*60}")
        category_counts = {}
        for entry in entries:
            cat = entry['category']
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        for category, count in sorted(category_counts.items()):
            print(f"  {category}: {count} entries")
        
        return loaded_count + updated_count


async def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python load_knowledge_base.py <path_to_json_file>")
        print("Example: python load_knowledge_base.py data/knowledge-base/initial_knowledge_base.json")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not Path(file_path).exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    print(f"Loading knowledge base from: {file_path}")
    print(f"{'='*60}\n")
    
    try:
        total_loaded = await load_knowledge_base(file_path)
        print(f"\n✓ Successfully loaded {total_loaded} knowledge base entries")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Error loading knowledge base: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
