import AppKit
import Foundation

let sizes = [16, 32, 48, 128]
let svgPath = "/Users/stevegowa/Documents/GitHub/lendpaper/chrome-extension/icons/icon.svg"
let outputDir = "/Users/stevegowa/Documents/GitHub/lendpaper/chrome-extension/icons/"

print("Loading SVG from: \(svgPath)")
guard let svgData = try? Data(contentsOf: URL(fileURLWithPath: svgPath)),
      let image = NSImage(data: svgData) else {
    print("Error: Could not load SVG image from \(svgPath)")
    exit(1)
}

print("Successfully loaded SVG. Dimension: \(image.size)")

for size in sizes {
    let newImage = NSImage(size: NSSize(width: size, height: size))
    newImage.lockFocus()
    
    // Set high-quality scaling and interpolation
    NSGraphicsContext.current?.imageInterpolation = .high
    
    image.draw(in: NSRect(x: 0, y: 0, width: size, height: size),
               from: NSRect(x: 0, y: 0, width: image.size.width, height: image.size.height),
               operation: .copy,
               fraction: 1.0)
    
    newImage.unlockFocus()
    
    guard let tiffData = newImage.tiffRepresentation,
          let bitmapRep = NSBitmapImageRep(data: tiffData),
          let pngData = bitmapRep.representation(using: .png, properties: [:]) else {
        print("Error: Failed to convert size \(size) to PNG representation")
        continue
    }
    
    let outPath = "\(outputDir)icon\(size).png"
    do {
        try pngData.write(to: URL(fileURLWithPath: outPath))
        print("Successfully wrote: \(outPath)")
    } catch {
        print("Error writing \(outPath): \(error)")
    }
}
print("Done!")
