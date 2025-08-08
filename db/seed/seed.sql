-- Grant permissions to read files
GRANT pg_read_server_files TO "user";

-- Seed data for categories, tag groups, and tags
DO $$
BEGIN
    -- 1. Add categories
    INSERT INTO category (name, description) VALUES
    ('Meta', 'Metadata and technical information about artworks'),
    ('Form', 'Visual and compositional elements of artworks'),
    ('Content', 'Subject matter and thematic content of artworks')
    ON CONFLICT (name) DO NOTHING;

    -- 2. Add tag groups
    INSERT INTO tag_group (category_id, name, description) VALUES

    -- Meta
    ((SELECT category_id FROM category WHERE name = 'Meta'),    'Medium',    'Physical medium used in the artwork'),
    ((SELECT category_id FROM category WHERE name = 'Meta'),    'Features',    'Fictional named characters in the artwork'),
    ((SELECT category_id FROM category WHERE name = 'Meta'),    'Depicts',    'Real-life people in the artwork'),
    ((SELECT category_id FROM category WHERE name = 'Meta'),    'Collection',    'Artwork is part of this collection:'),
    ((SELECT category_id FROM category WHERE name = 'Meta'),    'Art Movement','Art movement or period associated with the artwork'),

    -- Form
    ((SELECT category_id FROM category WHERE name = 'Form'),    'Landscape', 'Landscape and environmental compositions'),
    ((SELECT category_id FROM category WHERE name = 'Form'),    'Portrait',  'Portrait and figure compositions'),
    ((SELECT category_id FROM category WHERE name = 'Form'),    'Style',     'Artistic style and visual approach'),
    ((SELECT category_id FROM category WHERE name = 'Form'),    'Setting', 'Environment or world in which the subject exists'),
    ((SELECT category_id FROM category WHERE name = 'Form'),    'Mood', 'Mood or emotional tone of the artwork'),

    -- Content
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Gender',    'Gender representation in artworks'),
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Hair',      'Hair characteristics and styles'),
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Species', 'Species or race of figures in the artwork'),
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Creatures', 'Non-Humanoid creatures or monsters in the artwork'),
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Eyes', 'Eye color or state of characters'),
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Skin', 'Skin tone or condition of characters'),
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Clothes', 'Clothing worn by characters'),
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Armor', 'Type of armor worn by figures'),
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Action', 'Actions or behaviors depicted'),
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Facial Hair', 'Facial hair types'),
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Weapon', 'Weapons held or featured in the artwork'),
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Magic', 'Magical powers or abilities shown in the artwork'),
    ((SELECT category_id FROM category WHERE name = 'Content'), 'Occupation', 'Character roles or professions');

    -- 3. Add tags
    INSERT INTO tag (group_id, name, description) VALUES
    -- Landscape
    ((SELECT group_id FROM tag_group WHERE name = 'Landscape'), 'Landscape', 'Artwork depicts natural or outdoor scenery'),

    -- Portrait
    ((SELECT group_id FROM tag_group WHERE name = 'Portrait'),  'Bust Portrait', 'Artwork depicts a person from the shoulders up'),
    ((SELECT group_id FROM tag_group WHERE name = 'Portrait'),  'Full Length Portrait', 'Artwork depicts a person from head to toe'),
    ((SELECT group_id FROM tag_group WHERE name = 'Portrait'),  'Profile Portrait', 'Artwork depicts a person from the side'),

    -- Style
    ((SELECT group_id FROM tag_group WHERE name = 'Style'),     'Cartoon', 'Artwork created in cartoon or animated style'),
    ((SELECT group_id FROM tag_group WHERE name = 'Style'),     'Sketch', 'Artwork created quickly to capture an idea or composition'),
    ((SELECT group_id FROM tag_group WHERE name = 'Style'),     'Realism', 'Artwork created to accurately depict reality'),
    
    -- Medium
    ((SELECT group_id FROM tag_group WHERE name = 'Medium'),    'Oil on Panel', 'Artwork created using oil paint on wooden panel'),
    ((SELECT group_id FROM tag_group WHERE name = 'Medium'),    'Oil on Canvas', 'Artwork created using oil paint on canvas'),
    ((SELECT group_id FROM tag_group WHERE name = 'Medium'),    'Fresco', 'Artwork created using pigments on wet plaster'),
    ((SELECT group_id FROM tag_group WHERE name = 'Medium'),    'Ink on Paper', 'Artwork created using ink on paper'),
    ((SELECT group_id FROM tag_group WHERE name = 'Medium'),    'Photography', 'Artwork created using photography'),
    ((SELECT group_id FROM tag_group WHERE name = 'Medium'),    'Watercolor', 'Artwork created using watercolor paints'),
    ((SELECT group_id FROM tag_group WHERE name = 'Medium'),    'Digital', 'Artwork created using digital software'),
    ((SELECT group_id FROM tag_group WHERE name = 'Medium'),    '3D', 'Artwork created using 3D software'),
    
    -- Art Movement
    ((SELECT group_id FROM tag_group WHERE name = 'Art Movement'), 'Renaissance', 'Artwork from the European Renaissance period (14th-17th century)'),
    ((SELECT group_id FROM tag_group WHERE name = 'Art Movement'), 'Baroque', 'Artwork from the Baroque period (17th-18th century)'),
    
    --((SELECT group_id FROM tag_group WHERE name = 'Art Movement'), 'Pre-Raphaelite', 'Artwork from the Pre-Raphaelite movement (19th century)'),
    -- Tags can't have hyphens in them.

    -- Setting
    ((SELECT group_id FROM tag_group WHERE name = 'Setting'), 'Fantasy', 'Set in a fantastical or imaginary world'),
    ((SELECT group_id FROM tag_group WHERE name = 'Setting'), 'Steampunk', 'Set in a steampunk or retro-futuristic world'),
    ((SELECT group_id FROM tag_group WHERE name = 'Setting'), 'Sci-fi', 'Set in a science fiction world or future'),

    -- Gender
    ((SELECT group_id FROM tag_group WHERE name = 'Gender'),    'Male', 'Male figures present in the artwork'),
    ((SELECT group_id FROM tag_group WHERE name = 'Gender'),    'Female', 'Female figures present in the artwork'),
    ((SELECT group_id FROM tag_group WHERE name = 'Gender'),    'Nonbinary', 'Nonbinary figures present in the artwork'),
    ((SELECT group_id FROM tag_group WHERE name = 'Gender'),    'Androgynous', 'Androgynous or gender-ambiguous figures present in the artwork'),
    
    -- Hair
    ((SELECT group_id FROM tag_group WHERE name = 'Hair'),      'Long', 'Long hair depicted in the artwork'),
    ((SELECT group_id FROM tag_group WHERE name = 'Hair'),      'Short', 'Short hair depicted in the artwork'),
    ((SELECT group_id FROM tag_group WHERE name = 'Hair'),      'Brown', 'Brown hair depicted in the artwork'),
    ((SELECT group_id FROM tag_group WHERE name = 'Hair'),      'Black', 'Black hair depicted in the artwork'),
    ((SELECT group_id FROM tag_group WHERE name = 'Hair'),      'Blonde', 'Blonde hair depicted in the artwork'),
    ((SELECT group_id FROM tag_group WHERE name = 'Hair'),      'Red', 'Red hair depicted in the artwork'),
    ((SELECT group_id FROM tag_group WHERE name = 'Hair'),      'White', 'White hair depicted in the artwork'),

    -- Facial Hair
    ((SELECT group_id FROM tag_group WHERE name = 'Facial Hair'),      'Mustache', 'Mustache depicted in the artwork'),
    ((SELECT group_id FROM tag_group WHERE name = 'Facial Hair'),      'Beard', 'Beard depicted in the artwork'),
    ((SELECT group_id FROM tag_group WHERE name = 'Facial Hair'),      'Goatee', 'Goatee depicted in the artwork'),

    -- Mood
    ((SELECT group_id FROM tag_group WHERE name = 'Mood'), 'Grim', 'Artwork conveys a grim or dark tone'),
    ((SELECT group_id FROM tag_group WHERE name = 'Mood'), 'Celebratory', 'Artwork depicts celebration or joy'),
    ((SELECT group_id FROM tag_group WHERE name = 'Mood'), 'Serious', 'Artwork depicts a serious or solemn mood'),
    ((SELECT group_id FROM tag_group WHERE name = 'Mood'), 'Happy', 'Artwork depicts happiness or joy'),

    -- Species
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Humanoid', 'Humanoid subjects - Use this tag in combination with a creatures tag for anthropomorphic figures.'),
    ---- Tolkienesque
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Human', 'Human subjects'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Elf', 'Elf or elven subjects'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Dwarf', 'Dwarf or dwarven beings'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Orc', 'Orc or orc-like beings'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Hobbit', 'Halfling or hobbit-like beings'),
    ---- Magical
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Gnome', 'Small, magically inclined humanoids'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Angel', 'Divine beings with wings or celestial aura'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Fairy', 'Winged or magical nature spirits'),
    ---- Monstrous
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Goblin', 'Goblin or goblinoid creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Vampire', 'Vampire characters depicted'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Demon', 'Infernal or demonic creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Undead', 'Reanimated dead such as skeletons or zombies'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Werewolf', 'Humanoid wolf or lycanthropic figures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Merfolk', 'Aquatic humanoids like mermaids or mermen'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Minotaur', 'Humanoid bull creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Centaur', 'Half-human, half-horse beings'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Construct', 'Artificial beings such as golems'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Spirit', 'Ghostly or non-corporeal beings'),
    ((SELECT group_id FROM tag_group WHERE name = 'Species'), 'Giant', 'Gigantic beings'),
    
    -- Creatures (non-humanoids)
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Snake', 'Serpentine humanoid beings'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Dragon', 'Dragon or draconic humanoid characters'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Frog', 'Frog creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Hawk', 'Hawk or falcon creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Wolf', 'Wolf or werewolf creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Bat', 'Bat creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Bunny', 'Bunny or rabbit creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Bunnicorn', 'Bunny or rabbit creatures with horns'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Butterfly', 'Butterfly or moth creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Cat', 'Feline creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Dog', 'Canine creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Horse', 'Equine creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Mouse', 'Rodent creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Spider', 'Arachnid creatures'),
    ((SELECT group_id FROM tag_group WHERE name = 'Creatures'), 'Turtle', 'Reptilian creatures with shells'),

    -- Eyes
    ((SELECT group_id FROM tag_group WHERE name = 'Eyes'), 'Green', 'Characters with green eyes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Eyes'), 'Blue', 'Characters with blue eyes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Eyes'), 'Brown', 'Characters with brown eyes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Eyes'), 'Purple', 'Characters with purple eyes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Eyes'), 'Red', 'Characters with red eyes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Eyes'), 'Yellow', 'Characters with yellow eyes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Eyes'), 'Closed', 'Characters with closed eyes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Eyes'), 'Blind', 'Characters with blind or non-functional eyes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Eyes'), 'Heterochromia', 'Characters with differently colored eyes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Eyes'), 'Blindfold', 'Characters wearing blindfolds'),
    ((SELECT group_id FROM tag_group WHERE name = 'Eyes'), 'Glowing', 'Characters with eyes that glow'),

    -- Skin
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Fair', 'Artwork depicts characters with fair/light skin tone'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Light', 'Artwork depicts characters with light beige skin tone'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Medium', 'Artwork depicts characters with medium or tan skin tone'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Brown', 'Artwork depicts characters with brown skin tone'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Dark', 'Artwork depicts characters with dark brown skin tone'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Black', 'Artwork depicts characters with very dark skin tone'),
     -- Skin (Non-Standard)
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Purple', 'Artwork depicts characters with purple skin tone'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Red', 'Artwork depicts characters with red skin tone'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Blue', 'Artwork depicts characters with blue skin tone'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Green', 'Artwork depicts characters with green skin tone'),
    -- Skin (Conditions)
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Albino', 'Albino skin tone or condition'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Scarred', 'Characters with scars'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Burned', 'Characters with burn marks'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Vitiligo', 'Characters with vitiligo'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Tattooed', 'Characters with tattoos'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Pierced', 'Characters with skin piercings'),
    ((SELECT group_id FROM tag_group WHERE name = 'Skin'), 'Painted', 'Characters with painted skin or makeup'),


    -- Clothes
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Robe', 'Characters wearing robes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Cape', 'Characters wearing capes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Hat', 'Characters wearing hats'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Leather', 'Characters wearing leather clothing'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Scarf', 'Characters wearing scarves'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Blindfold', 'Characters wearing blindfolds'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Fur', 'Characters wearing fur clothing'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Finery', 'Characters wearing ornate clothing'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Skirt', 'Characters wearing skirts'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Eyepatch', 'Characters wearing eyepatches'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Kilt', 'Characters wearing kilts'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Glove', 'Characters wearing gloves'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Dress', 'Characters wearing dresses'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Suit', 'Characters wearing suits'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Glasses', 'Characters wearing glasses'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Cloak', 'Characters wearing cloaks'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Necklace', 'Characters wearing necklaces'),
    ((SELECT group_id FROM tag_group WHERE name = 'Clothes'), 'Belt', 'Characters wearing belts'),

    -- Armor
    ((SELECT group_id FROM tag_group WHERE name = 'Armor'), 'Plate', 'Heavy plate armor'),
    ((SELECT group_id FROM tag_group WHERE name = 'Armor'), 'Shield', 'Figures with shields'),
    ((SELECT group_id FROM tag_group WHERE name = 'Armor'), 'Leather', 'Light leather armor'),
    ((SELECT group_id FROM tag_group WHERE name = 'Armor'), 'Chain', 'Chain mail armor'),
    ((SELECT group_id FROM tag_group WHERE name = 'Armor'), 'Helmet', 'Figures with helmets'),
    ((SELECT group_id FROM tag_group WHERE name = 'Armor'), 'Boots', 'Figures with boots'),
    ((SELECT group_id FROM tag_group WHERE name = 'Armor'), 'Gauntlet', 'Figures with gauntlets'),
    ((SELECT group_id FROM tag_group WHERE name = 'Armor'), 'Cuirass', 'Torso armor consisting of breastplate and backplate.'),
    ((SELECT group_id FROM tag_group WHERE name = 'Armor'), 'Vambrace', 'armor strapped to the forearm for protection'),
    ((SELECT group_id FROM tag_group WHERE name = 'Armor'), 'Pauldron', 'A piece of armor that protects the shoulder and upper arm. It tends to be larger than spaulders because they sometimes provide coverage for the chest and back.'),
    ((SELECT group_id FROM tag_group WHERE name = 'Armor'), 'Boob Plate', 'An impractically shaped piece of plate armor for a female character, where a hit to the chest would direct all the force to the sternum.'),

    -- Action
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Fighting', 'Depiction of combat or aggression'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Reading', 'Characters reading a book or scroll'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Writing', 'Characters writing'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Dancing', 'Characters dancing'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Running', 'Characters running or sprinting'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Jumping', 'Characters jumping or leaping'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Swimming', 'Characters swimming or diving'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Flying', 'Characters flying or soaring'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Climbing', 'Characters climbing or scaling'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Speaking', 'Characters speaking or orating'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Playing Music', 'Characters playing musical instruments'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Sailing', 'Characters on boats or ships, or characters performing tasks related to sailing'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Fishing', 'Characters fishing or catching fish'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Cooking', 'Characters cooking or preparing food'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Eating', 'Characters eating or drinking'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Sleeping', 'Characters sleeping or resting'),
    ((SELECT group_id FROM tag_group WHERE name = 'Action'), 'Praying', 'Characters praying or worshipping'),
    
    -- Weapon
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Sword', 'Characters holding or wielding swords'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Bow', 'Characters holding or using bows'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Spear', 'Characters holding or wielding spears'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Halberd', 'Characters holding or wielding halberds'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Axe', 'Characters holding or wielding axes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Crossbow', 'Characters holding or using crossbows'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Gun', 'Characters holding or using guns'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Dagger', 'Characters holding or wielding daggers'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Hammer', 'Characters holding or wielding hammers'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Mace', 'Characters holding or wielding maces'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Morningstar', 'Characters holding or wielding morningstars'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Club', 'Characters holding or wielding clubs'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Scythe', 'Characters holding or wielding scythes'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Whip', 'Characters holding or wielding whips'),
    ((SELECT group_id FROM tag_group WHERE name = 'Weapon'), 'Staff', 'Characters holding or wielding staves'),

    -- Magic
    ((SELECT group_id FROM tag_group WHERE name = 'Magic'), 'Fire', 'Fire magic'),
    ((SELECT group_id FROM tag_group WHERE name = 'Magic'), 'Necromancy', 'Death or undead-based magic'),
    ((SELECT group_id FROM tag_group WHERE name = 'Magic'), 'Healing', 'Magic focused on healing or restoration'),
    ((SELECT group_id FROM tag_group WHERE name = 'Magic'), 'Illusion', 'Magic that alters perception'),
    ((SELECT group_id FROM tag_group WHERE name = 'Magic'), 'Divine', 'Magic granted by deities or faith'),
    ((SELECT group_id FROM tag_group WHERE name = 'Magic'), 'Dark', 'Cursed or forbidden magical arts'),

    -- Occupation
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Mage', 'Characters depicted as mages or wizards'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Knight', 'Characters shown as knights or armored soldiers'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Archer', 'Characters shown as archers or bowmen'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Warrior', 'Characters shown as warriors or soldiers'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Priest', 'Characters shown as priests or clerics'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Wizard', 'Characters shown as wizards or sorcerers'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Noble', 'Characters shown as nobles or aristocrats'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Merchant', 'Characters shown as merchants or traders'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Thief', 'Characters shown as thieves or rogues'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Assassin', 'Characters shown as assassins or killers'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Bandit', 'Characters shown as bandits or pirates'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Monk', 'Characters shown as monks or martial artists'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Ninja', 'Characters shown as ninjas or spies'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Samurai', 'Characters shown as samurais or warriors'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Monarch', 'Characters shown as kings, queens, or emperors'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Noble', 'Characters shown as nobles, lords, or ladies'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Squire', 'Characters shown as squires or pages'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Pirate', 'Characters shown as pirates or buccaneers'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Sailor', 'Characters shown as sailors or naval officers'),
    ((SELECT group_id FROM tag_group WHERE name = 'Occupation'), 'Captain', 'Characters shown as captains or admirals');

END $$;
