'use client'

import React, { useState, useCallback } from 'react'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  onImagesChange: (files: File[]) => void
  maxImages?: number
}

export function ImageUpload({ onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      )
      handleFiles([...images, ...files].slice(0, maxImages))
    },
    [images, maxImages]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((file) => file.type.startsWith('image/'))
      handleFiles([...images, ...files].slice(0, maxImages))
    }
  }

  const handleFiles = (files: File[]) => {
    setImages(files)
    onImagesChange(files)

    // Create previews
    const newPreviews: string[] = []
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === files.length) {
          setPreviews(newPreviews)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    setImages(newImages)
    setPreviews(newPreviews)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-neutral-50 transition-colors cursor-pointer"
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer block">
          <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-neutral-900">Drag & drop images here</p>
          <p className="text-xs text-neutral-600 mt-1">or click to select files</p>
          <p className="text-xs text-neutral-500 mt-2">
            Up to {maxImages} images • PNG, JPG, GIF supported
          </p>
        </label>
      </div>

      {previews.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-neutral-900 mb-3">Image Previews</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100">
                  <img
                    src={preview || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
