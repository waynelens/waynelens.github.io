export const useSearchDialog = () => {
  const isSearchOpen = useState<boolean>('site-search-open', () => false)

  const openSearch = () => {
    isSearchOpen.value = true
  }

  const closeSearch = () => {
    isSearchOpen.value = false
  }

  return { isSearchOpen, openSearch, closeSearch }
}
