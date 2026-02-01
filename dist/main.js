(() => {
  // src/main.js
  var fileInput = document.getElementById("image-upload");
  var processBtn = document.getElementById("process-btn");
  var downloadBtn = document.getElementById("download-btn");
  var outputNameInput = document.getElementById("output-name");
  var keepNameCheckbox = document.getElementById("keep-name");
  var addTimestampCheckbox = document.getElementById("add-timestamp");
  var maxWidthInput = document.getElementById("max-width");
  var maxHeightInput = document.getElementById("max-height");
  var aspectRatioSelect = document.getElementById("aspect-ratio");
  var cropPositionSelect = document.getElementById("crop-position");
  var cropPositionContainer = document.getElementById("crop-position-container");
  var overlayOptionsContainer = document.getElementById("overlay-options-container");
  var overlayMarginInput = document.getElementById("overlay-margin");
  var overlayShadowInput = document.getElementById("overlay-shadow");
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
      const shadowPercent = parseFloat(overlayShadowInput.value) || 0;
      const smallerDimension = Math.min(targetWidth, targetHeight);
      const margin = marginPercent / 100 * smallerDimension;
      const shadowRadius = shadowPercent / 100 * smallerDimension;
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
      if (shadowRadius > 0) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = shadowRadius * 0.5;
        ctx.shadowOffsetX = shadowRadius * 0.3;
        ctx.shadowOffsetY = shadowRadius * 0.3;
      }
      ctx.drawImage(uploadedImage, drawX, drawY, drawWidth, drawHeight);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
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
    canvas.dataset.dataUrl = dataUrl;
    if (!keepNameCheckbox.checked) {
      outputNameInput.value = "";
    }
    outputContainer.classList.remove("hidden");
    showTextOverlayTab();
  });
  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = canvas.dataset.filename;
    link.href = canvas.dataset.dataUrl;
    link.click();
  });
  var tabBar = document.getElementById("tab-bar");
  var tabBarText = document.getElementById("tab-bar-text");
  var processView = document.getElementById("process-view");
  var textOverlayView = document.getElementById("text-overlay-view");
  var textCanvas = document.getElementById("text-canvas");
  var textCanvasHint = document.getElementById("text-canvas-hint");
  var textCtx = textCanvas.getContext("2d");
  var textItemsList = document.getElementById("text-items-list");
  var addTextBtn = document.getElementById("add-text-btn");
  var textDownloadBtn = document.getElementById("text-download-btn");
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
  var deleteTextBtn = document.getElementById("delete-text-btn");
  var textItems = [];
  var selectedTextId = null;
  var baseImageData = null;
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
    outlineColor: "#000000"
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
      outlineColor: lastTextStyle.outlineColor
    };
  }
  function switchToTab(tabName) {
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
  }
  document.querySelectorAll(".tab-process-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchToTab("process"));
  });
  document.querySelectorAll(".tab-text-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchToTab("text"));
  });
  function showTextOverlayTab() {
    tabBar.classList.remove("hidden");
    baseImageData = {
      width: canvas.width,
      height: canvas.height,
      dataUrl: canvas.toDataURL()
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
  }
  function updateTextItem(id, updates) {
    const item = textItems.find((i) => i.id === id);
    if (item) {
      Object.assign(item, updates);
      const styleKeys = ["fontFamily", "fontSize", "color", "opacity", "bold", "italic", "underline", "uppercase", "outline", "outlineColor"];
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
      const styleKeys = ["fontFamily", "fontSize", "color", "opacity", "bold", "italic", "underline", "uppercase", "outline", "outlineColor"];
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
    if (item.outline) {
      ctx2.strokeStyle = item.outlineColor;
      ctx2.lineWidth = Math.max(2, item.fontSize / 12);
      ctx2.lineJoin = "round";
      ctx2.strokeText(displayText, x, y);
    }
    ctx2.fillStyle = item.color;
    ctx2.fillText(displayText, x, y);
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
    if (!baseImageData) return;
    textCanvas.width = baseImageData.width;
    textCanvas.height = baseImageData.height;
    const img = new Image();
    img.onload = () => {
      textCtx.drawImage(img, 0, 0);
      textItems.forEach((item) => {
        drawTextItem(textCtx, item, textCanvas.width, textCanvas.height);
      });
    };
    img.src = baseImageData.dataUrl;
  }
  textCanvas.addEventListener("click", (e) => {
    const pos = getCanvasClickPosition(e, textCanvas);
    if (selectedTextId) {
      updateTextItem(selectedTextId, { x: pos.x, y: pos.y });
    } else {
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
      updateTextItem(selectedTextId, { fontFamily: textFontSelect.value });
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
  deleteTextBtn.addEventListener("click", () => {
    if (selectedTextId) {
      deleteTextItem(selectedTextId);
    }
  });
  textDownloadBtn.addEventListener("click", () => {
    const forceJpg = forceJpgCheckbox.checked;
    const outputMimeType = forceJpg ? "image/jpeg" : sourceMimeType;
    const isOutputJpg = outputMimeType === "image/jpeg";
    const quality = isOutputJpg ? (parseInt(jpgQualityInput.value) || 80) / 100 : 1;
    const dataUrl = textCanvas.toDataURL(outputMimeType, quality);
    const link = document.createElement("a");
    const extension = getExtensionFromMime(outputMimeType);
    const baseName = outputNameInput.value.trim() || sourceFileName || "image";
    let filename;
    if (addTimestampCheckbox.checked) {
      const timestamp = getTimestamp();
      filename = `${baseName} - ${timestamp}.${extension}`;
    } else {
      filename = `${baseName}.${extension}`;
    }
    link.download = filename;
    link.href = dataUrl;
    link.click();
  });
})();
