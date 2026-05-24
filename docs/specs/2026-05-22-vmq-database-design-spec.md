# Vmq 重构数据库表结构设计文档

## 1. 文档目标

本文档定义 Vmq 从 H2 迁移到 PostgreSQL 后的数据库设计方案，目标是：

- 完整承载原系统业务逻辑
- 保持旧字段语义不变
- 为 Node.js + Express 服务提供清晰的数据边界
- 为后续迁移、测试、上线切换提供依据

本次设计范围仅覆盖当前服务端与 Web 管理后台需要的核心表，不扩展多租户、多商户、权限系统等新模型。

## 2. 设计原则

## 2.1 逻辑保真优先

数据库结构首先服务于“逻辑不变”，而不是纯粹追求范式优化。

必须保留的核心语义：

- 订单状态定义
- `price` 与 `reallyPrice` 区分
- 固定二维码与通用二维码并存
- 金额占位机制
- 监控端状态配置项
- 毫秒时间戳存储习惯

## 2.2 兼容优先于抽象

原系统使用键值配置表保存大量系统设置。重构后虽然可以设计为结构化配置表，但为了兼容和迁移简洁，本次仍保留键值配置表模型。

## 2.3 并发安全优先

金额占位是整个系统最容易因数据库设计失误而改坏逻辑的部分，因此：

- 必须通过唯一约束保障占位唯一性
- 必须让事务可以明确判断“占位成功/失败”

## 2.4 精度清晰

涉及金额字段时不能直接依赖浮点语义。PostgreSQL 中必须使用定点数。

## 3. 数据库选型与命名规范

## 3.1 数据库

- PostgreSQL 15+ 推荐

## 3.2 Schema

- 默认使用 `public`

## 3.3 表命名

采用小写下划线命名：

- `settings`
- `pay_orders`
- `pay_qrcodes`
- `tmp_prices`

## 3.4 字段命名

- 表字段采用 `snake_case`
- 应用层 DTO 可继续适配旧接口中的驼峰字段名

例如：

- 数据库字段：`order_id`
- API 返回字段：`orderId`

## 4. 核心表总览

## 4.1 表清单

| 表名 | 作用 |
|---|---|
| `settings` | 系统配置、监控状态、默认回调地址、默认二维码等 |
| `pay_orders` | 支付订单主表 |
| `pay_qrcodes` | 固定金额二维码表 |
| `tmp_prices` | 金额占位表 |

## 4.2 表关系概览

- `settings`：独立键值配置表
- `pay_orders`：核心业务表
- `pay_qrcodes`：按金额和支付方式匹配
- `tmp_prices`：按支付方式和金额保存临时占位

本次结构中不强制外键关联到 `settings`，因为其本质是系统级配置表。

## 5. 表设计详解

## 5.1 `settings`

### 作用

保存系统初始化设置、后台管理员账号、通知地址、监控端状态等。

### 建表建议

```sql
create table settings (
  key varchar(64) primary key,
  value text not null
);
```

### 字段说明

| 字段 | 类型 | 非空 | 说明 |
|---|---|---:|---|
| `key` | `varchar(64)` | 是 | 配置键 |
| `value` | `text` | 是 | 配置值 |

### 关键配置项

| key | 默认值 | 说明 |
|---|---|---|
| `user` | `admin` | 后台账号 |
| `pass` | `admin` | 后台密码 |
| `notifyUrl` | `` | 默认异步通知地址 |
| `returnUrl` | `` | 默认同步跳转地址 |
| `key` | 启动时生成 | 通讯密钥 |
| `lastheart` | `0` | 最后心跳时间 |
| `lastpay` | `0` | 最后收款时间 |
| `jkstate` | `-1` | 监控端状态 |
| `close` | `5` | 订单超时分钟数 |
| `payQf` | `1` | 金额区分方式 |
| `wxpay` | `` | 微信通用二维码内容 |
| `zfbpay` | `` | 支付宝通用二维码内容 |

### 设计说明

- 保持键值形式最容易兼容旧逻辑
- `value` 统一存字符串，应用层负责解析为数字或时间戳
- 不建议在数据库层对配置值做复杂类型约束，以避免影响旧行为

## 5.2 `pay_orders`

### 作用

保存订单的完整生命周期信息。

### 建表建议

```sql
create table pay_orders (
  id bigserial primary key,
  order_id varchar(64) not null,
  pay_id varchar(128) not null,
  create_date bigint not null,
  pay_date bigint not null default 0,
  close_date bigint not null default 0,
  param text not null default '',
  type smallint not null,
  price numeric(18,2) not null,
  really_price numeric(18,2) not null,
  notify_url text not null default '',
  return_url text not null default '',
  state smallint not null,
  is_auto smallint not null,
  pay_url text not null default ''
);
```

### 字段说明

| 字段 | 类型 | 非空 | 默认值 | 说明 |
|---|---|---:|---|---|
| `id` | `bigserial` | 是 | 自增 | 主键 |
| `order_id` | `varchar(64)` | 是 |  | 平台订单号 |
| `pay_id` | `varchar(128)` | 是 |  | 商户订单号 |
| `create_date` | `bigint` | 是 |  | 创建时间戳，毫秒 |
| `pay_date` | `bigint` | 是 | `0` | 支付时间戳，毫秒 |
| `close_date` | `bigint` | 是 | `0` | 关闭时间戳，毫秒 |
| `param` | `text` | 是 | `''` | 商户自定义参数 |
| `type` | `smallint` | 是 |  | 支付方式，1/2 |
| `price` | `numeric(18,2)` | 是 |  | 订单原始金额 |
| `really_price` | `numeric(18,2)` | 是 |  | 实际支付金额 |
| `notify_url` | `text` | 是 | `''` | 订单级异步回调地址 |
| `return_url` | `text` | 是 | `''` | 订单级同步跳转地址 |
| `state` | `smallint` | 是 |  | 订单状态 |
| `is_auto` | `smallint` | 是 |  | 1 通用码，0 固定金额码 |
| `pay_url` | `text` | 是 | `''` | 二维码内容 |

### 状态定义

| state | 说明 |
|---:|---|
| `-1` | 已过期 |
| `0` | 待支付 |
| `1` | 已支付 |
| `2` | 已支付但异步通知失败 |

### 设计说明

- `price` 与 `really_price` 必须分开存储
- `pay_date`、`close_date` 默认 `0`，保持旧系统语义
- `param`、`notify_url`、`return_url`、`pay_url` 默认空字符串，减少空值分支

## 5.3 `pay_qrcodes`

### 作用

保存固定金额二维码，用于优先匹配特定金额。

### 建表建议

```sql
create table pay_qrcodes (
  id bigserial primary key,
  pay_url text not null,
  price numeric(18,2) not null,
  type smallint not null
);
```

### 字段说明

| 字段 | 类型 | 非空 | 说明 |
|---|---|---:|---|
| `id` | `bigserial` | 是 | 主键 |
| `pay_url` | `text` | 是 | 二维码内容 |
| `price` | `numeric(18,2)` | 是 | 固定金额 |
| `type` | `smallint` | 是 | 支付方式，1/2 |

### 设计说明

- 原系统允许同一金额和类型下只取一条匹配记录
- 后续实现阶段建议在应用层避免重复插入
- 若希望更保守，可增加唯一约束：`(type, price, pay_url)`

## 5.4 `tmp_prices`

### 作用

保存当前已被占用的“支付方式 + 实际金额”组合，用于避免金额冲突。

### 建表建议

```sql
create table tmp_prices (
  price_key varchar(64) primary key,
  created_at bigint not null default 0
);
```

### 字段说明

| 字段 | 类型 | 非空 | 默认值 | 说明 |
|---|---|---:|---|---|
| `price_key` | `varchar(64)` | 是 |  | 唯一占位键，格式为 `type-reallyPrice` |
| `created_at` | `bigint` | 是 | `0` | 占位创建时间戳，便于排查问题 |

### 设计说明

- 旧系统只存一个 `price` 字符串主键
- 为避免语义混淆，数据库字段建议明确命名为 `price_key`
- 但应用层仍按旧格式构造值，例如：
  - `1-12.50`
  - `2-12.51`

### 为什么必须保留独立占位表

虽然也可以通过查询待支付订单来判断金额是否已占用，但原系统明确使用独立占位表，这带来两个兼容收益：

- 更接近旧逻辑
- 更容易做并发写入竞争控制

## 6. 索引与唯一约束设计

## 6.1 `settings`

主键即可：

```sql
alter table settings add primary key (key);
```

## 6.2 `pay_orders`

### 必备约束

```sql
create unique index uq_pay_orders_order_id on pay_orders(order_id);
create unique index uq_pay_orders_pay_id on pay_orders(pay_id);
```

### 查询索引

```sql
create index idx_pay_orders_state on pay_orders(state);
create index idx_pay_orders_type on pay_orders(type);
create index idx_pay_orders_create_date on pay_orders(create_date);
create index idx_pay_orders_close_date on pay_orders(close_date);
create index idx_pay_orders_type_state_really_price on pay_orders(type, state, really_price);
create index idx_pay_orders_pay_date on pay_orders(pay_date);
```

### 说明

- `order_id` 唯一：保证平台订单唯一
- `pay_id` 唯一：保持旧系统“商户订单号不可重复”
- `(type, state, really_price)` 复合索引：用于 `appPush` 快速匹配待支付订单

## 6.3 `pay_qrcodes`

```sql
create index idx_pay_qrcodes_type on pay_qrcodes(type);
create index idx_pay_qrcodes_type_price on pay_qrcodes(type, price);
```

## 6.4 `tmp_prices`

主键即唯一约束：

```sql
alter table tmp_prices add primary key (price_key);
```

## 7. 金额字段设计

## 7.1 类型选择

所有金额统一使用：

```sql
numeric(18,2)
```

## 7.2 原因

- 避免 JavaScript 浮点误差直接渗透到数据库
- 与 `0.01` 递增/递减规则匹配
- 支持后续统计求和

## 7.3 应用层要求

后端应用中必须统一金额处理策略：

- 入库前规范为两位小数
- 步进时使用精确计算，不允许裸 `number + 0.01`
- 生成 `price_key` 时必须使用标准化字符串，如 `12.50`

## 8. 时间字段设计

## 8.1 存储方式

继续采用毫秒时间戳 `bigint` 存储，不直接改为 `timestamp`。

## 8.2 原因

- 与旧系统保持一致
- 避免迁移时额外时区转换风险
- 与现有接口直接兼容

## 8.3 关键字段

- `create_date`
- `pay_date`
- `close_date`
- `tmp_prices.created_at`
- `settings.lastheart`
- `settings.lastpay`

## 9. H2 到 PostgreSQL 字段映射

## 9.1 `setting` -> `settings`

| H2 字段 | PostgreSQL 字段 | 说明 |
|---|---|---|
| `vkey` | `key` | 配置键 |
| `vvalue` | `value` | 配置值 |

## 9.2 `pay_order` -> `pay_orders`

| H2 字段 | PostgreSQL 字段 |
|---|---|
| `id` | `id` |
| `order_id` | `order_id` |
| `pay_id` | `pay_id` |
| `create_date` | `create_date` |
| `pay_date` | `pay_date` |
| `close_date` | `close_date` |
| `param` | `param` |
| `type` | `type` |
| `price` | `price` |
| `really_price` | `really_price` |
| `notify_url` | `notify_url` |
| `return_url` | `return_url` |
| `state` | `state` |
| `is_auto` | `is_auto` |
| `pay_url` | `pay_url` |

## 9.3 `pay_qrcode` -> `pay_qrcodes`

| H2 字段 | PostgreSQL 字段 |
|---|---|
| `id` | `id` |
| `pay_url` | `pay_url` |
| `price` | `price` |
| `type` | `type` |

## 9.4 `tmp_price` -> `tmp_prices`

| H2 字段 | PostgreSQL 字段 | 说明 |
|---|---|---|
| `price` | `price_key` | 原系统字符串主键 |

## 10. 初始化数据设计

## 10.1 首次启动默认数据

首次启动时，若 `settings` 为空，则插入：

```json
[
  { "key": "user", "value": "admin" },
  { "key": "pass", "value": "admin" },
  { "key": "notifyUrl", "value": "" },
  { "key": "returnUrl", "value": "" },
  { "key": "key", "value": "<运行时生成md5>" },
  { "key": "lastheart", "value": "0" },
  { "key": "lastpay", "value": "0" },
  { "key": "jkstate", "value": "-1" },
  { "key": "close", "value": "5" },
  { "key": "payQf", "value": "1" },
  { "key": "wxpay", "value": "" },
  { "key": "zfbpay", "value": "" }
]
```

## 10.2 初始化原则

- 仅当配置表为空时初始化
- 已存在数据时不得覆盖
- 默认值必须与旧系统一致

## 11. 典型查询与数据库支撑

## 11.1 创建订单时检查商户订单号

```sql
select id
from pay_orders
where pay_id = $1
limit 1;
```

## 11.2 插入金额占位

```sql
insert into tmp_prices (price_key, created_at)
values ($1, $2);
```

若主键冲突，则表示金额已被占用。

## 11.3 固定二维码匹配

```sql
select id, pay_url, price, type
from pay_qrcodes
where type = $1 and price = $2
order by id asc
limit 1;
```

## 11.4 `appPush` 匹配订单

```sql
select *
from pay_orders
where really_price = $1
  and state = 0
  and type = $2
order by id asc
limit 1;
```

## 11.5 批量关闭超时订单

```sql
update pay_orders
set close_date = $1,
    state = -1
where create_date < $2
  and state = 0;
```

## 12. 事务设计建议

## 12.1 创建订单事务

必须放在同一事务中的动作：

1. 校验商户订单号是否重复
2. 插入金额占位
3. 写入订单

若订单写入失败，必须回滚金额占位。

## 12.2 支付完成事务

建议放在同一事务中的动作：

1. 根据 `type + really_price + state=0` 查询订单
2. 删除金额占位
3. 更新订单为已支付

回调通知可放在事务外执行，但订单状态变更必须先稳定落库。

## 12.3 关闭订单事务

建议放在同一事务中的动作：

1. 校验订单状态
2. 更新订单为已关闭
3. 删除金额占位

## 13. 迁移策略建议

## 13.1 一次性迁移顺序

1. 创建 PostgreSQL 表结构
2. 导出 H2 配置表
3. 导出订单表
4. 导出固定二维码表
5. 清空或重建金额占位表
6. 校验配置项与订单总量

## 13.2 关于 `tmp_prices`

`tmp_prices` 是运行时临时状态，迁移时不建议照搬历史数据。更稳妥的方案是：

- 清空后重建
- 启动服务前，若有待支付订单，可通过脚本按 `type-reallyPrice` 重新生成占位

## 13.3 数据校验项

- `settings` 键数量是否完整
- `pay_orders` 总数是否一致
- `state=0/1/2/-1` 各状态数量是否一致
- `pay_qrcodes` 数量是否一致
- 关键配置项值是否正确

## 14. 可选增强，但本期不落地

以下增强可以留待后续版本，不纳入本次重构刚需：

- 将 `settings` 结构化拆表
- 为订单增加审计日志表
- 为回调增加独立记录表
- 为无订单转账增加独立表
- 为支付通知增加重试队列表

本期不要为了“更现代”而主动增加这些结构，以免影响保真目标。

## 15. 本文档结论

本次数据库设计的核心不是“建几张表”，而是确保以下四件事不变：

1. 订单生命周期不变
2. 金额占位算法不变
3. 回调与监控端兼容性不变
4. 默认配置与后台能力不变

按本文档落地后，后续实现阶段就可以在 PostgreSQL 上稳定承接原系统逻辑，同时保留足够清晰的边界，方便继续拆解为 migration、repository、service 和测试任务。
