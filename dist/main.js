(() => {
  // src/main.js
  var fileInput = document.getElementById("image-upload");
  var processBtn = document.getElementById("process-btn");
  var downloadBtn = document.getElementById("download-btn");
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
    if (resizeMode !== "crop" || !aspectRatio || !uploadedImage) {
      cropPositionContainer.classList.add("hidden");
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
      cropPositionContainer.classList.add("hidden");
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
    cropPositionContainer.classList.remove("hidden");
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
    const extension = getExtensionFromMime(outputMimeType);
    const timestamp = getTimestamp();
    const generatedFilename = `${sourceFileName} - se_imager_${timestamp}.${extension}`;
    outputFilename.textContent = generatedFilename;
    outputDimensions.textContent = `${targetWidth} \xD7 ${targetHeight} px`;
    const forceJpg = forceJpgCheckbox.checked;
    const outputMimeType = forceJpg ? "image/jpeg" : sourceMimeType;
    const isOutputJpg = outputMimeType === "image/jpeg";
    const quality = isOutputJpg ? (parseInt(jpgQualityInput.value) || 80) / 100 : 1;
    const dataUrl = canvas.toDataURL(outputMimeType, quality);
    const outputBytes = Math.round((dataUrl.length - `data:${sourceMimeType};base64,`.length) * 0.75);
    outputFilesizeEl.textContent = formatFilesize(outputBytes);
    canvas.dataset.filename = generatedFilename;
    canvas.dataset.dataUrl = dataUrl;
    sourceContainer.classList.add("hidden");
    outputContainer.classList.remove("hidden");
  });
  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = canvas.dataset.filename;
    link.href = canvas.dataset.dataUrl;
    link.click();
  });
})();
