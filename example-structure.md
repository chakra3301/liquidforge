# Example ZIP File Structure

Your ZIP file should contain folders, each representing a layer. Each folder should contain image assets (PNG, JPG, JPEG, GIF, WebP).

**IMPORTANT**: The layer folders must be at the root level of the ZIP file, not inside another folder.

## Basic Structure
```
master.zip
├── background/
│   ├── bg1.png
│   ├── bg2.png
│   └── bg3.png
├── character/
│   ├── char1.png
│   ├── char2.png
│   └── char3.png
├── head/
│   ├── head1.png
│   ├── head2.png
│   └── head3.png
└── accessories/
    ├── acc1.png
    ├── acc2.png
    └── acc3.png
```

## ❌ Incorrect Structure (Don't do this)
```
master.zip
└── my-project/
    ├── background/
    ├── character/
    ├── head/
    └── accessories/
```

## Advanced Structure
```
master.zip
├── background/
│   ├── bg_blue.png
│   ├── bg_red.png
│   ├── bg_green.png
│   └── bg_purple.png
├── body/
│   ├── body_skinny.png
│   ├── body_normal.png
│   └── body_chubby.png
├── head/
│   ├── head_round.png
│   ├── head_square.png
│   └── head_oval.png
├── eyes/
│   ├── eyes_blue.png
│   ├── eyes_brown.png
│   ├── eyes_green.png
│   └── eyes_red.png
├── mouth/
│   ├── mouth_smile.png
│   ├── mouth_frown.png
│   └── mouth_neutral.png
├── hair/
│   ├── hair_black.png
│   ├── hair_brown.png
│   ├── hair_blonde.png
│   └── hair_red.png
├── clothes/
│   ├── clothes_casual.png
│   ├── clothes_formal.png
│   └── clothes_sporty.png
└── accessories/
    ├── acc_hat.png
    ├── acc_glasses.png
    ├── acc_necklace.png
    └── acc_earrings.png
```

## Important Notes

### Image Requirements
- **Format**: PNG, JPG, JPEG, GIF, WebP
- **Transparency**: PNG with transparency is recommended for overlays
- **Size**: All images in a layer should have the same dimensions
- **Quality**: Use high-quality images for best results

### Layer Order
- Layers are processed from bottom to top
- Background layer should be at the bottom
- Accessories should be at the top
- You can reorder layers in the application

### Naming Convention
- Use descriptive names for easier management
- Avoid special characters in filenames
- Use underscores or hyphens instead of spaces

### File Organization
- Each layer should be in its own folder
- Folder names become layer names in the application
- Keep related assets together

## Example Metadata Output

When you generate NFTs, the metadata will look like this:

```json
{
  "name": "My Collection #001",
  "description": "Generated NFT collection",
  "image": "http://localhost:5000/generated/001.png",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "bg_blue"
    },
    {
      "trait_type": "Body",
      "value": "body_normal"
    },
    {
      "trait_type": "Head",
      "value": "head_round"
    },
    {
      "trait_type": "Eyes",
      "value": "eyes_blue"
    },
    {
      "trait_type": "Mouth",
      "value": "mouth_smile"
    },
    {
      "trait_type": "Hair",
      "value": "hair_brown"
    },
    {
      "trait_type": "Clothes",
      "value": "clothes_casual"
    },
    {
      "trait_type": "Accessories",
      "value": "acc_hat"
    }
  ],
  "edition": 1
}
```

## Tips for Best Results

1. **Consistent Sizing**: Ensure all images in each layer have the same dimensions
2. **Transparency**: Use PNG with transparency for overlays
3. **Quality**: Use high-resolution images (at least 1000x1000 pixels)
4. **Organization**: Keep your layer folders well-organized
5. **Testing**: Test with a small number of assets first
6. **Backup**: Keep backups of your original assets 