---
title: 第一篇:Hexo x Github Page
date: 2020-11-07 00:33:57
categories:
    - Blog

tags: 
    - hexo
    - github page
---
### 前言
在踏入coding的職場領域時，才逐漸意識到撰寫自己Blog的重要性。<!--more-->
* 將自己踩過的雷記下來，避免重複犯錯。
* 以菜鳥來說，在面試時也是可以當個拿出來說嘴的履歷。
* 在學習的路程上，受到了很多blog的幫助。<br>做為一個programmer，我能做的不多，將所學持續回饋是我能盡的微薄之力。
----------
### Blog的選擇
因為自己平常都是以**markdown**這個輕量的標記語言，紀錄自己遇到的問題或想法，所以一開始就鎖定透過撰寫markdown來發布內容的工具。
並且我是大量用**Github**保存我的任何創作，加入**git**和**Github**是很重要的。

#### 參考選項
* **Vue Press**: 因為平時都以Vue.js開發，目光自然有放在尤雨溪大神的新工具。
* **HackMD**: 一個各大Conf使用頻率很高的共筆軟體，支援很多markdown語法的擴展。
* **Notion**: 最近很火紅的筆記軟體，朋友一時之間大量入坑，介面看起來蠻漂亮的。
* **Hexo**: 在看Vue press文件時，有提到Vue目前文件還是用Hexo產生的。

#### 理由
> HackMD、Notion

在大學期間有不少的時間使用**HackMD**，他對於markdown的擴展語法支援頗高，對於分享內容有很大急迫性的話，的確是個相當好的選擇。
可惜我對於這個Blog的期待，不僅僅是放我的文筆紀錄，我還希望:
* 能夠使用自己購買的**domain**，辨識度高
* 放上自己履歷、Projects
* 平時偶有攝影作品，需要點樣式擴展性

基本上這兩個就是很純粹的筆記服務，除了內容展現，沒有其他的了。

> Vue Press

官方文件大概逛一圈，感覺是彈性挺大的，而且支援Vue component的引入<small>(雖然我不是很想在Blog上折騰太多XD)。</small><br>
不過試著配置一番後，實在說不上友好，我在調整想要的樣式時，官方文件和網路資源實在幫助不大。
如果想要開箱就用，Vue文件那種style是你的菜的話，**Vue Press**很推薦。

> Hexo

一開始就被它的主題功能吸引，雖然我是很想要高度訂製的外觀，但是要直接拓荒實在累了點啊... ...<br>
Hexo有預設categories、tags、亮暗切換和i18n多國語言等功能，完整的第三方主題一般也會在這幾個內建功能上做一些基本設定。

檔案結構也規劃的不錯，照著文檔放置檔案，搭配Hexo Cli，生成靜態檔案和發布到Github Page，可以放心的寫作，而不是在網頁功能上折騰。

----------
### Hexo x Github Page搭建
其實一開始是先去Hexo的官網看文件，但到部署階段我就混亂了。
* [部署文件](https://hexo.io/docs/github-pages.html)的中英文版本內容不一樣。
* 我想要main branch部署網頁(編譯後的靜態檔案)，另一個branch放置寫作內容。

> 後來找到[知乎](https://zhuanlan.zhihu.com/p/35668237?utm_source=ZHShareTargetIDMore&utm_medium=social&utm_oi=973100277712297984)上的文章，才成功搭建。

#### 步驟
* Github Page設定
* 安裝Hexo
* 連結Github和本地
* 寫文章、發布文章
* 綁定domain
* 加入第三方主題

#### Github Page設定
首先在Github創建一個Repository，並勾選README，先讓Repo有個東西
![img](https://i.imgur.com/4jqwWcW.png)

之後進入```⚙️settings```，選定main branch當作host的分支，主題隨便選一個就好。
![img](https://i.imgur.com/0nnR3vn.png)

現在你有了一個Github Page，如果Repository名稱設定是:
* ```<你的Github ID>.github.io```，則你的Github Page預設域名就是 
```https://<你的Github ID>.github.io```
* 其他名稱，則你的Github Page預設域名就是 
```https://<你的Github ID>.github.io/<Repository名稱>```
![img](https://i.imgur.com/JpRALOh.png)

#### 安裝Hexo
這個工具是基於Node.js的，所以先把環境和NPM裝起來吧。
之後進入terminal:
* ```npm i hexo-cli -g```，全域安裝hexo工具。
* ```hexo -v```，確認有安裝起來。

![img](https://i.imgur.com/4csMHrX.png)

之後找個喜歡的位置，在terminal輸入:
* ```hexo init <你想要的folder名稱>```，這會直接幫你建立對應名稱的資料夾，和生成必要的資料結構。
* 在資料夾下輸入 ```npm i```，下載```package.json```中相依的套件。
* 輸入 ```hexo g```生成編譯的靜態檔案。
* 輸入```hexo s```，啟動本地端server
* 在瀏覽器網址輸入 ```localhost:4000```，就可以預覽結果了。

![img](https://i.imgur.com/Jpx3WNd.png)

#### 連結Github和本地
打開Blog根目錄的```_config.yml```，這個是hexo的配置文件，在裡面找到```deploy```選項。

![img](https://i.imgur.com/Et0hF31.png)
* ```type```填git
* ```repository```填Github的項目地址
* ```branch``` 填main或master，視Github上的分支名稱為何。

>註 [IThome: Github從2020.10將master改名為main](https://www.ithome.com.tw/news/140094)

#### 寫文章、發布文章
* 安裝發布套件 ```npm i hexo-deployer-git```
* 如果你需要在Github的同一個Repo管理文章內容及hexo配置(也方便跨裝置編寫)，這時候切換到一個新branch，因為發布之後，main branch會被靜態檔案覆蓋。
* 輸入 ```hexo new post <文章標題>```，在```source/_posts```下就會多出一個```<文章標題>.md```的檔案。
* 在第二個branch上編寫完文件後，```hexo g```加上```hexo d```將整包網站部署上去。

這是發布用的main branch
![img](https://i.imgur.com/lMS3sbL.png)

這是編寫內容和配置的另一個branch，透過一般的```pull```、 ```push```操作即可。
![img](https://i.imgur.com/FlCzdwi.png)

#### 綁定domain
如果有個專屬域名，就綁定到Github Page上吧!
進入Github Repo的```⚙️settings```
* 在```Custom Domain```填進domain
* 並啟動Https

![img](https://i.imgur.com/UiTshL5.png)
此時可以查看，main branch的根目錄是不是出現了```CNAME```這個沒有後綴副檔名的檔案。
![img](https://i.imgur.com/o2YCN75.png)
如果沒有的話，自己在本地端的 ```/source```下新增```CNAME```，其內容就是你的domain。
之後再發布一次，Github的main branch就有CNAME了。
![img](https://i.imgur.com/9QqnQtp.png)

----------
### 遇到的問題

#### 部署時卡住不動
在首次的```hexo d```時，可能遇到滿螢幕的類似錯誤訊息。
```
warning: LF will be replaced by CRLF in xxxxx
The file will have its original line endings in your working directory.
```
將git的CRLF關掉就可以了
```
git config –global core.autocrlf false
```
雖然是內容農場，還是要附[來源](https://www.itread01.com/content/1546312562.html)

----------
### 結語
這篇文章主要講了如何讓Hexo成功的在Github Page host起來。
Hexo真的有很多的功能可以玩，設定起來也不難，保持了一定的設定彈性又不讓寫作者花費太多心思在架站上。

下一篇會講如何將第三方主題帶入，原本預設的是```landscape```主題。
主題除了外觀外，一些配置也幫你設定好了，甚至帶入了更多Hexo不提供的設置，大大減低拓荒的進度。

#### 參考來源
以下是我這次有參考到的網站:
* [Hexo官網](https://hexo.io/zh-tw/)
* [超详细Hexo+Github博客搭建小白教程](https://zhuanlan.zhihu.com/p/35668237?utm_source=ZHShareTargetIDMore&utm_medium=social&utm_oi=973100277712297984)
* [Git提交時提示 "The file will have its original line endings in your working directory"](https://www.itread01.com/content/1546312562.html)