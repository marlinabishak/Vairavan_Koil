-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: Vairavan_koil
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `kattalai_type_id` varchar(36) NOT NULL,
  `kattalai_date` int(11) DEFAULT NULL,
  `kattalai_month` int(11) DEFAULT NULL,
  `title` varchar(40) DEFAULT NULL,
  `title_ta` varchar(40) DEFAULT NULL,
  `name` varchar(160) NOT NULL,
  `name_ta` varchar(160) DEFAULT NULL,
  `star` varchar(60) DEFAULT NULL,
  `star_ta` varchar(60) DEFAULT NULL,
  `place` varchar(120) DEFAULT NULL,
  `place_ta` varchar(120) DEFAULT NULL,
  `code` varchar(40) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `whatsapp_number` varchar(20) DEFAULT NULL,
  `whatsapp_same_as_mobile` tinyint(1) DEFAULT 1,
  `email` varchar(160) DEFAULT NULL,
  `per_add_1` varchar(255) DEFAULT NULL,
  `per_add_2` varchar(255) DEFAULT NULL,
  `per_add_3` varchar(255) DEFAULT NULL,
  `comm_add_1` varchar(255) DEFAULT NULL,
  `comm_add_2` varchar(255) DEFAULT NULL,
  `comm_add_3` varchar(255) DEFAULT NULL,
  `comm_add_4` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `country_code` varchar(10) DEFAULT '91',
  `kat_type` varchar(50) DEFAULT NULL,
  `regn_date` varchar(50) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'booked',
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `comments` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_bookings_date` (`kattalai_month`,`kattalai_date`),
  KEY `idx_bookings_kattalai` (`kattalai_type_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`kattalai_type_id`) REFERENCES `kattalai_types` (`id`),
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES ('470a6eed-3877-40c5-9e1c-5f4754d62863','6ac54970-b720-11f1-a912-40c2ba2be375',10,10,'Thiru','திரு','Marlin Test','மார்லின்','Anusam','அனுஷம்','CHENNAI','சென்னை','U/1/280','6369679139','6369679139',1,'test@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,100.00,'91','LIFETIME',NULL,'booked',NULL,'2026-10-07 08:08:01','2026-10-13 08:08:46',NULL),('4e3a7bed-7e8b-485c-a468-ca840f0d3e2e','6ac58b1d-b720-11f1-a912-40c2ba2be375',24,9,'Thiru','திரு','abi','அபி','Anusam','அஸ்வதி','karaikudi','காரைக்குடி','A/4/267','6369679139','6369679139',1,'abishakmarlin@gmail.com','No.153 senbagam street soodamanipuram karaikudi','','','No.153 senbagam street soodamanipuram karaikudi','','','',0.00,'91','Arthajama Kattalai','2026-10-07','booked',NULL,'2026-10-07 04:54:08','2026-10-07 04:54:08',''),('57457fff-ef45-433a-8b72-f9c1d5675f2e','6ac54970-b720-11f1-a912-40c2ba2be375',28,9,'','thiru','abi','Marlin','Anusam','Ashwini','','KKDI','A/1/271','6369679139','6369679139',1,'MA@gmail.com','kkdi','','','kkdi','','','',10000.00,'91','Arthajama Kattalai',NULL,'booked',NULL,'2026-09-28 06:02:44','2026-09-28 06:02:44','Registered by marlin '),('5a8c4235-40c4-4a9b-bcf4-67566b5289d7','6ac54970-b720-11f1-a912-40c2ba2be375',24,9,'Thiru','திரு  ','Marlin','மார்லின்  ','Anusam','அனுசம் ','KARAIKUDI','காரைக்குடி','U/3/267','6369679139','6369679139',1,'abishakmarlin@gmail.com','KKDi','','','No.154 ABC ABC','Street Soodamanipuram','chennai 600000','',0.00,'91','Uchikala Kattalai','2026-09-24','booked',NULL,'2026-09-24 02:51:45','2026-09-24 08:33:06',NULL),('84175da3-ece9-4a63-b428-ca78348a1021','6ac58b1d-b720-11f1-a912-40c2ba2be375',12,10,'Thiru','0','marlin','திரு','Anusam','மார்லின்','KARAIKUDI','அனுசம்','A/2/285','6369679139','6369679139',1,'abishak@gmail.com','KKDI','','','KKDI','','','',0.00,'91','Arthajama Kattalai',NULL,'booked',NULL,'2026-10-12 06:18:11','2026-10-12 06:18:11','காரைக்குடி'),('86233094-2f2c-4c58-9adc-21def853cf07','6ac58b1d-b720-11f1-a912-40c2ba2be375',6,10,'Thiru','0','abi','திரு','Bharani','மார்லின்','','அனுசம்','A/3/279','6369679139','6369679139',1,'abishakmarlon@gmail.com','KKDI','','','KKDI','','','',1000.00,'91','Inheritance',NULL,'booked',NULL,'2026-10-07 08:33:29','2026-10-07 08:33:29','சென்னை');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dropdown_options`
--

DROP TABLE IF EXISTS `dropdown_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dropdown_options` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `category` varchar(30) NOT NULL,
  `value` varchar(160) NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_dropdown_options_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dropdown_options`
--

LOCK TABLES `dropdown_options` WRITE;
/*!40000 ALTER TABLE `dropdown_options` DISABLE KEYS */;
INSERT INTO `dropdown_options` VALUES ('01e74aeb-c4b1-4d20-af77-993db6c85341','place_ta','ஏ. தெக்கூர்',1,'2026-10-13 07:50:50'),('05d066f1-4592-40be-a9d8-be0e7c724bb7','star_ta','உத்திராடம்',21,'2026-10-13 07:50:50'),('06448caf-ac02-4750-9984-d68fe6e08ebb','place','RAMACHANDRA PURAM',54,'2026-09-23 08:49:42'),('0781c480-e856-44ad-94ff-9185ad31b498','place','NACHANDU PATTI',37,'2026-09-23 08:49:42'),('08e688e9-b913-411d-b68a-6749ee8afaad','star_ta','மிருகசீரிஷம்',5,'2026-10-13 07:50:50'),('09d7abaf-f791-4317-8d00-8016669d937d','place_ta','பல்லத்தூர்',48,'2026-10-13 07:50:50'),('0b2ea31f-1875-4567-997e-6c455157b0a2','place','KO.ALAGAPURI',25,'2026-09-23 08:49:42'),('0c41255d-0901-4795-9d87-7d380f505e0a','star','Bharani',5,'2026-09-23 08:49:42'),('0eee7833-30cf-4599-9d39-f487f8b43d3f','place','MATHAGU PATTI',34,'2026-09-23 08:49:42'),('0f1ec3b0-1065-4100-8135-fd878991cbcd','place_ta','கீழச்செவல்பட்டி',24,'2026-10-13 07:50:50'),('132824d8-c3fb-430d-afbe-91012dcfedb4','star','Anusam',1,'2026-09-23 08:49:42'),('13ad63a8-baaa-471a-ac1c-58a891fa3506','star','Hastham',7,'2026-09-23 08:49:42'),('14573e59-3945-469e-a6db-d3cfa04c419d','star_ta','உத்திரட்டாதி',26,'2026-10-13 07:50:50'),('1a0eca19-3f23-4ea6-afc7-a3d16f040bec','place_ta','பனங்குடி',49,'2026-10-13 07:50:50'),('1accdb8b-2652-4659-be60-f4a08be6be81','place','KADIAPATTI',15,'2026-09-23 08:49:42'),('1b5085dd-d7b1-4989-911f-2653e8e57c8e','star_ta','பரணி',2,'2026-10-13 07:50:50'),('1bf8f6c2-760f-4714-9807-a04ff052adf4','place','COIMBATORE',12,'2026-09-23 08:49:42'),('1ce41b0a-c825-40c0-9589-027222384982','place','K.ALAGAPURI',14,'2026-09-23 08:49:42'),('1d747c33-f3ac-44f4-b172-f89de9f6508b','place_ta','கோ. அழகபுரி',25,'2026-10-13 07:50:50'),('1de892ff-b3ac-400f-af02-73107982343d','place','VISWANATHA PURAM.K',66,'2026-09-23 08:49:42'),('1e7293d0-02ac-4b11-9472-1fc7aa551bd3','place','NATARAJAPURAM',39,'2026-09-23 08:49:42'),('1eaa718d-2ef6-4f1c-ac0d-25b36b44187f','star_ta','ஆயில்யம்',9,'2026-10-13 07:50:50'),('1eac6173-5d95-4d90-9134-d281e338ceed','place_ta','நடராஜபுரம்',39,'2026-10-13 07:50:50'),('200d35bf-1e69-45ce-be3e-79c320e4116a','star','Sadayam',20,'2026-09-23 08:49:42'),('21109605-7bbf-41e2-ba46-9136cf24fefc','star_ta','பூரம்',11,'2026-10-13 07:50:50'),('219f73a4-ca87-4f0b-834c-769d899f06e4','place','NEMATHANPATTI',41,'2026-09-23 08:49:42'),('22390b9e-f0ad-4909-9b04-e0bd010198c2','star_ta','ரோகிணி',4,'2026-10-13 07:50:50'),('2309d642-8a8e-456e-8b38-650779141a3d','star','Pooram',14,'2026-09-23 08:49:42'),('24763e01-a0b6-4a5a-b3ba-bc13e9ec540f','place_ta','பாகனேரி',46,'2026-10-13 07:50:50'),('25276a6f-7af0-46be-a50a-b89d0e06a2ee','star','Magam',10,'2026-09-23 08:49:42'),('256e7ed4-721e-40ef-bd3c-1a4b1f779793','place_ta','தேவகோட்டை',13,'2026-10-13 07:50:50'),('2575095f-fcf3-4d27-9d9d-2a53d49149c4','title','Selvi',3,'2026-09-23 08:49:42'),('27c956f3-247a-47e4-97b3-a95ac19403fa','place_ta','குளிபிறை',30,'2026-10-13 07:50:50'),('28ad5b6b-a39b-4f59-b74f-699d5352be1f','place','MELAI SIVAPURI',35,'2026-09-23 08:49:42'),('29a9e177-57e4-4439-9316-2823d76e7f2e','title','Thiru',1,'2026-09-23 08:49:42'),('2a900635-a5fe-4fa5-a0e0-d08182d25f32','star','Pooraadam',13,'2026-09-23 08:49:42'),('2ab1c965-adbb-4d1b-87ce-7f4492106360','place_ta','கோனாப்பட்டு',26,'2026-10-13 07:50:50'),('2af7c1ee-ac5a-4d1f-9229-69b54b501064','place','KULIPIRAI',30,'2026-09-23 08:49:42'),('2b722d81-49fb-4ade-af36-dc15758a1af0','place','POOLANKURICHI',52,'2026-09-23 08:49:42'),('2e2da74c-04f0-4371-b6ff-3d794bb62f63','place_ta','வலையபட்டி',61,'2026-10-13 07:50:51'),('311673d7-5d3c-4ac6-943e-d776f7fc38c9','title','Selvan',4,'2026-09-23 08:49:42'),('31578757-d458-4ed6-9027-9834a9e23b50','place_ta','புதுவயல்',53,'2026-10-13 07:50:51'),('32e619ca-6cae-45ee-aa3d-5002d817a2c0','place','VIRACHILAI',64,'2026-09-23 08:49:42'),('3316c178-f776-4a8d-b280-7511a68a6e7a','place_ta','கொப்பனாபட்டி',27,'2026-10-13 07:50:50'),('333d5fb6-a6c8-4296-bd9c-3c9e8ca14d24','place','PALAVANGUDI',47,'2026-09-23 08:49:42'),('337d05fd-21a9-4e15-b966-c1e042f8b9a6','place','PANAGUDI',49,'2026-09-23 08:49:42'),('36b2e097-a313-46ca-a4f6-39a626680e90','star','Aswathi',2,'2026-09-23 08:49:42'),('37d8e430-63b4-4970-b839-d91724cd7ac1','place','SIRAVAYAL',56,'2026-09-23 08:49:42'),('38c5feba-4836-4a04-b2c8-11a8b69c5b7b','place_ta','கோயம்புத்தூர்',12,'2026-10-13 07:50:50'),('39dbca27-4e48-4f8d-8bf7-f3c9e77c7a92','title_ta','திரு',1,'2026-10-13 07:50:50'),('39ee17ad-c703-44ba-9076-242dadfdb2a3','place','ONASIRUVAYAL',43,'2026-09-23 08:49:42'),('3a620b29-5018-4826-bf47-35066defc51c','place','P.ALAGAPURI',45,'2026-09-23 08:49:42'),('3b921697-3d65-4973-9a92-5c413dcdc743','place','KOTTAIYUR',29,'2026-09-23 08:49:42'),('3fe1d1a1-b463-4761-be12-c5e2e2f7e632','star','Poorattathi',15,'2026-09-23 08:49:42'),('407693ef-371c-47aa-9ae8-c25b049d51ac','place_ta','அரியக்குடி',8,'2026-10-13 07:50:50'),('408e4b73-d427-4f7c-81fb-079032c64101','star','Uthirattathi',26,'2026-09-23 08:49:42'),('40d138f3-bf58-4c84-8a75-136140fceb12','place_ta','விஸ்வநாதபுரம்.கே',66,'2026-10-13 07:50:51'),('40f090ba-a008-438b-81d7-9232762f085f','star_ta','அஸ்தம்',13,'2026-10-13 07:50:50'),('415d4bba-79ef-4843-ba56-8d38b747ab0b','place','A.MUTHUPPATTINAM',2,'2026-09-23 08:49:42'),('41ea8f93-1f48-4a4a-8f55-1ca8cca14645','kat_type','Lifetime',1,'2026-09-26 06:34:21'),('4276d0fe-f1f2-437d-bf69-675466ad14c9','place','NERKUPPAI',42,'2026-09-23 08:49:42'),('437a2dda-8475-4fd4-9a58-40b764a76714','place_ta','நெற்குப்பை',42,'2026-10-13 07:50:50'),('4573dc0e-3bc3-4fa8-ad85-bfcf05cfbba7','place_ta','கல்லல்',17,'2026-10-13 07:50:50'),('48cce338-ee86-4c5d-8dfe-dbd8add92c53','star_ta','திருவோணம்',22,'2026-10-13 07:50:50'),('497875a0-aba5-4b35-851c-6f48aae69db5','place_ta','மேலைச்சிவபுரி',35,'2026-10-13 07:50:50'),('498874ae-1319-4ac3-b2af-d5fad97ef251','place','KALAYAR MANGALAM',16,'2026-09-23 08:49:42'),('4abde560-a0d2-49f5-8f04-a3e2518dbd2d','place','AAVNIPPATTI',3,'2026-09-23 08:49:42'),('4ad9fcd6-3b37-4f10-b052-acbfabe01d4a','star','Uthiram',25,'2026-09-23 08:49:42'),('4adea91d-3c12-4189-9520-2b74262c0d49','place_ta','அரிமளம்',7,'2026-10-13 07:50:50'),('4cc3f164-a3b1-4120-a406-c0187a126fb3','place','MAKIBALANPATTI',32,'2026-09-23 08:49:42'),('4e0da4c6-a065-465c-8e8e-7974754c8b24','star_ta','கேட்டை',18,'2026-10-13 07:50:50'),('4e1ed4ae-8da5-4ec8-96ff-23644d3892dd','place','VENTHAN PATTI',62,'2026-09-23 08:49:42'),('4ea5e59a-e218-4364-88aa-62571ba90c26','star_ta','விசாகம்',16,'2026-10-13 07:50:50'),('511c6978-1f68-4365-91cc-ad24c488076e','place','MUTHU PATTINAM.K',36,'2026-09-23 08:49:42'),('5156520a-e98b-4f99-9eeb-670feabdb06c','place_ta','விராச்சிலை',64,'2026-10-13 07:50:51'),('5247a54b-aa7e-44c1-9564-ea6d50c4b312','star_ta','அவிட்டம்',23,'2026-10-13 07:50:50'),('52908e12-490f-4914-86ad-da9182d4e4ce','place','ATHANGUDI',9,'2026-09-23 08:49:42'),('52e26a04-2846-4ac5-a1c5-a5feb088d003','place','DEVAKOTTAI',13,'2026-09-23 08:49:42'),('5517117c-2592-48ae-859e-f17651095fa5','place_ta','ஆத்தங்குடி',9,'2026-10-13 07:50:50'),('557d2c84-924c-4f5d-bb47-f149ff6299e5','star_ta','பூராடம்',20,'2026-10-13 07:50:50'),('565e2b08-78a6-407a-bd31-1c1220513541','place','ARIMALAM',7,'2026-09-23 08:49:42'),('569c237b-77d2-47e2-b964-1b0169ad890a','place_ta','அரண்மனை சிறுவயல்',5,'2026-10-13 07:50:50'),('592b0b69-a02e-46cb-8ee1-093ecd80d383','place','VETRIYUR',63,'2026-09-23 08:49:42'),('59e1e778-80c5-4a06-af58-fa682b5bda9f','place_ta','ராயவரம்',55,'2026-10-13 07:50:51'),('5a8ac28e-7aeb-4530-8824-eb2cfc3ecf61','place','CHOKALINGAM PUDUR',11,'2026-09-23 08:49:42'),('5ccaeced-593f-444b-9c85-7665fee155f8','place','KARAIKUDI',22,'2026-09-23 08:49:42'),('5d724c69-91d1-4e46-ac63-3183d7320a57','place_ta','கண்டனூர்',19,'2026-10-13 07:50:50'),('5e0517c8-aa59-4b97-b80e-1ea282db2341','place','KANDAVARAYANPATTI',21,'2026-09-23 08:49:42'),('5fd8f87d-631c-4e36-a2e4-c0ba8553fea4','place_ta','நாச்சியாபுரம்',38,'2026-10-13 07:50:50'),('601a3940-f44c-4837-8801-06587040dbc3','place_ta','காரைக்குடி',22,'2026-10-13 07:50:50'),('613d5d04-a24e-4908-80bc-39bb6f00e762','place','RAYAVARAM',55,'2026-09-23 08:49:42'),('63d76fec-3436-4cd7-a092-1cfe57aa4516','place','NATTARASAN KOTTAI',40,'2026-09-23 08:49:42'),('688c79a4-4b2d-468d-aa3a-730184233b22','place','KARUNGKULAM',23,'2026-09-23 08:49:42'),('68dc438b-3c03-4fa8-adaf-4bac7873496a','place_ta','ஒனசிறுவயல்',43,'2026-10-13 07:50:50'),('6a30ef00-a78b-4542-b605-1ba7b7263e34','place','ALAVAKOTTAI',4,'2026-09-23 08:49:42'),('6ae7131e-ec0d-462a-a2b9-193841cb29bf','star_ta','கார்த்திகை',3,'2026-10-13 07:50:50'),('6ae80652-70b9-4def-a4cb-59a60be63553','star_ta','சதயம்',24,'2026-10-13 07:50:50'),('6e7ac722-e960-4fc7-90ee-35ca23624f2b','place_ta','வி. லட்சுமிபுரம்',60,'2026-10-13 07:50:51'),('6ffbef3f-ea95-4776-b828-0db4dc4195a7','star_ta','அனுஷம்',17,'2026-10-13 07:50:50'),('713619ad-e157-4436-8adc-87f80d0e05e2','place_ta','சிறுகூடல்பட்டி',57,'2026-10-13 07:50:51'),('71901968-ffb5-4cd0-b241-e7946fbbdd59','star','Chithirai',6,'2026-09-23 08:49:42'),('725354a9-7a64-4695-bef0-0c1e1e1f047f','place','THENIPATTI',59,'2026-09-23 08:49:42'),('725bc310-dc72-47ea-95e1-6e5a693161ca','place','OOKUR',44,'2026-09-23 08:49:42'),('72c5d0b1-27d0-41a9-8cdc-d155575187fc','place','KANDANUR',19,'2026-09-23 08:49:42'),('77a34f29-a41e-4ca5-a6dc-48afd01f1fed','place_ta','வீரமதி',65,'2026-10-13 07:50:51'),('7a5184cd-902a-4dba-a637-8b53e8287912','place_ta','பொன் புதுப்பட்டி',51,'2026-10-13 07:50:51'),('7c41dd95-bc81-4e1a-8edc-182cc66017c8','place','CHENNAI',10,'2026-09-23 08:49:42'),('7c9985c8-cabc-45ec-952e-6d1d728c503f','star_ta','சித்திரை',14,'2026-10-13 07:50:50'),('7ea63a69-3fc7-45d0-be59-73f06608796e','title_ta','செல்வி',3,'2026-10-13 07:50:50'),('7f7da353-c3b5-414b-9dd0-07a14415a771','place','V.LAKSHMIPURAM',60,'2026-09-23 08:49:42'),('808b0004-4291-4d53-afeb-d08b7cb85b0e','star_ta','புனர்பூசம்',7,'2026-10-13 07:50:50'),('8142cd29-0d41-4727-bb78-0565822d79c0','place_ta','ராமச்சந்திரபுரம்',54,'2026-10-13 07:50:51'),('83578fa6-b7df-4bc3-bfb5-f55d9cf73d7e','title_ta','திருமதி',2,'2026-10-13 07:50:50'),('85e728a5-f7ac-4912-b2f6-b5b050aae737','star_ta','ரேவதி',27,'2026-10-13 07:50:50'),('891f9768-8064-4284-92dd-c79ed791755f','place_ta','கோட்டையூர்',29,'2026-10-13 07:50:50'),('899eaa69-ad40-4c89-b712-6e900a26ec60','place','KALLAL',17,'2026-09-23 08:49:42'),('8a7ac7fb-cbf2-46b1-b526-29afb0d504a4','place_ta','ஆவணிப்பட்டி',3,'2026-10-13 07:50:50'),('8dfc3cbe-d0c3-4372-8e77-2603aba01b69','place_ta','பட்டம்மங்கலம்',50,'2026-10-13 07:50:50'),('8ee6a9b7-3a75-400e-b637-a497ef58cc72','place_ta','ஏ. முத்துப்பட்டினம்',2,'2026-10-13 07:50:50'),('8fa29794-672c-40da-9b56-930d7226883d','star','Punarpoosam',17,'2026-09-23 08:49:42'),('8fec5e08-92e4-4af6-9661-04ec0a0d99f2','place','ARANMANAI SIRUVAYAL',5,'2026-09-23 08:49:42'),('907d12fe-47bd-4330-aeb4-ceb37d5b3990','place_ta','சிவூர்',58,'2026-10-13 07:50:51'),('90e3aad2-65d5-4362-ab6c-0d60e642411e','place','PALLATHUR',48,'2026-09-23 08:49:42'),('934a2f33-6b84-4270-86a9-e0fb72761808','place','NACHIAPURAM',38,'2026-09-23 08:49:42'),('949abf76-e9f8-40d5-afd9-f9fd123f0746','place_ta','பாலவாங்குடி',47,'2026-10-13 07:50:50'),('982f1a6d-1c6a-40e4-b7bf-d424a5b33f43','place_ta','கண்டவராயன்பட்டி',21,'2026-10-13 07:50:50'),('9c68f623-8572-409d-8dee-d102e3efd63f','star','Rohini',19,'2026-09-23 08:49:42'),('9da20838-8e73-4e5d-bffa-3730220731e2','place_ta','முத்துப்பட்டினம்.கே',36,'2026-10-13 07:50:50'),('9e88ba45-97e1-4190-bc05-3937c9c0629e','title','Thirumathi',2,'2026-09-23 08:49:42'),('9ff3eabf-c33a-4728-885e-d5e5049214e8','place','PUDUVAYAL',53,'2026-09-23 08:49:42'),('a0288add-2a8e-4c1e-84ad-0c65539894e0','place','KEELASEVALPATTI',24,'2026-09-23 08:49:42'),('a0315e41-f2da-4e20-aef7-00e55c001a52','star_ta','மூலம்',19,'2026-10-13 07:50:50'),('a26a2d8e-b203-4f5e-97d5-4d57310c5287','star','Uthiradam',24,'2026-09-23 08:49:42'),('a2bbfea0-7792-463f-ade5-98c54d9027be','place_ta','நேமத்தான்பட்டி',41,'2026-10-13 07:50:50'),('a435fe9a-b169-4e3b-ad07-e661f339be15','place','VALAYAPATTI',61,'2026-09-23 08:49:42'),('a5ed93e5-c283-40e5-8f2c-bec7b4a65936','star_ta','சுவாதி',15,'2026-10-13 07:50:50'),('a6af1beb-1135-4b63-b352-c454f36cd440','place_ta','கொத்தமங்கலம்',28,'2026-10-13 07:50:50'),('a8daf013-9c6c-4f18-a6c9-039598e778cf','place','KONAPET',26,'2026-09-23 08:49:42'),('aa1a5e8f-ff61-467e-b647-816fc56bc6c7','place_ta','நாச்சந்துபட்டி',37,'2026-10-13 07:50:50'),('abd8f5f5-12df-47d2-95f4-6fe8aa099433','title_ta','செல்வன்',4,'2026-10-13 07:50:50'),('b27a2a14-c13e-43c6-b3f1-aa237b50f070','place','VIRAMATHI',65,'2026-09-23 08:49:42'),('b48a4597-118d-4aec-ae1b-ceaba6b97082','place_ta','குருவிகொண்டான்பட்டி',31,'2026-10-13 07:50:50'),('b9391483-ef46-4f98-af28-a0c9c53ed893','place_ta','கானாடுகாத்தான்',18,'2026-10-13 07:50:50'),('bc3a670a-b4ca-447d-87e6-618cb00085ef','place_ta','சிராவயல்',56,'2026-10-13 07:50:51'),('bf1bfa7c-193f-4dbc-9e67-8af261687c89','star','Poosam',16,'2026-09-23 08:49:42'),('c0dd781c-0b68-417e-af5e-b93f56e18a88','place','KOPPANA PATTI',27,'2026-09-23 08:49:42'),('c1a39633-2da0-4b44-b57c-88685b84e036','star','Karthikai',8,'2026-09-23 08:49:42'),('c42a76ca-5101-42f7-9fd9-e83428b27cc0','place','ARIYAGUDI',8,'2026-09-23 08:49:42'),('c506fba8-5b08-4978-a7a2-b4ab15a14df2','place_ta','கடியாபட்டி',15,'2026-10-13 07:50:50'),('c71aec13-0c4e-4e51-a5fd-67b1b54534c5','place','SIVUR',58,'2026-09-23 08:49:42'),('c86303ab-3667-404f-996c-98c49735c062','place','KANDARAMANIKKAM',20,'2026-09-23 08:49:42'),('c90687b3-a6dc-493e-87d9-bd77b8057213','star','Visakam',27,'2026-09-23 08:49:42'),('ca093785-3894-4058-aaf0-b64f916182be','star','Mirukashirisham',11,'2026-09-23 08:49:42'),('ccb6ed49-bcb7-44e3-b90f-b81d801a04e6','place','KOTHAMANGALAM',28,'2026-09-23 08:49:42'),('cd0729b3-d4ed-498c-8364-f7aac21ec7ff','star_ta','அஸ்வினி',1,'2026-10-13 07:50:50'),('cf4aa5d5-b55f-4cbe-99f5-5aaef2d4286b','place','PATTAMANGALAM',50,'2026-09-23 08:49:42'),('d14af935-2e0f-43ba-91cf-69df0035ec92','place','A THEKKUR',1,'2026-09-23 08:49:42'),('d28d4bc0-7847-446a-b927-cb221dac104d','place_ta','நாட்டரசன்கோட்டை',40,'2026-10-13 07:50:50'),('d43c2e06-deda-4c43-91c6-6b53f0eef1f9','star_ta','பூரட்டாதி',25,'2026-10-13 07:50:50'),('d44d793d-469d-4d5b-bc1f-3ed757b96da6','place_ta','மடகுபட்டி',34,'2026-10-13 07:50:50'),('d4ce890b-4c15-4d55-91cc-5a06e8fbe012','place_ta','வேந்தன்பட்டி',62,'2026-10-13 07:50:51'),('d57902f8-194f-490c-a33f-9f195e7af812','place','KANADUKATHAN',18,'2026-09-23 08:49:42'),('d5d13787-2f63-4669-82be-dcdb9b47a6e2','star','Swathi',21,'2026-09-23 08:49:42'),('d77fc0b2-8c8d-4e23-afe7-611ded1927ba','place_ta','அரவயல்',6,'2026-10-13 07:50:50'),('da3ca5c6-4bab-4b35-b29b-29048964bea9','place_ta','சென்னை',10,'2026-10-13 07:50:50'),('da565e8b-db65-4a60-a741-6fb3f71d487c','place','SIRUKUDALPATTI',57,'2026-09-23 08:49:42'),('db0570e2-61b7-44cd-b310-f551b566af29','place_ta','பி. அழகபுரி',45,'2026-10-13 07:50:50'),('dce5d6c4-e86f-4b5e-8481-db557b0819e9','place_ta','ஓகூர்',44,'2026-10-13 07:50:50'),('dcf88973-9b72-4b17-ad7f-464ce2c2835f','place','ARAVAYAL',6,'2026-09-23 08:49:42'),('dec7692a-4968-4fde-889b-c5c9114b6cf6','place','MANAKIRI',33,'2026-09-23 08:49:42'),('dedeaebe-21d3-4e08-87e0-513923bcb8f8','place_ta','கே. அழகபுரி',14,'2026-10-13 07:50:50'),('df448cf2-90fb-4d96-9680-d734d21626d5','place_ta','தேனிப்பட்டி',59,'2026-10-13 07:50:51'),('e004c80a-fa18-4461-91b5-34366684a46a','star','Thiruvathirai',22,'2026-09-23 08:49:42'),('e027ac87-d4b8-4357-9315-a99212a4e2b8','star_ta','மகம்',10,'2026-10-13 07:50:50'),('e1736bab-53c0-4e86-abbc-edf81486cbd3','place_ta','கண்டரமாணிக்கம்',20,'2026-10-13 07:50:50'),('e176f98a-42d1-4dbc-84ca-c64a48dcdf24','kat_type','Inheritance',2,'2026-09-26 06:34:21'),('e2769055-76f3-4081-b327-7aaa565eac12','star','Moolam',12,'2026-09-23 08:49:42'),('e63d6ea3-4fe5-4e74-bdc7-16c5bbd04053','star','Revathi',18,'2026-09-23 08:49:42'),('e9d300df-e7bc-4b18-86fb-77442def686d','place','PAGANERY',46,'2026-09-23 08:49:42'),('edb4b6b7-cb74-4aa7-99c5-765532454f5f','place_ta','கருங்குளம்',23,'2026-10-13 07:50:50'),('ee5a048c-eb43-44a8-a325-783f9d192ae8','place','PON PUDUPATTI',51,'2026-09-23 08:49:42'),('ee6e89e3-273a-4743-87d3-8a05f8f82814','place_ta','மானாகிரி',33,'2026-10-13 07:50:50'),('f39b130c-f543-4593-b680-8dc7193a7127','place','KURUVIKONDANPATTI',31,'2026-09-23 08:49:42'),('f6f21292-e0f2-4c1d-9a89-8b1df954c964','star_ta','பூசம்',8,'2026-10-13 07:50:50'),('f81ad06d-cfa3-4bc8-9864-09f1d8456b6e','place_ta','சொக்கலிங்கம்புதூர்',11,'2026-10-13 07:50:50'),('f9667618-4ec4-4cfe-9478-6726445f7232','star','Ayilyam',4,'2026-09-23 08:49:42'),('fade7470-4a3c-4f10-8949-a3f5f79d9ead','star','Thiruvonam',23,'2026-09-23 08:49:42'),('fb6d19a8-756b-4893-9836-e4a9863023c2','star','Keettai',9,'2026-09-23 08:49:42'),('fb81e540-ca42-4f6a-ab00-f0fa60e90e0b','star_ta','திருவாதிரை',6,'2026-10-13 07:50:50'),('fb9ac9eb-d5e6-4c6e-9ce7-4f0fea54dcd2','place_ta','வெற்றியூர்',63,'2026-10-13 07:50:51'),('fc3f9a3b-1c08-46f5-99b3-111186f8171b','place_ta','அலவாகோட்டை',4,'2026-10-13 07:50:50'),('fc7405f1-919b-46f3-8872-ae84dd4c91b6','star','Avittam',3,'2026-09-23 08:49:42'),('fd692f1f-c780-4693-8d14-7012cdec4f02','place_ta','காளையார் மங்கலம்',16,'2026-10-13 07:50:50'),('fd7a75fd-1828-4996-b4c2-bc9446e97777','place_ta','பூலாங்குறிச்சி',52,'2026-10-13 07:50:51'),('fe795d8e-43ed-4314-9089-ef90e2b46835','star_ta','உத்திரம்',12,'2026-10-13 07:50:50'),('ff020c26-26e6-449a-8ada-1deaf0357c6b','place_ta','மகிபாலன்பட்டி',32,'2026-10-13 07:50:50');
/*!40000 ALTER TABLE `dropdown_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `edit_requests`
--

DROP TABLE IF EXISTS `edit_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `edit_requests` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `booking_id` varchar(36) NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_edit_requests_booking` (`booking_id`),
  CONSTRAINT `edit_requests_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `edit_requests`
--

LOCK TABLES `edit_requests` WRITE;
/*!40000 ALTER TABLE `edit_requests` DISABLE KEYS */;
INSERT INTO `edit_requests` VALUES ('5fbf15e4-4590-4fa8-9640-92ded9fe1a1c','4e3a7bed-7e8b-485c-a468-ca840f0d3e2e','pending','2026-10-07 04:55:37','2026-10-07 04:55:37');
/*!40000 ALTER TABLE `edit_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `history_logs`
--

DROP TABLE IF EXISTS `history_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `history_logs` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `user_id` varchar(36) DEFAULT NULL,
  `action` varchar(120) NOT NULL,
  `details` text NOT NULL,
  `booking_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `booking_id` (`booking_id`),
  KEY `idx_history_logs_created_at` (`created_at`),
  CONSTRAINT `history_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `history_logs_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `history_logs`
--

LOCK TABLES `history_logs` WRITE;
/*!40000 ALTER TABLE `history_logs` DISABLE KEYS */;
INSERT INTO `history_logs` VALUES ('3c5bf902-1032-4c2f-b6de-5958a497a99a','08177268-a410-48b9-92fa-6287e9217407','Printed Labels','Administrator printed 1 Prasatham letters.',NULL,'2026-09-24 05:37:15'),('40db2ec8-3b85-4287-8794-9955463a7dfb','08177268-a410-48b9-92fa-6287e9217407','Printed Labels','Administrator printed 1 Prasatham letters.',NULL,'2026-10-12 06:19:51'),('57da2b7a-c226-11f1-9bf8-40c2ba2be375',NULL,'Updated Attendance','Marked present for 2026','470a6eed-3877-40c5-9e1c-5f4754d62863','2026-10-07 08:08:01'),('74bad547-a5cc-4ad2-97b1-78bee9c3533b',NULL,'REQUESTED_EDIT','Devotee requested permission to edit their locked details.',NULL,'2026-09-24 05:03:43'),('88a3de59-480a-4910-b3a1-1ca062eed64e','08177268-a410-48b9-92fa-6287e9217407','Printed Labels','Administrator printed 1 Prasatham letters.',NULL,'2026-09-24 07:26:44'),('952e1d45-57c1-4de7-97e9-599234635971','5185f894-3f76-4098-9a97-107a31383660','Created Staff Profile','Superadmin created profile \"Muthuraman (Pooja In-Charge)\" (Username: pooja_incharge) with role \"ulthurai\"',NULL,'2026-10-13 07:32:53'),('bc87b9b4-fcf5-44fc-9dc9-c209e55358f2',NULL,'REQUESTED_EDIT','Devotee requested permission to edit their locked details.','4e3a7bed-7e8b-485c-a468-ca840f0d3e2e','2026-10-07 04:55:37'),('fa043133-fb6d-4a7f-bc09-381702d708ed','08177268-a410-48b9-92fa-6287e9217407','Printed Labels','Administrator printed 2 Prasatham letters.',NULL,'2026-10-13 10:12:12');
/*!40000 ALTER TABLE `history_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kattalai_types`
--

DROP TABLE IF EXISTS `kattalai_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kattalai_types` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(120) NOT NULL,
  `name_ta` varchar(160) DEFAULT NULL,
  `color_key` varchar(30) NOT NULL,
  `default_amount` decimal(10,2) DEFAULT 0.00,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `max_slots` int(11) NOT NULL DEFAULT 5,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kattalai_types`
--

LOCK TABLES `kattalai_types` WRITE;
/*!40000 ALTER TABLE `kattalai_types` DISABLE KEYS */;
INSERT INTO `kattalai_types` VALUES ('6ac54970-b720-11f1-a912-40c2ba2be375','Uchikala Kattalai','உச்சிகால கட்டளை','morning',0.00,1,1,'2026-09-23 07:28:20',4),('6ac58b1d-b720-11f1-a912-40c2ba2be375','Arthajama Kattalai','அர்த்தஜாம கட்டளை','evening-blue',0.00,2,1,'2026-09-23 07:28:20',4),('6ac58dc8-b720-11f1-a912-40c2ba2be375','Archanai','அர்ச்சனை','archanai',0.00,3,1,'2026-09-23 07:28:20',4);
/*!40000 ALTER TABLE `kattalai_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panchangam`
--

DROP TABLE IF EXISTS `panchangam`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panchangam` (
  `panch_date` date NOT NULL,
  `tamil_month` varchar(40) DEFAULT NULL,
  `tamil_year` varchar(40) DEFAULT NULL,
  `tamil_day_number` int(11) DEFAULT NULL,
  `nalla_neram` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`nalla_neram`)),
  `yamagandam` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`yamagandam`)),
  `kuligai` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`kuligai`)),
  `rahu_kalam` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`rahu_kalam`)),
  `thithi` varchar(60) DEFAULT NULL,
  `thithi_time` varchar(60) DEFAULT NULL,
  `natchathiram` varchar(60) DEFAULT NULL,
  `yogam` varchar(60) DEFAULT NULL,
  `chandrashtamam` varchar(60) DEFAULT NULL,
  `kulam` varchar(60) DEFAULT NULL,
  `parigaram` varchar(120) DEFAULT NULL,
  `special_note` text DEFAULT NULL,
  `worship_note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`panch_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panchangam`
--

LOCK TABLES `panchangam` WRITE;
/*!40000 ALTER TABLE `panchangam` DISABLE KEYS */;
INSERT INTO `panchangam` VALUES ('2026-09-24','Purattasi','Krothi',8,'[{\"start\":\"07:31 am\",\"end\":\"09:00 am\"}]','[{\"start\":\"09:00 am\",\"end\":\"10:30 am\"}]','[{\"start\":\"12:00 pm\",\"end\":\"01:30 pm\"}]','[{\"start\":\"03:00 pm\",\"end\":\"04:30 pm\"}]','ஏகாதசி','தசமி காலை 10.36','பரணி இரவு 9.26','மரண-அமிர்த','மகம்','வடக்கு','பால்','தத்தாத்ரேயர் ஜெயந்தி.\nஅக்ஷயலோகாம் 32வது பட்டம்\nஅடைந்திய சிங்கர் திருநட்சத்திரம்.','பிரம்மா, விஷ்ணு, சிவனை நினைத்து\nவழிபடுதல்.','2026-09-24 05:57:06');
/*!40000 ALTER TABLE `panchangam` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `booking_id` varchar(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` varchar(30) DEFAULT 'cash',
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `transaction_ref` varchar(120) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_payments_booking` (`booking_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES ('ad873752-e2f8-4067-9ddb-87142c249c1c','86233094-2f2c-4c58-9adc-21def853cf07',1000.00,'cash','paid',NULL,'2026-10-07 08:33:29','2026-10-07 08:33:29'),('efa5a28d-5d2d-43a9-8d57-3e046ca44ee9','84175da3-ece9-4a63-b428-ca78348a1021',0.00,'cash','paid',NULL,'2026-10-12 06:18:11','2026-10-12 06:18:11');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `todo_items`
--

DROP TABLE IF EXISTS `todo_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `todo_items` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `todo_list_id` varchar(36) NOT NULL,
  `booking_id` varchar(36) DEFAULT NULL,
  `name` varchar(160) NOT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `idx_todo_items_list` (`todo_list_id`),
  CONSTRAINT `todo_items_ibfk_1` FOREIGN KEY (`todo_list_id`) REFERENCES `todo_lists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `todo_items_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `todo_items`
--

LOCK TABLES `todo_items` WRITE;
/*!40000 ALTER TABLE `todo_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `todo_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `todo_lists`
--

DROP TABLE IF EXISTS `todo_lists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `todo_lists` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `title` varchar(120) NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `todo_lists`
--

LOCK TABLES `todo_lists` WRITE;
/*!40000 ALTER TABLE `todo_lists` DISABLE KEYS */;
INSERT INTO `todo_lists` VALUES ('6ac6ba91-b720-11f1-a912-40c2ba2be375','Viboothi to be sent to',1,'2026-09-23 07:28:20'),('6ac6c3b0-b720-11f1-a912-40c2ba2be375','Reminder Letter to send',2,'2026-09-23 07:28:20');
/*!40000 ALTER TABLE `todo_lists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(120) NOT NULL,
  `email` varchar(160) NOT NULL,
  `password_hash` text NOT NULL,
  `role` varchar(30) NOT NULL DEFAULT 'staff',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('08177268-a410-48b9-92fa-6287e9217407','Administrator','admin','$2b$10$tRBLEXG4f2ltkfHaHE8.j.Nr9/AOKQSrWyKRIhRaGgZhIc/t0DMja','admin','2026-09-24 05:29:59'),('5185f894-3f76-4098-9a97-107a31383660','Super Administrator','superadmin','$2b$10$NHJdbR1sZOmRD7QlpkaT8OhkA0GNaOmUQyYDO3YLHdTmhcnzu.MM.','superadmin','2026-09-24 05:29:58'),('6a784f22-5de4-4c05-9d1f-34c38c508c5c','Muthuraman (Pooja In-Charge)','pooja_incharge','$2b$10$X7jU7uj4Q1avEeATEq1ZX.2WNeYWIwwkNtm7YJR7ntQD/iUBcb9Nm','ulthurai','2026-10-13 07:32:53'),('be1f3d3d-d80b-4a7b-80ca-8e95bfdb0c9e','Ulthurai (Pooja Team)','ulthurai','$2b$10$pLtKV9v6IkKsrR6db6pob..ACmHTSlpqYWVizlMV/CG2dAcW/Ewb6','ulthurai','2026-09-24 05:29:59');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whatsapp_send_history`
--

DROP TABLE IF EXISTS `whatsapp_send_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `whatsapp_send_history` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `lang` varchar(20) NOT NULL,
  `target_date` varchar(60) NOT NULL,
  `total` int(11) DEFAULT 0,
  `sent` int(11) DEFAULT 0,
  `failed` int(11) DEFAULT 0,
  `triggered_by` varchar(60) DEFAULT NULL,
  `error_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`error_details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whatsapp_send_history`
--

LOCK TABLES `whatsapp_send_history` WRITE;
/*!40000 ALTER TABLE `whatsapp_send_history` DISABLE KEYS */;
INSERT INTO `whatsapp_send_history` VALUES ('16476cc2-b7dd-11f1-a912-40c2ba2be375','en','2026-09-24',1,1,0,'admin',NULL,'2026-09-24 05:58:45'),('1db70cd8-b7e6-11f1-a912-40c2ba2be375','ta','2026-09-24',1,1,0,'admin',NULL,'2026-09-24 07:03:23'),('e7becac3-b7e7-11f1-a912-40c2ba2be375','ta','2026-09-24',1,1,0,'admin',NULL,'2026-09-24 07:16:11');
/*!40000 ALTER TABLE `whatsapp_send_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `yearly_booking_records`
--

DROP TABLE IF EXISTS `yearly_booking_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `yearly_booking_records` (
  `id` varchar(36) NOT NULL,
  `booking_id` varchar(36) NOT NULL,
  `record_year` int(11) NOT NULL,
  `wa_status_en` varchar(20) DEFAULT NULL,
  `wa_error_en` text DEFAULT NULL,
  `wa_status_ta` varchar(20) DEFAULT NULL,
  `wa_error_ta` text DEFAULT NULL,
  `let_intimation` varchar(20) DEFAULT NULL,
  `present` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `updated_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_booking_year` (`booking_id`,`record_year`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `yearly_booking_records_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `yearly_booking_records_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `yearly_booking_records`
--

LOCK TABLES `yearly_booking_records` WRITE;
/*!40000 ALTER TABLE `yearly_booking_records` DISABLE KEYS */;
INSERT INTO `yearly_booking_records` VALUES ('3dbd2030-c6df-11f1-95c0-40c2ba2be375','4e3a7bed-7e8b-485c-a468-ca840f0d3e2e',2026,'sent',NULL,NULL,NULL,NULL,0,'active',NULL,'2026-10-13 08:22:08','2026-10-13 08:22:08'),('57d9e65b-c226-11f1-9bf8-40c2ba2be375','470a6eed-3877-40c5-9e1c-5f4754d62863',2026,NULL,NULL,NULL,NULL,NULL,1,'active',NULL,'2026-10-07 08:08:01','2026-10-07 08:08:01'),('88ef48ae-c611-11f1-95c0-40c2ba2be375','84175da3-ece9-4a63-b428-ca78348a1021',2026,NULL,NULL,NULL,NULL,NULL,0,'active',NULL,'2026-10-12 07:49:47','2026-10-12 10:34:49'),('974d8686-c628-11f1-95c0-40c2ba2be375','84175da3-ece9-4a63-b428-ca78348a1021',2027,NULL,NULL,NULL,NULL,NULL,1,'active',NULL,'2026-10-12 10:34:49','2026-10-12 10:34:49');
/*!40000 ALTER TABLE `yearly_booking_records` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-14 10:34:24
