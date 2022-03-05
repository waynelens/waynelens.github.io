---
title: 從Github Clone Hexo專案
tags:
categories:
---
# hexo 從clone開始

## 前言
看到了Google Domain的帳單來的時候，我才想到我建立了這個Blog之後就拋棄它了~*￣▽￣*~
也因為今年買了新的筆電，所以相關的環境重新開始建立，不過今年工作都在接觸.Net的東西，node的工具很久沒碰了，一時之間不知道怎麼用(雖然這篇根本沒用到甚麼複雜的東西)。

## Clone from Github
先把整包檔案從Github上Clone下來，當初設定deploy的時候，就決定main branch是編過的靜態檔案，hexo branch是config、文章、主題那些的原始檔案。
比較要注意的是，當初是選用 [Cards](https://theme-cards.ichr.me/)這個專案當作Blog的主題，除了直接下載檔案放到 /themes/cards底下。
直接在一個有.git專案下，再clone一份專案，會變成git submodule(vs code中顯示如下)，方便後續用pull去更新。

但是submodule是reference到另一個專案，所以clone完主專案後，還需要cd到/themes下，clone submodule。
不然/themes/cards為空，後續deploy會報錯。

## NPM Install
Hexo基於Node.js，自然有package.json做套件管控，下個npm -i理所當然。
但是我並不打算做全域安裝，所以也必須把/node_modules/.bin加入環境變數，否則會錯誤。