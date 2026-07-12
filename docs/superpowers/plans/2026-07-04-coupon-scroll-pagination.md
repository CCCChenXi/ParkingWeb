# 优惠券滚动分页 + 详情面板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor mobile coupon page — cursor-based infinite scroll (10/page), pull-to-refresh, status/keyword filter for "mine" tab, BottomSheet detail panel (with remainStock).

**Architecture:** Backend: new `CouponClientController` + `CouponClientService` in client package with cursor pagination on MySQL. Frontend: store refactored to per-tab cursor state, new `BottomSheet.vue`, new `usePullToRefresh` composable.

**Tech Stack:** Spring Boot 3 + MyBatis-Plus (backed), Vue 3 + Pinia + @vueuse/core v14.3 + Element Plus (fronted)

## Global Constraints

- API wrapper: `{ code, message, data }` (`Result<T>`)
- Cursor result: `{ list, nextTimestamp, nextId, hasMore }` wrapped in `Result`
- Front-end baseURL: `/api` (proxied by nginx)
- User ID from `UserHolder.get()` (ThreadLocal set by JWT filter)
- @vueuse/core already installed in parking-client (provides useInfiniteScroll)
- Page loading uses `v-loading` on `.page` container
- Backend path: `D:\Parking\parkingsystem`
- Frontend path: `D:\Parking\ParkingWeb\parking-client`

---

### Task 1: Backend — Create DTO and VOs

**Files:**
- Create: `src\main\java\com\xigeandwillian\parkingsystem\client\dto\coupon\CouponPageQueryReq.java`
- Create: `src\main\java\com\xigeandwillian\parkingsystem\client\vo\coupon\CouponAvailableListVO.java`
- Create: `src\main\java\com\xigeandwillian\parkingsystem\client\vo\coupon\CouponUserListVO.java`
- Create: `src\main\java\com\xigeandwillian\parkingsystem\client\vo\coupon\CouponCursorResultVO.java`
- Create: `src\main\java\com\xigeandwillian\parkingsystem\client\vo\coupon\CouponDetailVO.java`

**Produces:** Data classes consumed by Task 3.

- [ ] **Step 1: Create directories**

```bash
mkdir -p "D:\Parking\parkingsystem\src\main\java\com\xigeandwillian\parkingsystem\client\dto\coupon"
mkdir -p "D:\Parking\parkingsystem\src\main\java\com\xigeandwillian\parkingsystem\client\vo\coupon"
```

- [ ] **Step 2: Create `CouponPageQueryReq`**

```java
package com.xigeandwillian.parkingsystem.client.dto.coupon;

import lombok.Data;

@Data
public class CouponPageQueryReq {
    private Long lastTimestamp;
    private Long lastId;
    private Integer pageSize = 10;
    private Integer status;
    private String keyword;
}
```

- [ ] **Step 3: Create `CouponAvailableListVO`**

```java
package com.xigeandwillian.parkingsystem.client.vo.coupon;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CouponAvailableListVO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal discountAmount;
    private BigDecimal minAmount;
    private Integer type;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
```

- [ ] **Step 4: Create `CouponUserListVO`**

```java
package com.xigeandwillian.parkingsystem.client.vo.coupon;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CouponUserListVO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal discountAmount;
    private BigDecimal minAmount;
    private Integer type;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
```

- [ ] **Step 5: Create `CouponCursorResultVO`**

```java
package com.xigeandwillian.parkingsystem.client.vo.coupon;

import lombok.Data;
import java.util.List;

@Data
public class CouponCursorResultVO<T> {
    private List<T> list;
    private Long nextTimestamp;
    private Long nextId;
    private Boolean hasMore;
}
```

- [ ] **Step 6: Create `CouponDetailVO`**

```java
package com.xigeandwillian.parkingsystem.client.vo.coupon;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CouponDetailVO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal discountAmount;
    private BigDecimal minAmount;
    private Integer type;
    private Integer stock;
    private Integer remainStock;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
```

- [ ] **Step 7: Verify compilation**

```bash
cd D:\Parking\parkingsystem; .\mvnw compile -q 2>&1 | Select-String -Pattern "ERROR"
```

Expected: No errors.

---

### Task 2: Backend — Create UserCouponMapper

**Files:**
- Create: `src\main\java\com\xigeandwillian\parkingsystem\common\mapper\UserCouponMapper.java`

**Produces:** Mapper for user_coupon table, consumed by Task 3.

- [ ] **Step 1: Create `UserCouponMapper`**

```java
package com.xigeandwillian.parkingsystem.common.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xigeandwillian.parkingsystem.common.entity.UserCoupon;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserCouponMapper extends BaseMapper<UserCoupon> {
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd D:\Parking\parkingsystem; .\mvnw compile -q 2>&1 | Select-String -Pattern "ERROR"
```

Expected: No errors.

---

### Task 3: Backend — Implement CouponClientService

**Files:**
- Create: `src\main\java\com\xigeandwillian\parkingsystem\client\service\service\CouponClientService.java`
- Create: `src\main\java\com\xigeandwillian\parkingsystem\client\service\impl\CouponClientServiceImpl.java`

**Consumes:** `CouponMapper`, `UserCouponMapper`, `CouponPageQueryReq`, VOs from Task 1.

**Produces:** `CouponClientService` with 5 methods, consumed by Task 4.

- [ ] **Step 1: Create service interface**

```java
package com.xigeandwillian.parkingsystem.client.service.service;

import com.xigeandwillian.parkingsystem.client.dto.coupon.CouponPageQueryReq;
import com.xigeandwillian.parkingsystem.common.result.Result;

public interface CouponClientService {
    Result listAvailable(CouponPageQueryReq req);
    Result listUserCoupons(CouponPageQueryReq req);
    Result getDetail(Long id);
    Result claim(Long id);
    Result flashSale(Long id);
}
```

- [ ] **Step 2: Create service impl — imports + fields + helper**

```java
package com.xigeandwillian.parkingsystem.client.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.xigeandwillian.parkingsystem.client.dto.coupon.CouponPageQueryReq;
import com.xigeandwillian.parkingsystem.client.service.service.CouponClientService;
import com.xigeandwillian.parkingsystem.client.vo.coupon.CouponAvailableListVO;
import com.xigeandwillian.parkingsystem.client.vo.coupon.CouponCursorResultVO;
import com.xigeandwillian.parkingsystem.client.vo.coupon.CouponDetailVO;
import com.xigeandwillian.parkingsystem.client.vo.coupon.CouponUserListVO;
import com.xigeandwillian.parkingsystem.common.constant.ResultConstant;
import com.xigeandwillian.parkingsystem.common.entity.Coupon;
import com.xigeandwillian.parkingsystem.common.entity.UserCoupon;
import com.xigeandwillian.parkingsystem.common.exception.BusinessException;
import com.xigeandwillian.parkingsystem.common.mapper.CouponMapper;
import com.xigeandwillian.parkingsystem.common.mapper.UserCouponMapper;
import com.xigeandwillian.parkingsystem.common.result.Result;
import com.xigeandwillian.parkingsystem.common.utils.UserHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@Service
public class CouponClientServiceImpl implements CouponClientService {

    private final CouponMapper couponMapper;
    private final UserCouponMapper userCouponMapper;
}
```

- [ ] **Step 3: Add `listAvailable` method to the impl class**

```java
    @Override
    public Result listAvailable(CouponPageQueryReq req) {
        QueryWrapper<Coupon> wrapper = new QueryWrapper<>();
        wrapper.apply("start_time <= NOW() AND end_time >= NOW()");
        if (req.getLastTimestamp() != null && req.getLastId() != null) {
            LocalDateTime cursorTime = LocalDateTime.ofInstant(
                    Instant.ofEpochMilli(req.getLastTimestamp()), ZoneId.systemDefault());
            wrapper.and(w -> w.lt("start_time", cursorTime)
                    .or(w2 -> w2.eq("start_time", cursorTime).lt("id", req.getLastId())));
        }
        wrapper.orderByDesc("start_time").orderByDesc("id");
        wrapper.last("LIMIT " + req.getPageSize());

        List<Coupon> list = couponMapper.selectList(wrapper);
        List<CouponAvailableListVO> voList = list.stream().map(c -> {
            CouponAvailableListVO vo = new CouponAvailableListVO();
            vo.setId(c.getId());
            vo.setName(c.getName());
            vo.setDescription(c.getDescription());
            vo.setDiscountAmount(c.getDiscountAmount());
            vo.setMinAmount(c.getMinAmount());
            vo.setType(c.getType());
            vo.setStartTime(c.getStartTime());
            vo.setEndTime(c.getEndTime());
            return vo;
        }).collect(Collectors.toList());

        CouponCursorResultVO<CouponAvailableListVO> result = new CouponCursorResultVO<>();
        fillAvailableCursor(result, list, req.getPageSize());
        result.setList(voList);
        return Result.ok(result);
    }

- [ ] **Step 4: Add helper methods + `listUserCoupons`**

```java
    private void fillAvailableCursor(CouponCursorResultVO<CouponAvailableListVO> result, List<Coupon> list, int pageSize) {
        result.setHasMore(list.size() >= pageSize);
        if (!list.isEmpty()) {
            Coupon last = list.get(list.size() - 1);
            result.setNextTimestamp(last.getStartTime() != null
                    ? last.getStartTime().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
                    : null);
            result.setNextId(last.getId());
        }
    }

    @Override
    public Result listUserCoupons(CouponPageQueryReq req) {
        Long userId = UserHolder.get();
        QueryWrapper<UserCoupon> uw = new QueryWrapper<>();
        uw.eq("user_id", userId);

        if (req.getStatus() != null) {
            uw.eq("status", req.getStatus());
        }
        if (req.getKeyword() != null && !req.getKeyword().isBlank()) {
            QueryWrapper<Coupon> cw = new QueryWrapper<>();
            cw.like("name", req.getKeyword());
            List<Coupon> matched = couponMapper.selectList(cw);
            if (matched.isEmpty()) {
                CouponCursorResultVO<CouponUserListVO> result = new CouponCursorResultVO<>();
                result.setList(Collections.emptyList());
                result.setHasMore(false);
                return Result.ok(result);
            }
            uw.in("coupon_id", matched.stream().map(Coupon::getId).collect(Collectors.toList()));
        }
        if (req.getLastTimestamp() != null && req.getLastId() != null) {
            LocalDateTime cursorTime = LocalDateTime.ofInstant(
                    Instant.ofEpochMilli(req.getLastTimestamp()), ZoneId.systemDefault());
            uw.and(w -> w.lt("create_time", cursorTime)
                    .or(w2 -> w2.eq("create_time", cursorTime).lt("id", req.getLastId())));
        }
        uw.orderByDesc("create_time").orderByDesc("id");
        uw.last("LIMIT " + req.getPageSize());

        List<UserCoupon> userCoupons = userCouponMapper.selectList(uw);

        List<Long> couponIds = userCoupons.stream().map(UserCoupon::getCouponId).collect(Collectors.toList());
        Map<Long, Coupon> couponMap = couponIds.isEmpty() ? Collections.emptyMap()
                : couponMapper.selectBatchIds(couponIds).stream()
                    .collect(Collectors.toMap(Coupon::getId, c -> c));

        List<CouponUserListVO> voList = userCoupons.stream().map(uc -> {
            Coupon c = couponMap.get(uc.getCouponId());
            if (c == null) return null;
            CouponUserListVO vo = new CouponUserListVO();
            vo.setId(uc.getId());
            vo.setName(c.getName());
            vo.setDescription(c.getDescription());
            vo.setDiscountAmount(c.getDiscountAmount());
            vo.setMinAmount(c.getMinAmount());
            vo.setType(c.getType());
            vo.setStatus(uc.getStatus());
            vo.setCreateTime(uc.getCreateTime());
            vo.setStartTime(c.getStartTime());
            vo.setEndTime(c.getEndTime());
            return vo;
        }).filter(Objects::nonNull).collect(Collectors.toList());

        CouponCursorResultVO<CouponUserListVO> result = new CouponCursorResultVO<>();
        result.setList(voList);
        result.setHasMore(voList.size() >= req.getPageSize());
        if (!voList.isEmpty()) {
            CouponUserListVO last = voList.get(voList.size() - 1);
            result.setNextTimestamp(last.getCreateTime() != null
                    ? last.getCreateTime().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
                    : null);
            result.setNextId(last.getId());
        }
        return Result.ok(result);
    }
```

- [ ] **Step 5: Add `getDetail`, `claim`, `flashSale` methods**

```java
    @Override
    public Result getDetail(Long id) {
        Coupon coupon = couponMapper.selectById(id);
        if (coupon == null) {
            throw new BusinessException(ResultConstant.BAD_REQUEST, "优惠券不存在");
        }
        CouponDetailVO vo = new CouponDetailVO();
        vo.setId(coupon.getId());
        vo.setName(coupon.getName());
        vo.setDescription(coupon.getDescription());
        vo.setDiscountAmount(coupon.getDiscountAmount());
        vo.setMinAmount(coupon.getMinAmount());
        vo.setType(coupon.getType());
        vo.setStock(coupon.getStock());
        vo.setRemainStock(coupon.getRemainStock());
        vo.setStartTime(coupon.getStartTime());
        vo.setEndTime(coupon.getEndTime());
        return Result.ok(vo);
    }

    @Override
    @Transactional
    public Result claim(Long id) {
        Long userId = UserHolder.get();
        Coupon coupon = couponMapper.selectById(id);
        if (coupon == null) {
            throw new BusinessException(ResultConstant.BAD_REQUEST, "优惠券不存在");
        }
        if (coupon.getRemainStock() <= 0) {
            throw new BusinessException(ResultConstant.BAD_REQUEST, "优惠券已领完");
        }
        QueryWrapper<UserCoupon> uw = new QueryWrapper<>();
        uw.eq("user_id", userId).eq("coupon_id", id);
        if (userCouponMapper.selectCount(uw) > 0) {
            throw new BusinessException(ResultConstant.BAD_REQUEST, "已领取过该优惠券");
        }
        coupon.setRemainStock(coupon.getRemainStock() - 1);
        couponMapper.updateById(coupon);
        UserCoupon uc = new UserCoupon();
        uc.setUserId(userId);
        uc.setCouponId(id);
        uc.setStatus(0);
        userCouponMapper.insert(uc);
        log.info("用户领取普通优惠券: userId={}, couponId={}", userId, id);
        return Result.ok();
    }

    @Override
    @Transactional
    public Result flashSale(Long id) {
        Long userId = UserHolder.get();
        Coupon coupon = couponMapper.selectById(id);
        if (coupon == null) {
            throw new BusinessException(ResultConstant.BAD_REQUEST, "优惠券不存在");
        }
        QueryWrapper<UserCoupon> uw = new QueryWrapper<>();
        uw.eq("user_id", userId).eq("coupon_id", id);
        if (userCouponMapper.selectCount(uw) > 0) {
            throw new BusinessException(ResultConstant.BAD_REQUEST, "已领取过该优惠券");
        }
        if (coupon.getRemainStock() <= 0) {
            throw new BusinessException(ResultConstant.BAD_REQUEST, "秒杀已结束");
        }
        coupon.setRemainStock(coupon.getRemainStock() - 1);
        couponMapper.updateById(coupon);
        UserCoupon uc = new UserCoupon();
        uc.setUserId(userId);
        uc.setCouponId(id);
        uc.setStatus(0);
        userCouponMapper.insert(uc);
        log.info("用户秒杀优惠券: userId={}, couponId={}", userId, id);
        return Result.ok();
    }
```

- [ ] **Step 6: Verify compilation**

```bash
cd D:\Parking\parkingsystem; .\mvnw compile -q 2>&1 | Select-String -Pattern "ERROR"
```

Expected: No errors.

---

### Task 4: Backend — Create CouponClientController

**Files:**
- Create: `src\main\java\com\xigeandwillian\parkingsystem\client\controller\CouponController.java`

**Consumes:** `CouponClientService`, `CouponPageQueryReq`.

- [ ] **Step 1: Create `CouponClientController`**

```java
package com.xigeandwillian.parkingsystem.client.controller;

import com.xigeandwillian.parkingsystem.client.dto.coupon.CouponPageQueryReq;
import com.xigeandwillian.parkingsystem.client.service.service.CouponClientService;
import com.xigeandwillian.parkingsystem.common.result.Result;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/coupons")
public class CouponController {

    private final CouponClientService couponClientService;

    @GetMapping("/available")
    public Result listAvailable(CouponPageQueryReq req) {
        log.info("获取可领取优惠券列表: lastTimestamp={}, lastId={}", req.getLastTimestamp(), req.getLastId());
        return couponClientService.listAvailable(req);
    }

    @GetMapping
    public Result listUserCoupons(CouponPageQueryReq req) {
        log.info("获取用户优惠券列表: lastTimestamp={}, lastId={}, status={}, keyword={}",
                req.getLastTimestamp(), req.getLastId(), req.getStatus(), req.getKeyword());
        return couponClientService.listUserCoupons(req);
    }

    @GetMapping("/{id}")
    public Result getDetail(@PathVariable Long id) {
        log.info("获取优惠券详情: id={}", id);
        return couponClientService.getDetail(id);
    }

    @PostMapping("/claim/{id}")
    public Result claim(@PathVariable Long id) {
        log.info("领取优惠券: id={}", id);
        return couponClientService.claim(id);
    }

    @PostMapping("/flash/{id}")
    public Result flashSale(@PathVariable Long id) {
        log.info("秒杀优惠券: id={}", id);
        return couponClientService.flashSale(id);
    }
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd D:\Parking\parkingsystem; .\mvnw compile -q 2>&1 | Select-String -Pattern "ERROR"
```

Expected: No errors.

---

### Task 5: Frontend — Update API functions

**Files:**
- Modify: `src\api\coupon.ts` (`D:\Parking\ParkingWeb\parking-client\src\api\coupon.ts`)

- [ ] **Step 1: Rewrite `api/coupon.ts`**

```ts
import request from './request'

export interface CursorParams {
  lastTimestamp?: number | null
  lastId?: number | null
  pageSize?: number
  status?: number | null
  keyword?: string
}

export function getAvailableCoupons(params: CursorParams) {
  return request.get('/coupons/available', { params })
}

export function claimCoupon(id: number) {
  return request.post(`/coupons/claim/${id}`)
}

export function flashSaleCoupon(id: number) {
  return request.post(`/coupons/flash/${id}`)
}

export function getUserCoupons(params: CursorParams) {
  return request.get('/coupons', { params: { scope: 'mine', ...params } })
}

export function getCouponDetail(id: number) {
  return request.get(`/coupons/${id}`)
}
```

---

### Task 6: Frontend — Create BottomSheet component

**Files:**
- Create: `src\components\BottomSheet.vue` (`D:\Parking\ParkingWeb\parking-client\src\components\BottomSheet.vue`)

- [ ] **Step 1: Create `BottomSheet.vue`**

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = ref(false)

watch(() => props.modelValue, (v) => {
  visible.value = v
})

function close() {
  visible.value = false
  emit('update:modelValue', false)
}

function onOverlayClick() {
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="visible" class="bottom-sheet-overlay" @click.self="onOverlayClick">
        <div class="bottom-sheet-panel" @click.stop>
          <div class="sheet-handle" />
          <div class="sheet-header">
            <span class="sheet-title">优惠券详情</span>
            <span class="sheet-close" @click="close">✕</span>
          </div>
          <div class="sheet-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
}
.bottom-sheet-panel {
  width: 100%;
  max-height: 75vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease-out;
}
.sheet-handle {
  width: 36px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  margin: 8px auto 0;
}
.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 8px;
}
.sheet-title {
  font-size: 16px;
  font-weight: 600;
}
.sheet-close {
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 4px;
}
.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px 24px;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
```

---

### Task 7: Frontend — Create usePullToRefresh composable

**Files:**
- Create: `src\composables\usePullToRefresh.ts` (`D:\Parking\ParkingWeb\parking-client\src\composables\usePullToRefresh.ts`)

- [ ] **Step 1: Create directories**

```bash
mkdir -p "D:\Parking\ParkingWeb\parking-client\src\composables"
```

- [ ] **Step 2: Create `usePullToRefresh.ts`**

```ts
import { ref, onMounted, onUnmounted } from 'vue'

export function usePullToRefresh(
  containerRef: HTMLElement | null,
  onRefresh: () => Promise<void>
) {
  const refreshing = ref(false)
  const pullDistance = ref(0)
  const threshold = 60

  let startY = 0
  let pulling = false

  function onTouchStart(e: TouchEvent) {
    if (containerRef && containerRef.scrollTop <= 0 && !refreshing.value) {
      startY = e.touches[0].clientY
      pulling = true
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!pulling || refreshing.value) return
    const delta = e.touches[0].clientY - startY
    if (delta > 0) {
      pullDistance.value = Math.min(delta * 0.4, 120)
    }
  }

  async function onTouchEnd() {
    if (!pulling) return
    pulling = false
    if (pullDistance.value >= threshold) {
      refreshing.value = true
      pullDistance.value = 0
      try {
        await onRefresh()
      } finally {
        refreshing.value = false
      }
    } else {
      pullDistance.value = 0
    }
  }

  onMounted(() => {
    if (containerRef) {
      containerRef.addEventListener('touchstart', onTouchStart, { passive: true })
      containerRef.addEventListener('touchmove', onTouchMove, { passive: true })
      containerRef.addEventListener('touchend', onTouchEnd, { passive: true })
    }
  })

  onUnmounted(() => {
    if (containerRef) {
      containerRef.removeEventListener('touchstart', onTouchStart)
      containerRef.removeEventListener('touchmove', onTouchMove)
      containerRef.removeEventListener('touchend', onTouchEnd)
    }
  })

  return { refreshing, pullDistance }
}
```

---

### Task 8: Frontend — Rewrite coupon store

**Files:**
- Modify: `src\stores\coupon.ts` (`D:\Parking\ParkingWeb\parking-client\src\stores\coupon.ts`)

- [ ] **Step 1: Rewrite `coupon.ts`**

```ts
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import {
  getAvailableCoupons, claimCoupon, flashSaleCoupon,
  getUserCoupons, getCouponDetail
} from '../api/coupon'
import type { CursorParams } from '../api/coupon'

export interface CouponInfo {
  id: number
  name: string
  description?: string
  discountAmount: number
  minAmount: number
  type: number
  startTime: string
  endTime: string
  status?: number
  stock?: number
  remainStock?: number
}

interface TabState {
  items: CouponInfo[]
  cursor: { timestamp: number | null; id: number | null }
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
}

function initialTabState(): TabState {
  return { items: [], cursor: { timestamp: null, id: null }, hasMore: true, loading: false, loadingMore: false }
}

export const useCouponStore = defineStore('coupon', () => {
  const available = reactive<TabState>(initialTabState())
  const mine = reactive<TabState & { status: number | null; keyword: string }>({
    ...initialTabState(),
    status: 0,
    keyword: ''
  })
  const detail = ref<CouponInfo | null>(null)
  const detailLoading = ref(false)

  async function refreshAvailable() {
    available.loading = true
    available.cursor = { timestamp: null, id: null }
    available.hasMore = true
    try {
      const res: any = await getAvailableCoupons({ pageSize: 10 })
      const d = res.data
      available.items = d.list || []
      available.cursor = { timestamp: d.nextTimestamp, id: d.nextId }
      available.hasMore = d.hasMore
    } finally {
      available.loading = false
    }
  }

  async function loadMoreAvailable() {
    if (!available.hasMore || available.loadingMore) return
    available.loadingMore = true
    try {
      const res: any = await getAvailableCoupons({
        lastTimestamp: available.cursor.timestamp,
        lastId: available.cursor.id,
        pageSize: 10
      })
      const d = res.data
      available.items.push(...(d.list || []))
      available.cursor = { timestamp: d.nextTimestamp, id: d.nextId }
      available.hasMore = d.hasMore
    } finally {
      available.loadingMore = false
    }
  }

  async function refreshMine() {
    mine.loading = true
    mine.cursor = { timestamp: null, id: null }
    mine.hasMore = true
    try {
      const params: CursorParams = { pageSize: 10 }
      if (mine.status !== null) params.status = mine.status
      if (mine.keyword) params.keyword = mine.keyword
      const res: any = await getUserCoupons(params)
      const d = res.data
      mine.items = d.list || []
      mine.cursor = { timestamp: d.nextTimestamp, id: d.nextId }
      mine.hasMore = d.hasMore
    } finally {
      mine.loading = false
    }
  }

  async function loadMoreMine() {
    if (!mine.hasMore || mine.loadingMore) return
    mine.loadingMore = true
    try {
      const params: CursorParams = {
        lastTimestamp: mine.cursor.timestamp,
        lastId: mine.cursor.id,
        pageSize: 10
      }
      if (mine.status !== null) params.status = mine.status
      if (mine.keyword) params.keyword = mine.keyword
      const res: any = await getUserCoupons(params)
      const d = res.data
      mine.items.push(...(d.list || []))
      mine.cursor = { timestamp: d.nextTimestamp, id: d.nextId }
      mine.hasMore = d.hasMore
    } finally {
      mine.loadingMore = false
    }
  }

  async function setMineStatus(status: number | null) {
    mine.status = status
    await refreshMine()
  }

  async function setMineKeyword(keyword: string) {
    mine.keyword = keyword
    await refreshMine()
  }

  async function fetchDetail(id: number) {
    detailLoading.value = true
    detail.value = null
    try {
      const res: any = await getCouponDetail(id)
      detail.value = res.data || null
    } finally {
      detailLoading.value = false
    }
  }

  async function claim(id: number) {
    await claimCoupon(id)
    await refreshMine()
  }

  async function flashSale(id: number) {
    await flashSaleCoupon(id)
    await refreshMine()
  }

  return {
    available, mine, detail, detailLoading,
    refreshAvailable, loadMoreAvailable,
    refreshMine, loadMoreMine,
    setMineStatus, setMineKeyword,
    fetchDetail, claim, flashSale
  }
})
```

---

### Task 9: Frontend — Rewrite Coupons.vue

**Files:**
- Modify: `src\views\Coupons.vue` (`D:\Parking\ParkingWeb\parking-client\src\views\Coupons.vue`)

**Consumes:** `useCouponStore`, `BottomSheet.vue`, `usePullToRefresh`, `useInfiniteScroll` from @vueuse/core.

- [ ] **Step 1: Rewrite `Coupons.vue` — script section**

```vue
<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useInfiniteScroll } from '@vueuse/core'
import { useCouponStore } from '../stores/coupon'
import BottomSheet from '../components/BottomSheet.vue'
import { usePullToRefresh } from '../composables/usePullToRefresh'

const router = useRouter()
const store = useCouponStore()

const activeTab = ref('available')
const scrollContainer = ref<HTMLElement | null>(null)
const sentinel = ref<HTMLElement | null>(null)
const showDetail = ref(false)
const detailItem = ref<typeof store.detail.value>(null)

const mineStatusLabels = ['待使用', '已使用', '已过期']

onMounted(async () => {
  await store.refreshAvailable()
  await store.refreshMine()
})

function onTabChange(tab: string) {
  activeTab.value = tab
  nextTick(() => {
    scrollContainer.value = document.querySelector('.scroll-container')
  })
}

// Infinite scroll
useInfiniteScroll(
  sentinel,
  async () => {
    if (activeTab.value === 'available') {
      await store.loadMoreAvailable()
    } else {
      await store.loadMoreMine()
    }
  },
  { distance: 10 }
)

// Pull to refresh
const { refreshing, pullDistance } = usePullToRefresh(scrollContainer.value, async () => {
  if (activeTab.value === 'available') {
    await store.refreshAvailable()
  } else {
    await store.refreshMine()
  }
})

async function onShowDetail(coupon: any) {
  detailItem.value = null
  await store.fetchDetail(coupon.id)
  detailItem.value = store.detail.value
  showDetail.value = true
}

async function onClaimFromDetail() {
  if (!detailItem.value) return
  try {
    if (detailItem.value.type === 1) {
      await store.flashSale(detailItem.value.id)
      ElMessage.success('秒杀成功！')
    } else {
      await store.claim(detailItem.value.id)
      ElMessage.success('领取成功')
    }
    showDetail.value = false
  } catch {
    // handled by interceptor
  }
}

async function onStatusChange(status: number | null) {
  await store.setMineStatus(status)
}

let searchTimer: ReturnType<typeof setTimeout>
function onSearchInput(val: string) {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.setMineKeyword(val)
  }, 300)
}

function getStatusText(status?: number) {
  return status === 0 ? '未使用' : status === 1 ? '已使用' : '已过期'
}
</script>
```

- [ ] **Step 2: Add template section**

```vue
<template>
  <div class="page">
    <div class="back-header" @click="router.back()">
      <el-icon :size="20"><ArrowLeft /></el-icon>
      <span class="back-text">优惠券</span>
    </div>

    <div class="coupon-tabs">
      <div class="tab-item" :class="{ active: activeTab === 'available' }" @click="onTabChange('available')">
        可领取
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'mine' }" @click="onTabChange('mine')">
        我的优惠券
      </div>
    </div>

    <!-- Available tab -->
    <div v-show="activeTab === 'available'" v-loading="store.available.loading" class="scroll-container">
      <!-- Pull indicator -->
      <div v-if="refreshing" class="pull-indicator">刷新中...</div>
      <div v-else-if="pullDistance > 0" class="pull-indicator" :style="{ height: pullDistance + 'px' }">
        {{ pullDistance >= 60 ? '释放刷新' : '继续下拉刷新' }}
      </div>

      <div class="coupon-list">
        <div v-for="c in store.available.items" :key="c.id" class="card coupon-card"
             :class="{ flash: c.type === 1 }" @click="onShowDetail(c)">
          <div class="coupon-left">
            <div class="coupon-amount">
              <span class="amount-symbol">¥</span>
              <span class="amount-value">{{ c.discountAmount }}</span>
            </div>
            <div class="coupon-min">满{{ c.minAmount }}可用</div>
          </div>
          <div class="coupon-divider" />
          <div class="coupon-right">
            <div class="coupon-name">{{ c.name }}</div>
            <div class="coupon-desc">{{ c.description }}</div>
            <div class="coupon-extra">
              <span class="coupon-date">{{ c.startTime }} ~ {{ c.endTime }}</span>
            </div>
          </div>
        </div>
        <div v-if="store.available.loadingMore" class="list-footer">正在加载更多...</div>
        <div v-else-if="!store.available.hasMore && store.available.items.length > 0" class="list-footer">— 没有更多了 —</div>
        <div v-if="store.available.items.length === 0" class="empty-state">
          <el-empty description="暂无可用优惠券" />
        </div>
      </div>
      <div ref="sentinel" class="sentinel" />
    </div>

    <!-- Mine tab -->
    <div v-show="activeTab === 'mine'" class="mine-container">
      <!-- Status tabs -->
      <div class="sub-tabs">
        <div class="sub-tab" :class="{ active: store.mine.status === null }" @click="onStatusChange(null)">全部</div>
        <div v-for="(label, idx) in mineStatusLabels" :key="idx" class="sub-tab"
             :class="{ active: store.mine.status === idx }" @click="onStatusChange(idx)">
          {{ label }}
        </div>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <el-icon :size="16"><Search /></el-icon>
        <input class="search-input" placeholder="输入券名搜索" @input="onSearchInput(($event.target as HTMLInputElement).value)" />
      </div>

      <!-- List -->
      <div v-loading="store.mine.loading" class="scroll-container">
        <div v-if="refreshing" class="pull-indicator">刷新中...</div>
        <div v-else-if="pullDistance > 0" class="pull-indicator" :style="{ height: pullDistance + 'px' }">
          {{ pullDistance >= 60 ? '释放刷新' : '继续下拉刷新' }}
        </div>

        <div class="coupon-list">
          <div v-for="c in store.mine.items" :key="c.id" class="card coupon-card mine"
               :class="{ used: c.status === 1, expired: c.status === 2 }" @click="onShowDetail(c)">
            <div class="coupon-left">
              <div class="coupon-amount">
                <span class="amount-symbol">¥</span>
                <span class="amount-value">{{ c.discountAmount }}</span>
              </div>
              <div class="coupon-min">满{{ c.minAmount }}可用</div>
            </div>
            <div class="coupon-divider" />
            <div class="coupon-right">
              <div class="coupon-name">{{ c.name }}</div>
              <div class="coupon-desc">{{ c.description }}</div>
              <div class="coupon-extra">
                <span class="coupon-status" :class="{ 'status-used': c.status === 1, 'status-expired': c.status === 2 }">
                  {{ getStatusText(c.status) }}
                </span>
                <span class="coupon-date">{{ c.startTime }} ~ {{ c.endTime }}</span>
              </div>
              <el-button v-if="c.status === 0" size="small" round type="primary" @click.stop="">去使用</el-button>
            </div>
          </div>
          <div v-if="store.mine.loadingMore" class="list-footer">正在加载更多...</div>
          <div v-else-if="!store.mine.hasMore && store.mine.items.length > 0" class="list-footer">— 没有更多了 —</div>
          <div v-if="store.mine.items.length === 0" class="empty-state">
            <el-empty description="暂无优惠券" />
          </div>
        </div>
        <div ref="sentinel" class="sentinel" />
      </div>
    </div>

    <!-- BottomSheet detail -->
    <BottomSheet v-model="showDetail">
      <div v-loading="store.detailLoading" class="detail-content">
        <div v-if="detailItem" class="detail-body">
          <div class="detail-amount-area">
            <div class="detail-amount">
              <span class="detail-symbol">¥</span>
              <span class="detail-value">{{ detailItem.discountAmount }}</span>
            </div>
            <div class="detail-min">满{{ detailItem.minAmount }}可用</div>
          </div>
          <div class="detail-info">
            <div class="info-row"><span class="info-label">名称</span><span>{{ detailItem.name }}</span></div>
            <div class="info-row"><span class="info-label">描述</span><span>{{ detailItem.description }}</span></div>
            <div class="info-row"><span class="info-label">类型</span><span>{{ detailItem.type === 1 ? '秒杀券' : '普通券' }}</span></div>
            <div class="info-row"><span class="info-label">总库存</span><span>{{ detailItem.stock }} 张</span></div>
            <div class="info-row"><span class="info-label">剩余</span><span>{{ detailItem.remainStock }} 张</span></div>
            <div class="info-row"><span class="info-label">有效期</span><span>{{ detailItem.startTime }} ~ {{ detailItem.endTime }}</span></div>
          </div>
        </div>
        <div v-if="detailItem" class="detail-action">
          <el-button v-if="activeTab === 'available'" type="primary" round class="action-btn"
                     @click="onClaimFromDetail">
            {{ detailItem.type === 1 ? '秒杀抢购' : '立即领取' }}
          </el-button>
          <el-button v-else-if="detailItem.status === 0" type="primary" round class="action-btn">
            去使用
          </el-button>
          <div v-else class="status-tag">{{ getStatusText(detailItem.status) }}</div>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
```

- [ ] **Step 3: Add style section**

```vue
<style scoped>
.back-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.back-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}
.coupon-tabs {
  display: flex;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 13px;
  color: #666;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.tab-item.active {
  background: #fff;
  color: #409EFF;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0,0,0,0.06);
}

.sub-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.sub-tab {
  padding: 4px 14px;
  font-size: 13px;
  color: #666;
  border-radius: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.sub-tab.active {
  background: #409EFF;
  color: #fff;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
}
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}
.search-input::placeholder {
  color: #bbb;
}

.scroll-container {
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.pull-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999;
  transition: height 0.2s;
}
.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.coupon-card {
  display: flex;
  align-items: stretch;
  padding: 0;
  overflow: hidden;
  min-height: 110px;
}
.coupon-card.flash {
  background: linear-gradient(135deg, #fff5f5, #fff0f0);
}
.coupon-card.mine.used { opacity: 0.6; }
.coupon-card.mine.expired { opacity: 0.4; }
.coupon-left {
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  flex-shrink: 0;
}
.coupon-amount {
  display: flex;
  align-items: baseline;
  color: #F56C6C;
}
.amount-symbol { font-size: 14px; }
.amount-value { font-size: 32px; font-weight: 700; }
.coupon-min {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}
.coupon-divider {
  width: 1px;
  background: repeating-linear-gradient(to bottom, #e8e8e8 0, #e8e8e8 6px, transparent 6px, transparent 12px);
  flex-shrink: 0;
}
.coupon-right {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}
.coupon-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}
.coupon-desc {
  font-size: 12px;
  color: #999;
}
.coupon-extra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #bbb;
  margin-top: auto;
}
.coupon-right .el-button {
  position: absolute;
  right: 16px;
  bottom: 14px;
}
.coupon-status { font-weight: 500; }
.status-used { color: #999; }
.status-expired { color: #ccc; }
.empty-state { margin-top: 60px; }
.list-footer {
  text-align: center;
  font-size: 12px;
  color: #bbb;
  padding: 16px 0;
}
.sentinel { height: 1px; }

.detail-amount-area {
  text-align: center;
  padding: 20px 0 24px;
}
.detail-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  color: #F56C6C;
}
.detail-symbol { font-size: 18px; }
.detail-value { font-size: 42px; font-weight: 700; }
.detail-min { font-size: 13px; color: #999; margin-top: 4px; }
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.info-label { color: #999; }
.detail-action {
  padding: 20px 0 12px;
}
.action-btn { width: 100%; }
.status-tag {
  text-align: center;
  font-size: 14px;
  color: #999;
  padding: 10px 0;
}
</style>
```

- [ ] **Step 4: Build check**

```bash
cd D:\Parking\ParkingWeb\parking-client; npx vue-tsc --noEmit 2>&1 | Select-String -Pattern "error" -NotMatch "node_modules"
```

Expected: No type errors (ignore node_modules).
