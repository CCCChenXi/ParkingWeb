# 注册功能改造：短信验证码 + 自动登录

## 概述

将现有的「填写信息→提交→手动切回登录」注册流程改造为「填写信息→短信验证→自动登录」的完整流程，并完善 HTTP 错误码的用户提示。

## 涉及文件

| 文件 | 改动幅度 | 说明 |
|---|---|---|
| `src/api/user.ts` | 小 | 新增 `sendCode`，修改 `register` 参数 |
| `src/api/request.ts` | 中 | 对 auth 端点跳过拦截器通用错误消息 |
| `src/stores/user.ts` | 中 | 新增 `sendCode`，改造 `register` 自动保存 token |
| `src/views/Login.vue` | 大 | 表单 + 流程重构 |

**不变**: 登录功能、路由、其他页面、请求拦截器、401 拦截逻辑

## 改动详情

### 1. src/api/user.ts — API 层

```ts
// 新增
export function sendCode(phone: string) {
  return request.post('/user/send-code', { phone })
}

// 改造：增加 code 字段
export function register(data: { username: string; password: string; phone: string; code: string }) {
  return request.post('/user/register', data)
}
```

### 2. src/api/request.ts — 拦截器增强

**成功拦截器**: 对 auth 端点（`/user/register`, `/user/send-code`），业务码 `res.code !== 200` 时，不弹 `ElMessage.error`，仅 `return Promise.reject(new Error(res.message))`。其他端点行为不变。

**错误拦截器**:

- 401: 清除 token 和 userInfo，`ElMessage.error('登录已过期，请重新登录')`，跳转 `/login`
- 403: `ElMessage.error('无权限访问，请联系管理员')`
- 对 auth 端点：跳过通用 `ElMessage.error`，让 UI 层 catch 处理
- 对非 auth 端点：保持原有 `ElMessage.error(error.message || '网络错误')`

判断逻辑：`error.config?.url?.includes('/user/register')` 或 `includes('/user/send-code')`

### 3. src/stores/user.ts — Store 层

```ts
// 新增
async function sendCode(phone: string) {
  return apiSendCode(phone)
}

// 改造：自动登录
async function register(username: string, password: string, phone: string, code: string) {
  const res: any = await apiRegister({ username, password, phone, code })
  token.value = res.data.token
  userInfo.value = res.data.user
  localStorage.setItem('token', res.data.token)
  localStorage.setItem('user', JSON.stringify(res.data.user))
  return res
}
```

错误自动冒泡到 UI 层。

### 4. src/views/Login.vue — 视图层重构

#### 新增响应式变量

```ts
const confirmPassword = ref('')
const code = ref('')
const codeSending = ref(false)
const countdown = ref(0)
let timer: number | undefined
```

#### 注册表单（isRegister 时显示）

| 字段 | 类型 | 验证规则 |
|---|---|---|
| username | input | 非空 |
| phone | input | 11 位数字，以 1 开头 |
| password | password-input | 非空，≥ 6 位 |
| confirmPassword | password-input | === password |
| code | input + 发送按钮 | 6 位数字，非空 |

#### 发送验证码流程

```
点击按钮
  ├─ 校验手机号 → 失败 → ElMessage.warning('请输入正确的手机号')
  └─ 成功 → 按钮禁用 + loading
       ├─ API 成功 → 开启 60s 倒计时，按钮文字：${countdown}s后重新发送
       └─ API 失败 → 恢复按钮，显示错误
```

倒计时期间按钮禁用，`onBeforeUnmount` 和切换 `isRegister` 时 `clearInterval(timer)`。

#### 注册提交流程

```
点击注册
  ├─ 表单验证
  │   ├─ 手机号非法 → 阻止提交
  │   ├─ 确认密码不匹配 → ElMessage.warning('两次输入的密码不一致')
  │   └─ 验证码为空 → ElMessage.warning('请先获取验证码')
  └─ 通过 → loading = true
       ├─ HTTP 200 → 自动保存 token → ElMessage.success('注册成功') → router.push('/home')
       ├─ HTTP 400 → ElMessage.error('验证码错误，请重新输入')
       ├─ HTTP 500 → ElMessage.error('服务器异常，请稍后重试')
       ├─ 403 → ElMessage.error('无权限访问，请联系管理员')
       └─ 网络错误 → ElMessage.error('网络连接失败，请检查网络')
       └─ finally → loading = false
```

#### 手机号变更时

监听 `phone`，当手机号改变且 code 已发送过时，自动清空 `code` 重置倒计时，提示"手机号已变更，请重新发送验证码"。

#### 模式切换（登录↔注册）

切换 `isRegister` 时：重置 `confirmPassword`、`code`，清理倒计时。

## 错误提示映射

| HTTP 状态码 | 用户提示 |
|---|---|
| 400 | 验证码错误，请重新输入 |
| 401 | 登录已过期，请重新登录 |
| 403 | 无权限访问，请联系管理员 |
| 500 | 服务器异常，请稍后重试 |
| 网络超时/无响应 | 网络连接失败，请检查网络 |

## 边界情况处理

1. **拦截器冲突** — auth 端点跳过拦截器通用错误消息，由 UI 层自行处理
2. **倒计时泄漏** — `onBeforeUnmount` 清理 `setInterval`
3. **手机号中途变更** — 清空验证码 + 重置倒计时
4. **表单模式切换** — 重置注册专用字段 + 清理倒计时
5. **多次快速点击** — loading 状态 + 倒计时期间按钮禁用
6. **确认密码校验** — 提交前客户端校验
