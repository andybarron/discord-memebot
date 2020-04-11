export function splitOnValue<T>(value: T, array: Array<T>): Array<Array<T>> {
  const chunks: Array<Array<T>> = []
  const currentChunk: Array<T> = []
  for (const item of array) {
    if (item === value) {
      chunks.push([...currentChunk])
      currentChunk.length = 0
    } else {
      currentChunk.push(item)
    }
  }
  chunks.push(currentChunk)
  return chunks
}
