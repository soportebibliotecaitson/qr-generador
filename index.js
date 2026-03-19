const PREVIEW_SIZE = 300;

let selectedColor = "#000000";
let selectedBg = "#ffffff";
let transparentBg = false;
let logoImage = null;

let gradientType = "none";
let colorStart = "#000000";
let colorEnd = "#3b82f6";
let cornerColor = "#000000";

const presetColors = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

const qr = new QRCodeStyling({
  width: PREVIEW_SIZE,
  height: PREVIEW_SIZE,
  data: "https://example.com",
});

/* INIT */
window.addEventListener("DOMContentLoaded", () => {
  qr.append(document.getElementById("qr"));

  createPalette("colorPicker");
  createPalette("bgPicker", true);
  createCornerPalette();

  createGradientPalette("gradientStartPicker", true);
  createGradientPalette("gradientEndPicker", false);

  bindEvents();
  updateQR();
});

/* EVENTOS */
function bindEvents() {
  const sizeInput = document.getElementById("size");
  const sizeLabel = document.getElementById("sizeLabel");

  sizeInput.oninput = () => {
    const val = parseInt(sizeInput.value);

    exportSize = val;
    sizeLabel.textContent = `${val} x ${val} px`;

    // actualizar preview también
    qr.update({
      width: val > 0 ? 300 : val, // límite para preview
      height: val > 0 ? 300 : val,
    });
  };

  ["text", "dotsType", "cornersSquare", "cornersDot"].forEach(
    (id) => (document.getElementById(id).oninput = updateQR),
  );

  document.getElementById("gradientType").oninput = (e) => {
    gradientType = e.target.value;
    updateQR();
  };

  document.getElementById("bgWhite").onclick = () => {
    selectedBg = "#fff";
    transparentBg = false;
    updateQR();
  };

  document.getElementById("bgBlack").onclick = () => {
    selectedBg = "#000";
    transparentBg = false;
    updateQR();
  };

  document.getElementById("bgTransparent").onclick = () => {
    transparentBg = true;
    updateQR();
  };

  document.getElementById("downloadBtn").onclick = downloadPNG;
  document.getElementById("logo").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
      logoImage = event.target.result; // base64
      updateQR();
    };

    reader.readAsDataURL(file);
  });
}

/* PALETAS + BOTÓN + */
function createPalette(id, isBg = false) {
  const container = document.getElementById(id);

  presetColors.forEach((color) => {
    const div = document.createElement("div");
    div.className = "color-option";
    div.style.background = color;

    div.onclick = () => {
      if (isBg) selectedBg = color;
      else selectedColor = color;

      updateQR();
    };

    container.appendChild(div);
  });

  addCustomColorButton(container, (color) => {
    if (isBg) selectedBg = color;
    else selectedColor = color;
  });
}

function createGradientPalette(id, isStart) {
  const container = document.getElementById(id);

  presetColors.forEach((color) => {
    const div = document.createElement("div");
    div.className = "color-option";
    div.style.background = color;

    div.onclick = () => {
      isStart ? (colorStart = color) : (colorEnd = color);
      updateQR();
    };

    container.appendChild(div);
  });

  addCustomColorButton(container, (color) => {
    isStart ? (colorStart = color) : (colorEnd = color);
  });
}

function createCornerPalette() {
  const container = document.getElementById("cornerColorPicker");

  presetColors.forEach((color) => {
    const div = document.createElement("div");
    div.className = "color-option";
    div.style.background = color;

    div.onclick = () => {
      cornerColor = color;
      updateQR();
    };

    container.appendChild(div);
  });

  addCustomColorButton(container, (color) => {
    cornerColor = color;
  });
}

/* BOTÓN + */
function addCustomColorButton(container, callback) {
  const custom = document.createElement("div");
  custom.className = "color-option custom";
  custom.innerHTML = "+";

  custom.onclick = () => {
    const input = document.createElement("input");
    input.type = "color";

    input.style.position = "fixed";
    input.style.left = "-9999px";

    document.body.appendChild(input);

    const applyColor = (color) => {
      custom.style.background = color;
      callback(color);
      updateQR();
    };

    // ✔ cuando seleccionas color (evento real)
    input.addEventListener("change", (e) => {
      applyColor(e.target.value);
      cleanup();
    });

    // ✔ fallback (por si el navegador no dispara change)
    input.addEventListener("blur", () => {
      cleanup();
    });

    function cleanup() {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }

    input.click();
  };

  container.appendChild(custom);
}
/* UPDATE */
function updateQR() {
  const dotsType = document.getElementById("dotsType").value;

  const dotsOptions =
    gradientType === "none"
      ? { color: selectedColor, type: dotsType, gradient: null }
      : {
          type: dotsType,
          gradient: {
            type: gradientType,
            colorStops: [
              { offset: 0, color: colorStart },
              { offset: 1, color: colorEnd },
            ],
          },
        };

  qr.update({
    data: document.getElementById("text").value || "https://example.com",
    image: logoImage,
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 5,
    },
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

/* EXPORT */
async function downloadPNG() {
  const canvas = document.querySelector("#qr canvas");
  const url = canvas.toDataURL("image/png");

  const a = document.createElement("a");
  a.href = url;
  a.download = "qr.png";
  a.click();
}
