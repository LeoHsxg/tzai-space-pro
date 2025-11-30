### 1. 「我一直以為後端就是直接往不知道哪裡發東西，怎麼感覺最麻煩的是把函式網站架起來，好累，為什麼要特地把函式上傳變成一個網站啊？它們的關係是什麼？」

- 核心概念：提供一個「對外」能呼叫的介面 (API endpoint)

  後端的本質常常就是「**把你的程式邏輯，包裝成可以被前端或外部系統呼叫的方式**」。而要對外呼叫，最常見的方式就是 HTTP Request/Response。

- Firebase Functions、Cloud Run 之類的服務，在底層都會幫你用一個「Web 伺服器 (Server)」去監聽特定的連接埠 (port，常見是 8080)。這樣你對外就會有個網址 (URL)，你只要丟 request 過去就可以觸發你的程式碼。

- 為什麼聽起來像「要把它部署成一個網站」？

  因為原理上來說，無論是傳統的 Web Server（像 Express、Koa）或是 Firebase Functions 都需要在網路世界中「**有個地方(主機)一直跑著程式，監聽 Request**」。所以聽起來就像「架一個網站」。

  事實上，Firebase Functions 幫你把「function (後端程式)」包成「一個對外提供的 Web 服務」。你只要負責寫程式碼，部署之後，就自動有一個 URL。

- 總結一下關係

  你在本地寫好的後端邏輯 (function) -> Firebase 幫你包成 Docker 容器 -> 在雲端執行 -> 外部拿到一個 HTTPS URL -> 前端/客戶端可呼叫。這是現代雲端後端開發的常態，省去很多「自己架伺服器 + 架網頁服務 + 管理 VM」的麻煩，但難免第一次使用時也要接受一些規則與設定。

### 2. 「一個網站只能架一個函式嗎？」

- 不只可以架一個

  在 Firebase Functions（不管是 1st Gen 還是 2nd Gen），你可以在同一個專案裡面定義多個 exports.someFunction = functions.https.onRequest(...)，最後一併 deploy。

  - 1st Gen 時，各函式會對應一個路徑，例如 https://<region>-<project-id>.cloudfunctions.net/someFunction

  - 2nd Gen 時，每個函式都會是個 Cloud Run Service，會有自己的 URL，但你可以為這些 Services 加上自訂網域或路由規則，整合成一個「對外」的網站入口。

- 想像：一個專案，多個 API endpoint

  你可能有一個 exports.addEventToCalendar、一個 exports.deleteEvent、一個 exports.checkoutCart、一個 exports.sendEmail … 等等。都在同一個 Firebase 專案中。只是它們各自成為「雲端函式」並對外提供 API。

你可以視情況把它們拆成好幾個檔案，反正只要在程式裡 exports.xxx 就都會被 Firebase deploy。

### 3. 「我快被搞到死掉了（癱）」

- 正常的狀態，習慣就好 xddd

  第一次碰雲端部署或後端服務，要理解「雲端怎麼幫你跑程式」「怎麼監聽 HTTP」「憑證/金鑰要放哪」「錯誤日誌在哪看」這一大堆事情，確實會覺得很繁瑣。有時候還會遇到各種奇怪的錯誤訊息。

- 好消息：解決第一輪痛苦後，後面就會順很多

  通常當你已經成功部署 1~2 次後，再做類似的事情就容易許多。

- 保持幽默、給自己一點時間

  雲端部署雖然有曲線，但這些服務（Firebase、Cloud Run、GCP）都是為了讓開發者不用從零開始架伺服器、配置網路、防火牆…等更深的基礎設施。

  事實上，我們已經避免了很多原本 DevOps 可能要做的繁雜設定——只是第一次嘗試雲端函式，也還是有不少細節要掌握。

別灰心，工程師大多都走過這種（或更痛的）部署之路，習慣了之後就不會覺得那麼崩潰了！加油～

後端程式連結：[https://addeventtocalendar-u5raioyw6q-uc.a.run.app](https://addeventtocalendar-u5raioyw6q-uc.a.run.app)
