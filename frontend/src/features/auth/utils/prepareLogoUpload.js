const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_DATA_URL_LENGTH = 85000
const MIN_DIMENSION = 80
const DEFAULT_MAX_DIMENSION = 220
const QUALITY_STEPS = [0.86, 0.76, 0.66, 0.56, 0.46]
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
])

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error("Failed to read image file"))
    reader.readAsDataURL(file)
  })

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to process image"))
    image.src = src
  })

const createCanvas = (width, height) => {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

const getScaledDimensions = (width, height, maxDimension) => {
  const ratio = Math.min(1, maxDimension / Math.max(width, height))

  return {
    width: Math.max(MIN_DIMENSION, Math.round(width * ratio)),
    height: Math.max(MIN_DIMENSION, Math.round(height * ratio))
  }
}

const exportCanvas = (canvas, mimeType, quality) =>
  canvas.toDataURL(mimeType, quality)

const getCandidateMimeTypes = (fileType) => {
  if (fileType === "image/png") {
    return ["image/webp", "image/png", "image/jpeg"]
  }

  return ["image/webp", "image/jpeg", "image/png"]
}

export const prepareLogoUpload = async (file) => {
  if (!file) {
    throw new Error("Choose an image to upload")
  }

  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Use a PNG, JPG, or WEBP image")
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Image must be smaller than 5 MB")
  }

  const sourceDataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(sourceDataUrl)
  const candidateMimeTypes = getCandidateMimeTypes(file.type)
  let maxDimension = DEFAULT_MAX_DIMENSION
  let bestResult = ""

  while (maxDimension >= MIN_DIMENSION) {
    const dimensions = getScaledDimensions(image.width, image.height, maxDimension)
    const canvas = createCanvas(dimensions.width, dimensions.height)
    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Image editing is not supported in this browser")
    }

    context.clearRect(0, 0, dimensions.width, dimensions.height)
    context.drawImage(image, 0, 0, dimensions.width, dimensions.height)

    for (const mimeType of candidateMimeTypes) {
      for (const quality of QUALITY_STEPS) {
        const candidate = exportCanvas(canvas, mimeType, quality)

        if (candidate.length <= MAX_DATA_URL_LENGTH) {
          return {
            fileName: file.name,
            logoUrl: candidate
          }
        }

        if (!bestResult || candidate.length < bestResult.length) {
          bestResult = candidate
        }
      }
    }

    maxDimension = Math.round(maxDimension * 0.82)
  }

  if (bestResult && bestResult.length <= MAX_DATA_URL_LENGTH * 1.15) {
    return {
      fileName: file.name,
      logoUrl: bestResult
    }
  }

  throw new Error("Image is too large. Try a smaller or simpler image")
}
