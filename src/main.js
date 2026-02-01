const fileInput = document.getElementById('image-upload');
const processBtn = document.getElementById('process-btn');
const downloadBtn = document.getElementById('download-btn');
const outputNameInput = document.getElementById('output-name');
const keepNameCheckbox = document.getElementById('keep-name');
const maxWidthInput = document.getElementById('max-width');
const maxHeightInput = document.getElementById('max-height');
const aspectRatioSelect = document.getElementById('aspect-ratio');
const cropPositionSelect = document.getElementById('crop-position');
const cropPositionContainer = document.getElementById('crop-position-container');
const overlayOptionsContainer = document.getElementById('overlay-options-container');
const overlayMarginInput = document.getElementById('overlay-margin');
const overlayShadowInput = document.getElementById('overlay-shadow');
const qualityContainer = document.getElementById('quality-container');
const jpgQualityInput = document.getElementById('jpg-quality');
const forceJpgCheckbox = document.getElementById('force-jpg');

// Toggle quality visibility based on force JPG checkbox
function updateQualityVisibility() {
    const isJpg = sourceMimeType === 'image/jpeg';
    const forceJpg = forceJpgCheckbox.checked;
    qualityContainer.classList.toggle('hidden', !isJpg && !forceJpg);
}

forceJpgCheckbox.addEventListener('change', updateQualityVisibility);
const customRatioW = document.getElementById('custom-ratio-w');
const customRatioH = document.getElementById('custom-ratio-h');
const resizeModeInputs = document.querySelectorAll('input[name="resize-mode"]');

// Clear custom ratio when dropdown is used
aspectRatioSelect.addEventListener('change', () => {
    if (aspectRatioSelect.value) {
        customRatioW.value = '';
        customRatioH.value = '';
    }
});

// Clear dropdown when custom ratio is entered
customRatioW.addEventListener('input', () => {
    if (customRatioW.value) {
        aspectRatioSelect.value = '';
    }
    updateCropPositionOptions();
});

customRatioH.addEventListener('input', () => {
    if (customRatioH.value) {
        aspectRatioSelect.value = '';
    }
    updateCropPositionOptions();
});

// Helper to get the current aspect ratio (from dropdown or custom)
function getAspectRatio() {
    if (aspectRatioSelect.value) {
        return aspectRatioSelect.value;
    }
    const w = parseInt(customRatioW.value);
    const h = parseInt(customRatioH.value);
    if (w > 0 && h > 0) {
        return `${w}:${h}`;
    }
    return '';
}
const canvas = document.getElementById('output-canvas');
const outputContainer = document.getElementById('output-container');
const outputFilename = document.getElementById('output-filename');
const outputDimensions = document.getElementById('output-dimensions');
const sourceContainer = document.getElementById('source-container');
const sourcePreview = document.getElementById('source-preview');
const sourceFilenameEl = document.getElementById('source-filename');
const sourceDimensionsEl = document.getElementById('source-dimensions');
const sourceFilesizeEl = document.getElementById('source-filesize');
const outputFilesizeEl = document.getElementById('output-filesize');
const ctx = canvas.getContext('2d');

function formatFilesize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

let uploadedImage = null;

// Update crop position options based on image and aspect ratio
function updateCropPositionOptions() {
    const aspectRatio = getAspectRatio();
    const resizeMode = document.querySelector('input[name="resize-mode"]:checked').value;

    // Hide if not crop mode or no aspect ratio
    if (resizeMode !== 'crop' || !aspectRatio || !uploadedImage) {
        cropPositionContainer.classList.add('hidden');
        return;
    }

    const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
    const targetRatio = ratioW / ratioH;
    const imgRatio = uploadedImage.width / uploadedImage.height;

    // Determine which options are relevant
    const isWider = imgRatio > targetRatio;
    const isTaller = imgRatio < targetRatio;
    const isExact = Math.abs(imgRatio - targetRatio) < 0.001;

    // Build options
    cropPositionSelect.innerHTML = '';

    // Center is always an option
    const centerOption = document.createElement('option');
    centerOption.value = 'center';
    centerOption.textContent = 'Center crop';
    cropPositionSelect.appendChild(centerOption);

    if (isExact) {
        // No cropping needed, hide the container
        cropPositionContainer.classList.add('hidden');
        return;
    }

    if (isWider) {
        // Horizontal crop - left/right matter
        const leftOption = document.createElement('option');
        leftOption.value = 'left';
        leftOption.textContent = 'Left crop';
        cropPositionSelect.appendChild(leftOption);

        const rightOption = document.createElement('option');
        rightOption.value = 'right';
        rightOption.textContent = 'Right crop';
        cropPositionSelect.appendChild(rightOption);
    } else if (isTaller) {
        // Vertical crop - top/bottom matter
        const topOption = document.createElement('option');
        topOption.value = 'top';
        topOption.textContent = 'Top crop';
        cropPositionSelect.appendChild(topOption);

        const bottomOption = document.createElement('option');
        bottomOption.value = 'bottom';
        bottomOption.textContent = 'Bottom crop';
        cropPositionSelect.appendChild(bottomOption);
    }

    cropPositionContainer.classList.remove('hidden');
}

// Toggle crop position and overlay options visibility based on resize mode
function updateResizeModeOptions() {
    const resizeMode = document.querySelector('input[name="resize-mode"]:checked').value;
    overlayOptionsContainer.classList.toggle('hidden', resizeMode !== 'overlay');
    updateCropPositionOptions();
}

resizeModeInputs.forEach(input => {
    input.addEventListener('change', updateResizeModeOptions);
});

aspectRatioSelect.addEventListener('change', updateCropPositionOptions);
let sourceFileName = '';
let sourceMimeType = 'image/png';

function getTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

function getExtensionFromMime(mimeType) {
    const mimeToExt = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp'
    };
    return mimeToExt[mimeType] || 'png';
}

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Store source file info
        const nameParts = file.name.split('.');
        nameParts.pop(); // Remove extension
        sourceFileName = nameParts.join('.');
        sourceMimeType = file.type || 'image/png';

        // Populate output name if blank
        if (!outputNameInput.value.trim()) {
            outputNameInput.value = sourceFileName;
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            uploadedImage = img;
            processBtn.disabled = false;
            updateCropPositionOptions();

            // Display source preview
            sourcePreview.src = objectUrl;
            sourceFilenameEl.textContent = file.name;
            sourceDimensionsEl.textContent = `${img.width} × ${img.height} px`;
            sourceFilesizeEl.textContent = formatFilesize(file.size);
            sourceContainer.classList.remove('hidden');

            // Update quality visibility
            updateQualityVisibility();
        };
        img.src = objectUrl;
    }
});

processBtn.addEventListener('click', () => {
    if (!uploadedImage) return;

    const maxWidth = parseInt(maxWidthInput.value) || uploadedImage.width;
    const maxHeight = parseInt(maxHeightInput.value) || uploadedImage.height;
    const aspectRatio = getAspectRatio();
    const resizeMode = document.querySelector('input[name="resize-mode"]:checked').value;

    let targetWidth, targetHeight;
    let sourceX = 0, sourceY = 0, sourceWidth = uploadedImage.width, sourceHeight = uploadedImage.height;

    // Calculate target dimensions based on aspect ratio
    if (aspectRatio) {
        const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
        const ratio = ratioW / ratioH;

        if (resizeMode === 'crop') {
            // Crop mode: fill the target area, cropping excess
            const imgRatio = uploadedImage.width / uploadedImage.height;
            const cropPosition = cropPositionSelect.value;

            if (imgRatio > ratio) {
                // Image is wider than target ratio, crop sides
                sourceHeight = uploadedImage.height;
                sourceWidth = sourceHeight * ratio;
                // Horizontal crop position
                if (cropPosition === 'left') {
                    sourceX = 0;
                } else if (cropPosition === 'right') {
                    sourceX = uploadedImage.width - sourceWidth;
                } else {
                    // center, top, bottom all use center for horizontal
                    sourceX = (uploadedImage.width - sourceWidth) / 2;
                }
            } else {
                // Image is taller than target ratio, crop top/bottom
                sourceWidth = uploadedImage.width;
                sourceHeight = sourceWidth / ratio;
                // Vertical crop position
                if (cropPosition === 'top') {
                    sourceY = 0;
                } else if (cropPosition === 'bottom') {
                    sourceY = uploadedImage.height - sourceHeight;
                } else {
                    // center, left, right all use center for vertical
                    sourceY = (uploadedImage.height - sourceHeight) / 2;
                }
            }

            // Determine target dimensions within max bounds
            if (maxWidth / ratio <= maxHeight) {
                targetWidth = maxWidth;
                targetHeight = maxWidth / ratio;
            } else {
                targetHeight = maxHeight;
                targetWidth = maxHeight * ratio;
            }
        } else {
            // Overlay mode: fit image within bounds, add letterbox/pillarbox
            targetWidth = maxWidth;
            targetHeight = maxWidth / ratio;
            if (targetHeight > maxHeight) {
                targetHeight = maxHeight;
                targetWidth = maxHeight * ratio;
            }
        }
    } else {
        // No aspect ratio constraint
        const imgRatio = uploadedImage.width / uploadedImage.height;

        if (uploadedImage.width / maxWidth > uploadedImage.height / maxHeight) {
            targetWidth = Math.min(maxWidth, uploadedImage.width);
            targetHeight = targetWidth / imgRatio;
        } else {
            targetHeight = Math.min(maxHeight, uploadedImage.height);
            targetWidth = targetHeight * imgRatio;
        }
    }

    targetWidth = Math.round(targetWidth);
    targetHeight = Math.round(targetHeight);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    if (resizeMode === 'overlay' && aspectRatio) {
        const imgRatio = uploadedImage.width / uploadedImage.height;
        const canvasRatio = targetWidth / targetHeight;
        const marginPercent = parseFloat(overlayMarginInput.value) || 0;
        const shadowPercent = parseFloat(overlayShadowInput.value) || 0;
        const smallerDimension = Math.min(targetWidth, targetHeight);
        const margin = (marginPercent / 100) * smallerDimension;
        const shadowRadius = (shadowPercent / 100) * smallerDimension;

        // Draw blurred background (cover mode - fills entire canvas)
        let bgWidth, bgHeight, bgX, bgY;
        if (imgRatio > canvasRatio) {
            // Image is wider - fit by height, crop sides
            bgHeight = targetHeight;
            bgWidth = targetHeight * imgRatio;
            bgX = (targetWidth - bgWidth) / 2;
            bgY = 0;
        } else {
            // Image is taller - fit by width, crop top/bottom
            bgWidth = targetWidth;
            bgHeight = targetWidth / imgRatio;
            bgX = 0;
            bgY = (targetHeight - bgHeight) / 2;
        }

        // Apply blur and draw background
        ctx.filter = 'blur(20px)';
        ctx.drawImage(uploadedImage, bgX, bgY, bgWidth, bgHeight);
        ctx.filter = 'none';

        // Calculate scaled image dimensions to fit within canvas (contain mode) with margin
        const availableWidth = targetWidth - (margin * 2);
        const availableHeight = targetHeight - (margin * 2);
        let drawWidth, drawHeight;
        if (imgRatio > availableWidth / availableHeight) {
            drawWidth = availableWidth;
            drawHeight = availableWidth / imgRatio;
        } else {
            drawHeight = availableHeight;
            drawWidth = availableHeight * imgRatio;
        }

        const drawX = (targetWidth - drawWidth) / 2;
        const drawY = (targetHeight - drawHeight) / 2;

        // Apply drop shadow if specified (darker and harder)
        if (shadowRadius > 0) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = shadowRadius * 0.5;
            ctx.shadowOffsetX = shadowRadius * 0.3;
            ctx.shadowOffsetY = shadowRadius * 0.3;
        }

        // Draw sharp foreground image
        ctx.drawImage(uploadedImage, drawX, drawY, drawWidth, drawHeight);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    } else {
        // Crop mode or no aspect ratio
        ctx.drawImage(
            uploadedImage,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, targetWidth, targetHeight
        );
    }

    // Determine output format and quality
    const forceJpg = forceJpgCheckbox.checked;
    const outputMimeType = forceJpg ? 'image/jpeg' : sourceMimeType;
    const isOutputJpg = outputMimeType === 'image/jpeg';
    const quality = isOutputJpg ? (parseInt(jpgQualityInput.value) || 80) / 100 : 1;
    const dataUrl = canvas.toDataURL(outputMimeType, quality);
    const outputBytes = Math.round((dataUrl.length - `data:${sourceMimeType};base64,`.length) * 0.75);
    outputFilesizeEl.textContent = formatFilesize(outputBytes);

    // Update output info
    const extension = getExtensionFromMime(outputMimeType);
    const timestamp = getTimestamp();
    const baseName = outputNameInput.value.trim() || sourceFileName;
    const generatedFilename = `${baseName} - ${timestamp}.${extension}`;
    outputFilename.textContent = generatedFilename;
    outputDimensions.textContent = `${targetWidth} × ${targetHeight} px`;

    // Store for download
    canvas.dataset.filename = generatedFilename;
    canvas.dataset.dataUrl = dataUrl;

    // Clear output name if not keeping
    if (!keepNameCheckbox.checked) {
        outputNameInput.value = '';
    }

    outputContainer.classList.remove('hidden');
});

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = canvas.dataset.filename;
    link.href = canvas.dataset.dataUrl;
    link.click();
});
