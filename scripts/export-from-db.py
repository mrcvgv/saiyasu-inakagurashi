#!/usr/bin/env python3
"""Export listings from SQLite DB to listings-live.json, merging with existing data."""

import sqlite3
import json
import os
from datetime import datetime
from collections import Counter

DB_PATH = os.environ.get('AKIYA_DB_PATH',
    os.path.join(os.path.dirname(__file__), '..', 'data', 'akiya_hunter_v1.sqlite'))
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'listings-live.json')

def format_price(yen):
    if yen is None:
        return '価格未定'
    if yen == 0:
        return '0円'
    man = yen / 10000
    if man == int(man):
        return f'{int(man)}万円'
    return f'{man}万円'

def parse_images(json_str):
    if not json_str:
        return []
    try:
        parsed = json.loads(json_str)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []

def infer_tags(row):
    tags = []
    price = row['price_yen']
    if price is not None:
        if price == 0:
            tags.append('0円')
        if price <= 500000:
            tags.append('激安')
    if row['is_akiya']:
        tags.append('空き家')
    age = row['building_age']
    if age and age >= 50:
        tags.append('古民家')
    title = row['title'] or ''
    notes = row['notes'] or ''
    text = (title + ' ' + notes).lower()
    if 'diy' in text:
        tags.append('DIY可')
    if '海' in text:
        tags.append('海近')
    if '山' in text or '高原' in text:
        tags.append('山あい')
    if '温泉' in text:
        tags.append('温泉')
    if '畑' in text or '農' in text:
        tags.append('畑付き')
    if '平屋' in text:
        tags.append('平屋')
    if '倉庫' in text or '車庫' in text:
        tags.append('倉庫付き')
    if '賃貸' in text or '家賃' in text or '月額' in text:
        tags.append('賃貸')
    return list(set(tags))

def main():
    if not os.path.exists(DB_PATH):
        print(f'DB not found: {DB_PATH}')
        return

    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    rows = db.execute(
        'SELECT * FROM properties WHERE price_yen <= 10000000 OR price_yen IS NULL ORDER BY last_seen_at DESC'
    ).fetchall()
    db.close()

    listings = []
    for row in rows:
        price = row['price_yen'] if row['price_yen'] is not None else 0
        tags = infer_tags(row)
        images = parse_images(row['image_urls_json'])
        built_year = None
        if row['building_age']:
            built_year = datetime.now().year - row['building_age']

        listings.append({
            'id': str(row['id']),
            'title': row['title'] or '物件情報',
            'price': price,
            'priceLabel': format_price(row['price_yen']),
            'prefecture': row['prefecture'] or '',
            'city': row['city'] or '',
            'address': row['address_raw'] or None,
            'landArea': row['land_area_sqm'] or None,
            'buildingArea': row['building_area_sqm'] or None,
            'builtYear': built_year,
            'description': row['notes'] or None,
            'imageUrl': images[0] if images else None,
            'sourceName': row['source'] or '',
            'sourceUrl': row['url'] or '',
            'tags': tags,
            'isCheap': price <= 1000000,
            'isFree': price == 0,
            'isOldHouse': (row['building_age'] or 0) >= 40,
            'isDIYFriendly': 'DIY可' in tags,
            'createdAt': row['first_seen_at'] or row['created_at'],
            'updatedAt': row['last_seen_at'] or row['updated_at'],
        })

    # Merge with existing data (e.g. jmty data from previous runs)
    existing_urls = set(l['sourceUrl'] for l in listings)
    try:
        with open(OUTPUT_PATH, 'r') as f:
            existing = json.load(f)
        for item in existing:
            url = item.get('sourceUrl', '')
            if url and url not in existing_urls:
                listings.append(item)
                existing_urls.add(url)
    except Exception:
        pass

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(listings, f, ensure_ascii=False, indent=2)

    print(f'{len(listings)} listings exported to {OUTPUT_PATH}')

    sources = Counter(l['sourceName'] for l in listings)
    print(f'\nBy source:')
    for name, count in sources.most_common():
        print(f'  {name:30s} {count:4d}')

if __name__ == '__main__':
    main()
