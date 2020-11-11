---
title: WritingTips
tags:
    - hexo

categories:
    - Blog
---
## _config.yml中的 post_asset_folder
設定為true後，每次新增post，都會同時生成可以放靜態資料的同名資料夾。
- 裡面放圖片，則可以 ![img]("圖片名稱")，直接呼叫


## Drafts
```hexo new draft "草稿標題"```，生成草稿，預設不顯示。
但可以透過 _config.yml的render_drafts來設定

## 生成新分頁
```hexo new page "Title"```

## Gitalk評論系統
https://github.com/gitalk/gitalk/blob/master/readme-cn.md#%E8%AE%BE%E7%BD%AE
* 要申請 Github Application，在設定=>developer setting

## 去除footer多餘字樣
主題強制加入的文字
> Powered by Hexo | Theme - Cards
* 進入themes/cards/source/footer.ejs 刪除即可

## 外觀部分反饋
* 手機端的文章大綱蓋版了
* 文章內容跟背景切割度不夠