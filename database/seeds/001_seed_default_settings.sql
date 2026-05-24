/**
 * 默认系统配置脚本
 * 用于部署或人工初始化时参考
 */

insert into settings(key, value) values
  ('user', 'admin'),
  ('pass', 'admin'),
  ('notifyUrl', ''),
  ('returnUrl', ''),
  ('key', '__RUNTIME_GENERATED__'),
  ('lastheart', '0'),
  ('lastpay', '0'),
  ('jkstate', '-1'),
  ('close', '5'),
  ('payQf', '1'),
  ('wxpay', ''),
  ('zfbpay', '')
on conflict (key) do nothing;
