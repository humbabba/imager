(() => {
  // src/main.js
  var fileInput = document.getElementById("image-upload");
  var processBtn = document.getElementById("process-btn");
  var downloadBtn = document.getElementById("download-btn");
  var previewBtn = document.getElementById("preview-btn");
  var outputNameInput = document.getElementById("output-name");
  var outputNameFinalInput = document.getElementById("output-name-final");
  var keepNameCheckbox = document.getElementById("keep-name");
  var addTimestampCheckbox = document.getElementById("add-timestamp");
  var maxWidthInput = document.getElementById("max-width");
  var maxHeightInput = document.getElementById("max-height");
  var aspectRatioSelect = document.getElementById("aspect-ratio");
  var cropPositionSelect = document.getElementById("crop-position");
  var cropPositionContainer = document.getElementById("crop-position-container");
  var overlayOptionsContainer = document.getElementById("overlay-options-container");
  var overlayMarginInput = document.getElementById("overlay-margin");
  var shadowOffsetXInput = document.getElementById("shadow-offset-x");
  var shadowOffsetYInput = document.getElementById("shadow-offset-y");
  var shadowBlurInput = document.getElementById("shadow-blur");
  var shadowColorInput = document.getElementById("shadow-color");
  var shadowOpacityInput = document.getElementById("shadow-opacity");
  var qualityContainer = document.getElementById("quality-container");
  var jpgQualityInput = document.getElementById("jpg-quality");
  var forceJpgCheckbox = document.getElementById("force-jpg");
  function updateQualityVisibility() {
    const isJpg = sourceMimeType === "image/jpeg";
    const forceJpg = forceJpgCheckbox.checked;
    qualityContainer.classList.toggle("hidden", !isJpg && !forceJpg);
  }
  forceJpgCheckbox.addEventListener("change", updateQualityVisibility);
  var customRatioW = document.getElementById("custom-ratio-w");
  var customRatioH = document.getElementById("custom-ratio-h");
  var resizeModeInputs = document.querySelectorAll('input[name="resize-mode"]');
  aspectRatioSelect.addEventListener("change", () => {
    if (aspectRatioSelect.value) {
      customRatioW.value = "";
      customRatioH.value = "";
    }
  });
  customRatioW.addEventListener("input", () => {
    if (customRatioW.value) {
      aspectRatioSelect.value = "";
    }
    updateCropPositionOptions();
  });
  customRatioH.addEventListener("input", () => {
    if (customRatioH.value) {
      aspectRatioSelect.value = "";
    }
    updateCropPositionOptions();
  });
  function getAspectRatio() {
    if (aspectRatioSelect.value) {
      return aspectRatioSelect.value;
    }
    const w = parseInt(customRatioW.value);
    const h = parseInt(customRatioH.value);
    if (w > 0 && h > 0) {
      return `${w}:${h}`;
    }
    return "";
  }
  var canvas = document.getElementById("output-canvas");
  var outputContainer = document.getElementById("output-container");
  var outputFilename = document.getElementById("output-filename");
  var outputDimensions = document.getElementById("output-dimensions");
  var sourceContainer = document.getElementById("source-container");
  var sourcePreview = document.getElementById("source-preview");
  var sourceFilenameEl = document.getElementById("source-filename");
  var sourceDimensionsEl = document.getElementById("source-dimensions");
  var sourceFilesizeEl = document.getElementById("source-filesize");
  var outputFilesizeEl = document.getElementById("output-filesize");
  var ctx = canvas.getContext("2d");
  var textOutputBar = document.getElementById("text-output-bar");
  var textOutputFilename = document.getElementById("text-output-filename");
  var textOutputDimensions = document.getElementById("text-output-dimensions");
  var textOutputFilesize = document.getElementById("text-output-filesize");
  var textOutputNameInput = document.getElementById("text-output-name");
  var textDownloadBtn = document.getElementById("text-download-btn");
  var textPreviewBtn = document.getElementById("text-preview-btn");
  function formatFilesize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }
  var uploadedImage = null;
  function updateCropPositionOptions() {
    const aspectRatio = getAspectRatio();
    const resizeMode = document.querySelector('input[name="resize-mode"]:checked').value;
    if (resizeMode !== "crop") {
      cropPositionContainer.style.display = "none";
      return;
    }
    cropPositionContainer.style.display = "flex";
    if (!aspectRatio || !uploadedImage) {
      return;
    }
    const [ratioW, ratioH] = aspectRatio.split(":").map(Number);
    const targetRatio = ratioW / ratioH;
    const imgRatio = uploadedImage.width / uploadedImage.height;
    const isWider = imgRatio > targetRatio;
    const isTaller = imgRatio < targetRatio;
    const isExact = Math.abs(imgRatio - targetRatio) < 1e-3;
    cropPositionSelect.innerHTML = "";
    const centerOption = document.createElement("option");
    centerOption.value = "center";
    centerOption.textContent = "Center crop";
    cropPositionSelect.appendChild(centerOption);
    if (isExact) {
      return;
    }
    if (isWider) {
      const leftOption = document.createElement("option");
      leftOption.value = "left";
      leftOption.textContent = "Left crop";
      cropPositionSelect.appendChild(leftOption);
      const rightOption = document.createElement("option");
      rightOption.value = "right";
      rightOption.textContent = "Right crop";
      cropPositionSelect.appendChild(rightOption);
    } else if (isTaller) {
      const topOption = document.createElement("option");
      topOption.value = "top";
      topOption.textContent = "Top crop";
      cropPositionSelect.appendChild(topOption);
      const bottomOption = document.createElement("option");
      bottomOption.value = "bottom";
      bottomOption.textContent = "Bottom crop";
      cropPositionSelect.appendChild(bottomOption);
    }
  }
  function updateResizeModeOptions() {
    const resizeMode = document.querySelector('input[name="resize-mode"]:checked').value;
    overlayOptionsContainer.classList.toggle("hidden", resizeMode !== "overlay");
    updateCropPositionOptions();
  }
  resizeModeInputs.forEach((input) => {
    input.addEventListener("change", updateResizeModeOptions);
  });
  aspectRatioSelect.addEventListener("change", updateCropPositionOptions);
  var sourceFileName = "";
  var sourceMimeType = "image/png";
  function getTimestamp() {
    const now = /* @__PURE__ */ new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  }
  function getExtensionFromMime(mimeType) {
    const mimeToExt = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/bmp": "bmp"
    };
    return mimeToExt[mimeType] || "png";
  }
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const nameParts = file.name.split(".");
      nameParts.pop();
      sourceFileName = nameParts.join(".");
      sourceMimeType = file.type || "image/png";
      if (!outputNameInput.value.trim()) {
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
        sourceDimensionsEl.textContent = `${img.width} \xD7 ${img.height} px`;
        sourceFilesizeEl.textContent = formatFilesize(file.size);
        sourceContainer.classList.remove("hidden");
        updateQualityVisibility();
      };
      img.src = objectUrl;
    }
  });
  processBtn.addEventListener("click", () => {
    if (!uploadedImage) return;
    const maxWidth = parseInt(maxWidthInput.value) || uploadedImage.width;
    const maxHeight = parseInt(maxHeightInput.value) || uploadedImage.height;
    const aspectRatio = getAspectRatio();
    const resizeMode = document.querySelector('input[name="resize-mode"]:checked').value;
    let targetWidth, targetHeight;
    let sourceX = 0, sourceY = 0, sourceWidth = uploadedImage.width, sourceHeight = uploadedImage.height;
    if (aspectRatio) {
      const [ratioW, ratioH] = aspectRatio.split(":").map(Number);
      const ratio = ratioW / ratioH;
      if (resizeMode === "crop") {
        const imgRatio = uploadedImage.width / uploadedImage.height;
        const cropPosition = cropPositionSelect.value;
        if (imgRatio > ratio) {
          sourceHeight = uploadedImage.height;
          sourceWidth = sourceHeight * ratio;
          if (cropPosition === "left") {
            sourceX = 0;
          } else if (cropPosition === "right") {
            sourceX = uploadedImage.width - sourceWidth;
          } else {
            sourceX = (uploadedImage.width - sourceWidth) / 2;
          }
        } else {
          sourceWidth = uploadedImage.width;
          sourceHeight = sourceWidth / ratio;
          if (cropPosition === "top") {
            sourceY = 0;
          } else if (cropPosition === "bottom") {
            sourceY = uploadedImage.height - sourceHeight;
          } else {
            sourceY = (uploadedImage.height - sourceHeight) / 2;
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
    if (resizeMode === "overlay" && aspectRatio) {
      const imgRatio = uploadedImage.width / uploadedImage.height;
      const canvasRatio = targetWidth / targetHeight;
      const marginPercent = parseFloat(overlayMarginInput.value) || 0;
      const smallerDimension = Math.min(targetWidth, targetHeight);
      const margin = marginPercent / 100 * smallerDimension;
      const shadowOffsetX = parseFloat(shadowOffsetXInput.value) || 0;
      const shadowOffsetY = parseFloat(shadowOffsetYInput.value) || 0;
      const shadowBlur = parseFloat(shadowBlurInput.value) || 0;
      const shadowColorHex = shadowColorInput.value || "#000000";
      const shadowOpacity = (parseFloat(shadowOpacityInput.value) || 0) / 100;
      const r = parseInt(shadowColorHex.slice(1, 3), 16);
      const g = parseInt(shadowColorHex.slice(3, 5), 16);
      const b = parseInt(shadowColorHex.slice(5, 7), 16);
      const shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`;
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
      ctx.filter = "blur(20px)";
      ctx.drawImage(uploadedImage, bgX, bgY, bgWidth, bgHeight);
      ctx.filter = "none";
      const availableWidth = targetWidth - margin * 2;
      const availableHeight = targetHeight - margin * 2;
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
      if (shadowBlur > 0 || shadowOffsetX !== 0 || shadowOffsetY !== 0) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;
      }
      ctx.drawImage(uploadedImage, drawX, drawY, drawWidth, drawHeight);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      ctx.drawImage(
        uploadedImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetWidth,
        targetHeight
      );
    }
    const forceJpg = forceJpgCheckbox.checked;
    const outputMimeType = forceJpg ? "image/jpeg" : sourceMimeType;
    const isOutputJpg = outputMimeType === "image/jpeg";
    const quality = isOutputJpg ? (parseInt(jpgQualityInput.value) || 80) / 100 : 1;
    const dataUrl = canvas.toDataURL(outputMimeType, quality);
    const outputBytes = Math.round((dataUrl.length - `data:${sourceMimeType};base64,`.length) * 0.75);
    outputFilesizeEl.textContent = formatFilesize(outputBytes);
    const extension = getExtensionFromMime(outputMimeType);
    const baseName = outputNameInput.value.trim() || sourceFileName;
    let generatedFilename;
    if (addTimestampCheckbox.checked) {
      const timestamp = getTimestamp();
      generatedFilename = `${baseName} - ${timestamp}.${extension}`;
    } else {
      generatedFilename = `${baseName}.${extension}`;
    }
    outputFilename.textContent = generatedFilename;
    outputDimensions.textContent = `${targetWidth} \xD7 ${targetHeight} px`;
    canvas.dataset.filename = generatedFilename;
    canvas.dataset.baseName = baseName;
    canvas.dataset.dataUrl = dataUrl;
    canvas.dataset.width = targetWidth;
    canvas.dataset.height = targetHeight;
    outputNameFinalInput.value = baseName;
    textOutputNameInput.value = baseName;
    if (!keepNameCheckbox.checked) {
      outputNameInput.value = "";
    }
    outputContainer.classList.remove("hidden");
    if (previewWindow && !previewWindow.closed) {
      updatePreviewWindow();
    }
    showTextOverlayTab();
  });
  var currentTab = "process";
  function getCurrentOutputData() {
    const forceJpg = forceJpgCheckbox.checked;
    const outputMimeType = forceJpg ? "image/jpeg" : sourceMimeType;
    const isOutputJpg = outputMimeType === "image/jpeg";
    const quality = isOutputJpg ? (parseInt(jpgQualityInput.value) || 80) / 100 : 1;
    const extension = getExtensionFromMime(outputMimeType);
    const baseName = outputNameFinalInput.value.trim() || sourceFileName || "image";
    let filename;
    if (addTimestampCheckbox.checked) {
      const timestamp = getTimestamp();
      filename = `${baseName} - ${timestamp}.${extension}`;
    } else {
      filename = `${baseName}.${extension}`;
    }
    let dataUrl;
    let width, height;
    if (currentTab === "text" && baseImageData) {
      dataUrl = textCanvas.toDataURL(outputMimeType, quality);
      width = textCanvas.width;
      height = textCanvas.height;
    } else {
      dataUrl = canvas.dataset.dataUrl;
      width = parseInt(canvas.dataset.width) || canvas.width;
      height = parseInt(canvas.dataset.height) || canvas.height;
    }
    return { dataUrl, filename, width, height, outputMimeType };
  }
  downloadBtn.addEventListener("click", () => {
    const { dataUrl, filename } = getCurrentOutputData();
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  });
  var previewWindow = null;
  function updatePreviewWindow() {
    if (!previewWindow || previewWindow.closed) {
      previewWindow = window.open("", "imager-preview", "menubar=no,toolbar=no,location=no,status=no");
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
  previewBtn.addEventListener("click", updatePreviewWindow);
  var tabBar = document.getElementById("tab-bar");
  var tabBarText = document.getElementById("tab-bar-text");
  var processView = document.getElementById("process-view");
  var textOverlayView = document.getElementById("text-overlay-view");
  var textCanvas = document.getElementById("text-canvas");
  var textCanvasHint = document.getElementById("text-canvas-hint");
  var textCtx = textCanvas.getContext("2d");
  var textItemsList = document.getElementById("text-items-list");
  var addTextBtn = document.getElementById("add-text-btn");
  var noSelectionMsg = document.getElementById("no-selection-msg");
  var styleControlsInner = document.getElementById("style-controls-inner");
  var textContentInput = document.getElementById("text-content");
  var textFontSelect = document.getElementById("text-font");
  var textSizeInput = document.getElementById("text-size");
  var textColorInput = document.getElementById("text-color");
  var textOpacityInput = document.getElementById("text-opacity");
  var textOpacityValue = document.getElementById("text-opacity-value");
  var toggleBoldBtn = document.getElementById("toggle-bold");
  var toggleItalicBtn = document.getElementById("toggle-italic");
  var toggleUnderlineBtn = document.getElementById("toggle-underline");
  var toggleUppercaseBtn = document.getElementById("toggle-uppercase");
  var textOutlineCheckbox = document.getElementById("text-outline");
  var textOutlineColorInput = document.getElementById("text-outline-color");
  var textShadowCheckbox = document.getElementById("text-shadow");
  var textShadowXInput = document.getElementById("text-shadow-x");
  var textShadowYInput = document.getElementById("text-shadow-y");
  var textShadowBlurInput = document.getElementById("text-shadow-blur");
  var textShadowColorInput = document.getElementById("text-shadow-color");
  var textShadowOpacityInput = document.getElementById("text-shadow-opacity");
  var deleteTextBtn = document.getElementById("delete-text-btn");
  var centerHBtn = document.getElementById("center-h-btn");
  var centerVBtn = document.getElementById("center-v-btn");
  var textItems = [];
  var selectedTextId = null;
  var baseImageData = null;
  var isDragging = false;
  var lastTextStyle = {
    fontFamily: "Arial",
    fontSize: 48,
    color: "#ffffff",
    opacity: 100,
    bold: false,
    italic: false,
    underline: false,
    uppercase: false,
    outline: false,
    outlineColor: "#000000",
    shadow: false,
    shadowX: 3,
    shadowY: 3,
    shadowBlur: 4,
    shadowColor: "#000000",
    shadowOpacity: 80
  };
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
  function createDefaultTextItem(x, y) {
    return {
      id: generateId(),
      text: "Text",
      x,
      y,
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
      shadow: lastTextStyle.shadow,
      shadowX: lastTextStyle.shadowX,
      shadowY: lastTextStyle.shadowY,
      shadowBlur: lastTextStyle.shadowBlur,
      shadowColor: lastTextStyle.shadowColor,
      shadowOpacity: lastTextStyle.shadowOpacity
    };
  }
  function updateOutputPane() {
    const { dataUrl, filename, width, height, outputMimeType } = getCurrentOutputData();
    const img = new Image();
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
    outputFilename.textContent = filename;
    outputDimensions.textContent = `${width} \xD7 ${height} px`;
    const outputBytes = Math.round((dataUrl.length - `data:${outputMimeType};base64,`.length) * 0.75);
    outputFilesizeEl.textContent = formatFilesize(outputBytes);
    textOutputFilename.textContent = filename;
    textOutputDimensions.textContent = `${width} \xD7 ${height} px`;
    textOutputFilesize.textContent = formatFilesize(outputBytes);
    textOutputBar.classList.remove("hidden");
  }
  function switchToTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll(".tab-process-btn").forEach((btn) => {
      btn.classList.toggle("active", tabName === "process");
    });
    document.querySelectorAll(".tab-text-btn").forEach((btn) => {
      btn.classList.toggle("active", tabName === "text");
    });
    if (tabName === "process") {
      processView.classList.remove("hidden");
      textOverlayView.classList.add("hidden");
    } else if (tabName === "text") {
      processView.classList.add("hidden");
      textOverlayView.classList.remove("hidden");
      renderTextOverlay();
    }
    if (baseImageData) {
      updateOutputPane();
    }
  }
  document.querySelectorAll(".tab-process-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchToTab("process"));
  });
  document.querySelectorAll(".tab-text-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchToTab("text"));
  });
  function showTextOverlayTab() {
    tabBar.classList.remove("hidden");
    const dataUrl = canvas.toDataURL();
    const img = new Image();
    img.src = dataUrl;
    baseImageData = {
      width: canvas.width,
      height: canvas.height,
      dataUrl,
      image: img
    };
  }
  function getCanvasClickPosition(event, canvasEl) {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width;
    const scaleY = canvasEl.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX / canvasEl.width * 100;
    const y = (event.clientY - rect.top) * scaleY / canvasEl.height * 100;
    return { x, y };
  }
  function addTextItem(x, y) {
    const item = createDefaultTextItem(x, y);
    textItems.push(item);
    selectTextItem(item.id);
    renderTextItemsList();
    renderTextOverlay();
    updateHintVisibility();
    textContentInput.focus();
    textContentInput.select();
  }
  function updateTextItem(id, updates) {
    const item = textItems.find((i) => i.id === id);
    if (item) {
      Object.assign(item, updates);
      const styleKeys = ["fontFamily", "fontSize", "color", "opacity", "bold", "italic", "underline", "uppercase", "outline", "outlineColor", "shadow", "shadowX", "shadowY", "shadowBlur", "shadowColor", "shadowOpacity"];
      styleKeys.forEach((key) => {
        if (key in item) {
          lastTextStyle[key] = item[key];
        }
      });
      renderTextOverlay();
      renderTextItemsList();
    }
  }
  function deleteTextItem(id) {
    const index = textItems.findIndex((i) => i.id === id);
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
  function selectTextItem(id) {
    selectedTextId = id;
    const item = textItems.find((i) => i.id === id);
    if (item) {
      const styleKeys = ["fontFamily", "fontSize", "color", "opacity", "bold", "italic", "underline", "uppercase", "outline", "outlineColor", "shadow", "shadowX", "shadowY", "shadowBlur", "shadowColor", "shadowOpacity"];
      styleKeys.forEach((key) => {
        if (key in item) {
          lastTextStyle[key] = item[key];
        }
      });
    }
    updateStyleControls();
    renderTextItemsList();
  }
  function updateHintVisibility() {
    if (textItems.length === 0) {
      textCanvasHint.classList.remove("hidden");
    } else {
      textCanvasHint.classList.add("hidden");
    }
  }
  function updateStyleControls() {
    const item = textItems.find((i) => i.id === selectedTextId);
    if (item) {
      noSelectionMsg.classList.add("hidden");
      styleControlsInner.classList.remove("hidden");
      textContentInput.value = item.text;
      textFontSelect.value = item.fontFamily;
      textSizeInput.value = item.fontSize;
      textColorInput.value = item.color;
      textOpacityInput.value = item.opacity;
      textOpacityValue.textContent = item.opacity + "%";
      toggleBoldBtn.classList.toggle("active", item.bold);
      toggleItalicBtn.classList.toggle("active", item.italic);
      toggleUnderlineBtn.classList.toggle("active", item.underline);
      toggleUppercaseBtn.classList.toggle("active", item.uppercase);
      textOutlineCheckbox.checked = item.outline;
      textOutlineColorInput.value = item.outlineColor;
      textShadowCheckbox.checked = item.shadow;
      textShadowXInput.value = item.shadowX;
      textShadowYInput.value = item.shadowY;
      textShadowBlurInput.value = item.shadowBlur;
      textShadowColorInput.value = item.shadowColor;
      textShadowOpacityInput.value = item.shadowOpacity;
    } else {
      noSelectionMsg.classList.remove("hidden");
      styleControlsInner.classList.add("hidden");
    }
  }
  function renderTextItemsList() {
    textItemsList.innerHTML = "";
    textItems.forEach((item) => {
      const chip = document.createElement("div");
      chip.className = "text-item-chip rounded flex items-center justify-between";
      if (item.id === selectedTextId) {
        chip.classList.add("selected");
      }
      const displayText = item.text.length > 15 ? item.text.substring(0, 15) + "..." : item.text;
      chip.innerHTML = `
            <span class="truncate">${displayText || "(empty)"}</span>
            <button class="text-item-delete" title="Delete">&times;</button>
        `;
      chip.addEventListener("click", (e) => {
        if (!e.target.classList.contains("text-item-delete")) {
          selectTextItem(item.id);
        }
      });
      chip.querySelector(".text-item-delete").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTextItem(item.id);
      });
      textItemsList.appendChild(chip);
    });
  }
  function drawTextItem(ctx2, item, canvasWidth, canvasHeight) {
    if (!item.text) return;
    const x = item.x / 100 * canvasWidth;
    const y = item.y / 100 * canvasHeight;
    let fontStyle = "";
    if (item.italic) fontStyle += "italic ";
    if (item.bold) fontStyle += "bold ";
    fontStyle += item.fontSize + "px ";
    fontStyle += '"' + item.fontFamily + '"';
    ctx2.font = fontStyle;
    ctx2.textAlign = "left";
    ctx2.textBaseline = "top";
    ctx2.globalAlpha = item.opacity / 100;
    const displayText = item.uppercase ? item.text.toUpperCase() : item.text;
    if (item.shadow) {
      const r = parseInt(item.shadowColor.slice(1, 3), 16);
      const g = parseInt(item.shadowColor.slice(3, 5), 16);
      const b = parseInt(item.shadowColor.slice(5, 7), 16);
      const a = item.shadowOpacity / 100;
      ctx2.shadowColor = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx2.shadowOffsetX = item.shadowX;
      ctx2.shadowOffsetY = item.shadowY;
      ctx2.shadowBlur = item.shadowBlur;
    }
    if (item.outline) {
      ctx2.strokeStyle = item.outlineColor;
      ctx2.lineWidth = Math.max(2, item.fontSize / 12);
      ctx2.lineJoin = "round";
      ctx2.strokeText(displayText, x, y);
    }
    ctx2.fillStyle = item.color;
    ctx2.fillText(displayText, x, y);
    ctx2.shadowColor = "transparent";
    ctx2.shadowOffsetX = 0;
    ctx2.shadowOffsetY = 0;
    ctx2.shadowBlur = 0;
    if (item.underline) {
      const metrics = ctx2.measureText(displayText);
      const underlineY = y + item.fontSize * 0.95;
      const underlineWidth = metrics.width;
      ctx2.beginPath();
      ctx2.moveTo(x, underlineY);
      ctx2.lineTo(x + underlineWidth, underlineY);
      ctx2.strokeStyle = item.color;
      ctx2.lineWidth = Math.max(1, item.fontSize / 20);
      ctx2.stroke();
    }
    ctx2.globalAlpha = 1;
  }
  function renderTextOverlay() {
    if (!baseImageData || !baseImageData.image) return;
    if (textCanvas.width !== baseImageData.width || textCanvas.height !== baseImageData.height) {
      textCanvas.width = baseImageData.width;
      textCanvas.height = baseImageData.height;
    }
    textCtx.drawImage(baseImageData.image, 0, 0);
    textItems.forEach((item) => {
      drawTextItem(textCtx, item, textCanvas.width, textCanvas.height);
    });
    if (currentTab === "text") {
      updateOutputPane();
    }
  }
  textCanvas.addEventListener("mousedown", (e) => {
    if (selectedTextId) {
      isDragging = true;
      textCanvas.style.cursor = "grabbing";
    }
  });
  textCanvas.addEventListener("mousemove", (e) => {
    if (isDragging && selectedTextId) {
      const pos = getCanvasClickPosition(e, textCanvas);
      updateTextItem(selectedTextId, { x: pos.x, y: pos.y });
    }
  });
  textCanvas.addEventListener("mouseup", (e) => {
    if (isDragging) {
      isDragging = false;
      textCanvas.style.cursor = "crosshair";
    }
  });
  textCanvas.addEventListener("mouseleave", () => {
    if (isDragging) {
      isDragging = false;
      textCanvas.style.cursor = "crosshair";
    }
  });
  textCanvas.addEventListener("click", (e) => {
    if (!selectedTextId) {
      const pos = getCanvasClickPosition(e, textCanvas);
      addTextItem(pos.x, pos.y);
    }
  });
  addTextBtn.addEventListener("click", () => {
    addTextItem(50, 50);
  });
  textContentInput.addEventListener("input", () => {
    if (selectedTextId) {
      updateTextItem(selectedTextId, { text: textContentInput.value });
    }
  });
  textFontSelect.addEventListener("change", () => {
    if (selectedTextId) {
      const fontFamily = textFontSelect.value;
      updateTextItem(selectedTextId, { fontFamily });
      document.fonts.load(`16px "${fontFamily}"`).then(() => {
        renderTextOverlay();
      });
    }
  });
  textSizeInput.addEventListener("input", () => {
    if (selectedTextId) {
      updateTextItem(selectedTextId, { fontSize: parseInt(textSizeInput.value) || 48 });
    }
  });
  textColorInput.addEventListener("input", () => {
    if (selectedTextId) {
      updateTextItem(selectedTextId, { color: textColorInput.value });
    }
  });
  textOpacityInput.addEventListener("input", () => {
    if (selectedTextId) {
      const val = parseInt(textOpacityInput.value);
      textOpacityValue.textContent = val + "%";
      updateTextItem(selectedTextId, { opacity: val });
    }
  });
  toggleBoldBtn.addEventListener("click", () => {
    if (selectedTextId) {
      const item = textItems.find((i) => i.id === selectedTextId);
      if (item) {
        updateTextItem(selectedTextId, { bold: !item.bold });
        toggleBoldBtn.classList.toggle("active");
      }
    }
  });
  toggleItalicBtn.addEventListener("click", () => {
    if (selectedTextId) {
      const item = textItems.find((i) => i.id === selectedTextId);
      if (item) {
        updateTextItem(selectedTextId, { italic: !item.italic });
        toggleItalicBtn.classList.toggle("active");
      }
    }
  });
  toggleUnderlineBtn.addEventListener("click", () => {
    if (selectedTextId) {
      const item = textItems.find((i) => i.id === selectedTextId);
      if (item) {
        updateTextItem(selectedTextId, { underline: !item.underline });
        toggleUnderlineBtn.classList.toggle("active");
      }
    }
  });
  toggleUppercaseBtn.addEventListener("click", () => {
    if (selectedTextId) {
      const item = textItems.find((i) => i.id === selectedTextId);
      if (item) {
        updateTextItem(selectedTextId, { uppercase: !item.uppercase });
        toggleUppercaseBtn.classList.toggle("active");
      }
    }
  });
  textOutlineCheckbox.addEventListener("change", () => {
    if (selectedTextId) {
      updateTextItem(selectedTextId, { outline: textOutlineCheckbox.checked });
    }
  });
  textOutlineColorInput.addEventListener("input", () => {
    if (selectedTextId) {
      updateTextItem(selectedTextId, { outlineColor: textOutlineColorInput.value });
    }
  });
  textShadowCheckbox.addEventListener("change", () => {
    if (selectedTextId) {
      updateTextItem(selectedTextId, { shadow: textShadowCheckbox.checked });
    }
  });
  textShadowXInput.addEventListener("input", () => {
    if (selectedTextId) {
      updateTextItem(selectedTextId, { shadowX: parseInt(textShadowXInput.value) || 0 });
    }
  });
  textShadowYInput.addEventListener("input", () => {
    if (selectedTextId) {
      updateTextItem(selectedTextId, { shadowY: parseInt(textShadowYInput.value) || 0 });
    }
  });
  textShadowBlurInput.addEventListener("input", () => {
    if (selectedTextId) {
      updateTextItem(selectedTextId, { shadowBlur: parseInt(textShadowBlurInput.value) || 0 });
    }
  });
  textShadowColorInput.addEventListener("input", () => {
    if (selectedTextId) {
      updateTextItem(selectedTextId, { shadowColor: textShadowColorInput.value });
    }
  });
  textShadowOpacityInput.addEventListener("input", () => {
    if (selectedTextId) {
      updateTextItem(selectedTextId, { shadowOpacity: parseInt(textShadowOpacityInput.value) || 0 });
    }
  });
  deleteTextBtn.addEventListener("click", () => {
    if (selectedTextId) {
      deleteTextItem(selectedTextId);
    }
  });
  centerHBtn.addEventListener("click", () => {
    if (selectedTextId && baseImageData) {
      const item = textItems.find((i) => i.id === selectedTextId);
      if (item) {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        let fontStyle = "";
        if (item.italic) fontStyle += "italic ";
        if (item.bold) fontStyle += "bold ";
        fontStyle += item.fontSize + "px ";
        fontStyle += '"' + item.fontFamily + '"';
        tempCtx.font = fontStyle;
        const displayText = item.uppercase ? item.text.toUpperCase() : item.text;
        const textWidth = tempCtx.measureText(displayText).width;
        const textWidthPercent = textWidth / baseImageData.width * 100;
        const centerX = 50 - textWidthPercent / 2;
        updateTextItem(selectedTextId, { x: centerX });
      }
    }
  });
  centerVBtn.addEventListener("click", () => {
    if (selectedTextId && baseImageData) {
      const item = textItems.find((i) => i.id === selectedTextId);
      if (item) {
        const textHeightPercent = item.fontSize / baseImageData.height * 100;
        const centerY = 50 - textHeightPercent / 2;
        updateTextItem(selectedTextId, { y: centerY });
      }
    }
  });
  outputNameInput.addEventListener("input", () => {
    outputNameFinalInput.value = outputNameInput.value;
    textOutputNameInput.value = outputNameInput.value;
  });
  outputNameFinalInput.addEventListener("input", () => {
    outputNameInput.value = outputNameFinalInput.value;
    textOutputNameInput.value = outputNameFinalInput.value;
    if (baseImageData) {
      const { filename } = getCurrentOutputData();
      outputFilename.textContent = filename;
      textOutputFilename.textContent = filename;
    }
  });
  textOutputNameInput.addEventListener("input", () => {
    outputNameFinalInput.value = textOutputNameInput.value;
    outputNameInput.value = textOutputNameInput.value;
    if (baseImageData) {
      const { filename } = getCurrentOutputData();
      outputFilename.textContent = filename;
      textOutputFilename.textContent = filename;
    }
  });
  textDownloadBtn.addEventListener("click", () => {
    const { dataUrl, filename } = getCurrentOutputData();
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  });
  textPreviewBtn.addEventListener("click", updatePreviewWindow);
})();
