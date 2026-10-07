'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'

export function QRCodeDisplay({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [svgStr, setSvgStr] = useState<string>('')

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
    }
    
    QRCode.toString(url, { type: 'svg', width: 250, margin: 2 })
      .then(setSvgStr)
      .catch(console.error)
  }, [url])

  const downloadPNG = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.download = 'qrcode.png'
      link.href = canvasRef.current.toDataURL()
      link.click()
    }
  }

  const downloadSVG = () => {
    if (svgStr) {
      const blob = new Blob([svgStr], { type: 'image/svg+xml' })
      const link = document.createElement('a')
      link.download = 'qrcode.svg'
      link.href = URL.createObjectURL(blob)
      link.click()
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas ref={canvasRef} className="border rounded shadow-sm"></canvas>
      <div className="flex space-x-2">
        <Button variant="outline" onClick={downloadPNG}>PNG</Button>
        <Button variant="outline" onClick={downloadSVG}>SVG (HD)</Button>
      </div>
    </div>
  )
}
