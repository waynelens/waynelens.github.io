---
lang: zh-TW
translationKey: article-slug-shared-by-both-languages
status: draft
title: 文章標題
description: 一至兩句文章簡介，適合顯示在文章列表與搜尋結果中。
date: YYYY-MM-DD
tags:
  - 標籤一
  - 標籤二
cover: "https://media.waynelens.dev/path/to/cover.jpg"
# 文章上方輪播：只放這篇文章最精選的照片。
carouselImages:
  - "https://media.waynelens.dev/path/to/image-01.jpg"
  - "https://media.waynelens.dev/path/to/image-02.jpg"
# 文章底部照片集：收錄當天／當次拍攝的完整作品集合。
articleGalleryImages:
  - "https://media.waynelens.dev/path/to/cover.jpg"
  - "https://media.waynelens.dev/path/to/image-01.jpg"
  - "https://media.waynelens.dev/path/to/image-02.jpg"
# 全站照片牆：只放希望出現在 /gallery 的全站精選照片。
siteGalleryImages:
  - "https://media.waynelens.dev/path/to/image-01.jpg"
---

<!--
使用方式：
1. 複製到 content/blog/zh-TW/ 或 content/blog/en/。
2. 檔名使用 YYYY-MM-DD-article-slug.md。
3. 英文版將 lang 改為 en；雙語版本必須使用相同的 translationKey。
4. 新文章保持 status: draft，確認可公開後才改為 published；不列出但可直接造訪時使用 hidden。
5. 沒有圖片時，刪除 cover，並將 carouselImages、articleGalleryImages、siteGalleryImages 保留為空陣列 []。
6. carouselImages 是文章上方輪播；articleGalleryImages 是文章底部的當次拍攝照片集；siteGalleryImages 是全站 /gallery 精選照片牆。
7. 新增或大幅修改文章時，同步更新 data/searchMetadata.ts 中以 translationKey 為鍵的中英文搜尋詞。
-->

在這裡撰寫文章正文。

<!--
文章內嵌地圖（選用）：
- 可放在正文任意位置，也可以在同一篇文章中放入多個 article-map。
- locations 至少需要一筆；name、latitude、longitude 為必要屬性。
- description、precision、link 為選填屬性；precision 可使用 exact 或 approximate。
- caption、zoom、height 均為選填；zoom 預設 14，height 預設桌面 420px、手機最高 300px。
- 同一個地圖有 8 個以上的位置時，標記會自動聚合。
- 使用時移除這段說明最外層的 HTML 註解標記。

::article-map
---
caption: 地圖說明文字
zoom: 14
height: 420
locations:
  - name: 第一個位置
    latitude: 25.116
    longitude: 121.917
    description: 這個位置的補充說明。
    precision: exact
    link: https://www.openstreetmap.org/
  - name: 第二個位置
    latitude: 25.12
    longitude: 121.91
    precision: approximate
---
::
-->
