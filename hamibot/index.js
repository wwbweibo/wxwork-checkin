/**
 * 检查无障碍服务是否已经启用
 * auto.waitFor()则会在在无障碍服务启动后继续运行
 * https://docs.hamibot.com/reference/widgetsBasedAutomation
 */
 importClass(android.content.Context);
 const { dingtalk, stepInterval, awakeningDelayTime, quickChecking, checkingTime, pwd, holidayUrl } = hamibot.env
 auto.waitFor()
 if (!shouldCheckIn()) {
   hamibot.exit()
 }
 // 添加随机的时间延迟
 let delay = random(1, 100)
 //sleep(1000 * delay)
 unlockIfNeed()
 sleep(1000)
 home()
 sleep(1000)
 toastLog('拉起企业微信,准备打卡。。。')
 app.launch("com.tencent.wework");
 
 let quick = false
 if (quickChecking == 1 || quickChecking == '1') {
     quick = quickChecking * 1 == 1
     let checkingHour = checkingTime.split(':')[0]
     let checkingMin = checkingTime.split(':')[1]
     let currentHour = new Date().getHours()
     let currentMin = new Date().getMinutes()
     if (currentHour > checkingHour * 1) {
         // 迟到或者下班卡
         quick = false
     } else if (currentMin <= checkingMin * 1 && quick) {
         quick = true
     } else {
         // 迟到或者下班卡
         quick = false
     }
 }
 
 if (quick) {
     check()
 } else {
     // 切换到 工作台
     stepClick('工作台')
     // 切换到打卡页
     stepClick('打卡')
 }
 
 
 function unlockIfNeed() {
     device.wakeUpIfNeeded();
     if (!isLocked()) {
         log("没有锁屏无需解锁");
         return;
     }
     enterPwd();
 
     log("解锁完毕");
 }
 function enterPwd() {
     sleep(2000);
 
     swipe(width / 2, height / 2, width / 2, 0, 500);
 
     //点击
     if (text(0).clickable(true).exists()) {
         for (var i = 0; i < pwd.length; i++) {
             a = pwd.charAt(i)
             sleep(200);
             text(a).clickable(true).findOne().click()
         }
     } else {
         for (var i = 0; i < pwd.length; i++) {
             a = pwd.charAt(i)
             sleep(200);
             desc(a).clickable(true).findOne().click()
         }
     }
 }
 
 function stepClick(matchStr) {
     console.log('正在匹配 --- ', matchStr)
     sleep(stepInterval)
     let step = text(matchStr).findOne(1000)
     if (step) {
         console.log('匹配成功')
         // let stepLeft = step.bounds().left + 15
         // let stepTop = step.bounds().top + 10
         // console.log(stepLeft, stepTop)
         if (matchStr !== '打卡') {
             // click(stepLeft, stepTop)
             while (!click(matchStr));
         } else {
             while (!click('打卡'));
             sleep(stepInterval)
             signAction()
         }
     } else if (matchStr == '打卡') {
         console.log('滑动屏幕再次匹配')
         let { height, width } = device
         let x = width / 2
         let y1 = (height / 3) * 2
         let y2 = height / 3
         let swipeResult = swipe(x, y1, x + 5, y2, 500)
         if (swipeResult) {
             sleep(stepInterval / 2)
             stepClick(matchStr)
         }
     } else {
         console.log('匹配失败,后退再次匹配')
         back()
         sleep(stepInterval)
         stepClick(matchStr)
     }
 }
 
 // 打卡
 function signAction() {
     toastLog('signAction 开始执行')
     let signIn = text('上班打卡').findOne(1000)
     let signOut = text('下班打卡').findOne(1000)
     if (signIn) {
         let stepLeft = signIn.bounds().left + 10
         let stepTop = signIn.bounds().top + 10
         click(stepLeft, stepTop)
         check()
     } else if (signOut) {
         let stepLeft = signOut.bounds().left + 10
         let stepTop = signOut.bounds().top + 10
         click(stepLeft, stepTop)
         check()
     } else {
         toastLog('打卡未完成,正在检查打卡状态')
         resultNotify('打卡未完成,正在检查打卡状态')
         check()
     }
 }
 
 // 判断打卡是否完成
 function check() {
     sleep(stepInterval)
     let msg = ''
     let flagIn =
         textEndsWith('上班·正常').findOne(1000) ||
         textStartsWith('上班自动打卡·正常').findOne(1000)
     let flagIn2 = textStartsWith('迟到打卡').findOne(1000)
     let flagOut =
         textEndsWith('下班·正常').findOne(1000) ||
         textStartsWith('今日打卡已完成').findOne(1000)
     let flagInAdvance =
         textStartsWith('你早退了').findOne(1000) &&
         textEndsWith('确认打卡').findOne(1000)
 
     if (flagIn) {
         toastLog('打卡完成')
         msg = '上班打卡成功'
     } else if (flagIn2) {
         toastLog('打卡完成')
         msg = '迟到打卡 完成'
     } else if (flagOut) {
         toastLog('打卡完成')
         msg = '下班打卡成功'
     } else if (flagInAdvance) {
         toastLog('已经打过上班卡了!')
         msg = '已经打过上班卡了!'
     } else {
         toastLog('打卡失败!')
         msg = '打卡失败!'
     }
 
 
     resultNotify(msg)
 
 
     let dd = new Date()
     let years = dd.getFullYear()
     let mouths = dd.getMonth() + 1
     let days = dd.getDate()
     let hours = dd.getHours()
     let minutes = dd.getMinutes()
     mouths = mouths < 10 ? '0' + mouths : mouths
     days = days < 10 ? '0' + days : days
     hours = hours < 10 ? '0' + hours : hours
     minutes = minutes < 10 ? '0' + minutes : minutes
     let formatDate =
         years + '-' + mouths + '-' + days + ' ' + hours + ':' + minutes
 
     hamibot.postMessage(formatDate + ' ' + msg)
     hamibot.exit()
 }
 
 function shouldCheckIn() {
   let response = http.get(holidayUrl)
   if (response.statusCode != '200') {
     resultNotify("请求假期数据失败，请进行手动打卡")
   } else {
     let result = JSON.parse(response.body.string())
     if (result.is_holiday) {
       resultNotify("今天是假期，不用打卡！")
          return false
     } else {
       return true
     }
   }
 }
 
 /**
  * 调用钉钉机器人推送打卡结果
  * @param {string} result 打卡结果
  */
 function resultNotify(result) {
     r = http.postJson(dingtalk, {
         "text": {
             "content": "打卡结果：" + result
         },
         "msgtype": "text"
     })
     toastLog(r.statusCode)
     toastLog(r.body.string())
 }
 
 function unlockIfNeed() {
     device.wakeUp();
       sleep(1000)
     if (!isLocked()) {
           toastLog("没有锁屏无需解锁");
         return;
     }
       swipe(500, 1000, 500, 100, 500)
     enterPwd();
     log("解锁完毕");
 }
 
 function enterPwd() {
     //点击
     if (text(0).clickable(true).exists()) {
         for (var i = 0; i < pwd.length; i++) {
             a = pwd.charAt(i)
             sleep(200);
             click(a)
         }
     } else {
         for (var i = 0; i < pwd.length; i++) {
             a = pwd.charAt(i)
             click(a)
             sleep(200);
         }
     }
 }
 
 function isLocked() {
     var km = context.getSystemService(Context.KEYGUARD_SERVICE);
     return km.isKeyguardLocked() && km.isKeyguardSecure();
 }
 