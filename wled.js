// WLED IP-Adresse
const wledIp = "192.168.2.142";
let overlayVisible = 0;
let settingsState = 0;

const originalFetch = window.fetch;

// Funktion zum Deaktivieren von fetch
function disableFetch() {
  window.fetch = function () {
    console.error("Fetch-Anfrage wurde verhindert.");
    return new Promise((resolve, reject) => {
      reject("Fetch-Anfragen sind deaktiviert.");
    });
  };
}

// Funktion zum Aktivieren von fetch
function enableFetch() {
  window.fetch = originalFetch;
}

disableFetch();
enableFetch();

class Settings extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<slot></slot>`;
  }
}

customElements.define("c-settings", Settings);

document.addEventListener("DOMContentLoaded", function () {
  // MAIN

  const executedCommands = {
    main1: false,
    main2: false,
    main3: false,
    main4: false,
  };

  function resetExecutedCommands(except) {
    for (let key in executedCommands) {
      if (key !== except) {
        executedCommands[key] = false;
      }
    }
  }

  function updateFooter(selectedId) {
    const mainContent = document.querySelectorAll(".mainContent");

    mainContent.forEach((content) => {
      if (selectedId !== content.id) {
        content.classList.add("deactivated");
      } else {
        content.classList.remove("deactivated");
      }
    });

    switch (selectedId) {
      case "main1":
        if (!executedCommands.main1) {
          resetExecutedCommands("main1");
          console.log("Load main 1");
          executedCommands.main1 = true;
        }
        break;
      case "main2":
        if (!executedCommands.main2) {
          resetExecutedCommands("main2");
          console.log("Load main 2");
          executedCommands.main2 = true;
        }
        break;
      case "main3":
        if (!executedCommands.main3) {
          resetExecutedCommands("main3");
          console.log("Load main 3");
          executedCommands.main3 = true;
        }
        break;
      case "main4":
        if (!executedCommands.main4) {
          resetExecutedCommands("main4");
          console.log("Load main 4");
          executedCommands.main4 = true;
        }
        break;
      default:
        break;
    }
  }

  const footerButtons = document.querySelectorAll(".footerbtn");
  const mainContent = document.querySelectorAll(".mainContent");
  footerButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      if (!button.classList.contains("selected")) {
        footerButtons.forEach((b) => {
          b.classList.remove("selectedBtn");
        });
        mainContent.forEach((b) => {
          b.classList.remove("selected");
        });
        button.classList.add("selectedBtn");
        mainContent[index].classList.add("selected");
        updateFooter(mainContent[index].id);
      }
    });
  });

  updateFooter("main1");

  // POWER BUTTON
  const powerButton = document.getElementById("navPower");

  powerButton.addEventListener("click", function () {
    togglePowerStatus();
  });

  function fetchCurrentPowerStatus() {
    const url = `http://${wledIp}/json/state`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const isOn = data.on;
        updateButtonState(isOn);
      })
      .catch((error) => {
        console.error("Error fetching power status:", error);
      });
  }

  function togglePowerStatus() {
    const url = `http://${wledIp}/json/state`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const isOn = data.on;
        const newState = !isOn;

        const dataToSend = {
          on: newState,
        };

        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Power status updated:", data);
            updateButtonState(newState);
          })
          .catch((error) => {
            console.error("Error updating power status:", error);
          });
      })
      .catch((error) => {
        console.error("Error fetching current power status:", error);
      });
  }

  function updateButtonState(isOn) {
    if (isOn) {
      powerButton.classList.add("On");
      powerButton.classList.remove("Off");
    } else {
      powerButton.classList.remove("On");
      powerButton.classList.add("Off");
    }
  }

  // COLOR
  const hueSlider = document.getElementById("hue");
  const saturationSlider = document.getElementById("saturation");
  const valueSlider = document.getElementById("value");
  const temperatureSlider = document.getElementById("temperature");
  const colorDisplay = document.getElementById("colorDisplay");
  const hueGradient = document.getElementById("hueGradient");
  const saturationGradient = document.getElementById("saturationGradient");
  const valueGradient = document.getElementById("valueGradient");
  const hueGradientThumb = document.getElementById("hueGradientThumb");
  const saturationGradientThumb = document.getElementById(
    "saturationGradientThumb"
  );
  const valueGradientThumb = document.getElementById("valueGradientThumb");
  const temperatureGradientThumb = document.getElementById(
    "temperatureGradientThumb"
  );

  let currentColorGRB = { g: 0, r: 0, b: 0 };

  fetchCurrentColor();
  setInitialGradients();
  registerEventHandlers();
  updateColor();
  updateSaturationGradient();
  updateValueGradient();

  function setInitialGradients() {
    hueGradient.style.background =
      "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)";
    hueGradientThumb.style.background =
      "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)";
  }

  function registerEventHandlers() {
    hueSlider.addEventListener("input", handleHueInput);
    saturationSlider.addEventListener("input", handleSaturationInput);
    valueSlider.addEventListener("input", handleValueInput);

    hueSlider.addEventListener("change", handleSubmit);
    saturationSlider.addEventListener("change", handleSubmit);
    valueSlider.addEventListener("change", handleSubmit);
  }

  function handleHueInput() {
    updateColor();
    updateSaturationGradient();
    updateValueGradient();
  }

  function handleSaturationInput() {
    updateColor();
    updateValueGradient();
  }

  function handleValueInput() {
    updateColor();
    updateSaturationGradient();
  }

  function handleSubmit() {
    sendColorToWLED(currentColorGRB);
  }

  function updateColor() {
    const h = parseInt(hueSlider.value, 10);
    const s = parseInt(saturationSlider.value, 10);
    const v = parseInt(valueSlider.value, 10);

    const rgb = hsvToRgb(h, s / 100, v / 100);
    currentColorGRB = rgbToGrb(rgb);

    colorDisplay.style.backgroundColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  function updateSaturationGradient() {
    const h = parseInt(hueSlider.value, 10);
    const v = parseInt(valueSlider.value, 10);

    const black = hsvToRgb(h, 0, v / 100);
    const color = hsvToRgb(h, 100, v / 100);

    saturationGradient.style.background = `linear-gradient(to right, rgb(${black[0]}, ${black[1]}, ${black[2]}), rgb(${color[0]}, ${color[1]}, ${color[2]}))`;
    saturationGradientThumb.style.background = `linear-gradient(to right, rgb(${black[0]}, ${black[1]}, ${black[2]}), rgb(${color[0]}, ${color[1]}, ${color[2]}))`;
  }

  function updateValueGradient() {
    const h = parseInt(hueSlider.value, 10);
    const s = parseInt(saturationSlider.value, 10);

    const blackWhite = hsvToRgb(h, s / 100, 0);
    const color = hsvToRgb(h, s / 100, 100);

    valueGradient.style.background = `linear-gradient(to right, rgb(${blackWhite[0]}, ${blackWhite[1]}, ${blackWhite[2]}), rgb(${color[0]}, ${color[1]}, ${color[2]}))`;
    valueGradientThumb.style.background = `linear-gradient(to right, rgb(${blackWhite[0]}, ${blackWhite[1]}, ${blackWhite[2]}), rgb(${color[0]}, ${color[1]}, ${color[2]}))`;
  }

  function sendColorToWLED(color) {
    const url = `http://${wledIp}/json/state`;
    const data = {
      on: true,
      seg: [
        {
          col: [
            [color.g, color.r, color.b], // GRB order
          ],
        },
      ],
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    colorInput.value = grbToHex(color);
    checkColorInput();

    fetchEstimatedCurrent(2);
  }

  function fetchCurrentColor() {
    const url = `http://${wledIp}/json/state`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const color = data.seg[0].col[0];
        const rgb = { r: color[0], g: color[1], b: color[2] };
        const grb = { r: color[1], g: color[0], b: color[2] };

        colorInput.value = grbToHex(grb);

        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

        setSliderValues(hsv.h, hsv.s * 100, hsv.v * 100);
      })
      .catch((error) => {
        console.error("Error fetching current color:", error);
      });
  }

  function setSliderValues(hue, saturation, value) {
    hueSlider.value = hue;
    saturationSlider.value = saturation;
    valueSlider.value = value;
    updateSaturationGradient();
    updateValueGradient();
    updateColor();
    updateGradientMask(hueSlider, hueGradientThumb);
    updateGradientMask(valueSlider, valueGradientThumb);
    updateGradientMask(saturationSlider, saturationGradientThumb);
    updateGradientMask(temperatureSlider, temperatureGradientThumb);
    checkColorInput();
  }

  hueSlider.addEventListener("input", () =>
    updateGradientMask(hueSlider, hueGradientThumb)
  );
  valueSlider.addEventListener("input", () =>
    updateGradientMask(valueSlider, valueGradientThumb)
  );
  saturationSlider.addEventListener("input", () =>
    updateGradientMask(saturationSlider, saturationGradientThumb)
  );
  temperatureSlider.addEventListener("input", () =>
    updateGradientMask(temperatureSlider, temperatureGradientThumb)
  );

  function updateGradientMask(slider, thumb, thumbWidth = 17.5) {
    const sliderRect = slider.getBoundingClientRect();
    const sliderWidth = sliderRect.width;
    const max = slider.max;
    const min = slider.min;
    const value = slider.value;

    const thumbLeft =
      ((value - min) / (max - min)) * (sliderWidth - thumbWidth) +
      thumbWidth / 2;

    thumb.style.clipPath = `circle(${thumbWidth / 2}px at ${thumbLeft}px 10px)`;
  }

  // CONVERT COLORS

  function rgbToHsv(r, g, b) {
    (r /= 255), (g /= 255), (b /= 255);
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    const d = max - min;
    let h,
      s = max === 0 ? 0 : d / max,
      v = max;

    switch (max) {
      case min:
        h = 0;
        break;
      case r:
        h = g - b + d * (g < b ? 6 : 0);
        h /= 6 * d;
        break;
      case g:
        h = b - r + d * 2;
        h /= 6 * d;
        break;
      case b:
        h = r - g + d * 4;
        h /= 6 * d;
        break;
    }

    return {
      h: Math.round(h * 360),
      s: s,
      v: v,
    };
  }

  function hsvToRgb(h, s, v) {
    s = Math.max(0, Math.min(1, s));
    v = Math.max(0, Math.min(1, v));
    let r, g, b;
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        (r = v), (g = t), (b = p);
        break;
      case 1:
        (r = q), (g = v), (b = p);
        break;
      case 2:
        (r = p), (g = v), (b = t);
        break;
      case 3:
        (r = p), (g = q), (b = v);
        break;
      case 4:
        (r = t), (g = p), (b = v);
        break;
      case 5:
        (r = v), (g = p), (b = q);
        break;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function rgbToGrb(rgb) {
    return {
      g: rgb[0],
      r: rgb[1],
      b: rgb[2],
    };
  }

  function grbToHex(color, type) {
    const r = color.r.toString(16).padStart(2, "0");
    const g = color.g.toString(16).padStart(2, "0");
    const b = color.b.toString(16).padStart(2, "0");
    if (type == "rgb") {
      return `#${r}${g}${b}`;
    } else {
      return `#${g}${r}${b}`;
    }
  }

  // Brightness

  const brightnessSlider = document.getElementById("brightnessSlider");
  const brightnessGradient = document.getElementById("brightnessGradient");

  function updateBrightnessGradient() {
    const brightnessValue = parseInt(brightnessSlider.value, 10);
    let percentage = (brightnessValue / 255) * 100;

    if (percentage < 10) {
      percentage += 5;
    } else if (percentage > 90) {
      percentage = percentage - 5;
    }
    brightnessGradient.style.background = `linear-gradient(to right, #fffaf5 ${percentage}%, var(--Mid-Grey) ${percentage}%)`;
  }

  brightnessSlider.addEventListener("input", updateBrightnessGradient);

  updateBrightnessGradient();

  function fetchCurrentBrightness() {
    const url = `http://${wledIp}/json/state`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const currentBrightness = data.bri || 0;
        brightnessSlider.value = currentBrightness;
        updateBrightnessGradient();
      })
      .catch((error) => {
        console.error("Error fetching current brightness:", error);
      });
  }

  function sendBrightnessToWLED() {
    let brightnessValue = parseInt(brightnessSlider.value, 10);

    if (brightnessValue === 0) {
      brightnessValue = 1;
    }

    const url = `http://${wledIp}/json/state`;
    const data = {
      on: true,
      bri: brightnessValue,
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Brightness updated:", data);
      })
      .catch((error) => {
        console.error("Error updating brightness:", error);
      });
  }

  let debounceTimeout;

  brightnessSlider.addEventListener("input", function () {
    updateBrightnessGradient();

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      sendBrightnessToWLED();
      fetchEstimatedCurrent();
    }, 20);
  });

  brightnessSlider.addEventListener("change", function () {
    sendBrightnessToWLED();
    fetchEstimatedCurrent(10);
  });

  fetchCurrentBrightness();
  fetchEstimatedCurrent();
  setInterval(fetchEstimatedCurrent, 60000);

  fetchCurrentPowerStatus();

  // Temperature
  temperatureSlider.addEventListener("input", handleTemperatureInput);
  temperatureSlider.addEventListener("change", function () {
    const color = {
      r: temperaturergb[1],
      g: temperaturergb[0],
      b: temperaturergb[2],
    };

    sendColorToWLED(color);
    colorDisplay.style.backgroundColor = `rgb(${color.g}, ${color.r}, ${color.b})`;
  });

  let temperaturergb;

  function handleTemperatureInput() {
    const value = temperatureSlider.value;
    temperaturergb = getTemperatureColor(value);
  }

  function getTemperatureColor(value) {
    const kelvin = 2200 + (value / 500) * (10500 - 2200);
    return kelvinToRGB(kelvin);
  }

  function kelvinToRGB(kelvin) {
    const kelvinValues = [2200, 4500, 10500];
    const rgbValues = [
      [255, 147, 44], // 2200K
      [255, 219, 186], // 4500K
      [204, 216, 255], // 10500K
    ];

    function interpolate(value, min1, max1, min2, max2) {
      const ratio = (value - min1) / (max1 - min1);
      return min2 + ratio * (max2 - min2);
    }

    let r, g, b;
    if (kelvin <= kelvinValues[0]) {
      [r, g, b] = rgbValues[0];
    } else if (kelvin >= kelvinValues[2]) {
      [r, g, b] = rgbValues[2];
    } else {
      let index1, index2;
      for (let i = 0; i < kelvinValues.length - 1; i++) {
        if (kelvin >= kelvinValues[i] && kelvin <= kelvinValues[i + 1]) {
          index1 = i;
          index2 = i + 1;
          break;
        }
      }

      const ratio =
        (kelvin - kelvinValues[index1]) /
        (kelvinValues[index2] - kelvinValues[index1]);
      r = interpolate(ratio, 0, 1, rgbValues[index1][0], rgbValues[index2][0]);
      g = interpolate(ratio, 0, 1, rgbValues[index1][1], rgbValues[index2][1]);
      b = interpolate(ratio, 0, 1, rgbValues[index1][2], rgbValues[index2][2]);
    }

    return [Math.round(r), Math.round(g), Math.round(b)];
  }

  // INFO OVERLAY
  const toggleButton = document.getElementById("navInfo");
  const overlay = document.getElementById("overlay");

  function infoOverlayClose() {
    overlayVisible = 0;
    overlay.classList.remove("show");
    overlay.classList.add("hide");
    toggleButton.classList.remove("active");
  }

  toggleButton.addEventListener("click", () => {
    overlayVisible = 1 - overlayVisible;

    if (overlayVisible === 1) {
      fetchWLEDInfo();
      overlay.classList.remove("hide");
      overlay.classList.add("show");
      toggleButton.classList.add("active");
    } else {
      infoOverlayClose();
    }
  });

  function fetchWLEDInfo() {
    const url = `http://${wledIp}/json/info`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const Info_uptimeS =
          data.wifi.signal !== undefined ? data.wifi.signal : "not available";
        const Info_uptimeR = data.wifi.rssi !== undefined ? data.wifi.rssi : "";
        const Info_ip = data.ip !== undefined ? data.ip : "not available";
        const Info_uptime =
          data.uptime !== undefined
            ? formatUptime(data.uptime)
            : "not available";
        const Info_time = data.time !== undefined ? data.time : "not available";
        const Info_count =
          data.leds.count !== undefined ? data.leds.count : "not available";
        const Info_pwr =
          data.leds.pwr !== undefined ? data.leds.pwr : "not available";
        const Info_maxpwr =
          data.leds.maxpwr !== undefined ? data.leds.maxpwr : "not available";
        const Info_freeheap =
          data.freeheap !== undefined
            ? formatFreeHeap(data.freeheap)
            : "not available";
        const Info_mac = data.mac !== undefined ? data.mac : "not available";
        const Info_vid = data.vid !== undefined ? data.vid : "not available";
        const Info_core = data.core !== undefined ? data.core : "not available";

        document.getElementById(
          "I_SignalStrength"
        ).innerText = `${Info_uptimeS}% (${Info_uptimeR}dBm)`;
        document.getElementById("I_IP").innerText = Info_ip;
        document.getElementById("I_Uptime").innerText = Info_uptime;
        document.getElementById("I_Time").innerText = Info_time;
        document.getElementById("I_Leds").innerText = Info_count;
        document.getElementById("I_Current").innerText = `${Info_pwr} mA`;
        document.getElementById("I_MaxCurrent").innerText = `${Info_maxpwr} mA`;
        document.getElementById("I_FreeHeap").innerText = `${Info_freeheap} kB`;
        document.getElementById("I_MAC").innerText = Info_mac;
        document.getElementById("I_Build").innerText = Info_vid;
        document.getElementById("I_Environment").innerText = Info_core;
      })
      .catch((error) => console.error("Error fetching data:", error));
  }

  function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let formattedTime = "";

    if (hours > 0) {
      if (hours === 1) {
        formattedTime += `${hours} hour`;
      } else {
        formattedTime += `${hours} hours`;
      }
      if (minutes > 0) {
        formattedTime += `, `;
      }
    }
    if (minutes > 0) {
      formattedTime += `${minutes} min`;
      if (!hours > 0) {
        formattedTime += `, ${remainingSeconds} sec`;
      }
    } else if (!(minutes > 0 || hours > 0)) {
      formattedTime += `${remainingSeconds} sec`;
    }

    return formattedTime;
  }

  function formatFreeHeap(value) {
    let stringValue = value.toString();
    let result;

    if (stringValue.length >= 4) {
      result = stringValue.slice(0, 3) + "." + stringValue[3];
    } else {
      while (stringValue.length < 4) {
        stringValue = "0" + stringValue;
      }
      stringValue = stringValue.slice(0, 3) + "." + stringValue[3];
      if (stringValue.length > 2) {
        stringValue = stringValue.replace(/^0+/, "");
        if (stringValue.length < 3) {
          stringValue = "0" + stringValue;
        }
      }
      result = stringValue;
    }

    return result;
  }

  // REBOOT
  async function reboot() {
    try {
      const response = await fetch(`http://${wledIp}/json/state`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rb: true }),
      });

      if (response.ok) {
        console.log("WLED Controller wird neu gestartet...");
      } else {
        console.error(
          "Fehler beim Neustarten des WLED Controllers:",
          response.status,
          await response.text()
        );
      }
    } catch (error) {
      console.error("Fehler beim Senden der Anfrage:", error);
    }
  }

  document.getElementById("infoReboot").addEventListener("click", () => {
    reboot();
  });
  document.getElementById("infoRefresh").addEventListener("click", () => {
    fetchWLEDInfo();
  });
  document.getElementById("infoClose").addEventListener("click", () => {
    infoOverlayClose();
  });

  // Color Input
  document.getElementById("colorInput").addEventListener("input", function () {
    checkColorInput();
  });

  function checkColorInput(type) {
    const input = document.getElementById("colorInput").value.trim();

    const hexPattern = /^#([0-9a-fA-F]{3}){1,2}$/;
    const rgbPattern = /^(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})$/;

    hexHeader.classList.remove("highlight");
    rgbHeader.classList.remove("highlight");

    if (hexPattern.test(input)) {
      if (type === 1) {
        return 1;
      } else {
        hexHeader.classList.add("highlight");
      }
      return 0;
    } else if (rgbPattern.test(input)) {
      const rgbMatch = input.match(rgbPattern);
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);

      if (r <= 255 && g <= 255 && b <= 255) {
        if (type === 1) {
          return 2;
        } else {
          rgbHeader.classList.add("highlight");
        }
        return 0;
      }
    }
  }

  const hexHeader = document.getElementById("Input_hex");
  const rgbHeader = document.getElementById("Input_rgb");
  const colorInputClearBtn = document.getElementById("colorInputClearBtn");
  const colorInputCopyBtn = document.getElementById("colorInputCopyBtn");
  const colorInputApplyBtn = document.getElementById("colorInputApplyBtn");
  const colorInput = document.getElementById("colorInput");

  function clearColorInput() {
    if (colorInput) {
      colorInput.value = "";
    }
    checkColorInput();
  }

  function copyColorToClipboard() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(colorInput.value)
        .then(() => {
          return;
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      colorInput.select();
      colorInput.setSelectionRange(0, 99999);

      try {
        const successful = document.execCommand("copy");
        if (successful) {
          return;
        } else {
          console.error(err);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  function convertToRGB(color) {
    let r, g, b;

    if (color.startsWith("#")) {
      const hex = color.substring(1);
      if (hex === "fff") {
        g = 255;
        r = 255;
        b = 255;
      } else if (hex.length === 6) {
        g = parseInt(hex.substring(0, 2), 16);
        r = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      } else {
        console.error("Ungültiges Hex-Format");
        return null;
      }
    } else {
      const rgb = color.match(/^(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})$/);
      if (rgb && rgb.length === 4) {
        g = parseInt(rgb[1], 10);
        r = parseInt(rgb[2], 10);
        b = parseInt(rgb[3], 10);

        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
          console.error("RGB-Werte müssen im Bereich von 0 bis 255 liegen.");
          return null;
        }
      } else {
        console.error("Ungültiges RGB-Format. Erwartet: rgb(R, G, B).");
        return null;
      }
    }
    return { r, g, b };
  }

  function sendInputColor() {
    let color = convertToRGB(colorInput.value);

    if (color === null) {
      return;
    }

    sendColorToWLED(color);
  }

  function parseRgbColor(value) {
    const rgb = value.split(",").map(Number);
    return {
      r: rgb[0],
      g: rgb[1],
      b: rgb[2],
    };
  }

  function switchColorInput(type) {
    let color;

    if (type === "hex") {
      if (checkColorInput(1) === 2) {
        color = grbToHex(parseRgbColor(colorInput.value), "rgb");
        hexHeader.classList.add("highlight");
      } else {
        console.error("FAIL");
        return;
      }
    } else if (type === "rgb") {
      if (checkColorInput(1) === 1) {
        color = convertToRGB(colorInput.value);
        color = `${color.g},${color.r},${color.b}`;
        rgbHeader.classList.add("highlight");
      } else {
        console.error("FAIL");
        return;
      }
    }

    colorInput.value = color;
  }

  hexHeader.addEventListener("click", function () {
    switchColorInput("hex");
  });
  rgbHeader.addEventListener("click", function () {
    switchColorInput("rgb");
  });
  colorInputClearBtn.addEventListener("click", clearColorInput);
  colorInputCopyBtn.addEventListener("click", copyColorToClipboard);
  colorInputApplyBtn.addEventListener("click", sendInputColor);

  // Color Paletts
  // ----

  // Settings
  const elementsToToggle = document.querySelectorAll(".settingsToggle");
  const settingsDiv = document.getElementById("settings");
  const body = document.getElementById("body");

  function toggleSettings() {
    settingsState = settingsState === 0 ? 1 : 0;
    elementsToToggle.forEach((element) => {
      if (settingsState === 0) {
        element.style.display = "flex";
      } else {
        element.style.display = "none";
      }
    });
    if (settingsState === 0) {
      settingsDiv.style.display = "none";
      body.style.height = "var(--Height)";
    } else {
      settingsDiv.style.display = "flex";
      body.style.height = "100dvh";
      infoOverlayClose(); //Temp
    }
  }

  const settingsButton = document.getElementById("navSettings");
  const settingsTButton = document.getElementById("settingsToggleButton");
  settingsButton.addEventListener("click", toggleSettings);
  settingsTButton.addEventListener("click", toggleSettings);
});
//

//Estimated current
function fetchEstimatedCurrent(repeat) {
  const url = `http://${wledIp}/json/info`;

  function fetchData() {
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const estimatedCurrentInMilliAmps = data.leds.pwr || 0;
        const estimatedCurrentInAmps = (
          estimatedCurrentInMilliAmps / 1000
        ).toFixed(2);

        const ampElements = document.querySelectorAll("p.amps");
        ampElements.forEach((element) => {
          element.textContent = `${estimatedCurrentInAmps} A`;
        });

        console.log(`Estimated Current: ${estimatedCurrentInAmps} A`);
      })
      .catch((error) => {
        console.error("Error fetching estimated current:", error);
      });
  }

  if (repeat > 0) {
    let count = 0;
    const intervalId = setInterval(() => {
      fetchData();
      count++;
      if (count >= repeat) {
        clearInterval(intervalId);
      }
    }, 125);
  } else {
    fetchData();
  }
}

// PING

ping();

function ping() {
  fetch("https://www.google.com", { mode: "no-cors" })
    .then(() => {
      console.log("Network connected");
      checkWledConnection();
    })
    .catch(() => {
      console.log("Network unreachable");
      checkWledConnection();
    });
}

function checkWledConnection() {
  fetch(`http://${wledIp}/json/state`, { mode: "no-cors" })
    .then(() => {
      console.log("WLED online");
    })
    .catch(() => {
      console.log("WLED offline");
    });
}
