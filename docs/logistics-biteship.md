# Biteship 物流接入

一期使用 Biteship Order API 创建 COD 运单并同步配送状态，BigSeller 专用 CSV 继续作为人工兜底。

## Vercel 环境变量

```env
LOGISTICS_PROVIDER=biteship
BITESHIP_API_KEY=
BITESHIP_WEBHOOK_TOKEN=
LOGISTICS_ORIGIN_CONTACT_NAME=
LOGISTICS_ORIGIN_CONTACT_PHONE=
LOGISTICS_ORIGIN_ADDRESS=
LOGISTICS_ORIGIN_POSTAL_CODE=
LOGISTICS_DEFAULT_COURIER=sicepat
LOGISTICS_DEFAULT_COURIER_TYPE=reg
LOGISTICS_DEFAULT_WEIGHT_GRAMS=1000
LOGISTICS_DEFAULT_LENGTH_CM=30
LOGISTICS_DEFAULT_WIDTH_CM=25
LOGISTICS_DEFAULT_HEIGHT_CM=10
LOGISTICS_COD_DISBURSEMENT=7_days
```

`BITESHIP_WEBHOOK_TOKEN` 请生成一个独立随机字符串，不要与管理员密码或 API Key 共用。

## Webhook

- URL: `https://grupbeli.com/api/logistics/biteship/webhook`
- 认证：`Authorization: Bearer <BITESHIP_WEBHOOK_TOKEN>`，也兼容 `x-webhook-token`
- 事件：`order.status`、`order.price`、`order.waybill_id`

## 后台流程

1. 在订单管理确认 COD。
2. 展开“创建运单”，选择快递公司、服务代码并填写收件邮编和包裹尺寸。
3. 创建后可刷新状态、打开物流轨迹或进入 Biteship 后台处理面单。
4. Webhook 会自动更新运单号、配送状态和订单状态，并写入操作日志。

## 面单说明

Biteship 当前不提供 Shipping Label API。后台的“打开 Biteship 面单”会进入 Biteship Dashboard，运营人员可在那里下载平台生成的面单。后续若切换到提供面单 PDF API 的供应商，可复用订单中的 `shipping.labelUrl` 字段。
