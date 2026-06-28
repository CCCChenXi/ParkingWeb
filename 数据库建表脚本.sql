-- ============================================================
-- 智能停车系统 - 数据库建表脚本
-- 数据库: parking_system
-- ============================================================

CREATE DATABASE IF NOT EXISTS `parking_system`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `parking_system`;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE `user` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username`    VARCHAR(32)  NOT NULL                COMMENT '用户名',
  `password`    VARCHAR(128) NOT NULL                COMMENT '密码(BCrypt加密)',
  `phone`       VARCHAR(20)  NOT NULL DEFAULT ''     COMMENT '手机号',
  `avatar`      VARCHAR(255) NOT NULL DEFAULT ''     COMMENT '头像URL',
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 2. 管理员表
-- ============================================================
CREATE TABLE `admin` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username`    VARCHAR(32)  NOT NULL                COMMENT '用户名',
  `password`    VARCHAR(128) NOT NULL                COMMENT '密码(BCrypt加密)',
  `role`        VARCHAR(20)  NOT NULL DEFAULT 'operator' COMMENT '角色(super/operator)',
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- ============================================================
-- 3. 停车场表
-- ============================================================
CREATE TABLE `parking_lot` (
  `id`              BIGINT        NOT NULL AUTO_INCREMENT COMMENT '停车场ID',
  `name`            VARCHAR(100)  NOT NULL                COMMENT '名称',
  `address`         VARCHAR(255)  NOT NULL                COMMENT '地址',
  `longitude`       DECIMAL(10,7) NOT NULL DEFAULT 0      COMMENT '经度',
  `latitude`        DECIMAL(10,7) NOT NULL DEFAULT 0      COMMENT '纬度',
  `total_spots`     INT           NOT NULL DEFAULT 0      COMMENT '总车位数',
  `available_spots` INT           NOT NULL DEFAULT 0      COMMENT '可用车位数(缓存同步)',
  `hourly_rate`     DECIMAL(10,2) NOT NULL DEFAULT 10.00  COMMENT '每小时费率(元)',
  `image_url`       VARCHAR(255)  NOT NULL DEFAULT ''     COMMENT '图片URL',
  `status`          TINYINT       NOT NULL DEFAULT 1      COMMENT '状态:0-关闭 1-营业',
  `create_time`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_location` (`longitude`, `latitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='停车场表';

-- ============================================================
-- 4. 车位表(元数据,实时状态存于Redis Bitmap)
-- ============================================================
CREATE TABLE `parking_spot` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '车位ID(作为Bitmap offset)',
  `lot_id`      BIGINT      NOT NULL                COMMENT '所属停车场ID',
  `spot_number` VARCHAR(10) NOT NULL                COMMENT '车位编号(如A01)',
  `type`        TINYINT     NOT NULL DEFAULT 0      COMMENT '类型:0-标准 1-大型 2-充电桩',
  `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lot_spot` (`lot_id`, `spot_number`),
  INDEX `idx_lot_id` (`lot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车位表(元数据,状态存Redis Bitmap)';

-- ============================================================
-- 5. 车辆信息表
-- ============================================================
CREATE TABLE `vehicle` (
  `id`           BIGINT      NOT NULL AUTO_INCREMENT COMMENT '车辆ID',
  `user_id`      BIGINT      NOT NULL                COMMENT '用户ID',
  `plate_number` VARCHAR(20) NOT NULL                COMMENT '车牌号',
  `brand`        VARCHAR(50) NOT NULL DEFAULT ''     COMMENT '品牌型号',
  `color`        VARCHAR(20) NOT NULL DEFAULT ''     COMMENT '颜色',
  `create_time`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车辆信息表';

-- ============================================================
-- 6. 订单表(order为MySQL保留字,使用parking_order)
-- ============================================================
CREATE TABLE `parking_order` (
  `id`           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no`     VARCHAR(32)   NOT NULL                COMMENT '订单号(唯一)',
  `user_id`      BIGINT        NOT NULL                COMMENT '用户ID',
  `lot_id`       BIGINT        NOT NULL                COMMENT '停车场ID',
  `spot_id`      BIGINT        NOT NULL                COMMENT '车位ID',
  `plate_number` VARCHAR(20)   NOT NULL                COMMENT '车牌号',
  `status`       TINYINT       NOT NULL DEFAULT 0      COMMENT '状态:0-已预约 1-进行中 2-已结算 3-已取消',
  `start_time`   DATETIME      NULL                    COMMENT '入场时间',
  `end_time`     DATETIME      NULL                    COMMENT '出场时间',
  `amount`       DECIMAL(10,2) NOT NULL DEFAULT 0.00   COMMENT '原金额',
  `coupon_id`    BIGINT        NULL                    COMMENT '使用的优惠券ID',
  `discount`     DECIMAL(10,2) NOT NULL DEFAULT 0.00   COMMENT '优惠金额',
  `create_time`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_lot_id` (`lot_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- ============================================================
-- 7. 消息表
-- ============================================================
CREATE TABLE `message` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `user_id`     BIGINT       NOT NULL                COMMENT '用户ID',
  `title`       VARCHAR(100) NOT NULL                COMMENT '标题',
  `content`     VARCHAR(500) NOT NULL                COMMENT '内容',
  `type`        TINYINT      NOT NULL DEFAULT 0      COMMENT '类型:0-预约 1-入场 2-结算 3-系统',
  `is_read`     TINYINT      NOT NULL DEFAULT 0      COMMENT '是否已读:0-未读 1-已读',
  `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表';

-- ============================================================
-- 8. 优惠券模板表
-- ============================================================
CREATE TABLE `coupon` (
  `id`              BIGINT        NOT NULL AUTO_INCREMENT COMMENT '优惠券ID',
  `name`            VARCHAR(50)   NOT NULL                COMMENT '名称',
  `description`     VARCHAR(200)  NOT NULL DEFAULT ''     COMMENT '描述',
  `discount_amount` DECIMAL(10,2) NOT NULL                COMMENT '优惠金额',
  `min_amount`      DECIMAL(10,2) NOT NULL DEFAULT 0.00   COMMENT '最低使用金额',
  `type`            TINYINT       NOT NULL DEFAULT 0      COMMENT '类型:0-普通 1-秒杀',
  `stock`           INT           NOT NULL DEFAULT 0      COMMENT '总库存',
  `remain_stock`    INT           NOT NULL DEFAULT 0      COMMENT '剩余库存',
  `start_time`      DATETIME      NOT NULL                COMMENT '生效时间',
  `end_time`        DATETIME      NOT NULL                COMMENT '失效时间',
  `create_time`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_time` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优惠券模板表';

-- ============================================================
-- 9. 用户优惠券表
-- ============================================================
CREATE TABLE `user_coupon` (
  `id`          BIGINT        NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id`     BIGINT        NOT NULL                COMMENT '用户ID',
  `coupon_id`   BIGINT        NOT NULL                COMMENT '优惠券ID',
  `status`      TINYINT       NOT NULL DEFAULT 0      COMMENT '状态:0-未使用 1-已使用 2-已过期',
  `create_time` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',
  `use_time`    DATETIME      NULL                    COMMENT '使用时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_user_status` (`user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户优惠券表';

-- ============================================================
-- 10. 钱包表
-- ============================================================
CREATE TABLE `wallet` (
  `id`          BIGINT        NOT NULL AUTO_INCREMENT COMMENT '钱包ID',
  `user_id`     BIGINT        NOT NULL                COMMENT '用户ID',
  `balance`     DECIMAL(10,2) NOT NULL DEFAULT 0.00   COMMENT '余额',
  `create_time` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钱包表';

-- ============================================================
-- 11. 钱包流水表
-- ============================================================
CREATE TABLE `wallet_log` (
  `id`          BIGINT        NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `wallet_id`   BIGINT        NOT NULL                COMMENT '钱包ID',
  `amount`      DECIMAL(10,2) NOT NULL                COMMENT '变动金额(正=收入 负=支出)',
  `type`        TINYINT       NOT NULL                COMMENT '类型:0-充值 1-支付',
  `remark`      VARCHAR(200)  NOT NULL DEFAULT ''     COMMENT '备注',
  `create_time` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_wallet_id` (`wallet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钱包流水表';

-- ============================================================
-- 初始化数据
-- ============================================================

-- 默认管理员(密码均为: 123456, BCrypt加密)
INSERT INTO `admin` (`username`, `password`, `role`) VALUES
('admin',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'super'),
('operator', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'operator');

-- 默认用户
INSERT INTO `user` (`username`, `password`, `phone`) VALUES
('张三', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '13800138000'),
('李四', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '13800138001'),
('王五', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '13800138002');

-- 默认用户钱包
INSERT INTO `wallet` (`user_id`, `balance`) VALUES
(1, 128.50),
(2, 56.00),
(3, 200.00);

-- 默认车辆
INSERT INTO `vehicle` (`user_id`, `plate_number`, `brand`, `color`) VALUES
(1, '粤B·88888', '特斯拉 Model 3', '白色'),
(1, '粤B·12345', '比亚迪 汉', '黑色'),
(2, '粤B·66666', '宝马 X3', '白色'),
(3, '粤B·77777', '奥迪 A6L', '黑色');

-- 默认停车场
INSERT INTO `parking_lot` (`name`, `address`, `longitude`, `latitude`, `total_spots`, `available_spots`, `hourly_rate`, `status`) VALUES
('科技园停车场',   '南山区科技南路100号', 113.9530000, 22.5410000, 100, 45, 10.00, 1),
('万象天地停车场', '南山区深南大道200号', 113.9610000, 22.5310000,  50, 12, 12.00, 1),
('华强北停车场',   '福田区华强北路50号',  114.0820000, 22.5420000,  80, 33,  8.00, 1),
('海岸城停车场',   '南山区文心五路33号',  113.9410000, 22.5210000, 120,  8, 15.00, 1),
('车公庙停车场',   '福田区泰然九路',      114.0210000, 22.5310000,  60, 27, 10.00, 1),
('市民中心停车场', '福田区福中三路',      114.0610000, 22.5510000, 200,  0,  6.00, 1);

-- 默认车位(每个停车场40个车位,4排×10列)
-- 科技园停车场 lot_id=1
INSERT INTO `parking_spot` (`lot_id`, `spot_number`, `type`) VALUES
(1, 'A01', 2), (1, 'A02', 2), (1, 'A03', 0), (1, 'A04', 0), (1, 'A05', 0),
(1, 'A06', 0), (1, 'A07', 0), (1, 'A08', 0), (1, 'A09', 1), (1, 'A10', 1),
(1, 'B01', 2), (1, 'B02', 2), (1, 'B03', 0), (1, 'B04', 0), (1, 'B05', 0),
(1, 'B06', 0), (1, 'B07', 0), (1, 'B08', 0), (1, 'B09', 1), (1, 'B10', 1),
(1, 'C01', 0), (1, 'C02', 0), (1, 'C03', 0), (1, 'C04', 0), (1, 'C05', 0),
(1, 'C06', 0), (1, 'C07', 0), (1, 'C08', 0), (1, 'C09', 0), (1, 'C10', 0),
(1, 'D01', 2), (1, 'D02', 2), (1, 'D03', 0), (1, 'D04', 0), (1, 'D05', 0),
(1, 'D06', 0), (1, 'D07', 0), (1, 'D08', 0), (1, 'D09', 1), (1, 'D10', 1);

-- 万象天地停车场 lot_id=2
INSERT INTO `parking_spot` (`lot_id`, `spot_number`, `type`) VALUES
(2, 'A01', 2), (2, 'A02', 2), (2, 'A03', 0), (2, 'A04', 0), (2, 'A05', 0),
(2, 'A06', 0), (2, 'A07', 0), (2, 'A08', 0), (2, 'A09', 1), (2, 'A10', 1),
(2, 'B01', 0), (2, 'B02', 0), (2, 'B03', 0), (2, 'B04', 0), (2, 'B05', 0),
(2, 'B06', 0), (2, 'B07', 0), (2, 'B08', 0), (2, 'B09', 0), (2, 'B10', 0),
(2, 'C01', 2), (2, 'C02', 2), (2, 'C03', 0), (2, 'C04', 0), (2, 'C05', 0),
(2, 'C06', 0), (2, 'C07', 0), (2, 'C08', 0), (2, 'C09', 1), (2, 'C10', 1),
(2, 'D01', 0), (2, 'D02', 0), (2, 'D03', 0), (2, 'D04', 0), (2, 'D05', 0),
(2, 'D06', 0), (2, 'D07', 0), (2, 'D08', 0), (2, 'D09', 0), (2, 'D10', 0);

-- 华强北停车场 lot_id=3
INSERT INTO `parking_spot` (`lot_id`, `spot_number`, `type`) VALUES
(3, 'A01', 0), (3, 'A02', 0), (3, 'A03', 0), (3, 'A04', 0), (3, 'A05', 0),
(3, 'A06', 0), (3, 'A07', 0), (3, 'A08', 0), (3, 'A09', 0), (3, 'A10', 0),
(3, 'B01', 2), (3, 'B02', 2), (3, 'B03', 0), (3, 'B04', 0), (3, 'B05', 0),
(3, 'B06', 0), (3, 'B07', 0), (3, 'B08', 0), (3, 'B09', 1), (3, 'B10', 1),
(3, 'C01', 0), (3, 'C02', 0), (3, 'C03', 0), (3, 'C04', 0), (3, 'C05', 0),
(3, 'C06', 0), (3, 'C07', 0), (3, 'C08', 0), (3, 'C09', 0), (3, 'C10', 0),
(3, 'D01', 0), (3, 'D02', 0), (3, 'D03', 0), (3, 'D04', 0), (3, 'D05', 0),
(3, 'D06', 0), (3, 'D07', 0), (3, 'D08', 0), (3, 'D09', 0), (3, 'D10', 0);

-- 海岸城停车场 lot_id=4
INSERT INTO `parking_spot` (`lot_id`, `spot_number`, `type`) VALUES
(4, 'A01', 2), (4, 'A02', 2), (4, 'A03', 0), (4, 'A04', 0), (4, 'A05', 0),
(4, 'A06', 0), (4, 'A07', 0), (4, 'A08', 0), (4, 'A09', 1), (4, 'A10', 1),
(4, 'B01', 2), (4, 'B02', 2), (4, 'B03', 0), (4, 'B04', 0), (4, 'B05', 0),
(4, 'B06', 0), (4, 'B07', 0), (4, 'B08', 0), (4, 'B09', 1), (4, 'B10', 1),
(4, 'C01', 0), (4, 'C02', 0), (4, 'C03', 0), (4, 'C04', 0), (4, 'C05', 0),
(4, 'C06', 0), (4, 'C07', 0), (4, 'C08', 0), (4, 'C09', 0), (4, 'C10', 0),
(4, 'D01', 0), (4, 'D02', 0), (4, 'D03', 0), (4, 'D04', 0), (4, 'D05', 0),
(4, 'D06', 0), (4, 'D07', 0), (4, 'D08', 0), (4, 'D09', 0), (4, 'D10', 0);

-- 车公庙停车场 lot_id=5
INSERT INTO `parking_spot` (`lot_id`, `spot_number`, `type`) VALUES
(5, 'A01', 0), (5, 'A02', 0), (5, 'A03', 0), (5, 'A04', 0), (5, 'A05', 0),
(5, 'A06', 1), (5, 'A07', 1), (5, 'A08', 1), (5, 'A09', 1), (5, 'A10', 1),
(5, 'B01', 2), (5, 'B02', 2), (5, 'B03', 0), (5, 'B04', 0), (5, 'B05', 0),
(5, 'B06', 0), (5, 'B07', 0), (5, 'B08', 0), (5, 'B09', 0), (5, 'B10', 0),
(5, 'C01', 0), (5, 'C02', 0), (5, 'C03', 0), (5, 'C04', 0), (5, 'C05', 0),
(5, 'C06', 0), (5, 'C07', 0), (5, 'C08', 0), (5, 'C09', 0), (5, 'C10', 0),
(5, 'D01', 2), (5, 'D02', 2), (5, 'D03', 0), (5, 'D04', 0), (5, 'D05', 0),
(5, 'D06', 0), (5, 'D07', 0), (5, 'D08', 0), (5, 'D09', 0), (5, 'D10', 0);

-- 市民中心停车场 lot_id=6
INSERT INTO `parking_spot` (`lot_id`, `spot_number`, `type`) VALUES
(6, 'A01', 2), (6, 'A02', 2), (6, 'A03', 2), (6, 'A04', 2), (6, 'A05', 0),
(6, 'A06', 0), (6, 'A07', 0), (6, 'A08', 0), (6, 'A09', 0), (6, 'A10', 0),
(6, 'B01', 0), (6, 'B02', 0), (6, 'B03', 0), (6, 'B04', 0), (6, 'B05', 0),
(6, 'B06', 0), (6, 'B07', 0), (6, 'B08', 0), (6, 'B09', 0), (6, 'B10', 0),
(6, 'C01', 0), (6, 'C02', 0), (6, 'C03', 0), (6, 'C04', 0), (6, 'C05', 0),
(6, 'C06', 0), (6, 'C07', 0), (6, 'C08', 0), (6, 'C09', 0), (6, 'C10', 0),
(6, 'D01', 1), (6, 'D02', 1), (6, 'D03', 1), (6, 'D04', 1), (6, 'D05', 1),
(6, 'D06', 1), (6, 'D07', 1), (6, 'D08', 1), (6, 'D09', 1), (6, 'D10', 1);

-- 默认优惠券
INSERT INTO `coupon` (`name`, `description`, `discount_amount`, `min_amount`, `type`, `stock`, `remain_stock`, `start_time`, `end_time`) VALUES
('新用户专享',     '满10减5停车优惠券',      5,  10,  0, 100,  88, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
('周末特惠',       '满20减8停车优惠券',      8,  20,  0,  50,  32, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
('秒杀-1折停车',   '全场1折停车最高减50元', 50,   1,  1,  10,   2, '2026-06-01 00:00:00', '2026-12-31 23:59:59'),
('满30减10',       '满30减10停车优惠',      10, 30,  0, 200, 145, '2026-06-15 00:00:00', '2026-08-15 23:59:59');
