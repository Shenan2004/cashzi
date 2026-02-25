-- Cashzi Default Categories Seed
-- Run: psql -d cashzi -f seed.sql

INSERT INTO categories (name, user_id, is_default) VALUES
    ('Salary', NULL, TRUE),
    ('Freelance', NULL, TRUE),
    ('Rent', NULL, TRUE),
    ('Groceries', NULL, TRUE),
    ('Transportation', NULL, TRUE),
    ('Dining', NULL, TRUE),
    ('Entertainment', NULL, TRUE),
    ('Utilities', NULL, TRUE),
    ('Healthcare', NULL, TRUE),
    ('Education', NULL, TRUE),
    ('Shopping', NULL, TRUE),
    ('Other', NULL, TRUE)
ON CONFLICT DO NOTHING;
