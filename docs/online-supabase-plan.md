# オンライン合言葉ルーム設計

## 目的

`Midnight Masquerade: 密書の夜会` の次段階として、Vercel に公開した Web アプリから Supabase へ接続し、会社や親戚の集まりで各自のスマホから同じ夜会へ参加できる合言葉ルーム方式を追加する。

初期オンライン版は、オフライン版の 2〜4 人・短時間・原作寄せのゲーム性を維持する。独自追加ルールや大人数化は、合言葉ルームで安定して遊べることを確認してから扱う。

## 要件台帳

| ID | 要件 | 状態 | 検証方法 |
| --- | --- | --- | --- |
| REQ-ONLINE-001 | Vercel では Vite の通常 build を使い、`dist/` を配信する | 追加 | `vercel.json` と `npm run build` |
| REQ-ONLINE-002 | Supabase 接続値は `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` だけをブラウザへ公開する | 追加 | `.env.sample` と client 実装 |
| REQ-ONLINE-003 | 参加者は Supabase Anonymous Auth で端末ごとの匿名 user として扱う | 追加 | `supabase.auth.signInAnonymously()` を使う client 実装 |
| REQ-ONLINE-004 | 合言葉は平文保存せず、room 作成/参加 RPC 内で `crypt` hash と照合する | 追加 | `supabase/migrations/202606010001_online_rooms.sql` |
| REQ-ONLINE-005 | RLS は `auth.uid()` と room membership で、参加済み room だけ読めるようにする | 追加 | RLS policy と Supabase SQL test |
| REQ-ONLINE-006 | 秘密情報は公開 room state に置かず、本人だけが読める private state または private event に分離する | 追加 | schema review と online gameplay tests |
| REQ-ONLINE-007 | Realtime は公開更新と自分宛て private event の同期に限定する | 追加 | publication と Realtime E2E |

## 現行 docs からの採用方針

- Supabase React/Vite では `@supabase/supabase-js` の `createClient` に Project URL と publishable/anon key を渡す。Vite では `VITE_` 接頭辞の環境変数だけがブラウザ bundle へ露出する。
- Supabase Anonymous Auth は `supabase.auth.signInAnonymously()` で端末ごとの匿名 user を作れる。匿名 user も `authenticated` role として RLS の対象になる。
- RLS policy では `auth.uid()` を membership table と照合し、他 room の state を読めないようにする。
- Realtime で Postgres changes を購読する table は `supabase_realtime` publication へ追加する。
- Vercel の Vite deploy は build command と output directory を指定できる。オンライン版は Pages 用 `/loveletter/` base ではなく、Vercel root 配信の `npm run build` を使う。

## データ境界

| Table | 用途 | 秘密度 | RLS |
| --- | --- | --- | --- |
| `online_rooms` | room code、進行状態、公開 state、現在手番 | 参加者内公開 | room member のみ select |
| `online_room_players` | 匿名 user と room 内席順、表示名 | 参加者内公開 | room member のみ select |
| `online_private_states` | 各 player の手札・本人だけの一時確認 | 本人のみ | 自分の player row のみ select |
| `online_room_events` | 公開ログと自分宛て private event | 公開/本人のみ | room member かつ visibility 条件 |

`online_rooms.public_state` には、山札残数、公開除外、使用済み密書、公開ログ、得点、手番 ID だけを置く。手札、引いた札、情報屋で見た札、交換結果などの秘密情報は入れない。

## RPC 境界

初期 migration では、room 作成と参加だけを RPC 化する。

- `create_online_room(room_code, passphrase, display_name, max_players, match_mode)`
  - `auth.uid()` 必須
  - 合言葉を `crypt(passphrase, gen_salt('bf'))` で hash 化
  - host を席順 1 として追加
- `join_online_room(room_code, passphrase, display_name)`
  - `auth.uid()` 必須
  - room を `for update` で取り、合言葉 hash を照合
  - 空き席がある場合だけ参加

ゲーム進行 RPC は次段で追加する。直接 table update を許可せず、`play_online_card` のような RPC がサーバ側で状態遷移を検証してから公開 state / private state / event を更新する。

## 非対象

- メール/パスワードログイン
- 観戦者
- 5人以上の拡張
- 独自カードや追加ルール
- Supabase service role key をブラウザや Vercel client env に置くこと

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 合言葉だけで room が列挙される | room code を 4〜16 文字の任意合言葉とは別の短い招待コードとして扱い、passphrase は hash 照合だけに使う |
| anon key で他 room を読める | RLS と membership table を必須にし、直接 insert/update/delete は許可しない |
| 秘密手札が Realtime payload に混ざる | 公開 state と private state/event を分離し、private table は publication へ追加しない |
| 同時操作で状態が壊れる | 進行 RPC で room row を `for update` し、turn/version を検証してから更新する |
| party 会場で接続が不安定 | UI は「同期中」「再接続中」「端末を渡さない」状態を明示し、offline 版へ戻れる導線を残す |

## 受け入れ条件

- `.env.sample` に必要な Vite 公開環境変数がある。
- `vercel.json` で Vite の root deploy が明示されている。
- Supabase migration が RLS enabled table、membership policy、作成/参加 RPC、Realtime publication を含む。
- README からオンライン化計画と migration の場所へ辿れる。
- Docker 内で既存 unit/build/e2e が通り、オフライン版の公開体験を壊していない。
