-- Run in phpMyAdmin (Import) or: mysql -u root < database.sql
CREATE DATABASE IF NOT EXISTS prs_repository CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prs_repository;

CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    fullname    VARCHAR(100) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('admin','staff') NOT NULL DEFAULT 'staff',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS projects (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    student_name  VARCHAR(100) NOT NULL,
    supervisor    VARCHAR(100) NOT NULL,
    year          SMALLINT     NOT NULL,
    category      VARCHAR(50)  NOT NULL,
    description   TEXT         NOT NULL,
    file_path     VARCHAR(255) NULL,
    original_name VARCHAR(255) NULL,
    created_by    INT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_year (year),
    INDEX idx_category (category),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Default Super Admin. Username: admin   Password: Admin@12345  (CHANGE IT after first login)
INSERT INTO users (username, fullname, password, role)
VALUES ('admin', 'Administrator', '$2y$10$0aja8SGAb5l/QO2Sq20Dte9xNqo526kHo4qsDKAV9Hs9bVnAqDZ4m', 'admin')
ON DUPLICATE KEY UPDATE username = username;
