## 如何備份分支狀態

### 方法一：GitHub 網頁版（github.com）

建立 Tag（推薦做法）

GitHub 網頁版沒有「單純建立 tag」的按鈕，最直接的路徑是透過 Releases 功能（建立 Release 的同時會順便建立 tag）：

1. 進到 repo 首頁 github.com/leohsxg/tzai-space-pro
2. 右側欄找到 Releases → 點 Create a new release（或網址直接打 /releases/new）
3. 在 Choose a tag 輸入框，打上 archive/photo-upload-feature，下面會出現「Create new tag: archive/photo-upload-feature on publish」
4. Target 選 main（要確認此時 main 還是現在這顆 commit b0ba7f9，還沒做刪除）
5. Release title 隨意填（例如「Photo upload feature archive」），Description 可以寫你想保留這個版本的原因
6. 下方有個選項可以勾 「Set as a pre-release」，這樣它不會被當成「最新正式版」顯示在 repo 首頁——建議勾起來，避免跟你實際的版本發布搞混
7. 點 Publish release，tag 就建立並推到遠端了

> 缺點：這個方法一定會附帶建立一個 Release 頁面，沒辦法只建 tag 不建 release。如果你不想要 repo 的 Releases 列表多一條紀錄，就改用下面的分支法。

建立 Archive 分支

1. 進到 repo 首頁，左上角分支切換的下拉選單（顯示目前分支名的那顆按鈕）
2. 直接在搜尋框打新名字，例如 archive/photo-upload-feature
3. 會出現「Create branch: archive/photo-upload-feature from 'main'」，點下去即可
這個方式乾淨很多，不會多出 Release 紀錄。

### 方法二：GitHub Desktop App

建立 Tag

1. 切到 History 分頁，找到你要標記的那顆 commit（現在 main 最上面那顆 系統公告與通知鈴鐺功能）
2. 在那顆 commit 上右鍵 → 選 Create Tag…
3. 輸入 tag 名稱，例如 archive/photo-upload-feature，按 Enter
4. 這時 tag 只存在本地，畫面上方會出現「Push origin」之類的按鈕（可能顯示 tag 數量），點下去把 tag 推上 GitHub

建立 Archive 分支

1. 上方 Current Branch 下拉選單 → New Branch
2. 輸入分支名稱 archive/photo-upload-feature，Base branch 選 main
點 Create Branch
3. 建立後上方會出現 Publish branch 按鈕，點下去推到遠端
   
---

## 一些問題答疑

### 1. Tag 跟 branch 差在哪

最關鍵的差異是**會不會自動移動**：

- **Branch** 是一個會跟著你的 commit 自動往前移動的指標。你在 `main` 上 commit，`main` 這個指標就跟著移到新的 commit 上。你可以一直在上面工作。
- **Tag** 建立之後就釘死在那一顆 commit 上，不會自動跟著移動。就算之後 main 往前推進了 100 個 commit，那個 tag 還是指著當初那一顆。

底層其實兩者都只是 `.git/refs/` 資料夾裡的一個檔案（裡面存著 commit 的 hash），結構上很像，**差別在於 git 怎麼「使用」它**：
- 你可以「站在」一個 branch 上工作，git 知道要自動更新它。
- 如果你 `checkout` 一個 tag，git 會把你丟進「detached HEAD」狀態——你技術上可以在那邊新增 commit，但這些 commit 不屬於任何 branch，沒有 branch 接住的話，之後可能會被 git 當垃圾清掉。Tag 本身的設計就不是給你「繼續工作」用的，它純粹是個「指標標籤」。

所以你會覺得路徑很不一樣是對的：branch 是給你開發用的活動空間；tag 是一個釘住歷史某一刻的標籤。

---

### 2. 斜線是約定俗成，沒錯——但有一個技術上的限制

整體來說你的理解是對的：git 本身完全不在乎你的分支叫 `feature/x` 還是 `feature-x` 還是 `蛤蛤蛤`，斜線純粹是人類自己發明的分類法（`feature/`、`bugfix/`、`release/`、`archive/`…）。

但有個真實的技術後果：因為 ref 是存成檔案路徑（`refs/heads/feature/photo-upload` 這串其實就是實際的檔案路徑，`feature` 變成一個資料夾），所以**你不能同時有一個叫 `feature` 的分支，又有一個叫 `feature/photo-upload` 的分支**——因為 git 沒辦法讓 `refs/heads/feature` 同時是一個檔案又是一個資料夾。除了這個限制，斜線完全只是命名習慣。

另外一個讓這個慣例流行起來的原因：GitHub 網頁版、GitHub Desktop、各種 Git GUI 工具看到斜線會自動把分支列表渲染成「資料夾」的樣子，所以用 `archive/xxx` 這種命名，在分支選單裡會自動幫你分組，是個附帶的好處。

---

### 3. Release 是什�麼

**Release 不是 git 的東西，是 GitHub 自己加上去的功能**（GitLab 也有類似的東西，但這是平台層級的功能，不是 git 核心概念）。

一個 Release 本質上是：
- **掛在一個 tag 上**（如果那個 tag 還不存在，建立 Release 時會順便幫你建好）
- 多了一個標題、一段可以寫 changelog 的說明（支援 Markdown）
- 可以附加檔案下載（例如打包好的執行檔、壓縮包）
- 會出現在 repo 的 Releases 頁面，watch 這個 repo 的人會收到通知
- 可以標記成 `Latest`、`Pre-release`、`Draft`

典型用途是「軟體版本發布」：你出了 v1.2.0，想讓使用者知道這個版本改了什麼、可以下載什麼檔案——這就是 Release 存在的目的。對你現在這個「單純想留個還原點」的需求來說，Release 是多餘的，只是因為網頁版要建立 tag 時，UI 把它跟 Release 綁在一起了，這也是我上一則訊息建議你也可以改用「建立分支」這個路徑來避開的原因。

---

### 4. Tag 名字可以長,你想的「短標籤」是另一種慣例

你的直覺沒有錯——tag 最常見的用法確實是短短的版本號，像 `v1.0.0`、`v2.3.1`，這是所謂的「語意化版本」（semantic versioning）慣例，用在**正式發布版本**的場合。

但這只是其中一種使用模式，不是規則。Git 對 tag 名稱的限制跟分支幾乎一樣寬鬆（不能有空白、不能有 `..` 之類的），長度跟內容隨便你取。

我建議 `archive/photo-upload-feature` 是因為它屬於**另一種使用模式**：不是「正式版本號」，而是「給自己留的備忘錄」。這種 tag 沒有版號可以遵循（你又不是真的要發布 v1.0），所以乾脆取一個一看就懂在幹嘛的描述性名字，半年後你回來看 tag 列表，`v3` 跟 `archive/photo-upload-feature` 比起來，後者一眼就知道是什麼、不用回去翻 commit log。

如果你還是想要短一點，當然也可以，比如 `archive-photo` 或 `pre-photo-removal`——兩種風格都合法，純粹看你想要「好記」還是「好認」。