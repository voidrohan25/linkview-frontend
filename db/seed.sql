-- Link Test — Production Seed Script (Optional Initialization)
-- Run this in your Supabase SQL Editor or psql to populate standard cohorts and test templates.

-- 1. Default Tenant
INSERT INTO tenants (id, name, slug, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Link Test Global Academy', 'link-test-global', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. Initial Super Admin Profiles (Matches authorized Gmails)
INSERT INTO profiles (id, tenant_id, email, full_name, role, status)
VALUES 
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'admin.linktest@gmail.com', 'Super Administrator 1', 'super_admin', 'active'),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'superadmin.linktest@gmail.com', 'Super Administrator 2', 'super_admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- 3. Default Batches
INSERT INTO batches (id, tenant_id, name, code, description, status)
VALUES 
    ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Java Full Stack & DSA Spring 2026', 'JAVA2026', 'Data structures, Algorithms, Spring Boot microservices and system design.', 'active'),
    ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Python for AI & Placement Prep', 'PYAI2026', 'Core Python, algorithmic puzzles, mock interview tracks, and assessment drilling.', 'active'),
    ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Cloud Native & DevOps Track', 'CLOUD26', 'Kubernetes, Docker, AWS infrastructure and automated CI/CD pipelines.', 'active')
ON CONFLICT DO NOTHING;

-- 4. Initial Questions Bank
INSERT INTO questions (id, tenant_id, type, prompt, options_json, answer_key_json, explanation, marks, negative_marks, difficulty, topic)
VALUES
    ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'single_mcq', 
     'Which data structure follows the First-In, First-Out (FIFO) principle?', 
     '["Stack", "Queue", "Binary Tree", "Graph"]'::jsonb, 
     '"Queue"'::jsonb, 
     'A Queue operates in FIFO order where elements are inserted at rear and removed from front.', 
     10.00, 2.00, 'easy', 'DSA'),
    ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'single_mcq', 
     'What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?', 
     '["O(1)", "O(n)", "O(log n)", "O(n log n)"]'::jsonb, 
     '"O(log n)"'::jsonb, 
     'Each comparison divides the search space in half, yielding logarithmic search complexity.', 
     10.00, 2.00, 'medium', 'DSA'),
    ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', 'true_false', 
     'A HashMap in Java provides O(1) time complexity for get and put operations on average.', 
     '["True", "False"]'::jsonb, 
     '"True"'::jsonb, 
     'Under good hash distribution, HashMap achieves constant time average operations.', 
     10.00, 0.00, 'easy', 'Java')
ON CONFLICT (id) DO NOTHING;
