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