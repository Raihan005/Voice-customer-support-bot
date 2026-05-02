-- ============================================================
-- ShopVault Product Seed Data
-- Run this AFTER schema.sql in the Supabase SQL Editor
-- ============================================================

insert into public.products (name, price, category, emoji, rating, reviews, description, colors, features, in_stock)
values
  (
    'Quantum Pro Wireless Headphones',
    249.99,
    'Electronics',
    '🎧',
    4.8,
    2341,
    'Premium noise-cancelling headphones with spatial audio, 40-hour battery life, and ultra-comfortable memory foam cushions.',
    ARRAY['Midnight Black', 'Arctic White', 'Navy Blue'],
    ARRAY['Active Noise Cancellation', 'Spatial Audio', '40hr Battery', 'Bluetooth 5.3'],
    true
  ),
  (
    'Aurora Smart Watch Ultra',
    399.99,
    'Wearables',
    '⌚',
    4.9,
    1856,
    'Advanced smartwatch with health monitoring, GPS tracking, and a stunning AMOLED display. Water resistant to 100m.',
    ARRAY['Titanium', 'Rose Gold', 'Space Gray'],
    ARRAY['Heart Rate Monitor', 'GPS', 'AMOLED Display', 'Water Resistant 100m'],
    true
  ),
  (
    'NexGen Mechanical Keyboard',
    179.99,
    'Accessories',
    '⌨️',
    4.7,
    984,
    'Hot-swappable mechanical keyboard with RGB backlighting, PBT keycaps, and gasket mount design for the ultimate typing experience.',
    ARRAY['Carbon Black', 'Pearl White'],
    ARRAY['Hot-Swappable', 'RGB Backlit', 'PBT Keycaps', 'Gasket Mount'],
    true
  ),
  (
    'Vortex Gaming Mouse',
    89.99,
    'Accessories',
    '🖱️',
    4.6,
    1567,
    'Ultra-lightweight gaming mouse with 25K DPI optical sensor, ergonomic design, and customizable RGB lighting.',
    ARRAY['Obsidian', 'White', 'Pink'],
    ARRAY['25K DPI Sensor', 'Wireless', '65g Lightweight', 'RGB'],
    true
  ),
  (
    'Prism 4K Webcam',
    149.99,
    'Electronics',
    '📷',
    4.5,
    723,
    'Professional 4K webcam with auto-focus, noise-cancelling microphone, and AI-powered background blur.',
    ARRAY['Matte Black'],
    ARRAY['4K Resolution', 'Auto Focus', 'Noise-Cancelling Mic', 'AI Background Blur'],
    true
  ),
  (
    'Horizon Ultrawide Monitor',
    799.99,
    'Electronics',
    '🖥️',
    4.9,
    456,
    '34-inch curved ultrawide QHD monitor with 165Hz refresh rate, 1ms response time, and HDR600 support.',
    ARRAY['Dark Silver'],
    ARRAY['34" Curved', '165Hz', '1ms Response', 'HDR600'],
    true
  ),
  (
    'BassBoom Portable Speaker',
    129.99,
    'Audio',
    '🔊',
    4.4,
    2105,
    'Waterproof portable Bluetooth speaker with 360° sound, 20-hour battery, and party mode for multi-speaker sync.',
    ARRAY['Ocean Blue', 'Forest Green', 'Sunset Red', 'Storm Gray'],
    ARRAY['360° Sound', 'IP67 Waterproof', '20hr Battery', 'Party Mode'],
    true
  ),
  (
    'ZenPad Drawing Tablet',
    329.99,
    'Accessories',
    '✏️',
    4.7,
    891,
    'Professional drawing tablet with 8192 pressure levels, tilt recognition, and a 13.3-inch laminated display.',
    ARRAY['Graphite'],
    ARRAY['8192 Pressure Levels', 'Tilt Recognition', '13.3" Display', 'USB-C'],
    true
  );
