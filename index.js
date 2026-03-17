const PREVIEW_SIZE = 300;
let exportSize = 1024;

let selectedColor = "#000000";
let selectedBg = "#ffffff";
let transparentBg = false;

let gradientType = "none";
let colorStart = "#000000";
let colorEnd = "#3b82f6";
let cornerColor = "#000000";

const presetColors = [
  "#000000","#ffffff","#ef4444","#f97316",
  "#22c55e","#3b82f6","#6366f1","#a855f7","#ec4899",
];

const qr = new QRCodeStyling({
  width: PREVIEW_SIZE,
  height: PREVIEW_SIZE,
  data: "https://example.com",
});

/* ================= CONTRASTE ================= */
function getLuminance(hex) {
  const c = hex.replace("#", "");
  const rgb = [0, 2, 4]
    .map(i => parseInt(c.substr(i, 2), 16) / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function checkContrast() {
  if (transparentBg) return;

  const lum1 = getLuminance(selectedColor);
  const lum2 = getLuminance(selectedBg);
  const contrast =
    (Math.max(lum1, lum2) + 0.05) /
    (Math.min(lum1, lum2) + 0.05);

  document.getElementById("warning").textContent =
    contrast < 2 ? "⚠ Bajo contraste" : "";
}

/* ================= PALETAS ================= */
function createPalette(id, isBg = false) {
  const container = document.getElementById(id);

  presetColors.forEach(color => {
    const div = document.createElement("div");
    div.className = "color-option";
    div.style.background = color;

    div.onclick = () => {
      if (isBg) {
        selectedBg = color;
        transparentBg = false;

        // quitar botones activos
        document.querySelectorAll(".bg-buttons button")
          .forEach(btn => btn.classList.remove("active"));
      } else {
        selectedColor = color;
      }

      container.querySelectorAll(".color-option")
        .forEach(el => el.classList.remove("active"));

      div.classList.add("active");
      updateQR();
    };

    container.appendChild(div);
  });
}

/* ================= GRADIENTES ================= */
function createGradientPalette(id, isStart = true) {
  const container = document.getElementById(id);

  presetColors.forEach(color => {
    const div = document.createElement("div");
    div.className = "color-option";
    div.style.background = color;

    div.onclick = () => {
      isStart ? colorStart = color : colorEnd = color;

      container.querySelectorAll(".color-option")
        .forEach(el => el.classList.remove("active"));

      div.classList.add("active");
      updateQR();
    };

    container.appendChild(div);
  });
}

function initGradientPresets() {
  document.querySelectorAll(".grad-option").forEach(el => {
    const start = el.dataset.start;
    const end = el.dataset.end;

    el.style.background = `linear-gradient(45deg, ${start}, ${end})`;

    el.onclick = () => {
      gradientType = "linear";
      colorStart = start;
      colorEnd = end;

      document.querySelectorAll(".grad-option")
        .forEach(p => p.classList.remove("active"));

      el.classList.add("active");
      updateQR();
    };
  });
}

/* ================= ESQUINAS ================= */
function createCornerPalette() {
  const container = document.getElementById("cornerColorPicker");

  presetColors.forEach(color => {
    const div = document.createElement("div");
    div.className = "color-option";
    div.style.background = color;

    div.onclick = () => {
      cornerColor = color;

      container.querySelectorAll(".color-option")
        .forEach(el => el.classList.remove("active"));

      div.classList.add("active");
      updateQR();
    };

    container.appendChild(div);
  });
}

/* ================= BOTONES BG ================= */
function setActiveBgButton(activeId) {
  document.querySelectorAll(".bg-buttons button")
    .forEach(btn => btn.classList.remove("active"));

  document.getElementById(activeId).classList.add("active");
}

/* ================= INIT ================= */
window.addEventListener("DOMContentLoaded", () => {
  qr.append(document.getElementById("qr"));

  createPalette("colorPicker");
  createPalette("bgPicker", true);
  createCornerPalette();

  createGradientPalette("gradientStartPicker", true);
  createGradientPalette("gradientEndPicker", false);
  initGradientPresets();

  /* BOTONES FONDO */
  document.getElementById("bgWhite").onclick = () => {
    selectedBg = "#ffffff";
    transparentBg = false;
    setActiveBgButton("bgWhite");
    updateQR();
  };

  document.getElementById("bgBlack").onclick = () => {
    selectedBg = "#000000";
    transparentBg = false;
    setActiveBgButton("bgBlack");
    updateQR();
  };

  document.getElementById("bgTransparent").onclick = () => {
    transparentBg = true;
    setActiveBgButton("bgTransparent");
    updateQR();
  };

  document.getElementById("gradientType").oninput = (e) => {
    gradientType = e.target.value;

    if (gradientType === "none") {
      document.querySelectorAll(".grad-option")
        .forEach(el => el.classList.remove("active"));
    }

    updateQR();
  };

  ["text","dotsType","cornersSquare","cornersDot"]
    .forEach(id => {
      document.getElementById(id).oninput = updateQR;
    });

  document.getElementById("logo").onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      qr.update({
        image: URL.createObjectURL(file),
        imageOptions: {
          margin: 8,
          hideBackgroundDots: true,
          imageSize: 0.4,
        },
      });
    }
  };

  const sizeInput = document.getElementById("size");
  const sizeLabel = document.getElementById("sizeLabel");

  sizeInput.oninput = () => {
    let val = Math.round(sizeInput.value / 128) * 128;
    sizeInput.value = val;
    exportSize = val;
    sizeLabel.textContent = `${val} x ${val} px`;
  };

  document.getElementById("downloadBtn").onclick = downloadPNG;

  updateQR();
});

/* ================= UPDATE ================= */
function updateQR() {
  checkContrast();

  let dotsOptions;

  if (gradientType === "none") {
    dotsOptions = {
      color: selectedColor,
      type: document.getElementById("dotsType").value,
      gradient: null // 🔥 FIX
    };
  } else {
    dotsOptions = {
      type: document.getElementById("dotsType").value,
      gradient: {
        type: gradientType,
        colorStops: [
          { offset: 0, color: colorStart },
          { offset: 1, color: colorEnd },
        ],
      },
    };
  }

  qr.update({
    data: document.getElementById("text").value || "https://example.com",
    dotsOptions,

    cornersSquareOptions: {
      type: document.getElementById("cornersSquare").value,
      color: cornerColor,
    },

    cornersDotOptions: {
      type: document.getElementById("cornersDot").value,
      color: cornerColor,
    },

    backgroundOptions: {
      color: transparentBg ? "transparent" : selectedBg,
    },
  });

  const container = document.getElementById("qr");
  container.innerHTML = "";
  qr.append(container);
}

/* ================= EXPORT ================= */
async function downloadPNG() {
  const exportTransparent =
    document.getElementById("exportTransparent").checked;

  const tempQR = new QRCodeStyling({
    width: exportSize,
    height: exportSize,
    data: document.getElementById("text").value || "https://example.com",
    margin: Math.floor(exportSize * 0.08),

    dotsOptions:
      gradientType === "none"
        ? {
            color: selectedColor,
            type: document.getElementById("dotsType").value,
          }
        : {
            type: document.getElementById("dotsType").value,
            gradient: {
              type: gradientType,
              colorStops: [
                { offset: 0, color: colorStart },
                { offset: 1, color: colorEnd },
              ],
            },
          },

    cornersSquareOptions: {
      type: document.getElementById("cornersSquare").value,
      color: cornerColor,
    },

    cornersDotOptions: {
      type: document.getElementById("cornersDot").value,
      color: cornerColor,
    },

    backgroundOptions: {
      color: exportTransparent ? "transparent" : "#ffffff",
    },

    image: qr._options.image || undefined,
  });

  const hiddenDiv = document.createElement("div");
  hiddenDiv.style.position = "fixed";
  hiddenDiv.style.left = "-9999px";
  document.body.appendChild(hiddenDiv);

  tempQR.append(hiddenDiv);

  await new Promise(res => setTimeout(res, 200));

  const canvas = hiddenDiv.querySelector("canvas");
  const url = canvas.toDataURL("image/png");

  const a = document.createElement("a");
  a.href = url;
  a.download = "qr.png";
  a.click();

  document.body.removeChild(hiddenDiv);
}