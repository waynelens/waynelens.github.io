export const useRssDialog = () => {
  const isRssOpen = useState<boolean>('site-rss-open', () => false)

  const openRss = () => {
    isRssOpen.value = true
  }

  const closeRss = () => {
    isRssOpen.value = false
  }

  return { isRssOpen, openRss, closeRss }
}
