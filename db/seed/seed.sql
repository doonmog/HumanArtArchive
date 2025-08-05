
-- Grant permissions to read files
GRANT pg_read_server_files TO "user";

-- Seed data for the Human Art Archive
DO $$
DECLARE
    da_vinci_id UUID;
    michelangelo_id UUID;
    mona_lisa_id UUID;
    last_supper_id UUID;
    vitruvian_man_id UUID;
    creation_of_adam_id UUID;
    mona_lisa_image_id UUID;
    mona_lisa_gioconda_image_id UUID;
    mona_lisa_simpsons_image_id UUID;
    last_supper_image_id UUID;
    vitruvian_man_image_id UUID;
    creation_of_adam_image_id UUID;
    meta_category_id UUID;
    form_category_id UUID;
    content_category_id UUID;
    landscape_group_id UUID;
    portrait_group_id UUID;
    style_group_id UUID;
    gender_group_id UUID;
    hair_group_id UUID;
    medium_group_id UUID;
    art_movement_group_id UUID;
    male_tag_id UUID;
    female_tag_id UUID;
    nonbinary_tag_id UUID;
    long_hair_tag_id UUID;
    short_hair_tag_id UUID;
    brown_hair_tag_id UUID;
    black_hair_tag_id UUID;
    blonde_hair_tag_id UUID;
    landscape_tag_id UUID;
    portrait_tag_id UUID;
    bust_portrait_tag_id UUID;
    full_length_portrait_tag_id UUID;
    profile_portrait_tag_id UUID;
    cartoon_tag_id UUID;
BEGIN
    -- 1. Add artists to the artists table and get the generated IDs
    INSERT INTO artist (name, bio) VALUES 
    ('Leonardo da Vinci', 'Leonardo di ser Piero da Vinci (1452-04-15 – 1519-05-02) was an Italian polymath of the High Renaissance who was active as a painter, draughtsman, engineer, scientist, theorist, sculptor, and architect.'),
    ('Michelangelo', 'Michelangelo di Lodovico Buonarroti Simoni (1475-03-06 – 1564-02-18) was an Italian sculptor, painter, architect and poet of the High Renaissance. He is considered one of the greatest artists of all time.')
    ON CONFLICT (name) DO NOTHING;
    SELECT artist_id INTO da_vinci_id FROM artist WHERE name = 'Leonardo da Vinci';
    SELECT artist_id INTO michelangelo_id FROM artist WHERE name = 'Michelangelo';

    -- 2. Add artworks using the retrieved artist_ids
    INSERT INTO artwork (artist_id, artwork_name, year, description) VALUES
    (da_vinci_id, 'Mona Lisa', 1503, 'The Mona Lisa is a half-length portrait painting by Italian artist Leonardo da Vinci. Considered an archetypal masterpiece of the Italian Renaissance, it has been described as "the best known, the most visited, the most written about, the most sung about, the most parodied work of art in the world."'),
    (da_vinci_id, 'The Last Supper', 1495, 'The Last Supper is a mural painting by the Italian High Renaissance artist Leonardo da Vinci, dated to c. 1495–1498. The painting represents the scene of the Last Supper of Jesus with the Twelve Apostles, as it is told in the Gospel of John – specifically the moment after Jesus announces that one of his apostles will betray him.'),
    (da_vinci_id, 'Vitruvian Man', 1490, 'The Vitruvian Man is a drawing made by the Italian polymath Leonardo da Vinci in about 1490. It is accompanied by notes based on the work of the Roman architect Vitruvius. The drawing, which is in pen and ink on paper, depicts a man in two superimposed positions with his arms and legs apart and inscribed in a circle and square.'),
    (michelangelo_id, 'The Creation of Adam', 1512, 'The Creation of Adam is a fresco painting by Italian artist Michelangelo, which forms part of the Sistine Chapel ceiling. It illustrates the Biblical creation narrative from the Book of Genesis in which God gives life to Adam, the first man. The fresco is part of a complex iconographic scheme and is one of the most famous works of art ever created');
    
    SELECT artwork_id INTO mona_lisa_id FROM artwork WHERE artwork_name = 'Mona Lisa';
    SELECT artwork_id INTO last_supper_id FROM artwork WHERE artwork_name = 'The Last Supper';
    SELECT artwork_id INTO vitruvian_man_id FROM artwork WHERE artwork_name = 'Vitruvian Man';
    SELECT artwork_id INTO creation_of_adam_id FROM artwork WHERE artwork_name = 'The Creation of Adam';

    -- 3. Add images for the artworks using the retrieved artwork_ids
    INSERT INTO image (artwork_id, image, filesize, resolution, display_order) VALUES
    (mona_lisa_id, pg_read_binary_file('/docker-entrypoint-initdb.d/seed-data/mona-lisa.jpg'), 0, '0x0', 1),
    (mona_lisa_id, pg_read_binary_file('/docker-entrypoint-initdb.d/seed-data/mona-lisa-gioconda.jpg'), 0, '0x0', 2),
    (mona_lisa_id, pg_read_binary_file('/docker-entrypoint-initdb.d/seed-data/mona-lisa-simpsons.jpg'), 0, '0x0', 3),
    (last_supper_id, pg_read_binary_file('/docker-entrypoint-initdb.d/seed-data/the-last-supper.jpg'), 0, '0x0', 1),
    (vitruvian_man_id, pg_read_binary_file('/docker-entrypoint-initdb.d/seed-data/vitruvian-man.jpg'), 0, '0x0', 1),
    (creation_of_adam_id, pg_read_binary_file('/docker-entrypoint-initdb.d/seed-data/creation-of-adam.jpg'), 0, '0x0', 1);
    
    SELECT image_id INTO mona_lisa_image_id FROM image WHERE artwork_id = mona_lisa_id AND display_order = 1;
    SELECT image_id INTO mona_lisa_gioconda_image_id FROM image WHERE artwork_id = mona_lisa_id AND display_order = 2;
    SELECT image_id INTO mona_lisa_simpsons_image_id FROM image WHERE artwork_id = mona_lisa_id AND display_order = 3;
    SELECT image_id INTO last_supper_image_id FROM image WHERE artwork_id = last_supper_id;
    SELECT image_id INTO vitruvian_man_image_id FROM image WHERE artwork_id = vitruvian_man_id;
    SELECT image_id INTO creation_of_adam_image_id FROM image WHERE artwork_id = creation_of_adam_id;

    -- 4. Add categories
    INSERT INTO category (name, description) VALUES
    ('Meta', 'Metadata and technical information about artworks'),
    ('Form', 'Visual and compositional elements of artworks'),
    ('Content', 'Subject matter and thematic content of artworks')
    ON CONFLICT (name) DO NOTHING;
    
    SELECT category_id INTO meta_category_id FROM category WHERE name = 'Meta';
    SELECT category_id INTO form_category_id FROM category WHERE name = 'Form';
    SELECT category_id INTO content_category_id FROM category WHERE name = 'Content';

    -- 5. Add tag groups
    INSERT INTO tag_group (category_id, name, description) VALUES
    (form_category_id, 'Landscape', 'Landscape and environmental compositions'),
    (form_category_id, 'Portrait', 'Portrait and figure compositions'),
    (form_category_id, 'Style', 'Artistic style and visual approach'),
    (content_category_id, 'Gender', 'Gender representation in artworks'),
    (content_category_id, 'Hair', 'Hair characteristics and styles'),
    (meta_category_id, 'Medium', 'Physical medium used in the artwork'),
    (meta_category_id, 'Art Movement', 'Art movement or period associated with the artwork');
    
    SELECT group_id INTO landscape_group_id FROM tag_group WHERE name = 'Landscape';
    SELECT group_id INTO portrait_group_id FROM tag_group WHERE name = 'Portrait';
    SELECT group_id INTO style_group_id FROM tag_group WHERE name = 'Style';
    SELECT group_id INTO gender_group_id FROM tag_group WHERE name = 'Gender';
    SELECT group_id INTO hair_group_id FROM tag_group WHERE name = 'Hair';
    SELECT group_id INTO medium_group_id FROM tag_group WHERE name = 'Medium';
    SELECT group_id INTO art_movement_group_id FROM tag_group WHERE name = 'Art Movement';

    -- 6. Add tags
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
    (art_movement_group_id, 'Renaissance', 'Artwork from the European Renaissance period (14th-17th century)'),
    (art_movement_group_id, 'High Renaissance', 'Artwork from the High Renaissance period (1490s-1527)');
    
    SELECT tag_id INTO landscape_tag_id FROM tag WHERE name = 'Landscape';
    SELECT tag_id INTO bust_portrait_tag_id FROM tag WHERE name = 'Bust Portrait';
    SELECT tag_id INTO full_length_portrait_tag_id FROM tag WHERE name = 'Full Length Portrait';
    SELECT tag_id INTO profile_portrait_tag_id FROM tag WHERE name = 'Profile Portrait';
    SELECT tag_id INTO cartoon_tag_id FROM tag WHERE name = 'Cartoon';
    SELECT tag_id INTO male_tag_id FROM tag WHERE name = 'Male';
    SELECT tag_id INTO female_tag_id FROM tag WHERE name = 'Female';
    SELECT tag_id INTO nonbinary_tag_id FROM tag WHERE name = 'Nonbinary';
    SELECT tag_id INTO long_hair_tag_id FROM tag WHERE name = 'Long';
    SELECT tag_id INTO short_hair_tag_id FROM tag WHERE name = 'Short';
    SELECT tag_id INTO brown_hair_tag_id FROM tag WHERE name = 'Brown';
    SELECT tag_id INTO black_hair_tag_id FROM tag WHERE name = 'Black';
    SELECT tag_id INTO blonde_hair_tag_id FROM tag WHERE name = 'Blonde';
    
    DECLARE
        oil_panel_tag_id UUID;
        oil_canvas_tag_id UUID;
        fresco_tag_id UUID;
        ink_paper_tag_id UUID;
        renaissance_tag_id UUID;
        high_renaissance_tag_id UUID;
    BEGIN
        SELECT tag_id INTO oil_panel_tag_id FROM tag WHERE name = 'Oil on Panel';
        SELECT tag_id INTO oil_canvas_tag_id FROM tag WHERE name = 'Oil on Canvas';
        SELECT tag_id INTO fresco_tag_id FROM tag WHERE name = 'Fresco';
        SELECT tag_id INTO ink_paper_tag_id FROM tag WHERE name = 'Ink on Paper';
        SELECT tag_id INTO renaissance_tag_id FROM tag WHERE name = 'Renaissance';
        SELECT tag_id INTO high_renaissance_tag_id FROM tag WHERE name = 'High Renaissance';

    -- 7. Apply tags to artworks
    INSERT INTO image_tags (image_id, tag_id) VALUES
    -- Mona Lisa (Original): Bust Portrait, Female, Long hair, Brown hair, Oil on Panel, High Renaissance
    (mona_lisa_image_id, bust_portrait_tag_id),
    (mona_lisa_image_id, female_tag_id),
    (mona_lisa_image_id, long_hair_tag_id),
    (mona_lisa_image_id, brown_hair_tag_id),
    (mona_lisa_image_id, oil_panel_tag_id),
    (mona_lisa_image_id, high_renaissance_tag_id),
    
    -- Mona Lisa (Gioconda): Bust Portrait, Female, Long hair, Brown hair, Oil on Panel, High Renaissance
    (mona_lisa_gioconda_image_id, bust_portrait_tag_id),
    (mona_lisa_gioconda_image_id, female_tag_id),
    (mona_lisa_gioconda_image_id, long_hair_tag_id),
    (mona_lisa_gioconda_image_id, brown_hair_tag_id),
    (mona_lisa_gioconda_image_id, oil_panel_tag_id),
    (mona_lisa_gioconda_image_id, high_renaissance_tag_id),
    
    -- Mona Lisa (Simpsons): Bust Portrait, Female, Long hair, Cartoon
    (mona_lisa_simpsons_image_id, bust_portrait_tag_id),
    (mona_lisa_simpsons_image_id, female_tag_id),
    (mona_lisa_simpsons_image_id, long_hair_tag_id),
    (mona_lisa_simpsons_image_id, cartoon_tag_id),
    
    -- The Last Supper: Full Length Portrait, Male (multiple figures), Fresco, High Renaissance
    (last_supper_image_id, full_length_portrait_tag_id),
    (last_supper_image_id, male_tag_id),
    (last_supper_image_id, brown_hair_tag_id),
    (last_supper_image_id, black_hair_tag_id),
    (last_supper_image_id, long_hair_tag_id),
    (last_supper_image_id, fresco_tag_id),
    (last_supper_image_id, high_renaissance_tag_id),
    
    -- Vitruvian Man: Profile Portrait, Male, Short hair, Ink on Paper, Renaissance
    (vitruvian_man_image_id, profile_portrait_tag_id),
    (vitruvian_man_image_id, male_tag_id),
    (vitruvian_man_image_id, short_hair_tag_id),
    (vitruvian_man_image_id, ink_paper_tag_id),
    (vitruvian_man_image_id, renaissance_tag_id),
    
    -- Creation of Adam: Full Length Portrait, Male, Fresco, High Renaissance
    (creation_of_adam_image_id, full_length_portrait_tag_id),
    (creation_of_adam_image_id, male_tag_id),
    (creation_of_adam_image_id, fresco_tag_id),
    (creation_of_adam_image_id, high_renaissance_tag_id);
    END;
END $$;