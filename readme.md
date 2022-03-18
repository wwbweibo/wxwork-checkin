# 企业微信自动打卡脚本

这是一个简单的企业微信打卡脚本，脚本的基础功能来自@hlsky1988 的 [WeChatCheckingIn](https://github.com/hlsky1988/WeChatCheckingIn), 并进行了优化和功能更新。

## 支持功能

- 原有功能请访问原项目，
- 为了简单，将消息推送更改到了钉钉群机器人（NTR狂喜）
- 添加了假期检查，配合hamibot的自动任务可以实现只有工作日打卡（需要独自部署假期服务，并配置假期数据）
- 添加了打卡时间的随机，延迟目前为（0-100s），可以自己改代码
- 手机解锁

## 假期服务

假期服务由rust编写（写的很烂，但是能用）

clone 本仓库到你的服务器，并使用 cargo 构建之后运行，服务将会在 `0.0.0.0:9999` 进行监听

### api

- `http[s]://<yourip>:9999/holiday`
  - 用于获取当天是否为假期
  - method: GET
  - param: 无
  - response
    - content-type: application/json
    - body:
      - today(string): 请求时的时间
      - is_holiday(bool): 指示当天是否为假期
    - example：
      ```json
      {"today":"2022-03-18","is_holiday":false}
      ```
- `http[s]://<yourip>:9999/holiday`
  - 用于获取当天是否为假期
  - method: POST
  - content-type: application/json
  - request body:
    - json array
    - example:
      ```json
      [
          {
              "period_start": "假期开始，格式为 yyyy-MM-dd HH:mm:ss",
              "period_end": "假期结束，格式为 yyyy-MM-dd HH:mm:ss",
              "is_holiday": "是否为假期，true｜false"
          }
      ]
      ```
  - response
    - content-type: plain/text
    - body: 如果成功返回 `set success`，否则将会返回 500 或者空响应