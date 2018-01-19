DROP DATABASE IF EXISTS htc_coco;
CREATE DATABASE htc_coco CHARACTER SET utf8 COLLATE utf8_general_ci;

USE htc_coco;
SET NAMES 'utf8';

DROP TABLE IF EXISTS `analysis`;
CREATE TABLE `htc_coco`.`analysis` (
	`id` int(32) NOT NULL AUTO_INCREMENT,
	`create_time` int(64) NOT NULL COMMENT '时间',
	`buy_option` varchar(32) NOT NULL DEFAULT '' COMMENT '选择',
	`set_master` int(64) NOT NULL COMMENT 'set时的master',
	`set_slave` int(64) NOT NULL COMMENT 'set时的slave',
	`actual_master` int(64) NOT NULL COMMENT '最终的master',
	`actual_slave` int(64) NOT NULL COMMENT '最终的slave',
	`account_value` int(64) NOT NULL COMMENT '账户余额',
	PRIMARY KEY (`id`)
) ENGINE=`InnoDB` AUTO_INCREMENT=100 DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ROW_FORMAT=DYNAMIC CHECKSUM=0 DELAY_KEY_WRITE=0;