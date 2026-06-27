export function preloadImages(imagePaths) {
  const uniquePaths = [...new Set(imagePaths)].filter(Boolean)
  for (const path of uniquePaths) {
    const img = new Image()
    img.src = path
  }
}
