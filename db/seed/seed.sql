
-- Grant permissions to read files
GRANT pg_read_server_files TO "user";

-- Seed data for the Human Art Archive

-- 1. Add Leonardo da Vinci to the artists table
INSERT INTO artist (artist_id, name, bio) VALUES (1, 'Leonardo da Vinci', 'Leonardo di ser Piero da Vinci (1452-04-15 – 1519-05-02) was an Italian polymath of the High Renaissance who was active as a painter, draughtsman, engineer, scientist, theorist, sculptor, and architect.') ON CONFLICT (name) DO NOTHING;

-- 2. Add artworks by Leonardo da Vinci
INSERT INTO artwork (artwork_id, artist_id, artwork_name, year, description) VALUES
(1, 1, 'Mona Lisa', 1503, 'The Mona Lisa is a half-length portrait painting by Italian artist Leonardo da Vinci. Considered an archetypal masterpiece of the Italian Renaissance, it has been described as "the best known, the most visited, the most written about, the most sung about, the most parodied work of art in the world."'),
(2, 1, 'The Last Supper', 1495, 'The Last Supper is a mural painting by the Italian High Renaissance artist Leonardo da Vinci, dated to c. 1495–1498. The painting represents the scene of the Last Supper of Jesus with the Twelve Apostles, as it is told in the Gospel of John – specifically the moment after Jesus announces that one of his apostles will betray him.'),
(3, 1, 'Vitruvian Man', 1490, 'The Vitruvian Man is a drawing made by the Italian polymath Leonardo da Vinci in about 1490. It is accompanied by notes based on the work of the Roman architect Vitruvius. The drawing, which is in pen and ink on paper, depicts a man in two superimposed positions with his arms and legs apart and inscribed in a circle and square.')
ON CONFLICT (artwork_name) DO NOTHING;

-- 3. Add images for the artworks
-- Note: The bytea data is represented as a placeholder. You will need to replace this with the actual file content.
INSERT INTO image (image_id, artwork_id, image, filesize, resolution, display_order) VALUES
(1, 1, pg_read_binary_file('/docker-entrypoint-initdb.d/seed-data/mona-lisa.jpg'), 0, '0x0', 1),
(2, 2, pg_read_binary_file('/docker-entrypoint-initdb.d/seed-data/the-last-supper.jpg'), 0, '0x0', 1),
(3, 3, pg_read_binary_file('/docker-entrypoint-initdb.d/seed-data/vitruvian-man.jpg'), 0, '0x0', 1)
ON CONFLICT (image_id) DO NOTHING;