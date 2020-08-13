const puppeteer = require('puppeteer');

if (!process.env.EMAIL || !process.env.PASSWORD) {
  throw new Error('環境変数にEMAILまたはPASSWORDが指定されていません')
}

let error = null
const main = async () => {
  const goToOpt = {waitUntil: ['load', 'networkidle0']}

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    // id.moneyforward.com で直接ログインすると、 moneyforward.com にはログインできない
    // moneyforward.com からログインページに移動すること
    await page.goto('https://moneyforward.com/', goToOpt);
    await page.click('a[href="/users/sign_in"]')
    // XXX click しただけではページが真っ白なまま
    // goto で移動し直す
    await page.goto(page.url(), goToOpt);
    // メールアドレスによる認証ページへ移動
    // click だと input[type="email"] が見つからない場合がある
    const signinUrl = await page.evaluate(
        () => Array.from(
          document.querySelectorAll('.buttonWrapper a:nth-child(1)'),
          a => a.getAttribute('href')
        )
      );
    await page.goto(`https://id.moneyforward.com${signinUrl[0]}`, goToOpt);

    await page.type('input[type="email"]', process.env.EMAIL);
    await page.click('input[type="submit"]')

    await page.type('input[type="password"]', process.env.PASSWORD);
    await page.click('input[type="submit"]')

    await page.goto('https://moneyforward.com/accounts', goToOpt)

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

    return true
  } catch (e) {
    error = e
    return false
  } finally {
    await browser.close()
  }
}

(async () => {
  let retries = 0
  let ok = false
  while (retries++ < 10) {
    ok = await main()
    if (ok) {
      break;
    }
  }
  if (!ok) {
    throw error
  }
})()
