# 优惠券滚动分页 + 详情面板设计

## 1. 后端 API

### 1.1 可领取列表 — `GET /api/coupons/available`

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `lastTimestamp` | Long | 否 | 上次最后一条 `startTime` 时间戳（毫秒），首次不传 |
| `lastId` | Long | 否 | 上次最后一条 `id`，首次不传 |
| `pageSize` | Integer | 否 | 固定 10，默认 10 |

**SQL 逻辑**

```sql
WHERE startTime <= NOW()
  AND endTime >= NOW()
ORDER BY start_time DESC, id DESC
```

游标条件（`lastTimestamp` 和 `lastId` 同时传才生效）：

```sql
AND (start_time < FROM_UNIXTIME(#{lastTimestamp}/1000)
  OR (start_time = FROM_UNIXTIME(#{lastTimestamp}/1000) AND id < #{lastId}))
```

**响应（`data` 内）**

```json
{
  "list": [
    {
      "id": 1,
      "name": "满20减5",
      "description": "停车优惠",
      "discountAmount": 5.00,
      "minAmount": 20.00,
      "type": 0,
      "startTime": "2026-06-01 00:00:00",
      "endTime": "2026-12-31 23:59:59"
    }
  ],
  "nextTimestamp": 1780300800000,
  "nextId": 5,
  "hasMore": true
}
```

> **不含** `stock`、`remainStock`。外层统一信封 `Result`。

### 1.2 我的优惠券 — `GET /api/coupons?scope=mine`

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `lastTimestamp` | Long | 否 | 上次最后一条 `user_coupon.create_time` 时间戳 |
| `lastId` | Long | 否 | 上次最后一条 `user_coupon.id` |
| `pageSize` | Integer | 否 | 固定 10 |
| `status` | Integer | 否 | 0=未使用 1=已使用 2=已过期 |
| `keyword` | String | 否 | 模糊匹配 `coupon.name` |

**SQL 逻辑**

```sql
FROM user_coupon uc
JOIN coupon c ON uc.coupon_id = c.id
WHERE uc.user_id = #{userId}
```

+ 可选 `AND uc.status = #{status}`
+ 可选 `AND c.name LIKE CONCAT('%', #{keyword}, '%')`

排序：`uc.create_time DESC, uc.id DESC`
游标条件同 1.1（字段改为 `uc.create_time`、`uc.id`）。

**响应（`data` 内）**

```json
{
  "list": [
    {
      "id": 1,
      "name": "满20减5",
      "description": "停车优惠",
      "discountAmount": 5.00,
      "minAmount": 20.00,
      "type": 0,
      "status": 0,
      "startTime": "2026-06-01 00:00:00",
      "endTime": "2026-12-31 23:59:59",
      "createTime": "2026-07-01 12:00:00"
    }
  ],
  "nextTimestamp": 1780300800000,
  "nextId": 5,
  "hasMore": true
}
```

> 多一个 `status` 字段。不含 `stock`、`remainStock`。

### 1.3 优惠券详情 — `GET /api/coupons/{id}`

返回全部字段，包含动态信息。

**响应（`data` 内）**

```json
{
  "id": 1,
  "name": "新用户停车专享",
  "description": "首次停车立减20元",
  "discountAmount": 20.00,
  "minAmount": 30.00,
  "type": 0,
  "stock": 100,
  "remainStock": 88,
  "startTime": "2026-06-01 00:00:00",
  "endTime": "2026-12-31 23:59:59"
}
```

> 不返回 `status`。因为详情从列表点击进入，`status` 已由列表项携带传给 BottomSheet。

### 1.4 统一返回格式

分页结果：

```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "list": [...],
    "nextTimestamp": 1704067200000,
    "nextId": 5,
    "hasMore": true
  }
}
```

详情结果：

```json
{
  "code": 200,
  "message": "ok",
  "data": { ... }
}
```

### 1.5 后端 VO / DTO 新增

| 类 | 说明 |
|------|------|
| `CouponPageQueryReq` | `lastTimestamp`, `lastId`, `pageSize`, `status`, `keyword` |
| `CouponListVO` | 列表 VO（无 stock/remainStock），复用现有或新建 |
| `CouponDetailVO` | 含 stock/remainStock 的完整 VO |
| `CouponCursorResultVO` | `List<CouponListVO> list`, `Long nextTimestamp`, `Long nextId`, `Boolean hasMore` |

## 2. 前端

### 2.1 页面布局

```
┌──────────────────────────────────────┐
│  <  优惠券                            │  ← 标题栏
├──────────────────────────────────────┤
│  可领取  │  我的优惠券 (高亮)          │  ← 一级胶囊 Tab
├──────────────────────────────────────┤
│  待使用(N) │ 已使用 │ 已过期           │  ← 二级状态 Tab（仅"我的优惠券"显示）
├──────────────────────────────────────┤
│  🔍 输入券名搜索                      │  ← 搜索框（仅"我的优惠券"显示）
├──────────────────────────────────────┤
│  ┌─────────────────────────────┐     │
│  │ ¥50  【停车券】             │     │  ← 流式卡片列表
│  │ 有效期至 2026-07-31  [去使用]│     │
│  └─────────────────────────────┘     │
│  ┌─────────────────────────────┐     │
│  │ ¥20  【洗车券】             │     │
│  │ 有效期至 2026-08-15  [去使用]│     │
│  └─────────────────────────────┘     │
│         正在加载更多...               │  ← 触底加载
│        — 没有更多了 —                 │  ← 无更多提示
└──────────────────────────────────────┘
```

### 2.2 组件文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/views/Coupons.vue` | **重写** | 主页面，两个 Tab 容器 + 搜索/筛选 |
| `src/stores/coupon.ts` | **重构** | 游标分页状态 + 搜索/筛选 + 详情 |
| `src/api/coupon.ts` | **修改** | 更新 API 函数加参数 |
| `src/components/BottomSheet.vue` | **新建** | 底部滑出详情面板 |
| `src/composables/usePullToRefresh.ts` | **新建** | 下拉刷新 composable |
| `src/types/coupon.ts` | **新建** | 类型定义 |

### 2.3 Store 状态设计

```ts
interface CursorState {
  items: CouponInfo[]
  cursor: { timestamp: number | null; id: number | null }
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  refreshing: boolean
}

interface MineState extends CursorState {
  status: number | null       // 当前筛选状态，null=全部
  keyword: string
  statusCount: Record<number, number>  // 各状态数量，如 {0: 3, 1: 0, 2: 5}
}

// store actions
function refreshAvailable()     // 重置游标，拉可领取第一页
function loadMoreAvailable()    // 追加载可领取下一页
function refreshMine()          // 重置游标，拉我的第一页（带 status/keyword）
function loadMoreMine()         // 追加我的下一页
function fetchDetail(id)        // 拉详情 → 打开 BottomSheet
function claim(id)              // 领取
function flashSale(id)          // 秒杀
```

### 2.4 组件交互

| 动作 | 触发 | 逻辑 |
|------|------|------|
| 选择一级 Tab（可领取） | 点击 | 切换容器，触发 `refreshAvailable()` |
| 选择一级 Tab（我的） | 点击 | 切换容器，触发 `refreshMine()` |
| 选择二级状态 Tab | 点击 | 更新 `status`，重置游标，`refreshMine()` |
| 输入搜索 | 输入 | debounce 300ms，更新 `keyword`，`refreshMine()` |
| 滑到底部 | `useInfiniteScroll` | `if hasMore → loadMore()`，否则显示"没有更多" |
| 下拉释放 | `usePullToRefresh` | `refreshAvailable()` / `refreshMine()` |
| 点击卡片 | 点击 | `fetchDetail(id)` → BottomSheet 显示 |
| 底部按钮 | 点击 | claim/flashSale/去使用 |

### 2.5 BottomSheet 详情面板

```
┌─────────────────────────────────────┐
│  优惠券详情                    ✕     │
├─────────────────────────────────────┤
│                                     │
│       ┌───────────────┐             │
│       │   ¥ 20.00     │             │  ← 大号金额
│       │   满30可用     │             │  ← 满减条件
│       └───────────────┘             │
│                                     │
│  名称：新用户停车专享                 │
│  描述：首次停车立减20元               │
│  类型：普通优惠券                     │
│  总库存：100 张                      │
│  剩余：  88 张        🔥 充足       │  ← 列表不展示的动态字段
│  有效期：2026-06-01 ~ 2026-12-31    │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │  立即领取 / 秒杀抢购 / 去使用 │    │  ← 底部固定按钮
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
   ↑ 约 70% 屏幕高度，半透明蒙层，点击关闭
```

### 2.6 CouponInfo 接口更新

```ts
interface CouponInfo {
  id: number
  name: string
  description?: string
  discountAmount: number
  minAmount: number
  type: number          // 0=普通 1=秒杀
  startTime: string
  endTime: string
  // 以下仅"我的"列表返回（列表时已有，详情没有）
  status?: number       // 0=未使用 1=已使用 2=已过期
  // 以下仅详情接口返回
  stock?: number
  remainStock?: number
}

interface CursorResult {
  list: CouponInfo[]
  nextTimestamp: number | null
  nextId: number | null
  hasMore: boolean
}
```

## 3. 影响文件清单

### 后端（parkingsystem）

| 文件 | 操作 |
|------|------|
| `src/main/java/.../client/controller/CouponClientController.java` | **新建** |
| `src/main/java/.../client/service/CouponClientService.java` | **新建** |
| `src/main/java/.../client/service/impl/CouponClientServiceImpl.java` | **新建** |
| `src/main/java/.../common/mapper/UserCouponMapper.java` | **新建** |
| `src/main/java/.../client/dto/CouponPageQueryReq.java` | **新建** |
| `src/main/java/.../client/vo/CouponListVO.java` | **新建** |
| `src/main/java/.../client/vo/CouponDetailVO.java` | **新建** |
| `src/main/java/.../client/vo/CouponCursorResultVO.java` | **新建** |

### 前端（parking-client）

| 文件 | 操作 |
|------|------|
| `src/views/Coupons.vue` | 重写 |
| `src/stores/coupon.ts` | 重构 |
| `src/api/coupon.ts` | 修改（添加分页/搜索参数） |
| `src/components/BottomSheet.vue` | 新建 |
| `src/composables/usePullToRefresh.ts` | 新建 |
| `src/types/coupon.ts` | 新建（可选，也可放 store 内） |
