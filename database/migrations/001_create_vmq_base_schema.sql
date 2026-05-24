/**
 * TP-02 基础数据库结构脚本
 * 负责创建 Node-Vmq 当前阶段需要的核心表和索引
 */

create table if not exists settings (
  key varchar(64) primary key,
  value text not null
);

create table if not exists pay_orders (
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

create table if not exists pay_qrcodes (
  id bigserial primary key,
  pay_url text not null,
  price numeric(18,2) not null,
  type smallint not null
);

create table if not exists tmp_prices (
  price_key varchar(64) primary key,
  created_at bigint not null default 0
);

create unique index if not exists uq_pay_orders_order_id on pay_orders(order_id);
create unique index if not exists uq_pay_orders_pay_id on pay_orders(pay_id);

create index if not exists idx_pay_orders_state on pay_orders(state);
create index if not exists idx_pay_orders_type on pay_orders(type);
create index if not exists idx_pay_orders_create_date on pay_orders(create_date);
create index if not exists idx_pay_orders_close_date on pay_orders(close_date);
create index if not exists idx_pay_orders_type_state_really_price on pay_orders(type, state, really_price);
create index if not exists idx_pay_orders_pay_date on pay_orders(pay_date);

create index if not exists idx_pay_qrcodes_type on pay_qrcodes(type);
create index if not exists idx_pay_qrcodes_type_price on pay_qrcodes(type, price);
