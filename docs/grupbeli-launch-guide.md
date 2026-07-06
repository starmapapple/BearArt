# GrupBeli 正式上线手册

目标：第一版先用 Vercel 全包上线，验证转化、订单、支付和广告素材；代码已预留 `NEXT_PUBLIC_ASSET_BASE_URL`，以后可以把图片切到 Bunny CDN。

## 你需要准备的账号

1. Vercel：部署网站。
2. GoDaddy：你已经买好 `grupbeli.com`，用于改 DNS。
3. Neon 或 Supabase：创建 PostgreSQL 数据库。
4. Xendit 或 Midtrans：后续接 Virtual Account 支付，第一期 COD-only 暂时不需要。

## 第一步：先建数据库

推荐先用 Neon，地区选 Singapore。

拿到数据库连接串后，本地执行：

```bash
DATABASE_URL="你的数据库连接串" npm run migrate:postgres
```

连接串不要发到公开聊天或截图里。

## 第二步：Vercel 添加环境变量

Vercel 项目里进入：

```txt
Settings -> Environment Variables
```

先填这些：

```env
NEXT_PUBLIC_SITE_URL=https://grupbeli.com
NEXT_PUBLIC_SUPPORT_WHATSAPP=6285215448518
NEXT_PUBLIC_ASSET_BASE_URL=

ADMIN_PASSWORD=自己设置一个后台密码
ADMIN_SESSION_SECRET=自己设置一个很长的随机字符串

DATABASE_URL=你的PostgreSQL连接串

PAYMENT_PROVIDER=cod_only
PAYMENT_WEBHOOK_SECRET=先设置一个随机字符串
```

`NEXT_PUBLIC_ASSET_BASE_URL` 第一版可以留空。以后切 Bunny CDN 时填：

```env
NEXT_PUBLIC_ASSET_BASE_URL=https://cdn.grupbeli.com
```

填完环境变量后，需要重新部署一次才会生效。

## 第三步：配置一键发布

在 Vercel 项目里进入：

```txt
Settings -> Git -> Deploy Hooks
```

新建一个 Deploy Hook：

```txt
Name: Admin publish
Branch: main
```

复制生成的 Hook URL，添加到 Vercel Production 环境变量：

```env
VERCEL_DEPLOY_HOOK_URL=你的Deploy Hook URL
```

以后后台里的普通修改只保存数据，不会自动发布。需要上线时，进入后台点击右上角 `发布线上`。

如果还没有配置这个变量，后台按钮会提示缺少 `VERCEL_DEPLOY_HOOK_URL`，不会误发布。

## 第四步：绑定域名

Vercel 项目里进入：

```txt
Settings -> Domains
```

添加：

```txt
grupbeli.com
www.grupbeli.com
```

Vercel 会提示你需要在 GoDaddy 里添加哪些 DNS 记录。

通常是：

```txt
Type: A
Name: @
Value: 76.76.21.21
```

```txt
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

以 Vercel 页面显示的值为准。

## 第五步：上线验收

打开这些地址：

```txt
https://grupbeli.com
https://grupbeli.com/p/colorbear-art
https://grupbeli.com/account?from=colorbear
https://grupbeli.com/admin/login
```

检查：

1. 手机打开页面速度正常。
2. 首屏图片正常显示。
3. 点击 `Langsung COD` 可以打开购买弹窗。
4. COD 下单能成功，购买弹窗只展示 COD。
5. 后台订单能看到新订单。
6. `/admin/analytics` 能看到访问和下单事件。
7. WhatsApp 客服按钮能打开。
8. 页面没有横向滚动。

## 第六步：以后切 Bunny CDN

先把这些目录里的文件上传到 Bunny：

```txt
public/uploads
public/icons
```

上传后确保 CDN 路径保持一致，例如：

```txt
https://cdn.grupbeli.com/uploads/colorbear-art/hero-offer-kit.png
https://cdn.grupbeli.com/icons/whatsapp-green.webp
```

然后在 Vercel 环境变量里设置：

```env
NEXT_PUBLIC_ASSET_BASE_URL=https://cdn.grupbeli.com
```

重新部署后，页面会自动把 `/uploads/...` 和 `/icons/...` 切到 CDN。

## 当前策略

第一版：Vercel 全包 + COD-only，最快上线验证。

放量前：图片切 Bunny，视频用 YouTube 弹窗播放；需要 Virtual Account 时再接 Xendit/Midtrans。
