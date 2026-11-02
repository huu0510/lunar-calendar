# Lịch âm Việt Nam

Ứng dụng lịch âm: xem tháng, chi tiết ngày (Can Chi, tiết khí), đổi dương ↔ âm, ngày lễ Việt Nam, sự kiện lặp theo dương hoặc âm, và nhắc qua Telegram / Zalo.

Giao diện tiếng Việt, ưu tiên điện thoại. Mọi phép tính ngày dùng múi giờ `Asia/Ho_Chi_Minh` (UTC+7), thuật toán thiên văn của Hồ Ngọc Đức — không dùng lịch âm Trung Quốc (UTC+8).

## Yêu cầu

- Node.js **22** trở lên (`engines.node` là `>=22`, xem `.nvmrc`)
- npm

## Cài đặt

```bash
nvm use
npm install
cp .env.example .env
```

Điền ít nhất:

```bash
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="$(openssl rand -base64 32)"
CRON_SECRET="$(openssl rand -base64 32)"
APP_TIMEZONE="Asia/Ho_Chi_Minh"
```

`AUTH_SECRET` là bí mật phiên đăng nhập (NextAuth đọc cùng giá trị qua `NEXTAUTH_SECRET` trong mã nguồn). Không commit file `.env`.

```bash
npx prisma migrate dev
npm run dev
```

Mở http://localhost:3000. Đăng ký tài khoản để tạo sự kiện và người nhận. Lịch tháng, chi tiết ngày và đổi ngày dùng được khi chưa đăng nhập.

## Lệnh

```bash
npm run dev
npm run build
npm run lint
npm test
npx tsx scripts/send-reminders.ts
# hoặc
npm run reminders
```

`npm run build`, `npm run lint` và `npm test` phải pass trước khi mở PR.

## Nhắc nhở

Mỗi sự kiện có `leadDays` (ví dụ 7, 1, 0) và danh sách người nhận.

- `NONE`: một lần.
- `YEARLY_SOLAR`: hằng năm theo dương lịch. Ngày 29/2 của năm không nhuận rơi vào 28/2.
- `YEARLY_LUNAR`: hằng năm theo âm lịch.
  - Sự kiện ở tháng nhuận, năm đó không có tháng nhuận cùng số → dùng tháng thường.
  - Ngày 30 của tháng thiếu → dùng ngày 29.

Job quét các lần xảy ra đúng `hôm nay + leadDays` (giờ Việt Nam). Bản ghi `ReminderLog` có khóa duy nhất `(eventId, occurrenceDate, leadDays, recipientId, channel)`. Trạng thái `SENT` chặn gửi trùng. `FAILED` được ghi đè để lần chạy sau thử lại kênh đó; lỗi một kênh không dừng cả job.

Cron mỗi ngày lúc 07:00 giờ Việt Nam (`0 0 * * *` UTC) gọi `GET /api/cron/reminders` với header:

```text
Authorization: Bearer <CRON_SECRET>
```

Thiếu hoặc sai secret thì endpoint trả 401.

## Telegram

1. Tạo bot với BotFather, đặt `TELEGRAM_BOT_TOKEN`.
2. Đặt `TELEGRAM_WEBHOOK_SECRET`, rồi:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://<host>/api/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

3. Người nhận nhắn `/start`. Bot trả `chat_id`. Dán số đó vào mục Người nhận.

Webhook từ chối request nếu header `X-Telegram-Bot-Api-Secret-Token` không khớp.

## Zalo Official Account

Đặt `ZALO_OA_APP_ID`, `ZALO_OA_SECRET_KEY`, `ZALO_OA_ACCESS_TOKEN`, `ZALO_OA_REFRESH_TOKEN`. Người nhận là `user_id` của người đã quan tâm OA.

Access token hết hạn thì notifier gọi `https://oauth.zaloapp.com/v4/oa/access_token` và lưu cặp token mới vào bảng `ZaloToken`. Refresh token của Zalo chỉ dùng một lần, nên token sau khi làm mới phải lấy từ DB, không làm mới lại từ giá trị cũ trong `.env`.

Thêm kênh mới: tạo file trong `src/lib/notifiers/` và đăng ký trong `src/lib/notifiers/index.ts`.

## PostgreSQL khi production

Schema mặc định là SQLite để chạy local. Để dùng Postgres:

1. Trong `prisma/schema.prisma`, đổi `provider` thành `"postgresql"`.
2. Đặt `DATABASE_URL="postgresql://..."`.
3. Cài `@prisma/adapter-pg` và `pg`.
4. Trong `src/lib/db.ts`, tạo client bằng `PrismaPg` thay cho `PrismaBetterSqlite3`.
5. `npx prisma migrate deploy`.

`leadDays` lưu JSON để cùng một field chạy được trên cả hai engine.

## Thư viện

Các gói trong `package.json` là bản stable mới nhất chạy được trên Node 22 (không dùng bản RC/beta). Prisma CLI 8 còn là release candidate nên dự án dùng Prisma ORM 7.10. NextAuth dùng bản stable 4; Auth.js 5 vẫn là beta. `tsc` là TypeScript 7. ESLint cần compiler API, mà TypeScript 7 chưa có, nên gói `typescript` trỏ tới `@typescript/typescript6` theo hướng dẫn chạy song song của TypeScript.
