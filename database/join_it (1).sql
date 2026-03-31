-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 31, 2026 at 08:26 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `join_it`
--

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `task_staff_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `contribution_detail` longtext NOT NULL,
  `learning_outcome` longtext NOT NULL,
  `mentor_feedback` longtext NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` varchar(255) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `task_staff_id`, `intern_id`, `contribution_detail`, `learning_outcome`, `mentor_feedback`, `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_at`) VALUES
(1, 0, 0, '0', '0', '0', '0', '0000-00-00 00:00:00', '0', '0000-00-00 00:00:00', NULL),
(10, 10764, 14, '', '', '', 'Armin Alert', '2026-03-31 02:37:28', '', '2026-03-31 02:37:28', NULL),
(14, 10765, 14, '', '', '', 'Armin Alert', '2026-03-31 02:46:22', '', '2026-03-31 02:46:22', NULL),
(15, 10763, 14, '', '', '', 'Armin Alert', '2026-03-31 02:46:32', '', '2026-03-31 02:46:32', NULL),
(19, 10764, 15, '', '', '', 'Hello', '2026-03-31 02:46:58', '', '2026-03-31 02:46:58', NULL),
(20, 10765, 15, '', '', '', 'Hello', '2026-03-31 02:47:00', '', '2026-03-31 02:47:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `university_name` varchar(255) DEFAULT NULL,
  `academic_year` varchar(50) DEFAULT NULL,
  `faculty` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `role` varchar(50) DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `avatar_url`, `university_name`, `academic_year`, `faculty`, `updated_at`, `role`) VALUES
(13, 'admin', '$2b$10$KFjofo0tvkzoK5lNyvTppOcrHguHHWjYYiwBi/E253DveSirhdRgK', 'Eren yeager', '/uploads/avatar-13-1774838997249-131905439.jpg', '55555', '2000', '2026-03-20 13:54:47', '2026-03-30 02:51:01', 'user'),
(14, 'admin1', '$2b$10$z9Ykgdf7EJr.SfQsla7SZ.Q9mbkCde1An10eE8M7xJAXuIomnpRQK', 'Armin Alert', NULL, 'Shiganshina', '855', NULL, '2026-03-31 02:36:54', 'admin1'),
(15, 'admin2', '$2b$10$fu68BG23Ejx0AECoP5J91.BjCuOeX2A4bVuarXLnpMDEYAQc.esku', 'Hello', NULL, 'AAA', '121', NULL, '2026-03-31 02:40:41', 'admin');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`) USING BTREE;

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
