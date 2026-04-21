-- --------------------------------------------------------
-- SQL Setup for Join-IT Project (Full Schema)
-- --------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `join_it`
--

-- --------------------------------------------------------

--
-- 1. Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `university_name` varchar(255) DEFAULT NULL,
  `academic_year` varchar(50) DEFAULT NULL,
  `term` varchar(255) DEFAULT NULL,
  `faculty` varchar(255) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'user',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 
-- dumping data for admin (Password: admin)
-- 
INSERT INTO `users` (`username`, `password`, `full_name`, `role`) VALUES
('admin', '$2b$10$aZlvEJjuH3kORhJtDQgebO05OiffB8MDroPusPbu60jceGH4hoHBG', 'Administrator', 'admin');

-- --------------------------------------------------------

--
-- 2. Table structure for table `tasks` (Join Staff Tasks)
--

DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_staff_id` int(11) NOT NULL COMMENT 'ID จาก orderit.data_report',
  `intern_id` int(11) NOT NULL COMMENT 'ID จาก join_it.users',
  `contribution_detail` longtext DEFAULT NULL,
  `learning_outcome` longtext DEFAULT NULL,
  `mentor_feedback` longtext DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_contribution` (`task_staff_id`,`intern_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 3. Table structure for table `intern_tasks` (Self-created Tasks)
--

DROP TABLE IF EXISTS `intern_tasks`;
CREATE TABLE `intern_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date_report` date NOT NULL,
  `time_report` time NOT NULL,
  `reporter` varchar(255) NOT NULL,
  `department` varchar(100) NOT NULL COMMENT 'เก็บ ID หรือชื่อแผนก',
  `tel` varchar(50) DEFAULT NULL,
  `deviceName` varchar(255) NOT NULL,
  `number_device` varchar(255) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `report` longtext NOT NULL,
  `status` int(1) NOT NULL DEFAULT 1 COMMENT '1:รับแจ้ง, 2:ดำเนินการ, 3:เสร็จสิ้น',
  `username` varchar(255) DEFAULT NULL COMMENT 'Username นักศึกษาที่รับงาน',
  `contribution_detail` longtext DEFAULT NULL,
  `learning_outcome` longtext DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `closed_date` date DEFAULT NULL,
  `closed_time` time DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
