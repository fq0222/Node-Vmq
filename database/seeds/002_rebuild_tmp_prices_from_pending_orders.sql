/**
 * tmp_prices 重建脚本
 * 用于从待支付订单重新生成金额占位数据
 */

insert into tmp_prices(price_key, created_at)
select
  concat(type, '-', to_char(really_price, 'FM999999999999990.00')) as price_key,
  create_date as created_at
from pay_orders
where state = 0
on conflict (price_key) do nothing;
