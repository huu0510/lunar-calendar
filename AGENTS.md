# AGENTS.md — Lunar Calendar (Lịch Âm Việt Nam)

Hướng dẫn cho AI coding agent (Cursor Agent, v.v.) khi làm việc trong repo này.
Repo: https://github.com/huu0510/lunar-calendar

## 1. Mục tiêu sản phẩm

Web app lịch âm Việt Nam cho phép:

- Xem lịch tháng: mỗi ô ngày dương lịch hiển thị ngày âm lịch bên dưới; làm nổi bật hôm nay, mùng 1, rằm (15).
- Xem chi tiết ngày: ngày dương, ngày âm, Can Chi của ngày/tháng/năm, tiết khí (nếu có).
- Đổi ngày dương ↔ âm.
- Hiển thị các ngày lễ lớn của Việt Nam (theo âm lịch và dương lịch).
- Người dùng tạo **ghi chú/sự kiện** theo ngày: ngày lễ, ngày giỗ, ngày kỷ niệm, tuỳ chỉnh.
  - Lặp hằng năm theo **âm lịch** hoặc **dương lịch**, hoặc chỉ một lần.
- Người dùng cấu hình **người nhận** và **thời điểm nhắc trước** (vd: trước 7 ngày, 1 ngày, đúng ngày).
- Gửi **thông báo** khi gần đến ngày qua **Telegram** và **Zalo**.

Ngôn ngữ giao diện: **tiếng Việt**. Thiết kế responsive, ưu tiên mobile.

## 2. Tech stack

- Next.js (App Router) + TypeScript (strict mode)
- Tailwind CSS cho UI
- Prisma ORM: SQLite khi dev local, PostgreSQL khi production
- Auth: Auth.js (NextAuth) — mỗi user chỉ thấy dữ liệu của mình
- Test: Vitest (unit), Playwright (e2e, tuỳ chọn)
- Lint/format: ESLint + Prettier
- Package manager: npm

## 3. Cấu trúc thư mục đề xuất

```
src/
  app/                    # Routes (App Router)
    (calendar)/           # Lịch tháng, chi tiết ngày
    convert/              # Đổi ngày âm ↔ dương
    events/               # CRUD ghi chú/sự kiện
    recipients/           # Quản lý người nhận
    api/
      cron/reminders/     # Endpoint cron gửi nhắc (Vercel Cron)
  lib/
    lunar/                # Thuật toán âm lịch (thuần TS, không phụ thuộc UI)
      convert.ts          # solarToLunar, lunarToSolar
      canchi.ts           # Can Chi ngày/tháng/năm
      solarTerms.ts       # Tiết khí
      holidays.ts         # Ngày lễ Việt Nam
    events/
      recurrence.ts       # Tính lần xảy ra tiếp theo của sự kiện
      reminders.ts        # Tìm sự kiện sắp tới cần nhắc
    notifiers/
      types.ts            # interface Notifier
      telegram.ts
      zalo.ts
      index.ts            # registry chọn notifier theo channel
  components/
prisma/
  schema.prisma
scripts/
  send-reminders.ts       # Chạy job nhắc ở local
tests/
```

## 4. Quy tắc tính lịch âm (quan trọng)

- Dùng thuật toán của **Hồ Ngọc Đức** (chuẩn cho lịch Việt Nam), múi giờ **UTC+7**.
  Không dùng thư viện lịch âm Trung Quốc (UTC+8) vì sẽ lệch ngày ở một số năm.
- Xử lý **tháng nhuận** (`isLeapMonth`). Ví dụ: năm 2023 nhuận tháng 2, năm 2025 nhuận tháng 6.
- Kiểu dữ liệu chuẩn:
  ```ts
  type LunarDate = { day: number; month: number; year: number; isLeapMonth: boolean };
  ```
- Code trong `src/lib/lunar/` phải là hàm thuần (pure), không đụng DB/UI, có test đầy đủ.
- Test bắt buộc tối thiểu:
  - Ngày Tết (1/1 âm) của nhiều năm, ví dụ: 2024-02-10, 2025-01-29, 2026-02-17.
  - Các ngày trong tháng nhuận 2023 và 2025.
  - Chuyển đổi khứ hồi: `lunarToSolar(solarToLunar(d)) === d` cho một dải ngày rộng.

## 5. Sự kiện lặp lại & nhắc nhở

- `recurrence`: `NONE` | `YEARLY_SOLAR` | `YEARLY_LUNAR`.
- Với `YEARLY_LUNAR`:
  - Nếu sự kiện gốc rơi vào tháng nhuận mà năm đó không có tháng nhuận → dùng tháng thường cùng số.
  - Nếu ngày 30 âm không tồn tại trong tháng (tháng thiếu) → dùng ngày 29.
  - Ghi rõ các quy tắc này trong code và test.
- Nhắc nhở: mỗi sự kiện có danh sách `leadDays` (vd `[7, 1, 0]`) và danh sách người nhận.
- Job nhắc chạy định kỳ (mặc định 1 lần/ngày, khoảng 07:00 giờ Việt Nam):
  - Tìm các lần xảy ra sắp tới, gửi thông báo cho đúng người nhận.
  - **Chống gửi trùng**: lưu bản ghi `ReminderLog` với khoá duy nhất `(eventId, occurrenceDate, leadDays, recipientId, channel)`.
  - Lỗi gửi ở một kênh không được làm hỏng cả job; ghi log và thử lại lần chạy sau.
- Endpoint cron `/api/cron/reminders` phải kiểm tra header bí mật (`CRON_SECRET`).

## 6. Kênh thông báo

Mọi kênh triển khai chung interface:

```ts
interface Notifier {
  channel: 'telegram' | 'zalo';
  send(to: RecipientTarget, message: NotificationMessage): Promise<SendResult>;
}
```

- **Telegram**: Bot API (`sendMessage`), người nhận định danh bằng `chat_id`.
  Có hướng dẫn lấy `chat_id` (user nhắn `/start` cho bot, bot lưu lại chat_id qua webhook).
- **Zalo**: Zalo Official Account (OA) API, người nhận là `user_id` của người đã follow OA.
  Lưu ý access token OA hết hạn → cần cơ chế refresh token, lưu token trong DB.
- Thêm kênh mới chỉ cần thêm file trong `src/lib/notifiers/` và đăng ký trong `index.ts`.
- Nội dung tin nhắn bằng tiếng Việt, ví dụ:
  `🔔 Còn 7 ngày nữa là Giỗ ông nội (10/3 âm lịch — 26/04/2026 dương lịch).`

## 7. Mô hình dữ liệu (Prisma, tóm tắt)

- `User` — tài khoản đăng nhập.
- `Event` — `userId`, `title`, `type` (HOLIDAY | DEATH_ANNIVERSARY | ANNIVERSARY | CUSTOM), `note`,
  `calendarType` (SOLAR | LUNAR), `day`, `month`, `year?`, `isLeapMonth`, `recurrence`, `leadDays Int[]`/JSON.
- `Recipient` — `userId`, `name`, `channel` (TELEGRAM | ZALO), `externalId` (chat_id / zalo user_id).
- `EventRecipient` — bảng nối nhiều-nhiều Event ↔ Recipient.
- `ReminderLog` — lịch sử gửi, khoá duy nhất để chống trùng.
- `ZaloToken` — access/refresh token của OA.

## 8. Biến môi trường

Liệt kê trong `.env.example` (không commit giá trị thật):

```
DATABASE_URL=
AUTH_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
ZALO_OA_APP_ID=
ZALO_OA_SECRET_KEY=
ZALO_OA_ACCESS_TOKEN=
ZALO_OA_REFRESH_TOKEN=
CRON_SECRET=
APP_TIMEZONE=Asia/Ho_Chi_Minh
```

## 9. Lệnh thường dùng

```bash
npm install
npx prisma migrate dev
npm run dev            # chạy local
npm run build          # phải pass trước khi mở PR
npm run lint
npm test               # Vitest
npx tsx scripts/send-reminders.ts   # chạy job nhắc thủ công
```

## 10. Quy ước code

- TypeScript strict, không dùng `any` nếu tránh được.
- Mọi phép tính ngày dùng múi giờ `Asia/Ho_Chi_Minh`; không phụ thuộc múi giờ máy chủ.
- Logic nghiệp vụ nằm trong `src/lib/`, component chỉ lo hiển thị.
- Server Actions / Route Handlers phải kiểm tra quyền sở hữu dữ liệu theo `userId`.
- Không hard-code token, secret; không log nội dung token.
- Tên biến/hàm bằng tiếng Anh; chuỗi hiển thị cho người dùng bằng tiếng Việt.

## 11. Định nghĩa "xong" cho mỗi thay đổi

- `npm run build`, `npm run lint`, `npm test` đều pass.
- Thêm/cập nhật test cho logic lịch âm, lặp sự kiện, nhắc nhở khi có thay đổi.
- Cập nhật README nếu thêm biến môi trường hoặc bước cài đặt.
- PR mô tả rõ thay đổi, kèm ảnh chụp màn hình nếu đụng tới UI.
