const fileInput = document.getElementById('image-upload');
const processBtn = document.getElementById('process-btn');
const downloadBtn = document.getElementById('download-btn');
const previewBtn = document.getElementById('preview-btn');
const outputNameInput = document.getElementById('output-name');
const keepNameCheckbox = document.getElementById('keep-name');
const addTimestampCheckbox = document.getElementById('add-timestamp');
const maxWidthInput = document.getElementById('max-width');
const maxHeightInput = document.getElementById('max-height');
const aspectRatioSelect = document.getElementById('aspect-ratio');
const cropPositionSelect = document.getElementById('crop-position');
const cropPositionContainer = document.getElementById('crop-position-container');
const overlayOptionsContainer = document.getElementById('overlay-options-container');
const overlayMarginInput = document.getElementById('overlay-margin');
const overlayBlurCheckbox = document.getElementById('overlay-blur');
const overlayBgColorInput = document.getElementById('overlay-bg-color');
const overlayBgColorInputLabel = document.getElementById('overlay-bg-color-label');
const shadowEnabledCheckbox = document.getElementById('shadow-enabled');
const shadowOffsetXInput = document.getElementById('shadow-offset-x');
const shadowOffsetYInput = document.getElementById('shadow-offset-y');
const shadowBlurInput = document.getElementById('shadow-blur');
const shadowColorInput = document.getElementById('shadow-color');
const shadowOpacityInput = document.getElementById('shadow-opacity');
const qualityContainer = document.getElementById('quality-container');
const jpgQualityInput = document.getElementById('jpg-quality');
const forceJpgCheckbox = document.getElementById('force-jpg');
const batchProgress = document.getElementById('batch-progress');
const batchProgressText = document.getElementById('batch-progress-text');

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

// Text overlay output bar elements
const textOutputBar = document.getElementById('text-output-bar');
const textOutputFilename = document.getElementById('text-output-filename');
const textOutputDimensions = document.getElementById('text-output-dimensions');
const textOutputFilesize = document.getElementById('text-output-filesize');
const textOutputNameInput = document.getElementById('text-output-name');
const textDownloadBtn = document.getElementById('text-download-btn');
const textPreviewBtn = document.getElementById('text-preview-btn');

function formatFilesize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

let uploadedImage = null;
let uploadedFiles = [];
let processedImages = [];
let isProcessing = false;
let outputNameManuallyEdited = false;

// Update crop position options based on image and aspect ratio
function updateCropPositionOptions() {
    const aspectRatio = getAspectRatio();
    const resizeMode = document.querySelector('input[name="resize-mode"]:checked').value;

    // Hide if not crop mode
    if (resizeMode !== 'crop') {
        cropPositionContainer.style.display = 'none';
        return;
    }

    // Show in crop mode
    cropPositionContainer.style.display = 'flex';

    // Only rebuild options if we have image and aspect ratio
    if (!aspectRatio || !uploadedImage) {
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

overlayBlurCheckbox.addEventListener('change', () => {
    overlayBgColorInput.classList.toggle('hidden', overlayBlurCheckbox.checked);
    overlayBgColorInputLabel.classList.toggle('hidden', overlayBlurCheckbox.checked);
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
    const files = Array.from(e.target.files);
    if (!files.length) return;

    uploadedFiles = files;
    processedImages = [];
    outputNameManuallyEdited = false;

    // Use the first file for source preview and settings
    const file = files[0];
    const nameParts = file.name.split('.');
    nameParts.pop();
    sourceFileName = nameParts.join('.');
    sourceMimeType = file.type || 'image/png';

    if (!keepNameCheckbox.checked || !outputNameInput.value.trim()) {
        outputNameInput.value = sourceFileName;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
        uploadedImage = img;
        processBtn.disabled = false;
        updateCropPositionOptions();

        sourcePreview.src = objectUrl;
        sourceFilenameEl.textContent = file.name;
        sourceDimensionsEl.textContent = `${img.width} × ${img.height} px`;
        sourceFilesizeEl.textContent = formatFilesize(file.size);
        sourceContainer.classList.remove('hidden');

        updateQualityVisibility();

        // Update process button text
        if (files.length > 1) {
            processBtn.innerHTML = `⚙ Process ${files.length} Images`;
        } else {
            processBtn.innerHTML = '⚙ Process Image';
        }

        // Reset download button labels
        downloadBtn.innerHTML = '⚙ Download';
        textDownloadBtn.innerHTML = '⚙ Download';
    };
    img.src = objectUrl;
});

// Load a File as an Image via object URL
function loadFileAsImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = objectUrl;
    });
}

// Process a single image with current UI settings, drawing to the shared canvas
function processSingleImage(img, fileBaseName, fileMimeType) {
    const maxWidth = parseInt(maxWidthInput.value) || img.width;
    const maxHeight = parseInt(maxHeightInput.value) || img.height;
    const aspectRatio = getAspectRatio();
    const resizeMode = document.querySelector('input[name="resize-mode"]:checked').value;

    let targetWidth, targetHeight;
    let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;

    if (aspectRatio) {
        const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
        const ratio = ratioW / ratioH;

        if (resizeMode === 'crop') {
            const imgRatio = img.width / img.height;
            const cropPosition = cropPositionSelect.value;

            if (imgRatio > ratio) {
                sourceHeight = img.height;
                sourceWidth = sourceHeight * ratio;
                if (cropPosition === 'left') {
                    sourceX = 0;
                } else if (cropPosition === 'right') {
                    sourceX = img.width - sourceWidth;
                } else {
                    sourceX = (img.width - sourceWidth) / 2;
                }
            } else {
                sourceWidth = img.width;
                sourceHeight = sourceWidth / ratio;
                if (cropPosition === 'top') {
                    sourceY = 0;
                } else if (cropPosition === 'bottom') {
                    sourceY = img.height - sourceHeight;
                } else {
                    sourceY = (img.height - sourceHeight) / 2;
                }
            }

            if (maxWidth / ratio <= maxHeight) {
                targetWidth = maxWidth;
                targetHeight = maxWidth / ratio;
            } else {
                targetHeight = maxHeight;
                targetWidth = maxHeight * ratio;
            }
        } else {
            targetWidth = maxWidth;
            targetHeight = maxWidth / ratio;
            if (targetHeight > maxHeight) {
                targetHeight = maxHeight;
                targetWidth = maxHeight * ratio;
            }
        }
    } else {
        const imgRatio = img.width / img.height;
        if (img.width / maxWidth > img.height / maxHeight) {
            targetWidth = Math.min(maxWidth, img.width);
            targetHeight = targetWidth / imgRatio;
        } else {
            targetHeight = Math.min(maxHeight, img.height);
            targetWidth = targetHeight * imgRatio;
        }
    }

    targetWidth = Math.round(targetWidth);
    targetHeight = Math.round(targetHeight);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    if (resizeMode === 'overlay' && aspectRatio) {
        const imgRatio = img.width / img.height;
        const canvasRatio = targetWidth / targetHeight;
        const marginPercent = parseFloat(overlayMarginInput.value) || 0;
        const smallerDimension = Math.min(targetWidth, targetHeight);
        const margin = (marginPercent / 100) * smallerDimension;

        const shadowOffsetX = parseFloat(shadowOffsetXInput.value) || 0;
        const shadowOffsetY = parseFloat(shadowOffsetYInput.value) || 0;
        const shadowBlurVal = parseFloat(shadowBlurInput.value) || 0;
        const shadowColorHex = shadowColorInput.value || '#000000';
        const shadowOpacityVal = (parseFloat(shadowOpacityInput.value) || 0) / 100;

        const r = parseInt(shadowColorHex.slice(1, 3), 16);
        const g = parseInt(shadowColorHex.slice(3, 5), 16);
        const b = parseInt(shadowColorHex.slice(5, 7), 16);
        const shadowColorRgba = `rgba(${r}, ${g}, ${b}, ${shadowOpacityVal})`;

        if (overlayBlurCheckbox.checked) {
            let bgWidth, bgHeight, bgX, bgY;
            if (imgRatio > canvasRatio) {
                bgHeight = targetHeight;
                bgWidth = targetHeight * imgRatio;
                bgX = (targetWidth - bgWidth) / 2;
                bgY = 0;
            } else {
                bgWidth = targetWidth;
                bgHeight = targetWidth / imgRatio;
                bgX = 0;
                bgY = (targetHeight - bgHeight) / 2;
            }
            ctx.filter = 'blur(20px)';
            ctx.drawImage(img, bgX, bgY, bgWidth, bgHeight);
            ctx.filter = 'none';
        } else {
            ctx.fillStyle = overlayBgColorInput.value;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

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

        if (shadowEnabledCheckbox.checked && (shadowBlurVal > 0 || shadowOffsetX !== 0 || shadowOffsetY !== 0)) {
            ctx.shadowColor = shadowColorRgba;
            ctx.shadowBlur = shadowBlurVal;
            ctx.shadowOffsetX = shadowOffsetX;
            ctx.shadowOffsetY = shadowOffsetY;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    } else {
        ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, targetWidth, targetHeight
        );
    }

    const forceJpg = forceJpgCheckbox.checked;
    const outputMimeType = forceJpg ? 'image/jpeg' : fileMimeType;
    const isOutputJpg = outputMimeType === 'image/jpeg';
    const quality = isOutputJpg ? (parseInt(jpgQualityInput.value) || 80) / 100 : 1;
    const dataUrl = canvas.toDataURL(outputMimeType, quality);

    const extension = getExtensionFromMime(outputMimeType);
    // If user manually edited the output name field, all images share that name
    // Otherwise each image uses its own source filename
    const baseName = (outputNameManuallyEdited && outputNameInput.value.trim())
        ? outputNameInput.value.trim()
        : fileBaseName;

    let generatedFilename;
    if (addTimestampCheckbox.checked) {
        const timestamp = getTimestamp();
        generatedFilename = `${baseName} - ${timestamp}.${extension}`;
    } else {
        generatedFilename = `${baseName}.${extension}`;
    }

    return {
        dataUrl,
        filename: generatedFilename,
        baseName,
        width: targetWidth,
        height: targetHeight,
        outputMimeType
    };
}

processBtn.addEventListener('click', async () => {
    if (!uploadedImage || isProcessing) return;

    isProcessing = true;
    processBtn.disabled = true;
    processedImages = [];

    const total = uploadedFiles.length;
    const isBatch = total > 1;

    for (let i = 0; i < total; i++) {
        const file = uploadedFiles[i];

        if (isBatch) {
            batchProgress.classList.remove('hidden');
            batchProgressText.textContent = `Processing ${i + 1} of ${total}...`;
        }

        const img = await loadFileAsImage(file);
        uploadedImage = img;

        const nameParts = file.name.split('.');
        nameParts.pop();
        const fileBaseName = nameParts.join('.');
        const fileMimeType = file.type || 'image/png';

        // Update the output name field to reflect current file (unless manually edited)
        if (!outputNameManuallyEdited) {
            outputNameInput.value = fileBaseName;
            textOutputNameInput.value = fileBaseName;
        }

        const result = processSingleImage(img, fileBaseName, fileMimeType);

        // Pre-load the result image for text overlay
        const resultImage = new Image();
        resultImage.src = result.dataUrl;

        processedImages.push({ ...result, image: resultImage });

        // Update output info for preview
        const outputBytes = Math.round((result.dataUrl.length - `data:${result.outputMimeType};base64,`.length) * 0.75);
        outputFilesizeEl.textContent = formatFilesize(outputBytes);
        outputFilename.textContent = result.filename;
        outputDimensions.textContent = `${result.width} × ${result.height} px`;

        canvas.dataset.filename = result.filename;
        canvas.dataset.baseName = result.baseName;
        canvas.dataset.dataUrl = result.dataUrl;
        canvas.dataset.width = result.width;
        canvas.dataset.height = result.height;

        outputContainer.classList.remove('hidden');

        // Yield to browser for visual update
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Sync filename to text overlay tab
    const lastResult = processedImages[processedImages.length - 1];
    textOutputNameInput.value = lastResult.baseName;

    // Auto-update preview window if open
    if (previewWindow && !previewWindow.closed) {
        updatePreviewWindow();
    }

    // Show text overlay tab with last image
    showTextOverlayTab();

    // Update download button labels
    if (isBatch) {
        downloadBtn.innerHTML = '⚙ Download ZIP';
        textDownloadBtn.innerHTML = '⚙ Download ZIP';
    } else {
        downloadBtn.innerHTML = '⚙ Download';
        textDownloadBtn.innerHTML = '⚙ Download';
    }

    // Hide progress after brief delay
    if (isBatch) {
        batchProgressText.textContent = `Done! Processed ${total} images.`;
        setTimeout(() => {
            batchProgress.classList.add('hidden');
        }, 2000);
    }

    isProcessing = false;
    processBtn.disabled = false;
});

// Track current tab for download/preview
let currentTab = 'process';

// Generate current output data based on active tab
function getCurrentOutputData() {
    const forceJpg = forceJpgCheckbox.checked;
    const outputMimeType = forceJpg ? 'image/jpeg' : sourceMimeType;
    const isOutputJpg = outputMimeType === 'image/jpeg';
    const quality = isOutputJpg ? (parseInt(jpgQualityInput.value) || 80) / 100 : 1;
    const extension = getExtensionFromMime(outputMimeType);
    const baseName = (currentTab === 'text' ? textOutputNameInput.value.trim() : outputNameInput.value.trim()) || sourceFileName || 'image';

    let filename;
    if (addTimestampCheckbox.checked) {
        const timestamp = getTimestamp();
        filename = `${baseName} - ${timestamp}.${extension}`;
    } else {
        filename = `${baseName}.${extension}`;
    }

    let dataUrl;
    let width, height;
    if (currentTab === 'text' && baseImageData) {
        // Text overlay mode - generate from text canvas
        dataUrl = textCanvas.toDataURL(outputMimeType, quality);
        width = textCanvas.width;
        height = textCanvas.height;
    } else {
        // Process mode - use stored processed image data
        dataUrl = canvas.dataset.dataUrl;
        width = parseInt(canvas.dataset.width) || canvas.width;
        height = parseInt(canvas.dataset.height) || canvas.height;
    }

    return { dataUrl, filename, width, height, outputMimeType };
}

// Apply text overlay items to a base image, returns a dataUrl
function applyTextOverlayToImage(baseImage, w, h, mimeType, quality) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(baseImage, 0, 0, w, h);
    textItems.forEach(item => {
        drawTextItem(tempCtx, item, w, h);
    });
    return tempCanvas.toDataURL(mimeType, quality);
}

// Convert a dataUrl to a Blob
function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const binary = atob(parts[1]);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        arr[i] = binary.charCodeAt(i);
    }
    return new Blob([arr], { type: mime });
}

// Unified download handler for single or batch
async function handleDownload() {
    if (processedImages.length <= 1) {
        // Single image — use existing behavior
        const { dataUrl, filename } = getCurrentOutputData();
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
        return;
    }

    // Batch — create ZIP
    const zip = new JSZip();
    const forceJpg = forceJpgCheckbox.checked;
    const hasText = textItems.length > 0;
    const usedNames = {};

    for (const pImg of processedImages) {
        const outputMimeType = forceJpg ? 'image/jpeg' : pImg.outputMimeType;
        const isOutputJpg = outputMimeType === 'image/jpeg';
        const quality = isOutputJpg ? (parseInt(jpgQualityInput.value) || 80) / 100 : 1;

        let finalDataUrl;
        if (hasText) {
            // Wait for image to load if needed
            if (!pImg.image.complete) {
                await new Promise(resolve => { pImg.image.onload = resolve; });
            }
            finalDataUrl = applyTextOverlayToImage(pImg.image, pImg.width, pImg.height, outputMimeType, quality);
        } else {
            finalDataUrl = pImg.dataUrl;
        }

        // Build filename: use manual name for all if edited, otherwise each image's own name
        const extension = getExtensionFromMime(outputMimeType);
        const nameBase = (outputNameManuallyEdited && outputNameInput.value.trim())
            ? outputNameInput.value.trim()
            : pImg.baseName;
        let candidateName;
        if (addTimestampCheckbox.checked) {
            const timestamp = getTimestamp();
            candidateName = `${nameBase} - ${timestamp}.${extension}`;
        } else {
            candidateName = `${nameBase}.${extension}`;
        }

        // Deduplicate
        if (usedNames[candidateName]) {
            usedNames[candidateName]++;
            const dotIdx = candidateName.lastIndexOf('.');
            candidateName = `${candidateName.substring(0, dotIdx)} (${usedNames[candidateName] - 1})${candidateName.substring(dotIdx)}`;
        } else {
            usedNames[candidateName] = 1;
        }

        const blob = dataUrlToBlob(finalDataUrl);
        zip.file(candidateName, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const baseName = (outputNameManuallyEdited && outputNameInput.value.trim())
        ? outputNameInput.value.trim()
        : processedImages[0].baseName;
    const timestamp = getTimestamp();
    const zipFilename = `${baseName} - ${timestamp}.zip`;

    const link = document.createElement('a');
    link.download = zipFilename;
    link.href = URL.createObjectURL(zipBlob);
    link.click();
    URL.revokeObjectURL(link.href);
}

downloadBtn.addEventListener('click', handleDownload);

// Preview window (named window that persists and updates)
let previewWindow = null;

function updatePreviewWindow() {
    if (!previewWindow || previewWindow.closed) {
        previewWindow = window.open('', 'imager-preview', 'menubar=no,toolbar=no,location=no,status=no');
    }

    const { dataUrl, filename } = getCurrentOutputData();

    previewWindow.document.open();
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${filename}</title>
            <style>
                body { margin: 0; background: #1a1a1a; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>
            <img src="${dataUrl}" alt="${filename}">
        </body>
        </html>
    `);
    previewWindow.document.close();
    previewWindow.focus();
}

previewBtn.addEventListener('click', updatePreviewWindow);

// ============================================================
// Text Overlay Feature
// ============================================================

// DOM Elements
const tabBar = document.getElementById('tab-bar');
const tabBarText = document.getElementById('tab-bar-text');
const processView = document.getElementById('process-view');
const textOverlayView = document.getElementById('text-overlay-view');
const textCanvas = document.getElementById('text-canvas');
const textCanvasHint = document.getElementById('text-canvas-hint');
const textCtx = textCanvas.getContext('2d');
const textItemsList = document.getElementById('text-items-list');
const addTextBtn = document.getElementById('add-text-btn');

// Style controls
const noSelectionMsg = document.getElementById('no-selection-msg');
const styleControlsInner = document.getElementById('style-controls-inner');
const textContentInput = document.getElementById('text-content');
const textFontSelect = document.getElementById('text-font');
const textSizeInput = document.getElementById('text-size');
const textColorInput = document.getElementById('text-color');
const textOpacityInput = document.getElementById('text-opacity');
const textOpacityValue = document.getElementById('text-opacity-value');
const toggleBoldBtn = document.getElementById('toggle-bold');
const toggleItalicBtn = document.getElementById('toggle-italic');
const toggleUnderlineBtn = document.getElementById('toggle-underline');
const toggleUppercaseBtn = document.getElementById('toggle-uppercase');
const textOutlineCheckbox = document.getElementById('text-outline');
const textOutlineColorInput = document.getElementById('text-outline-color');
const textOutlineOpacityInput = document.getElementById('text-outline-opacity');
const textShadowCheckbox = document.getElementById('text-shadow');
const textShadowXInput = document.getElementById('text-shadow-x');
const textShadowYInput = document.getElementById('text-shadow-y');
const textShadowBlurInput = document.getElementById('text-shadow-blur');
const textShadowColorInput = document.getElementById('text-shadow-color');
const textShadowOpacityInput = document.getElementById('text-shadow-opacity');
const textBgCheckbox = document.getElementById('text-bg');
const textBgColorInput = document.getElementById('text-bg-color');
const textBgOpacityInput = document.getElementById('text-bg-opacity');
const textBgPaddingInput = document.getElementById('text-bg-padding');
const textBgWidthInput = document.getElementById('text-bg-width');
const textBgOffsetXInput = document.getElementById('text-bg-offset-x');
const textBgSlantLeftInput = document.getElementById('text-bg-slant-left');
const textBgSlantRightInput = document.getElementById('text-bg-slant-right');
const deleteTextBtn = document.getElementById('delete-text-btn');
const centerHBtn = document.getElementById('center-h-btn');
const centerVBtn = document.getElementById('center-v-btn');

// Data model
let textItems = [];
let selectedTextId = null;
let baseImageData = null; // Stores the processed image data
let isDragging = false;
let dragMoved = false;
let lastTextStyle = {
    fontFamily: 'Arial',
    fontSize: 48,
    color: '#ffffff',
    opacity: 100,
    bold: false,
    italic: false,
    underline: false,
    uppercase: false,
    outline: false,
    outlineColor: '#000000',
    outlineOpacity: 100,
    shadow: false,
    shadowX: 3,
    shadowY: 3,
    shadowBlur: 4,
    shadowColor: '#000000',
    shadowOpacity: 80,
    bg: false,
    bgColor: '#000000',
    bgOpacity: 50,
    bgPadding: 10,
    bgWidth: 0,
    bgOffsetX: 0,
    bgSlantLeft: 0,
    bgSlantRight: 0
};

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Default text item
function createDefaultTextItem(x, y) {
    return {
        id: generateId(),
        text: 'Text',
        x: x,
        y: y,
        fontFamily: lastTextStyle.fontFamily,
        fontSize: lastTextStyle.fontSize,
        color: lastTextStyle.color,
        opacity: lastTextStyle.opacity,
        bold: lastTextStyle.bold,
        italic: lastTextStyle.italic,
        underline: lastTextStyle.underline,
        uppercase: lastTextStyle.uppercase,
        outline: lastTextStyle.outline,
        outlineColor: lastTextStyle.outlineColor,
        outlineOpacity: lastTextStyle.outlineOpacity,
        shadow: lastTextStyle.shadow,
        shadowX: lastTextStyle.shadowX,
        shadowY: lastTextStyle.shadowY,
        shadowBlur: lastTextStyle.shadowBlur,
        shadowColor: lastTextStyle.shadowColor,
        shadowOpacity: lastTextStyle.shadowOpacity,
        bg: lastTextStyle.bg,
        bgColor: lastTextStyle.bgColor,
        bgOpacity: lastTextStyle.bgOpacity,
        bgPadding: lastTextStyle.bgPadding,
        bgWidth: lastTextStyle.bgWidth,
        bgOffsetX: lastTextStyle.bgOffsetX,
        bgSlantLeft: lastTextStyle.bgSlantLeft,
        bgSlantRight: lastTextStyle.bgSlantRight
    };
}

// Update output pane to reflect current tab's canvas
function updateOutputPane() {
    const { dataUrl, filename, width, height, outputMimeType } = getCurrentOutputData();

    // Update preview canvas
    const img = new Image();
    img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;

    // Update displayed info
    outputFilename.textContent = filename;
    outputDimensions.textContent = `${width} × ${height} px`;

    // Estimate filesize
    const outputBytes = Math.round((dataUrl.length - `data:${outputMimeType};base64,`.length) * 0.75);
    outputFilesizeEl.textContent = formatFilesize(outputBytes);

    // Update text overlay output bar too
    textOutputFilename.textContent = filename;
    textOutputDimensions.textContent = `${width} × ${height} px`;
    textOutputFilesize.textContent = formatFilesize(outputBytes);
    textOutputBar.classList.remove('hidden');
}

// Tab switching
function switchToTab(tabName) {
    currentTab = tabName;

    // Update all tab buttons
    document.querySelectorAll('.tab-process-btn').forEach(btn => {
        btn.classList.toggle('active', tabName === 'process');
    });
    document.querySelectorAll('.tab-text-btn').forEach(btn => {
        btn.classList.toggle('active', tabName === 'text');
    });

    if (tabName === 'process') {
        processView.classList.remove('hidden');
        textOverlayView.classList.add('hidden');
    } else if (tabName === 'text') {
        processView.classList.add('hidden');
        textOverlayView.classList.remove('hidden');
        renderTextOverlay();
    }

    // Update output pane for current tab
    if (baseImageData) {
        updateOutputPane();
    }
}

// Event listeners for all tab buttons
document.querySelectorAll('.tab-process-btn').forEach(btn => {
    btn.addEventListener('click', () => switchToTab('process'));
});
document.querySelectorAll('.tab-text-btn').forEach(btn => {
    btn.addEventListener('click', () => switchToTab('text'));
});

// Show text overlay tab after processing
function showTextOverlayTab() {
    tabBar.classList.remove('hidden');
    // Store the base image data and pre-load the image for fast rendering
    const dataUrl = canvas.toDataURL();
    const img = new Image();
    img.src = dataUrl;
    baseImageData = {
        width: canvas.width,
        height: canvas.height,
        dataUrl: dataUrl,
        image: img
    };
}

// Get canvas click position as percentage
function getCanvasClickPosition(event, canvasEl) {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width;
    const scaleY = canvasEl.height / rect.height;
    const x = ((event.clientX - rect.left) * scaleX / canvasEl.width) * 100;
    const y = ((event.clientY - rect.top) * scaleY / canvasEl.height) * 100;
    return { x, y };
}

// Add text item
function addTextItem(x, y) {
    const item = createDefaultTextItem(x, y);
    textItems.push(item);
    selectTextItem(item.id);
    renderTextItemsList();
    renderTextOverlay();
    updateHintVisibility();

    // Focus and select text input for immediate typing
    textContentInput.focus();
    textContentInput.select();
}

// Update text item
function updateTextItem(id, updates) {
    const item = textItems.find(i => i.id === id);
    if (item) {
        Object.assign(item, updates);
        // Save style settings (excluding position and text content)
        const styleKeys = ['fontFamily', 'fontSize', 'color', 'opacity', 'bold', 'italic', 'underline', 'uppercase', 'outline', 'outlineColor', 'outlineOpacity', 'shadow', 'shadowX', 'shadowY', 'shadowBlur', 'shadowColor', 'shadowOpacity', 'bg', 'bgColor', 'bgOpacity', 'bgPadding', 'bgWidth', 'bgOffsetX', 'bgSlantLeft', 'bgSlantRight'];
        styleKeys.forEach(key => {
            if (key in item) {
                lastTextStyle[key] = item[key];
            }
        });
        renderTextOverlay();
        renderTextItemsList();
    }
}

// Delete text item
function deleteTextItem(id) {
    const index = textItems.findIndex(i => i.id === id);
    if (index !== -1) {
        textItems.splice(index, 1);
        if (selectedTextId === id) {
            selectedTextId = null;
            updateStyleControls();
        }
        renderTextItemsList();
        renderTextOverlay();
        updateHintVisibility();
    }
}

// Select text item
function selectTextItem(id) {
    selectedTextId = id;
    // Save style from selected item
    const item = textItems.find(i => i.id === id);
    if (item) {
        const styleKeys = ['fontFamily', 'fontSize', 'color', 'opacity', 'bold', 'italic', 'underline', 'uppercase', 'outline', 'outlineColor', 'outlineOpacity', 'shadow', 'shadowX', 'shadowY', 'shadowBlur', 'shadowColor', 'shadowOpacity', 'bg', 'bgColor', 'bgOpacity', 'bgPadding', 'bgWidth', 'bgOffsetX', 'bgSlantLeft', 'bgSlantRight'];
        styleKeys.forEach(key => {
            if (key in item) {
                lastTextStyle[key] = item[key];
            }
        });
    }
    updateStyleControls();
    renderTextItemsList();
    textContentInput.focus();
    textContentInput.select();
}

// Update hint visibility
function updateHintVisibility() {
    if (textItems.length === 0) {
        textCanvasHint.classList.remove('hidden');
    } else {
        textCanvasHint.classList.add('hidden');
    }
}

// Update style controls based on selected item
function updateStyleControls() {
    const item = textItems.find(i => i.id === selectedTextId);
    if (item) {
        noSelectionMsg.classList.add('hidden');
        styleControlsInner.classList.remove('hidden');

        textContentInput.value = item.text;
        textFontSelect.value = item.fontFamily;
        textSizeInput.value = item.fontSize;
        textColorInput.value = item.color;
        textOpacityInput.value = item.opacity;
        textOpacityValue.textContent = item.opacity + '%';
        toggleBoldBtn.classList.toggle('active', item.bold);
        toggleItalicBtn.classList.toggle('active', item.italic);
        toggleUnderlineBtn.classList.toggle('active', item.underline);
        toggleUppercaseBtn.classList.toggle('active', item.uppercase);
        textOutlineCheckbox.checked = item.outline;
        textOutlineColorInput.value = item.outlineColor;
        textOutlineOpacityInput.value = item.outlineOpacity;
        textShadowCheckbox.checked = item.shadow;
        textShadowXInput.value = item.shadowX;
        textShadowYInput.value = item.shadowY;
        textShadowBlurInput.value = item.shadowBlur;
        textShadowColorInput.value = item.shadowColor;
        textShadowOpacityInput.value = item.shadowOpacity;
        textBgCheckbox.checked = item.bg;
        textBgColorInput.value = item.bgColor;
        textBgOpacityInput.value = item.bgOpacity;
        textBgPaddingInput.value = item.bgPadding;
        textBgWidthInput.value = item.bgWidth;
        textBgOffsetXInput.value = item.bgOffsetX;
        textBgSlantLeftInput.value = item.bgSlantLeft;
        textBgSlantRightInput.value = item.bgSlantRight;
    } else {
        noSelectionMsg.classList.remove('hidden');
        styleControlsInner.classList.add('hidden');
    }
}

// Render text items list
function renderTextItemsList() {
    textItemsList.innerHTML = '';
    textItems.forEach(item => {
        const chip = document.createElement('div');
        chip.className = 'text-item-chip rounded flex items-center justify-between';
        if (item.id === selectedTextId) {
            chip.classList.add('selected');
        }
        const displayText = item.text.length > 15 ? item.text.substring(0, 15) + '...' : item.text;
        chip.innerHTML = `
            <span class="truncate">${displayText || '(empty)'}</span>
            <button class="text-item-delete" title="Delete">&times;</button>
        `;
        chip.addEventListener('click', (e) => {
            if (!e.target.classList.contains('text-item-delete')) {
                selectTextItem(item.id);
            }
        });
        chip.querySelector('.text-item-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTextItem(item.id);
        });
        textItemsList.appendChild(chip);
    });
}

// Draw a single text item
function drawTextItem(ctx, item, canvasWidth, canvasHeight) {
    if (!item.text) return;

    const x = (item.x / 100) * canvasWidth;
    const y = (item.y / 100) * canvasHeight;

    // Build font string
    let fontStyle = '';
    if (item.italic) fontStyle += 'italic ';
    if (item.bold) fontStyle += 'bold ';
    fontStyle += item.fontSize + 'px ';
    fontStyle += '"' + item.fontFamily + '"';

    ctx.font = fontStyle;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Apply uppercase transform if enabled
    const displayText = item.uppercase ? item.text.toUpperCase() : item.text;

    // Draw background if enabled
    if (item.bg) {
        ctx.save();
        const textMetrics = ctx.measureText(displayText);
        const textWidth = textMetrics.width;
        const ascent = textMetrics.actualBoundingBoxAscent;
        const descent = textMetrics.actualBoundingBoxDescent;
        const textHeight = ascent + descent;
        const padding = item.bgPadding;
        const bgW = item.bgWidth > 0 ? (item.bgWidth / 100) * canvasWidth : textWidth + 2 * padding;
        const bgH = textHeight + 2 * padding;
        const centerX = x + textWidth / 2 + item.bgOffsetX;
        const centerY = y + (descent - ascent) / 2;
        const left = centerX - bgW / 2;
        const right = centerX + bgW / 2;
        const top = centerY - bgH / 2;
        const bottom = centerY + bgH / 2;
        const sl = item.bgSlantLeft;
        const sr = item.bgSlantRight;

        const r = parseInt(item.bgColor.slice(1, 3), 16);
        const g = parseInt(item.bgColor.slice(3, 5), 16);
        const b = parseInt(item.bgColor.slice(5, 7), 16);
        const a = item.bgOpacity / 100;

        ctx.globalAlpha = 1;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.beginPath();
        ctx.moveTo(left + sl, top);
        ctx.lineTo(right - sr, top);
        ctx.lineTo(right, bottom);
        ctx.lineTo(left, bottom);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Draw drop shadow as separate blurred pass (independent of text opacity)
    if (item.shadow) {
        ctx.save();
        const r = parseInt(item.shadowColor.slice(1, 3), 16);
        const g = parseInt(item.shadowColor.slice(3, 5), 16);
        const b = parseInt(item.shadowColor.slice(5, 7), 16);
        ctx.globalAlpha = item.shadowOpacity / 100;
        ctx.filter = `blur(${item.shadowBlur}px)`;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        if (item.outline) {
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = Math.max(2, item.fontSize / 12);
            ctx.lineJoin = 'round';
            ctx.strokeText(displayText, x + item.shadowX, y + item.shadowY);
        }
        ctx.fillText(displayText, x + item.shadowX, y + item.shadowY);
        ctx.restore();
    }

    // Draw outline if enabled (with its own opacity)
    if (item.outline) {
        ctx.globalAlpha = item.outlineOpacity / 100;
        ctx.strokeStyle = item.outlineColor;
        ctx.lineWidth = Math.max(2, item.fontSize / 12);
        ctx.lineJoin = 'round';
        ctx.strokeText(displayText, x, y);
    }

    // Draw fill
    ctx.globalAlpha = item.opacity / 100;
    ctx.fillStyle = item.color;
    ctx.fillText(displayText, x, y);

    // Draw underline if enabled
    if (item.underline) {
        const metrics = ctx.measureText(displayText);
        const underlineY = y + item.fontSize * 0.95;
        const underlineWidth = metrics.width;
        ctx.beginPath();
        ctx.moveTo(x, underlineY);
        ctx.lineTo(x + underlineWidth, underlineY);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = Math.max(1, item.fontSize / 20);
        ctx.stroke();
    }

    // Reset alpha
    ctx.globalAlpha = 1;
}

// Render the text overlay canvas
function renderTextOverlay() {
    if (!baseImageData || !baseImageData.image) return;

    // Only set canvas dimensions if they changed (avoids clearing)
    if (textCanvas.width !== baseImageData.width || textCanvas.height !== baseImageData.height) {
        textCanvas.width = baseImageData.width;
        textCanvas.height = baseImageData.height;
    }

    // Draw base image synchronously from cached image
    textCtx.drawImage(baseImageData.image, 0, 0);

    // Draw all text items
    textItems.forEach(item => {
        drawTextItem(textCtx, item, textCanvas.width, textCanvas.height);
    });

    // Update output pane if on text tab
    if (currentTab === 'text') {
        updateOutputPane();
    }
}

// Canvas drag handlers for repositioning text
textCanvas.addEventListener('mousedown', (e) => {
    if (selectedTextId) {
        isDragging = true;
        dragMoved = false;
        textCanvas.style.cursor = 'grabbing';
    }
});

textCanvas.addEventListener('mousemove', (e) => {
    if (isDragging && selectedTextId) {
        dragMoved = true;
        const pos = getCanvasClickPosition(e, textCanvas);
        updateTextItem(selectedTextId, { x: pos.x, y: pos.y });
    }
});

textCanvas.addEventListener('mouseup', (e) => {
    if (isDragging) {
        isDragging = false;
        textCanvas.style.cursor = 'crosshair';
    }
});

textCanvas.addEventListener('mouseleave', () => {
    if (isDragging) {
        isDragging = false;
        textCanvas.style.cursor = 'crosshair';
    }
});

// Canvas click handler
textCanvas.addEventListener('click', (e) => {
    const pos = getCanvasClickPosition(e, textCanvas);
    if (selectedTextId && !dragMoved) {
        updateTextItem(selectedTextId, { x: pos.x, y: pos.y });
    } else if (!selectedTextId) {
        addTextItem(pos.x, pos.y);
    }
});

// Add text button handler
addTextBtn.addEventListener('click', () => {
    // Add text at center
    addTextItem(50, 50);
});

// Style control event handlers
textContentInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { text: textContentInput.value });
    }
});

textFontSelect.addEventListener('change', () => {
    if (selectedTextId) {
        const fontFamily = textFontSelect.value;
        updateTextItem(selectedTextId, { fontFamily });
        document.fonts.load(`16px "${fontFamily}"`).then(() => {
            renderTextOverlay();
        });
    }
});

textSizeInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { fontSize: parseInt(textSizeInput.value) || 48 });
    }
});

textColorInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { color: textColorInput.value });
    }
});

textOpacityInput.addEventListener('input', () => {
    if (selectedTextId) {
        const val = parseInt(textOpacityInput.value);
        textOpacityValue.textContent = val + '%';
        updateTextItem(selectedTextId, { opacity: val });
    }
});

toggleBoldBtn.addEventListener('click', () => {
    if (selectedTextId) {
        const item = textItems.find(i => i.id === selectedTextId);
        if (item) {
            updateTextItem(selectedTextId, { bold: !item.bold });
            toggleBoldBtn.classList.toggle('active');
        }
    }
});

toggleItalicBtn.addEventListener('click', () => {
    if (selectedTextId) {
        const item = textItems.find(i => i.id === selectedTextId);
        if (item) {
            updateTextItem(selectedTextId, { italic: !item.italic });
            toggleItalicBtn.classList.toggle('active');
        }
    }
});

toggleUnderlineBtn.addEventListener('click', () => {
    if (selectedTextId) {
        const item = textItems.find(i => i.id === selectedTextId);
        if (item) {
            updateTextItem(selectedTextId, { underline: !item.underline });
            toggleUnderlineBtn.classList.toggle('active');
        }
    }
});

toggleUppercaseBtn.addEventListener('click', () => {
    if (selectedTextId) {
        const item = textItems.find(i => i.id === selectedTextId);
        if (item) {
            updateTextItem(selectedTextId, { uppercase: !item.uppercase });
            toggleUppercaseBtn.classList.toggle('active');
        }
    }
});

textOutlineCheckbox.addEventListener('change', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { outline: textOutlineCheckbox.checked });
    }
});

textOutlineColorInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { outlineColor: textOutlineColorInput.value });
    }
});

textOutlineOpacityInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { outlineOpacity: parseInt(textOutlineOpacityInput.value) || 0 });
    }
});

textShadowCheckbox.addEventListener('change', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { shadow: textShadowCheckbox.checked });
    }
});

textShadowXInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { shadowX: parseInt(textShadowXInput.value) || 0 });
    }
});

textShadowYInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { shadowY: parseInt(textShadowYInput.value) || 0 });
    }
});

textShadowBlurInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { shadowBlur: parseInt(textShadowBlurInput.value) || 0 });
    }
});

textShadowColorInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { shadowColor: textShadowColorInput.value });
    }
});

textShadowOpacityInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { shadowOpacity: parseInt(textShadowOpacityInput.value) || 0 });
    }
});

textBgCheckbox.addEventListener('change', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { bg: textBgCheckbox.checked });
    }
});

textBgColorInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { bgColor: textBgColorInput.value });
    }
});

textBgOpacityInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { bgOpacity: parseInt(textBgOpacityInput.value) || 0 });
    }
});

textBgPaddingInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { bgPadding: parseInt(textBgPaddingInput.value) || 0 });
    }
});

textBgWidthInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { bgWidth: parseInt(textBgWidthInput.value) || 0 });
    }
});

textBgOffsetXInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { bgOffsetX: parseInt(textBgOffsetXInput.value) || 0 });
    }
});

textBgSlantLeftInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { bgSlantLeft: parseInt(textBgSlantLeftInput.value) || 0 });
    }
});

textBgSlantRightInput.addEventListener('input', () => {
    if (selectedTextId) {
        updateTextItem(selectedTextId, { bgSlantRight: parseInt(textBgSlantRightInput.value) || 0 });
    }
});

deleteTextBtn.addEventListener('click', () => {
    if (selectedTextId) {
        deleteTextItem(selectedTextId);
    }
});

// Center text horizontally
centerHBtn.addEventListener('click', () => {
    if (selectedTextId && baseImageData) {
        const item = textItems.find(i => i.id === selectedTextId);
        if (item) {
            // Measure text width to center properly
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            let fontStyle = '';
            if (item.italic) fontStyle += 'italic ';
            if (item.bold) fontStyle += 'bold ';
            fontStyle += item.fontSize + 'px ';
            fontStyle += '"' + item.fontFamily + '"';
            tempCtx.font = fontStyle;
            const displayText = item.uppercase ? item.text.toUpperCase() : item.text;
            const textWidth = tempCtx.measureText(displayText).width;
            const textWidthPercent = (textWidth / baseImageData.width) * 100;
            const centerX = 50 - (textWidthPercent / 2);
            updateTextItem(selectedTextId, { x: centerX });
        }
    }
});

// Center text vertically
centerVBtn.addEventListener('click', () => {
    if (selectedTextId && baseImageData) {
        const item = textItems.find(i => i.id === selectedTextId);
        if (item) {
            // Use font size to estimate text height
            const textHeightPercent = (item.fontSize / baseImageData.height) * 100;
            const centerY = 50 - (textHeightPercent / 2);
            updateTextItem(selectedTextId, { y: centerY });
        }
    }
});

// Sync filename fields between process tab and text overlay tab
outputNameInput.addEventListener('input', () => {
    outputNameManuallyEdited = true;
    textOutputNameInput.value = outputNameInput.value;
});

// Sync text output name back to the main field
textOutputNameInput.addEventListener('input', () => {
    outputNameManuallyEdited = true;
    outputNameInput.value = textOutputNameInput.value;
    if (baseImageData) {
        const { filename } = getCurrentOutputData();
        outputFilename.textContent = filename;
        textOutputFilename.textContent = filename;
    }
});

// Text overlay download
textDownloadBtn.addEventListener('click', handleDownload);

textPreviewBtn.addEventListener('click', updatePreviewWindow);

// ============================================================
// Settings Persistence (localStorage + URL sharing)
// ============================================================

const SETTINGS_STORAGE_KEY = 'imager-settings';

// Gather all current settings into a plain object
function gatherSettings() {
    const settings = {
        // Process tab
        kn: keepNameCheckbox.checked,
        ts: addTimestampCheckbox.checked,
        mw: maxWidthInput.value,
        mh: maxHeightInput.value,
        ar: aspectRatioSelect.value,
        crw: customRatioW.value,
        crh: customRatioH.value,
        rm: document.querySelector('input[name="resize-mode"]:checked').value,
        cp: cropPositionSelect.value,
        om: overlayMarginInput.value,
        ob: overlayBlurCheckbox.checked,
        obc: overlayBgColorInput.value,
        se: shadowEnabledCheckbox.checked,
        sox: shadowOffsetXInput.value,
        soy: shadowOffsetYInput.value,
        sb: shadowBlurInput.value,
        sc: shadowColorInput.value,
        so: shadowOpacityInput.value,
        fj: forceJpgCheckbox.checked,
        jq: jpgQualityInput.value,
        // Text style defaults
        tf: lastTextStyle.fontFamily,
        tsz: lastTextStyle.fontSize,
        tc: lastTextStyle.color,
        to: lastTextStyle.opacity,
        tb: lastTextStyle.bold,
        ti: lastTextStyle.italic,
        tu: lastTextStyle.underline,
        tuc: lastTextStyle.uppercase,
        tol: lastTextStyle.outline,
        toc: lastTextStyle.outlineColor,
        too: lastTextStyle.outlineOpacity,
        tsh: lastTextStyle.shadow,
        tsx: lastTextStyle.shadowX,
        tsy: lastTextStyle.shadowY,
        tsb: lastTextStyle.shadowBlur,
        tsc: lastTextStyle.shadowColor,
        tso: lastTextStyle.shadowOpacity,
        tbg: lastTextStyle.bg,
        tbc: lastTextStyle.bgColor,
        tbo: lastTextStyle.bgOpacity,
        tbp: lastTextStyle.bgPadding,
        tbw: lastTextStyle.bgWidth,
        tbox: lastTextStyle.bgOffsetX,
        tbsl: lastTextStyle.bgSlantLeft,
        tbsr: lastTextStyle.bgSlantRight,
    };
    // Only save filename when "Keep name" is on
    if (keepNameCheckbox.checked && outputNameInput.value.trim()) {
        settings.fn = outputNameInput.value.trim();
    }
    return settings;
}

// Apply a settings object to the UI and internal state
function applySettings(s) {
    if (!s) return;

    // Process tab
    if ('kn' in s) keepNameCheckbox.checked = s.kn;
    if ('fn' in s) {
        outputNameInput.value = s.fn;
        textOutputNameInput.value = s.fn;
    }
    if ('ts' in s) addTimestampCheckbox.checked = s.ts;
    if ('mw' in s) maxWidthInput.value = s.mw;
    if ('mh' in s) maxHeightInput.value = s.mh;
    if ('ar' in s) aspectRatioSelect.value = s.ar;
    if ('crw' in s) customRatioW.value = s.crw;
    if ('crh' in s) customRatioH.value = s.crh;
    if ('rm' in s) {
        document.querySelectorAll('input[name="resize-mode"]').forEach(r => {
            r.checked = r.value === s.rm;
        });
        updateResizeModeOptions();
    }
    if ('cp' in s) cropPositionSelect.value = s.cp;
    if ('om' in s) overlayMarginInput.value = s.om;
    if ('ob' in s) {
        overlayBlurCheckbox.checked = s.ob;
        overlayBgColorInput.classList.toggle('hidden', s.ob);
        overlayBgColorInputLabel.classList.toggle('hidden', s.ob);
    }
    if ('obc' in s) overlayBgColorInput.value = s.obc;
    if ('se' in s) shadowEnabledCheckbox.checked = s.se;
    if ('sox' in s) shadowOffsetXInput.value = s.sox;
    if ('soy' in s) shadowOffsetYInput.value = s.soy;
    if ('sb' in s) shadowBlurInput.value = s.sb;
    if ('sc' in s) shadowColorInput.value = s.sc;
    if ('so' in s) shadowOpacityInput.value = s.so;
    if ('fj' in s) {
        forceJpgCheckbox.checked = s.fj;
        updateQualityVisibility();
    }
    if ('jq' in s) jpgQualityInput.value = s.jq;

    // Text style defaults
    if ('tf' in s) lastTextStyle.fontFamily = s.tf;
    if ('tsz' in s) lastTextStyle.fontSize = s.tsz;
    if ('tc' in s) lastTextStyle.color = s.tc;
    if ('to' in s) lastTextStyle.opacity = s.to;
    if ('tb' in s) lastTextStyle.bold = s.tb;
    if ('ti' in s) lastTextStyle.italic = s.ti;
    if ('tu' in s) lastTextStyle.underline = s.tu;
    if ('tuc' in s) lastTextStyle.uppercase = s.tuc;
    if ('tol' in s) lastTextStyle.outline = s.tol;
    if ('toc' in s) lastTextStyle.outlineColor = s.toc;
    if ('too' in s) lastTextStyle.outlineOpacity = s.too;
    if ('tsh' in s) lastTextStyle.shadow = s.tsh;
    if ('tsx' in s) lastTextStyle.shadowX = s.tsx;
    if ('tsy' in s) lastTextStyle.shadowY = s.tsy;
    if ('tsb' in s) lastTextStyle.shadowBlur = s.tsb;
    if ('tsc' in s) lastTextStyle.shadowColor = s.tsc;
    if ('tso' in s) lastTextStyle.shadowOpacity = s.tso;
    if ('tbg' in s) lastTextStyle.bg = s.tbg;
    if ('tbc' in s) lastTextStyle.bgColor = s.tbc;
    if ('tbo' in s) lastTextStyle.bgOpacity = s.tbo;
    if ('tbp' in s) lastTextStyle.bgPadding = s.tbp;
    if ('tbw' in s) lastTextStyle.bgWidth = s.tbw;
    if ('tbox' in s) lastTextStyle.bgOffsetX = s.tbox;
    if ('tbsl' in s) lastTextStyle.bgSlantLeft = s.tbsl;
    if ('tbsr' in s) lastTextStyle.bgSlantRight = s.tbsr;
}

function saveToLocalStorage() {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(gatherSettings()));
    } catch (e) { /* localStorage unavailable */ }
}

function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
}

function generateSettingsUrl() {
    const json = JSON.stringify(gatherSettings());
    const encoded = btoa(json);
    const url = new URL(window.location.href.split('?')[0].split('#')[0]);
    url.searchParams.set('s', encoded);
    return url.toString();
}

function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('s');
    if (encoded) {
        try {
            return JSON.parse(atob(encoded));
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Auto-save on any tracked input change
[
    'output-name', 'keep-name', 'add-timestamp', 'max-width', 'max-height',
    'aspect-ratio', 'custom-ratio-w', 'custom-ratio-h',
    'crop-position', 'overlay-margin', 'overlay-blur', 'overlay-bg-color',
    'shadow-enabled', 'shadow-offset-x', 'shadow-offset-y', 'shadow-blur', 'shadow-color', 'shadow-opacity',
    'force-jpg', 'jpg-quality',
    'text-font', 'text-size', 'text-color', 'text-opacity',
    'text-outline', 'text-outline-color', 'text-outline-opacity',
    'text-shadow', 'text-shadow-x', 'text-shadow-y', 'text-shadow-blur',
    'text-shadow-color', 'text-shadow-opacity',
    'text-bg', 'text-bg-color', 'text-bg-opacity', 'text-bg-padding',
    'text-bg-width', 'text-bg-offset-x', 'text-bg-slant-left', 'text-bg-slant-right'
].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', saveToLocalStorage);
        el.addEventListener('change', saveToLocalStorage);
    }
});

// Save on resize mode radio change
resizeModeInputs.forEach(input => {
    input.addEventListener('change', saveToLocalStorage);
});

// Save on text style toggle clicks
[toggleBoldBtn, toggleItalicBtn, toggleUnderlineBtn, toggleUppercaseBtn].forEach(btn => {
    btn.addEventListener('click', () => {
        // Delay slightly so updateTextItem/lastTextStyle updates first
        setTimeout(saveToLocalStorage, 0);
    });
});

// Copy Settings Link button
const copySettingsBtn = document.getElementById('copy-settings-btn');
if (copySettingsBtn) {
    copySettingsBtn.addEventListener('click', () => {
        const url = generateSettingsUrl();
        const showCopied = () => {
            copySettingsBtn.textContent = 'Copied!';
            setTimeout(() => { copySettingsBtn.textContent = '\u2699 Copy Settings Link'; }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(showCopied).catch(fallbackCopy);
        } else {
            fallbackCopy();
        }
        function fallbackCopy() {
            const tmp = document.createElement('textarea');
            tmp.value = url;
            tmp.style.position = 'fixed';
            tmp.style.opacity = '0';
            document.body.appendChild(tmp);
            tmp.select();
            document.execCommand('copy');
            document.body.removeChild(tmp);
            showCopied();
        }
    });
}

// On page load: URL params > localStorage > defaults
(function initSettings() {
    const urlSettings = loadFromUrl();
    if (urlSettings) {
        applySettings(urlSettings);
        saveToLocalStorage();
        // Clean the URL
        window.history.replaceState({}, '', window.location.pathname);
    } else {
        const stored = loadFromLocalStorage();
        if (stored) {
            applySettings(stored);
        }
    }
})();
