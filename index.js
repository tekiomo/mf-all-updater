const puppeteer = require('puppeteer')

if (!process.env.EMAIL || !process.env.PASSWORD) {
  throw new Error('環境変数にEMAILまたはPASSWORDが指定されていません')
}

process.on('unhandledPromiseRejectionWarning', (error) => {
  throw error
})

puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox']
}).then(async browser => {
  process.on('unhandledRejection', (reason, p) => {
    console.error(`Unhandled Rejection at: Promise ${p}\nreason: ${reason}`)
    browser.close()
  })

  const page = await browser.newPage()
  const options = {
    userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; NP06; rv:11.0) like Gecko',
    viewport: {
      height: 1000,
      width: 1000
    }
  }
  await page.emulate(options)
  await page.goto('https://moneyforward.com/users/sign_in')
  console.log(`page opened: ${page.url()}`)

  await page.type('#sign_in_session_service_email', process.env.EMAIL)
  await page.type('#sign_in_session_service_password', process.env.PASSWORD)
  await page.click('input[type="submit"]')
  console.log('try signin...')
  await page.waitForNavigation({waitUntil: 'domcontentloaded'})
  console.log(`page opened: ${page.url()}`)

  await page.goto('https://moneyforward.com/accounts')
  console.log(`page opened: ${page.url()}`)

  // 押下可能な更新ボタンの数を調べる
  const buttonSelector = 'input:not(disabled)[type="submit"][name="commit"][value="更新"]'
  const buttonCount = await page.$$eval(buttonSelector, buttons => buttons.length)

  // table#account-table内のtrをひとつづつ確認し更新ボタンが存在したらクリック
  let i = 1
  let clickedCount = 0
  while (clickedCount < buttonCount) {
    // #registration-tableが2つあるので.accountsで絞るつらみ
    const trSelector = `section#registration-table.accounts table#account-table tr:nth-child(${i})`
    if (await page.$$eval(`${trSelector} ${buttonSelector}`, l => l.length)) {
      let account = await page.evaluate((sel) => {
        let element = document.querySelector(sel)
        if (element) {
          return element.textContent
            .replace(/\([\s\S]*/, '')
            .replace(/[\n\r]*/g, '')
        }
      }, `${trSelector} td:first-child`)

      console.info(account)

      await page.click(`${trSelector} ${buttonSelector}`)
      clickedCount++
    }
    i++
  }

  await browser.close()
})
