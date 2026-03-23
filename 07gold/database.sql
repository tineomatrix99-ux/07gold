-- SQL Script for 07gold Admin Account Setup

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Admin Account
-- Password is stored as a raw string for your reference, 
-- but in a production environment, it should be HASHED (e.g., using bcrypt).
INSERT INTO users (username, password, role) 
VALUES ('07gold', 'pijsDN;FKAJBFUVJ’BAJˆ%$#%$82', 'admin');
