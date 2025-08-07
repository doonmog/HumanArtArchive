
-- Grant permissions to read files
GRANT pg_read_server_files TO "user";

-- Seed data for categories, tag groups, and tags
DO $$
DECLARE
    -- Category IDs
    meta_category_id UUID;
    form_category_id UUID;
    content_category_id UUID;

    -- Tag Group IDs
    landscape_group_id UUID;
    portrait_group_id UUID;
    style_group_id UUID;
    gender_group_id UUID;
    hair_group_id UUID;
    medium_group_id UUID;
    art_movement_group_id UUID;
BEGIN
    -- 1. Add categories
    INSERT INTO category (name, description) VALUES
    ('Meta', 'Metadata and technical information about artworks'),
    ('Form', 'Visual and compositional elements of artworks'),
    ('Content', 'Subject matter and thematic content of artworks')
    ON CONFLICT (name) DO NOTHING;

    -- Get category IDs
    SELECT category_id INTO meta_category_id FROM category WHERE name = 'Meta';
    SELECT category_id INTO form_category_id FROM category WHERE name = 'Form';
    SELECT category_id INTO content_category_id FROM category WHERE name = 'Content';

    -- 2. Add tag groups
    INSERT INTO tag_group (category_id, name, description) VALUES
    (form_category_id, 'Landscape', 'Landscape and environmental compositions'),
    (form_category_id, 'Portrait', 'Portrait and figure compositions'),
    (form_category_id, 'Style', 'Artistic style and visual approach'),
    (content_category_id, 'Gender', 'Gender representation in artworks'),
    (content_category_id, 'Hair', 'Hair characteristics and styles'),
    (meta_category_id, 'Medium', 'Physical medium used in the artwork'),
    (meta_category_id, 'Art Movement', 'Art movement or period associated with the artwork')
    ON CONFLICT (name) DO NOTHING;

    -- Get tag group IDs
    SELECT group_id INTO landscape_group_id FROM tag_group WHERE name = 'Landscape';
    SELECT group_id INTO portrait_group_id FROM tag_group WHERE name = 'Portrait';
    SELECT group_id INTO style_group_id FROM tag_group WHERE name = 'Style';
    SELECT group_id INTO gender_group_id FROM tag_group WHERE name = 'Gender';
    SELECT group_id INTO hair_group_id FROM tag_group WHERE name = 'Hair';
    SELECT group_id INTO medium_group_id FROM tag_group WHERE name = 'Medium';
    SELECT group_id INTO art_movement_group_id FROM tag_group WHERE name = 'Art Movement';

    -- 3. Add tags
    INSERT INTO tag (group_id, name, description) VALUES
    (landscape_group_id, 'Landscape', 'Artwork depicts natural or outdoor scenery'),
    (portrait_group_id, 'Bust Portrait', 'Artwork depicts a person from the shoulders up'),
    (portrait_group_id, 'Full Length Portrait', 'Artwork depicts a person from head to toe'),
    (portrait_group_id, 'Profile Portrait', 'Artwork depicts a person from the side'),
    (style_group_id, 'Cartoon', 'Artwork created in cartoon or animated style'),
    (gender_group_id, 'Male', 'Male figures present in the artwork'),
    (gender_group_id, 'Female', 'Female figures present in the artwork'),
    (gender_group_id, 'Nonbinary', 'Nonbinary or gender-neutral figures present in the artwork'),
    (hair_group_id, 'Long', 'Long hair depicted in the artwork'),
    (hair_group_id, 'Short', 'Short hair depicted in the artwork'),
    (hair_group_id, 'Brown', 'Brown hair depicted in the artwork'),
    (hair_group_id, 'Black', 'Black hair depicted in the artwork'),
    (hair_group_id, 'Blonde', 'Blonde hair depicted in the artwork'),
    (medium_group_id, 'Oil on Panel', 'Artwork created using oil paint on wooden panel'),
    (medium_group_id, 'Oil on Canvas', 'Artwork created using oil paint on canvas'),
    (medium_group_id, 'Fresco', 'Artwork created using pigments on wet plaster'),
    (medium_group_id, 'Ink on Paper', 'Artwork created using ink on paper'),
    (art_movement_group_id, 'Renaissance', 'Artwork from the European Renaissance period (14th-17th century)')
    ON CONFLICT (name) DO NOTHING;

END $$;