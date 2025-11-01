# WebAuthn 自动登录功能

## 功能说明

已经使用 WebAuthn 绑定的设备，下次打开网页时会自动使用上次的用户名进行 WebAuthn 认证登录。

## 实现原理

1. **保存用户名**：用户通过 WebAuthn 成功登录后，系统会将用户名保存到 `localStorage` 中
2. **自动检测**：下次打开登录页面时，系统会自动：
   - 读取上次登录的用户名
   - 检查该用户是否绑定了 WebAuthn 设备
   - 如果有绑定设备，自动触发 WebAuthn 认证流程
3. **用户体验**：用户只需通过指纹、面部识别等生物识别方式确认身份即可完成登录

## 使用流程

### 首次绑定设备
1. 在登录页面输入用户名和密码
2. 点击"绑定 WebAuthn 设备"按钮
3. 输入邀请码
4. 按照浏览器提示完成设备绑定（指纹、面部识别等）

### 后续自动登录
1. 打开登录页面
2. 系统自动识别上次登录的用户名
3. 自动弹出 WebAuthn 认证提示
4. 用户确认生物识别即可完成登录

## 技术细节

### 修改的文件
- `src/components/LoginPage.vue`

### 主要改动
1. 添加 `autoAuthAttempted` 状态，防止重复自动认证
2. 修改 `loginWithWebAuthn` 函数，添加 `silent` 参数支持静默认证
3. 新增 `tryAutoWebAuthnLogin` 函数，实现自动认证逻辑
4. 在 `onMounted` 生命周期中调用自动认证
5. 成功登录后保存用户名到 `localStorage`
6. 添加自动认证提示 UI

### 数据存储
- `localStorage.lastUsername`：存储上次成功登录的用户名

## 安全性说明

- 只保存用户名，不保存任何密码或认证凭证
- WebAuthn 认证仍需要用户的生物识别确认
- 用户可以随时取消自动认证流程
- 符合 WebAuthn 标准的安全要求

## 浏览器兼容性

需要浏览器支持：
- WebAuthn API
- localStorage
- 生物识别硬件（指纹识别器、面部识别摄像头等）

支持的浏览器：
- Chrome 67+
- Firefox 60+
- Safari 13+
- Edge 18+
