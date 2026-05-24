# Vmq 重构接口兼容详细文档

## 1. 文档目标

本文档定义 Vmq 重构后的接口兼容要求，覆盖：

- 公共支付接口
- 监控端对接接口
- 后台管理接口
- 二维码工具接口

文档目标不是重新设计协议，而是明确“新系统必须如何表现，才能兼容旧系统逻辑与调用方式”。

## 2. 通用约定

## 2.1 基础说明

- 默认协议：HTTP/HTTPS
- 默认返回：`application/json`
- 特殊情况：
  - `/enQrcode` 返回图片流
  - `/createOrder` 在 `isHtml=1` 时返回 HTML 跳转脚本
- 兼容旧项目，接口允许 `GET` 和 `POST` 混用的部分，重构后建议仍兼容

## 2.2 通用响应结构

大部分接口采用统一结构：

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

字段说明：

- `code`：`1` 表示成功，负值表示失败
- `msg`：结果说明
- `data`：接口返回数据，失败时通常为 `null`

## 2.3 分页响应结构

后台列表接口使用分页结构：

```json
{
  "code": 0,
  "msg": "",
  "count": 2,
  "data": []
}
```

字段说明：

- `code`：分页列表成功时通常为前端表格兼容值
- `msg`：消息
- `count`：总条数
- `data`：当前页数据

## 2.4 时间字段约定

所有时间字段保持毫秒时间戳语义，例如：

```json
{
  "createDate": 1716379200000
}
```

## 2.5 支付方式约定

- `1`：微信
- `2`：支付宝

## 2.6 订单状态约定

- `-1`：已过期
- `0`：待支付
- `1`：已支付
- `2`：已支付但异步通知失败

## 3. 对外公共接口

## 3.1 创建订单

### 接口

- 路径：`/createOrder`
- 方法：`GET` / `POST`

### 说明

创建支付订单，返回订单信息；当 `isHtml=1` 时直接返回跳转支付页的 HTML。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `payId` | string | 是 | 商户订单号，必须唯一 |
| `param` | string | 否 | 商户自定义参数，原样带回回调 |
| `type` | number | 是 | 支付方式，`1` 微信，`2` 支付宝 |
| `price` | string | 是 | 订单金额 |
| `notifyUrl` | string | 否 | 异步通知地址，空时用系统配置 |
| `returnUrl` | string | 否 | 同步跳转地址，空时用系统配置 |
| `sign` | string | 是 | 签名 |
| `isHtml` | number | 否 | `0` 返回 JSON，`1` 返回 HTML 跳转 |

### 签名规则

```text
md5(payId + param + type + price + key)
```

若 `param` 为空，则按空字符串参与签名。

### 表单请求示例

```json
{
  "payId": "ORDER_202605220001",
  "param": "user_1001",
  "type": 2,
  "price": "12.50",
  "notifyUrl": "https://merchant.example.com/payment/notify",
  "returnUrl": "https://merchant.example.com/payment/return",
  "sign": "0e2f4d6d0d50c99d5322e0f5b1f3a8f2",
  "isHtml": 0
}
```

### QueryString 请求示例

```text
/createOrder?payId=ORDER_202605220001&param=user_1001&type=2&price=12.50&notifyUrl=https://merchant.example.com/payment/notify&returnUrl=https://merchant.example.com/payment/return&sign=0e2f4d6d0d50c99d5322e0f5b1f3a8f2&isHtml=0
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": {
    "payId": "ORDER_202605220001",
    "orderId": "202605221430159876",
    "payType": 2,
    "price": 12.5,
    "reallyPrice": 12.51,
    "payUrl": "HTTPS://QR.ALIPAY.COM/FKX000000000000000000",
    "isAuto": 1,
    "state": 0,
    "timeOut": 5,
    "date": 1779431415000
  }
}
```

### 失败响应示例

签名错误：

```json
{
  "code": -1,
  "msg": "签名校验不通过",
  "data": null
}
```

商户订单号重复：

```json
{
  "code": -1,
  "msg": "商户订单号已存在",
  "data": null
}
```

### `isHtml=1` 返回示例

```html
<script>window.location.href = '/payPage/pay.html?orderId=202605221430159876'</script>
```

### 兼容要求

- 保持金额去重逻辑
- 保持 `payUrl` 选取逻辑
- 保持返回字段命名
- 保持 `payType` 字段命名，不改成 `type`

## 3.2 查询订单详情

### 接口

- 路径：`/getOrder`
- 方法：`GET` / `POST`

### 说明

根据平台订单号查询订单详情，主要供支付页使用。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `orderId` | string | 是 | 平台订单号 |

### 请求示例

```json
{
  "orderId": "202605221430159876"
}
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": {
    "payId": "ORDER_202605220001",
    "orderId": "202605221430159876",
    "payType": 2,
    "price": 12.5,
    "reallyPrice": 12.51,
    "payUrl": "HTTPS://QR.ALIPAY.COM/FKX000000000000000000",
    "isAuto": 1,
    "state": 0,
    "timeOut": 5,
    "date": 1779431415000
  }
}
```

### 失败响应示例

```json
{
  "code": -1,
  "msg": "云端订单编号不存在",
  "data": null
}
```

## 3.3 查询订单支付状态

### 接口

- 路径：`/checkOrder`
- 方法：`GET` / `POST`

### 说明

轮询订单支付状态。支付成功后返回同步跳转地址。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `orderId` | string | 是 | 平台订单号 |

### 请求示例

```json
{
  "orderId": "202605221430159876"
}
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": "https://merchant.example.com/payment/return?payId=ORDER_202605220001&param=user_1001&type=2&price=12.5&reallyPrice=12.51&sign=58aa0e6a3697408a0c10b52ef6a86697"
}
```

### 失败响应示例

待支付：

```json
{
  "code": -1,
  "msg": "订单未支付",
  "data": null
}
```

已过期：

```json
{
  "code": -1,
  "msg": "订单已过期",
  "data": null
}
```

## 3.4 关闭订单

### 接口

- 路径：`/closeOrder`
- 方法：`GET` / `POST`

### 说明

商户主动关闭待支付订单。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `orderId` | string | 是 | 平台订单号 |
| `sign` | string | 是 | 关闭签名 |

### 签名规则

```text
md5(orderId + key)
```

### 请求示例

```json
{
  "orderId": "202605221430159876",
  "sign": "a4259235d8f74b89e3abf9d5fd6bde73"
}
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

### 失败响应示例

```json
{
  "code": -1,
  "msg": "订单状态不允许关闭",
  "data": null
}
```

## 3.5 查询服务状态

### 接口

- 路径：`/getState`
- 方法：`GET` / `POST`

### 说明

供外部或监控配置页查询监控端状态。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `t` | string | 是 | 当前毫秒时间戳 |
| `sign` | string | 是 | 签名 |

### 签名规则

```text
md5(t + key)
```

### 请求示例

```json
{
  "t": "1779431415000",
  "sign": "4eb154dd0df6688f2b2e02b7d0fc4cb3"
}
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": {
    "state": "1",
    "lastheart": "1779431409000",
    "lastpay": "1779431412000"
  }
}
```

### 状态说明

- `1`：在线
- `0`：离线
- `-1`：未绑定监控端

## 4. 监控端接口

## 4.1 心跳上报

### 接口

- 路径：`/appHeart`
- 方法：`GET` / `POST`

### 说明

安卓监控端定时上报心跳。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `t` | string | 是 | 设备当前毫秒时间戳 |
| `sign` | string | 是 | 签名 |

### 签名规则

```text
md5(t + key)
```

### 请求示例

```json
{
  "t": "1779431415000",
  "sign": "4eb154dd0df6688f2b2e02b7d0fc4cb3"
}
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

### 失败响应示例

时间误差过大：

```json
{
  "code": -1,
  "msg": "客户端时间错误",
  "data": null
}
```

## 4.2 收款推送

### 接口

- 路径：`/appPush`
- 方法：`GET` / `POST`

### 说明

监控端在监听到收款通知后上报支付事件。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `type` | number | 是 | 支付方式，`1` 微信，`2` 支付宝 |
| `price` | string | 是 | 实际支付金额，对应 `reallyPrice` |
| `t` | string | 是 | 收款事件时间戳 |
| `sign` | string | 是 | 签名 |

### 签名规则

```text
md5(type + price + t + key)
```

### 请求示例

```json
{
  "type": 2,
  "price": "12.51",
  "t": "1779431415000",
  "sign": "c86af1667984fccfe64bf4a8de6d8af0"
}
```

### 成功响应示例

匹配到订单并通知成功：

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

未匹配到订单但记录为无订单转账：

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

### 失败响应示例

异步通知失败：

```json
{
  "code": -1,
  "msg": "通知异步地址失败",
  "data": null
}
```

重复推送：

```json
{
  "code": -1,
  "msg": "重复推送",
  "data": null
}
```

### 兼容注意

- 若找不到匹配订单，旧系统也会返回成功
- 这是业务兼容行为，重构后必须保留

## 5. 二维码工具接口

## 5.1 生成二维码

### 接口

- 路径：`/enQrcode`
- 方法：`GET`

### 说明

将文本内容编码为二维码 PNG 图片。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `url` | string | 是 | 二维码内容 |

### 请求示例

```text
/enQrcode?url=HTTPS://QR.ALIPAY.COM/FKX000000000000000000
```

### 响应说明

- `Content-Type: image/png`
- 返回二维码图片流

## 5.2 Base64 解码二维码

### 接口

- 路径：`/deQrcode`
- 方法：`GET` / `POST`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `base64` | string | 是 | 图片 Base64 内容 |

### 请求示例

```json
{
  "base64": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": "HTTPS://QR.ALIPAY.COM/FKX000000000000000000"
}
```

### 失败响应示例

```json
{
  "code": -1,
  "msg": "失败",
  "data": null
}
```

## 5.3 上传文件解码二维码

### 接口

- 路径：`/deQrcode2`
- 方法：`POST`
- 类型：`multipart/form-data`

### 请求字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `file` | file | 是 | 二维码图片文件 |

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": "wxp://f2f0abc1234567890"
}
```

## 6. 后台认证接口

## 6.1 登录

### 接口

- 路径：`/login`
- 方法：`POST`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `user` | string | 是 | 管理员账号 |
| `pass` | string | 是 | 管理员密码 |

### 请求示例

```json
{
  "user": "admin",
  "pass": "admin"
}
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

### 失败响应示例

```json
{
  "code": -1,
  "msg": "账号或密码不正确",
  "data": null
}
```

## 7. 后台设置接口

## 7.1 获取菜单

### 接口

- 路径：`/admin/getMenu`
- 方法：`GET` / `POST`

### 说明

旧后台动态加载菜单。新前端即使不再依赖，也建议保留兼容返回。

### 成功响应示例

```json
[
  {
    "name": "系统设置",
    "type": "url",
    "url": "admin/setting.html?t=1779431415000"
  },
  {
    "name": "监控端设置",
    "type": "url",
    "url": "admin/jk.html?t=1779431415000"
  },
  {
    "name": "微信二维码",
    "type": "menu",
    "node": [
      {
        "name": "添加",
        "type": "url",
        "url": "admin/addwxqrcode.html?t=1779431415000"
      },
      {
        "name": "管理",
        "type": "url",
        "url": "admin/wxqrcodelist.html?t=1779431415000"
      }
    ]
  }
]
```

## 7.2 获取系统设置

### 接口

- 路径：`/admin/getSettings`
- 方法：`GET` / `POST`

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": {
    "user": "admin",
    "pass": "admin",
    "notifyUrl": "https://merchant.example.com/payment/notify",
    "returnUrl": "https://merchant.example.com/payment/return",
    "key": "83d551f0b3609781a22536ca2658473d",
    "wxpay": "wxp://f2f0abc1234567890",
    "zfbpay": "HTTPS://QR.ALIPAY.COM/FKX000000000000000000",
    "close": "5",
    "payQf": "1",
    "lastheart": "1779431409000",
    "lastpay": "1779431412000",
    "jkstate": "1"
  }
}
```

## 7.3 保存系统设置

### 接口

- 路径：`/admin/saveSetting`
- 方法：`POST`

### 请求体示例

```json
{
  "user": "admin",
  "pass": "admin",
  "notifyUrl": "https://merchant.example.com/payment/notify",
  "returnUrl": "https://merchant.example.com/payment/return",
  "key": "83d551f0b3609781a22536ca2658473d",
  "wxpay": "wxp://f2f0abc1234567890",
  "zfbpay": "HTTPS://QR.ALIPAY.COM/FKX000000000000000000",
  "close": "5",
  "payQf": "1"
}
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

## 8. 后台订单接口

## 8.1 订单分页查询

### 接口

- 路径：`/admin/getOrders`
- 方法：`GET` / `POST`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `page` | number | 是 | 页码，从 1 开始 |
| `limit` | number | 是 | 每页条数 |
| `type` | number | 否 | 支付方式筛选 |
| `state` | number | 否 | 状态筛选 |

### 请求示例

```json
{
  "page": 1,
  "limit": 20,
  "type": 2,
  "state": 0
}
```

### 成功响应示例

```json
{
  "code": 0,
  "msg": "",
  "count": 1,
  "data": [
    {
      "id": 12,
      "orderId": "202605221430159876",
      "payId": "ORDER_202605220001",
      "createDate": 1779431415000,
      "payDate": 0,
      "closeDate": 0,
      "param": "user_1001",
      "type": 2,
      "price": 12.5,
      "reallyPrice": 12.51,
      "notifyUrl": "https://merchant.example.com/payment/notify",
      "returnUrl": "https://merchant.example.com/payment/return",
      "state": 0,
      "isAuto": 1,
      "payUrl": "HTTPS://QR.ALIPAY.COM/FKX000000000000000000"
    }
  ]
}
```

## 8.2 删除订单

### 接口

- 路径：`/admin/delOrder`
- 方法：`POST`

### 请求示例

```json
{
  "id": 12
}
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

## 8.3 删除过期订单

### 接口

- 路径：`/admin/delGqOrder`
- 方法：`POST`

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

## 8.4 删除七天前订单

### 接口

- 路径：`/admin/delLastOrder`
- 方法：`POST`

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

## 8.5 补单

### 接口

- 路径：`/admin/setBd`
- 方法：`POST`

### 请求示例

```json
{
  "id": 12
}
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

### 回调失败响应示例

```json
{
  "code": -2,
  "msg": "补单失败",
  "data": "merchant service returned error"
}
```

## 9. 后台二维码管理接口

## 9.1 查询二维码列表

### 接口

- 路径：`/admin/getPayQrcodes`
- 方法：`GET` / `POST`

### 请求示例

```json
{
  "page": 1,
  "limit": 20,
  "type": 1
}
```

### 成功响应示例

```json
{
  "code": 0,
  "msg": "",
  "count": 1,
  "data": [
    {
      "id": 3,
      "payUrl": "wxp://f2f0abc1234567890",
      "price": 12.51,
      "type": 1
    }
  ]
}
```

## 9.2 新增二维码

### 接口

- 路径：`/admin/addPayQrcode`
- 方法：`POST`

### 请求示例

```json
{
  "payUrl": "wxp://f2f0abc1234567890",
  "price": 12.51,
  "type": 1
}
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

## 9.3 删除二维码

### 接口

- 路径：`/admin/delPayQrcode`
- 方法：`POST`

### 请求示例

```json
{
  "id": 3
}
```

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": null
}
```

## 10. 后台统计接口

## 10.1 首页统计

### 接口

- 路径：`/admin/getMain`
- 方法：`GET` / `POST`

### 成功响应示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": {
    "todayOrder": "10",
    "todaySuccessOrder": "8",
    "todayCloseOrder": "2",
    "todayMoney": "126.80",
    "countOrder": "356",
    "countMoney": "5821.44"
  }
}
```

## 11. 商户异步通知规范

### 说明

当订单支付成功后，服务端将向 `notifyUrl` 发起 GET 请求。

### 通知参数示例

```json
{
  "payId": "ORDER_202605220001",
  "param": "user_1001",
  "type": 2,
  "price": 12.5,
  "reallyPrice": 12.51,
  "sign": "58aa0e6a3697408a0c10b52ef6a86697"
}
```

### 实际 QueryString 示例

```text
https://merchant.example.com/payment/notify?payId=ORDER_202605220001&param=user_1001&type=2&price=12.5&reallyPrice=12.51&sign=58aa0e6a3697408a0c10b52ef6a86697
```

### 签名规则

```text
md5(payId + param + type + price + reallyPrice + key)
```

### 商户成功响应要求

```text
success
```

注意：

- 必须严格等于字符串 `success`
- 否则视为通知失败，并将订单状态改为 `2`

## 12. 同步跳转规范

### 说明

支付页轮询 `checkOrder` 成功后，前端跳转到返回的 URL。

### 跳转地址示例

```json
{
  "code": 1,
  "msg": "成功",
  "data": "https://merchant.example.com/payment/return?payId=ORDER_202605220001&param=user_1001&type=2&price=12.5&reallyPrice=12.51&sign=58aa0e6a3697408a0c10b52ef6a86697"
}
```

## 13. 错误码兼容建议

旧项目整体上使用较粗粒度错误码，重构后建议保持兼容：

- `1`：成功
- `-1`：通用失败
- `-2`：补单回调失败等特殊失败

内部可以有更细日志分类，但外部响应不要随意改成复杂错误体系。

## 14. 实施建议

后续编码时建议把接口兼容分成三层：

1. 路由兼容层：保留旧路径和旧参数名
2. 应用服务层：按新模块实现业务
3. DTO 适配层：确保返回 JSON 字段名与旧系统一致

这样既能保留兼容性，也方便内部代码按现代结构维护。
